from flask import Blueprint, request
from app.documents.service import DocumentService
from app.middleware.role_guard import hr_required
from app.middleware.multi_tenant_jwt import multi_tenant_jwt_required, get_current_user
from app.middleware.company_context import company_required
from app.utils.response import success_response, error_response, validation_error_response

documents_bp = Blueprint('documents', __name__)


# ── TEMPLATES ──────────────────────────────────────────────────────────────

@documents_bp.route('/templates', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_templates():
    active_only = request.args.get('active_only', 'false').lower() == 'true'
    result = DocumentService.get_templates(active_only=active_only)
    return success_response(data=result['data']) if result['success'] else error_response(result.get('message'), 500)


@documents_bp.route('/templates', methods=['POST'])
@company_required
@hr_required
def create_template():
    data = request.get_json()
    if not data or not data.get('template_name') or not data.get('template_content'):
        return validation_error_response("template_name and template_content are required")
    user = get_current_user()
    result = DocumentService.save_template(data, user_id=user.get('user_id'))
    return success_response(data=result['data'], message=result.get('message')) if result['success'] else error_response(result.get('message'), 400)


@documents_bp.route('/templates/<int:template_id>', methods=['PUT'])
@company_required
@hr_required
def update_template(template_id):
    data = request.get_json()
    if not data:
        return validation_error_response("Request body required")
    user = get_current_user()
    result = DocumentService.save_template(data, user_id=user.get('user_id'), template_id=template_id)
    return success_response(data=result['data'], message=result.get('message')) if result['success'] else error_response(result.get('message'), 400)


@documents_bp.route('/templates/<int:template_id>', methods=['DELETE'])
@company_required
@hr_required
def delete_template(template_id):
    result = DocumentService.delete_template(template_id)
    return success_response(message="Template deactivated") if result['success'] else error_response(result.get('message'), 400)


# ── LETTER GENERATION ──────────────────────────────────────────────────────

@documents_bp.route('/employee-data/<int:employee_id>', methods=['GET'])
@company_required
@hr_required
def get_employee_data(employee_id):
    result = DocumentService.get_employee_letter_data(employee_id)
    return success_response(data=result['data']) if result['success'] else error_response(result.get('message'), 404)


@documents_bp.route('/generate', methods=['POST'])
@company_required
@hr_required
def generate_letter():
    data = request.get_json()
    if not data or not data.get('employee_id') or not data.get('template_id'):
        return validation_error_response("employee_id and template_id are required")
    user = get_current_user()
    result = DocumentService.generate_letter(
        employee_id=data['employee_id'],
        template_id=data['template_id'],
        generated_by=user.get('user_id'),
    )
    if result['success']:
        # Notify the employee
        try:
            from app.notifications.service import NotificationService
            from app.database.multi_tenant_executor import MultiTenantExecutor
            r = MultiTenantExecutor.execute_procedure('proc_get_employee_user_id', {'employee_id': data['employee_id']})
            rows = r.get('data', [])
            if rows and isinstance(rows[0], list): rows = rows[0]
            if rows and rows[0].get('user_id'):
                letter_name = result['data'].get('template_name', 'document')
                NotificationService.create(
                    user_id=rows[0]['user_id'],
                    title='New Document Available',
                    message=f'Your {letter_name} has been generated and is ready to view.',
                    module='DOCUMENTS',
                    reference_id=result['data'].get('letter_id')
                )
        except Exception:
            pass
        return success_response(data=result['data'], message=result.get('message'))
    else:
        return error_response(result.get('message'), 400)


@documents_bp.route('/template-variables', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_template_variables():
    result = DocumentService.get_template_variables()
    return success_response(data=result['data']) if result['success'] else error_response(result.get('message'), 500)


# ── EMPLOYEE LETTERS ───────────────────────────────────────────────────────

@documents_bp.route('/letters', methods=['GET'])
@company_required
@hr_required
def get_all_letters():
    employee_id = request.args.get('employee_id', type=int)
    result = DocumentService.get_employee_letters(employee_id=employee_id)
    return success_response(data=result['data']) if result['success'] else error_response(result.get('message'), 500)


@documents_bp.route('/my-letters', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_my_letters():
    user = get_current_user()
    employee_id = user.get('employee_id')
    if not employee_id:
        return error_response("No employee profile linked", 400)
    result = DocumentService.get_employee_letters(employee_id=employee_id)
    return success_response(data=result['data']) if result['success'] else error_response(result.get('message'), 500)
