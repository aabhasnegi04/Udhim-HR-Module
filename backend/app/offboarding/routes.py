from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.offboarding.service import OffboardingService
from app.middleware.multi_tenant_jwt import multi_tenant_jwt_required
from app.middleware.company_context import company_required
from app.notifications.service import NotificationService
from app.database.multi_tenant_executor import MultiTenantExecutor

offboarding_bp = Blueprint('offboarding', __name__)


def _uid():
    identity = get_jwt_identity()
    uid = identity.get('user_id') if isinstance(identity, dict) else identity
    try:
        return int(uid)
    except (TypeError, ValueError):
        return uid


def _get_employee_user_id(employee_code):
    """Look up user_id for an employee_code — for sending notifications."""
    try:
        result = MultiTenantExecutor.execute_procedure('proc_get_employee_user_id', {'employee_code': employee_code})
        data = result.get('data', [])
        rows = data[0] if data and isinstance(data[0], list) else data
        return rows[0].get('user_id') if rows else None
    except Exception:
        return None


# ── Exits ──────────────────────────────────────────────────────────────────

@offboarding_bp.route('/initiate', methods=['POST'])
@company_required
@multi_tenant_jwt_required
def initiate_exit():
    data = request.get_json()
    employee_code = data.get('employee_id')
    result = OffboardingService.initiate_exit(
        employee_id=employee_code,
        exit_type=data.get('exit_type'),
        exit_reason=data.get('exit_reason'),
        last_working_day=data.get('last_working_day'),
        notes=data.get('notes'),
        initiated_by=_uid()
    )
    if result.get('success'):
        try:
            emp_user_id = _get_employee_user_id(employee_code)
            if emp_user_id:
                NotificationService.create(
                    emp_user_id,
                    'Exit Process Initiated',
                    f'Your offboarding process has been initiated. Exit type: {data.get("exit_type")}.',
                    module='offboarding',
                    reference_id=result.get('exit_id')
                )
        except Exception:
            pass
    return jsonify(result), 200 if result['success'] else 400


@offboarding_bp.route('/exits', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_all_exits():
    return jsonify(OffboardingService.get_all_exits())


@offboarding_bp.route('/exits/<int:exit_id>', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_exit(exit_id):
    return jsonify(OffboardingService.get_exit_by_id(exit_id))


@offboarding_bp.route('/my-exit', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_my_exit():
    identity = get_jwt_identity()
    # JWT has employee_id as INT pk — look up the employee_code for the exits table
    employee_pk = identity.get('employee_id') if isinstance(identity, dict) else None
    if not employee_pk:
        return jsonify({'success': False, 'data': None}), 200
    try:
        result = MultiTenantExecutor.execute_procedure('proc_get_employee_code', {'employee_id': int(employee_pk)})
        data = result.get('data', [])
        rows = data[0] if data and isinstance(data[0], list) else data
        employee_code = rows[0].get('employee_code') if rows else None
    except Exception:
        employee_code = None
    if not employee_code:
        return jsonify({'success': False, 'data': None}), 200
    return jsonify(OffboardingService.get_exit_by_employee(employee_code))


# ── Clearances ─────────────────────────────────────────────────────────────

@offboarding_bp.route('/exits/<int:exit_id>/clearances', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_clearances(exit_id):
    return jsonify(OffboardingService.get_exit_clearances(exit_id))


@offboarding_bp.route('/clearances/<int:clearance_id>/approve', methods=['POST'])
@company_required
@multi_tenant_jwt_required
def approve_clearance(clearance_id):
    data = request.get_json()
    status = data.get('status')
    result = OffboardingService.approve_clearance(
        clearance_id=clearance_id,
        status=status,
        comments=data.get('comments'),
        approved_by=_uid()
    )
    if result.get('success'):
        try:
            # Get exit_id from clearance to find the employee
            cl_result = MultiTenantExecutor.execute_procedure('proc_get_clearance_by_id', {'clearance_id': clearance_id})
            cl_data = cl_result.get('data', [])
            cl_rows = cl_data[0] if cl_data and isinstance(cl_data[0], list) else cl_data
            if cl_rows:
                exit_id = cl_rows[0].get('exit_id')
                dept = cl_rows[0].get('department', 'Department')
                if exit_id:
                    exit_data = OffboardingService.get_exit_by_id(exit_id)
                    if exit_data.get('success') and exit_data.get('data'):
                        emp_code = exit_data['data'].get('employee_id')
                        emp_user_id = _get_employee_user_id(emp_code)
                        if emp_user_id:
                            action = 'approved' if status == 'APPROVED' else 'rejected'
                            NotificationService.create(
                                emp_user_id,
                                f'Clearance {action.capitalize()}',
                                f'Your {dept} clearance has been {action}.',
                                module='offboarding',
                                reference_id=exit_id
                            )
        except Exception:
            pass
    return jsonify(result), 200 if result['success'] else 400


# ── Interview ──────────────────────────────────────────────────────────────

@offboarding_bp.route('/exits/<int:exit_id>/interview', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_interview(exit_id):
    return jsonify(OffboardingService.get_interview(exit_id))


@offboarding_bp.route('/exits/<int:exit_id>/interview', methods=['POST'])
@company_required
@multi_tenant_jwt_required
def save_interview(exit_id):
    data = request.get_json()
    result = OffboardingService.save_interview(exit_id, data, _uid())
    return jsonify(result), 200 if result['success'] else 400


# ── Settlement ─────────────────────────────────────────────────────────────

@offboarding_bp.route('/exits/<int:exit_id>/settlement', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_settlement(exit_id):
    return jsonify(OffboardingService.get_settlement(exit_id))


@offboarding_bp.route('/exits/<int:exit_id>/settlement', methods=['POST'])
@company_required
@multi_tenant_jwt_required
def process_settlement(exit_id):
    data = request.get_json()
    result = OffboardingService.process_settlement(exit_id, data, _uid())
    return jsonify(result), 200 if result['success'] else 400


# ── Complete ───────────────────────────────────────────────────────────────

@offboarding_bp.route('/exits/<int:exit_id>/complete', methods=['POST'])
@company_required
@multi_tenant_jwt_required
def complete_exit(exit_id):
    result = OffboardingService.complete_exit(exit_id)
    if result.get('success'):
        try:
            exit_data = OffboardingService.get_exit_by_id(exit_id)
            if exit_data.get('success') and exit_data.get('data'):
                emp_code = exit_data['data'].get('employee_id')
                emp_user_id = _get_employee_user_id(emp_code)
                if emp_user_id:
                    NotificationService.create(
                        emp_user_id,
                        'Offboarding Completed',
                        'Your offboarding process has been completed. Please collect your final documents from HR.',
                        module='offboarding',
                        reference_id=exit_id
                    )
        except Exception:
            pass
    return jsonify(result), 200 if result['success'] else 400


@offboarding_bp.route('/exits/<int:exit_id>', methods=['DELETE'])
@company_required
@multi_tenant_jwt_required
def delete_exit(exit_id):
    result = OffboardingService.delete_exit(exit_id)
    return jsonify(result), 200 if result['success'] else 400
