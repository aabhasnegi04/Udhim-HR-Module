from flask import Blueprint, request, current_app
from app.leave.service import LeaveService
from app.middleware.role_guard import hr_required, manager_required, employee_required, hr_or_manager_required
from app.middleware.multi_tenant_jwt import multi_tenant_jwt_required
from app.middleware.company_context import company_required
from app.middleware.active_employee_required import active_employee_required
from app.utils.response import (
    success_response, 
    error_response, 
    validation_error_response
)
from datetime import datetime

leave_bp = Blueprint('leave', __name__)


# ============================================================================
# LEAVE TYPES (MASTER DATA)
# ============================================================================

@leave_bp.route('/types', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_leave_types():
    """Get all active leave types (All roles)"""
    try:
        result = LeaveService.get_leave_types()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"leave_types": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve leave types", status_code=500)


@leave_bp.route('/types/employee/<int:employee_id>', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_leave_types_for_employee(employee_id):
    """Get leave types appropriate for a specific employee based on gender"""
    try:
        # Get user_id from JWT to verify access
        from flask_jwt_extended import get_jwt_identity, get_jwt
        user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get("role")
        
        # Employees can only view their own leave types
        # HR/Manager can view any employee's leave types
        if user_role == "EMPLOYEE":
            # Get employee_id from user_id using service method
            emp_result = LeaveService.get_employee_id_from_user_id(user_id)
            
            if not emp_result["success"] or emp_result["employee_id"] != employee_id:
                return error_response("Access denied", status_code=403)
        
        result = LeaveService.get_leave_types_for_employee(employee_id)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"leave_types": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        current_app.logger.error(f"Get leave types for employee error: {str(e)}")
        return error_response("Failed to retrieve leave types", status_code=500)


# ============================================================================
# LEAVE BALANCE MANAGEMENT (HR ONLY)
# ============================================================================

@leave_bp.route('/balance/allocate', methods=['POST'])
@company_required
@hr_required
def allocate_leave_balance():
    """Allocate leave balance to employee (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['employee_id', 'leave_type_id', 'year', 'total_allocated']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        result = LeaveService.allocate_leave_balance(data)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to allocate leave balance", status_code=500)


@leave_bp.route('/balance/<int:balance_id>/adjust', methods=['PUT'])
@company_required
@hr_required
def adjust_leave_balance(balance_id):
    """Adjust leave balance (HR only - manual correction)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        if 'adjustment' not in data or 'reason' not in data:
            return validation_error_response("adjustment and reason are required")
        
        result = LeaveService.adjust_leave_balance(
            balance_id, 
            data['adjustment'], 
            data['reason']
        )
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to adjust leave balance", status_code=500)


@leave_bp.route('/balance/employee/<int:employee_id>', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_leave_balances(employee_id):
    """Get leave balances for an employee"""
    try:
        # Get user_id from JWT to verify access
        from flask_jwt_extended import get_jwt_identity, get_jwt
        user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get("role")
        
        # Employees can only view their own balances
        # HR/Manager can view any employee's balances
        if user_role == "EMPLOYEE":
            # Get employee_id from user_id using service method
            emp_result = LeaveService.get_employee_id_from_user_id(user_id)
            
            if not emp_result["success"] or emp_result["employee_id"] != employee_id:
                return error_response("Access denied", status_code=403)
        
        year = request.args.get('year', type=int)
        
        result = LeaveService.get_leave_balances_by_employee(employee_id, year)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"balances": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        current_app.logger.error(f"Get leave balances error: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return error_response("Failed to retrieve leave balances", status_code=500)


# ============================================================================
# LEAVE APPLICATION (EMPLOYEE)
# ============================================================================

@leave_bp.route('/apply', methods=['POST'])
@company_required
@employee_required
@active_employee_required  # Must be active employee
def apply_leave():
    """Apply for leave (Employee)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Get user_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        
        # Get employee_id from user_id using service method
        emp_result = LeaveService.get_employee_id_from_user_id(user_id)
        
        if not emp_result["success"]:
            return error_response("Employee record not found", status_code=404)
        
        employee_id = emp_result["employee_id"]
        
        # Validate required fields (employee_id is now from JWT, not request body)
        required_fields = ['leave_type_id', 'start_date', 'end_date', 'reason']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        # Override employee_id from JWT (security measure)
        data['employee_id'] = employee_id
        
        # Parse dates
        try:
            data['start_date'] = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            data['end_date'] = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        except ValueError:
            return validation_error_response("Invalid date format. Use YYYY-MM-DD")
        
        result = LeaveService.apply_leave(data)
        
        if result["success"]:
            # 1. Confirm to employee
            try:
                from app.notifications.service import NotificationService
                NotificationService.create(
                    user_id=user_id,
                    title='Leave Request Submitted',
                    message='Your leave request has been submitted and is pending approval.',
                    module='LEAVE',
                    reference_id=result['data'].get('request_id') if isinstance(result.get('data'), dict) else None
                )
            except Exception:
                pass
            # 2. Notify all HR users
            try:
                from app.notifications.service import NotificationService
                from app.database.multi_tenant_executor import MultiTenantExecutor
                hr_rows = MultiTenantExecutor.execute_procedure('proc_get_hr_user_ids', {}).get('data', [])
                if hr_rows and isinstance(hr_rows[0], list): hr_rows = hr_rows[0]
                emp_r = MultiTenantExecutor.execute_procedure('proc_get_employee_info', {'employee_id': employee_id}).get('data', [])
                if emp_r and isinstance(emp_r[0], list): emp_r = emp_r[0]
                emp_name = emp_r[0].get('full_name', 'An employee') if emp_r else 'An employee'
                for hr in (hr_rows or []):
                    if hr.get('user_id'):
                        NotificationService.create(
                            user_id=hr['user_id'],
                            title='New Leave Request',
                            message=f'{emp_name} has submitted a leave request pending your approval.',
                            module='LEAVE'
                        )
            except Exception:
                pass
            return success_response(message=result["message"], data=result["data"])
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to apply leave", status_code=500)


# ============================================================================
# APPROVAL WORKFLOW
# ============================================================================

@leave_bp.route('/<int:request_id>/approve/manager', methods=['PUT'])
@company_required
@manager_required
def manager_approve_leave(request_id):
    """Manager approve leave (First level approval)"""
    try:
        data = request.get_json() or {}
        
        # Get approver_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        approver_id = get_jwt_identity()
        
        comment = data.get('comment')
        
        result = LeaveService.manager_approve_leave(request_id, approver_id, comment)
        
        if result["success"]:
            try:
                from app.notifications.service import NotificationService
                from app.database.multi_tenant_executor import MultiTenantExecutor
                r = MultiTenantExecutor.execute_procedure('proc_get_leave_request_user', {'request_id': request_id})
                rows = r.get('data', [])
                if rows and isinstance(rows[0], list): rows = rows[0]
                if rows and rows[0].get('user_id'):
                    NotificationService.create(
                        user_id=rows[0]['user_id'],
                        title='Leave Approved by Manager',
                        message='Your leave request has been approved by your manager and is pending HR final approval.',
                        module='LEAVE',
                        reference_id=request_id
                    )
            except Exception:
                pass
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to approve leave", status_code=500)


@leave_bp.route('/<int:request_id>/approve/hr', methods=['PUT'])
@company_required
@hr_required
def hr_approve_leave(request_id):
    """HR approve leave (Final approval - updates balance)"""
    try:
        data = request.get_json() or {}
        
        from flask_jwt_extended import get_jwt_identity
        approver_id = get_jwt_identity()
        comment = data.get('comment')
        
        result = LeaveService.hr_approve_leave(request_id, approver_id, comment)
        
        if result["success"]:
            # Notify the employee
            try:
                from app.notifications.service import NotificationService
                from app.database.multi_tenant_executor import MultiTenantExecutor
                r = MultiTenantExecutor.execute_procedure('proc_get_leave_request_user', {'request_id': request_id})
                rows = r.get('data', [])
                if rows and isinstance(rows[0], list): rows = rows[0]
                if rows and rows[0].get('user_id'):
                    NotificationService.create(
                        user_id=rows[0]['user_id'],
                        title='Leave Approved',
                        message='Your leave request has been approved by HR.',
                        module='LEAVE',
                        reference_id=request_id
                    )
            except Exception:
                pass
            return success_response(message=result["message"], data=result["data"])
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to approve leave", status_code=500)


@leave_bp.route('/<int:request_id>/reject', methods=['PUT'])
@company_required
@hr_or_manager_required
def reject_leave(request_id):
    """Reject leave request (Manager or HR)"""
    try:
        data = request.get_json()
        
        if not data or not data.get('comment'):
            return validation_error_response("Comment is required for rejection")
        
        # Get approver info from JWT token
        from flask_jwt_extended import get_jwt_identity, get_jwt
        approver_id = get_jwt_identity()
        claims = get_jwt()
        approver_role = claims.get("role")
        
        # Map role to approver_role format
        if approver_role == "HR":
            approver_role = "HR"
        elif approver_role == "Manager":
            approver_role = "MANAGER"
        else:
            return error_response("Invalid role for leave rejection", status_code=403)
        
        result = LeaveService.reject_leave(
            request_id, 
            approver_id, 
            approver_role, 
            data['comment']
        )
        
        if result["success"]:
            try:
                from app.notifications.service import NotificationService
                from app.database.multi_tenant_executor import MultiTenantExecutor
                r = MultiTenantExecutor.execute_procedure('proc_get_leave_request_user', {'request_id': request_id})
                rows = r.get('data', [])
                if rows and isinstance(rows[0], list): rows = rows[0]
                if rows and rows[0].get('user_id'):
                    NotificationService.create(
                        user_id=rows[0]['user_id'],
                        title='Leave Rejected',
                        message=f'Your leave request has been rejected. Reason: {data["comment"]}',
                        module='LEAVE',
                        reference_id=request_id
                    )
            except Exception:
                pass
            return success_response(message=result["message"], data=result["data"])
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to reject leave", status_code=500)


# ============================================================================
# CANCEL LEAVE
# ============================================================================

@leave_bp.route('/<int:request_id>/cancel', methods=['PUT'])
@company_required
@employee_required
@active_employee_required  # Must be active employee
def cancel_leave(request_id):
    """Cancel leave request (Employee)"""
    try:
        # Get user_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        
        # Get employee_id from user_id using service method
        emp_result = LeaveService.get_employee_id_from_user_id(user_id)
        
        if not emp_result["success"]:
            return error_response("Employee record not found", status_code=404)
        
        employee_id = emp_result["employee_id"]
        
        result = LeaveService.cancel_leave(request_id, employee_id)
        
        if result["success"]:
            # Notify employee confirmation + notify HR
            try:
                from app.notifications.service import NotificationService
                from app.database.multi_tenant_executor import MultiTenantExecutor
                NotificationService.create(
                    user_id=user_id,
                    title='Leave Cancelled',
                    message='Your leave request has been cancelled successfully.',
                    module='LEAVE',
                    reference_id=request_id
                )
                hr_rows = MultiTenantExecutor.execute_procedure('proc_get_hr_user_ids', {}).get('data', [])
                if hr_rows and isinstance(hr_rows[0], list): hr_rows = hr_rows[0]
                emp_r = MultiTenantExecutor.execute_procedure('proc_get_employee_info', {'employee_id': employee_id}).get('data', [])
                if emp_r and isinstance(emp_r[0], list): emp_r = emp_r[0]
                emp_name = emp_r[0].get('full_name', 'An employee') if emp_r else 'An employee'
                for hr in (hr_rows or []):
                    if hr.get('user_id'):
                        NotificationService.create(
                            user_id=hr['user_id'],
                            title='Leave Cancelled',
                            message=f'{emp_name} has cancelled their leave request.',
                            module='LEAVE'
                        )
            except Exception:
                pass
            return success_response(message=result["message"], data=result["data"])
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to cancel leave", status_code=500)


# ============================================================================
# REPORTING
# ============================================================================

@leave_bp.route('/my', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_my_leaves():
    """Get my leave history (All roles - returns leaves based on user)"""
    try:
        # Get user_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        
        # Get employee_id from user_id using service method
        emp_result = LeaveService.get_employee_id_from_user_id(user_id)
        
        if not emp_result["success"]:
            return error_response("Employee record not found", status_code=404)
        
        employee_id = emp_result["employee_id"]
        
        year = request.args.get('year', type=int)
        
        result = LeaveService.get_leaves_by_employee(employee_id, year)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"leaves": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        current_app.logger.error(f"Get my leaves error: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return error_response("Failed to retrieve leave history", status_code=500)


@leave_bp.route('/employee/<int:employee_id>', methods=['GET'])
@company_required
@hr_or_manager_required
def get_employee_leaves(employee_id):
    """Get leave history for an employee (HR/Manager)"""
    try:
        year = request.args.get('year', type=int)
        
        result = LeaveService.get_leaves_by_employee(employee_id, year)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"leaves": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve leave history", status_code=500)


@leave_bp.route('/department/<department>', methods=['GET'])
@company_required
@hr_or_manager_required
def get_department_leaves(department):
    """Get leaves for a department (HR/Manager)"""
    try:
        year = request.args.get('year', type=int)
        
        result = LeaveService.get_leaves_by_department(department, year)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"leaves": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve department leaves", status_code=500)


@leave_bp.route('/register', methods=['GET'])
@company_required
@hr_required
def get_leave_register():
    """Get complete leave register (HR only)"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        status = request.args.get('status')
        
        # Parse dates if provided
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            except ValueError:
                return validation_error_response("Invalid start_date format. Use YYYY-MM-DD")
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                return validation_error_response("Invalid end_date format. Use YYYY-MM-DD")
        
        result = LeaveService.get_leave_register(start_date, end_date, status)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"leaves": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve leave register", status_code=500)


@leave_bp.route('/pending', methods=['GET'])
@company_required
@hr_or_manager_required
def get_pending_leaves():
    """Get pending leaves for approval (HR/Manager)"""
    try:
        # Get role from JWT token
        from flask_jwt_extended import get_jwt
        claims = get_jwt()
        user_role = claims.get("role")
        
        # Map role to approver_role format
        if user_role == "HR":
            approver_role = "HR"
        elif user_role == "Manager":
            approver_role = "MANAGER"
        else:
            approver_role = None
        
        result = LeaveService.get_pending_leaves(approver_role)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"leaves": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve pending leaves", status_code=500)
