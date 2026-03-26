from flask import current_app
from app.database.multi_tenant_executor import MultiTenantExecutor


class DocumentService:

    @staticmethod
    def _extract_data(result):
        """Flatten multi-resultset responses — always returns a list of row dicts."""
        data = result.get("data")
        if not data:
            return []
        # executor returns list-of-lists when multiple result sets
        if data and isinstance(data[0], list):
            for rs in data:
                if rs:
                    return rs
            return []
        return data

    @staticmethod
    def get_templates(active_only=False):
        try:
            params = {'is_active': 1} if active_only else {}
            result = MultiTenantExecutor.execute_procedure('proc_get_letter_templates', params)
            return {"success": True, "data": DocumentService._extract_data(result)}
        except Exception as e:
            current_app.logger.error(f"get_templates error: {str(e)}")
            return {"success": False, "data": [], "message": str(e)}

    @staticmethod
    def save_template(data, user_id, template_id=None):
        try:
            params = {
                'template_name': data.get('template_name'),
                'template_category': data.get('template_category'),
                'template_content': data.get('template_content'),
                'description': data.get('description', ''),
                'is_active': 1 if data.get('is_active', True) else 0,
                'user_id': user_id,
            }
            if template_id:
                params['template_id'] = template_id
            result = MultiTenantExecutor.execute_procedure('proc_save_letter_template', params)
            rows = DocumentService._extract_data(result)
            if result["success"] and rows:
                row = rows[0]
                return {"success": bool(row.get("success")), "data": row, "message": row.get("message", "")}
            return {"success": False, "message": "Failed to save template"}
        except Exception as e:
            current_app.logger.error(f"save_template error: {str(e)}")
            return {"success": False, "message": str(e)}

    @staticmethod
    def delete_template(template_id):
        try:
            result = MultiTenantExecutor.execute_procedure('proc_delete_letter_template', {'template_id': template_id})
            return {"success": result.get("success", False)}
        except Exception as e:
            current_app.logger.error(f"delete_template error: {str(e)}")
            return {"success": False, "message": str(e)}

    @staticmethod
    def get_employee_letter_data(employee_id):
        try:
            result = MultiTenantExecutor.execute_procedure('proc_get_employee_letter_data', {'employee_id': employee_id})
            rows = DocumentService._extract_data(result)
            if result["success"] and rows:
                return {"success": True, "data": rows[0]}
            return {"success": False, "data": None, "message": "Employee not found"}
        except Exception as e:
            current_app.logger.error(f"get_employee_letter_data error: {str(e)}")
            return {"success": False, "message": str(e)}

    @staticmethod
    def generate_letter(employee_id, template_id, generated_by):
        try:
            params = {
                'employee_id': employee_id,
                'template_id': template_id,
                'generated_by': generated_by,
            }
            result = MultiTenantExecutor.execute_procedure('proc_generate_letter', params)
            rows = DocumentService._extract_data(result)
            if result["success"] and rows:
                row = rows[0]
                if not row.get("success"):
                    return {"success": False, "message": row.get("message", "Generation failed")}
                return {"success": True, "data": row, "message": row.get("message", "")}
            return {"success": False, "message": "Failed to generate letter"}
        except Exception as e:
            current_app.logger.error(f"generate_letter error: {str(e)}")
            return {"success": False, "message": str(e)}

    @staticmethod
    def save_letter(employee_id, template_id, letter_type, generated_content, generated_by):
        try:
            params = {
                'employee_id': employee_id,
                'template_id': template_id,
                'letter_type': letter_type,
                'generated_content': generated_content,
                'generated_by': generated_by,
            }
            result = MultiTenantExecutor.execute_procedure('proc_save_employee_letter', params)
            rows = DocumentService._extract_data(result)
            if result["success"] and rows:
                row = rows[0]
                return {"success": bool(row.get("success")), "data": row, "message": row.get("message", "")}
            return {"success": False, "message": "Failed to save letter"}
        except Exception as e:
            current_app.logger.error(f"save_letter error: {str(e)}")
            return {"success": False, "message": str(e)}

    @staticmethod
    def get_template_variables():
        try:
            result = MultiTenantExecutor.execute_procedure('proc_get_template_variables', {})
            return {"success": True, "data": DocumentService._extract_data(result)}
        except Exception as e:
            current_app.logger.error(f"get_template_variables error: {str(e)}")
            return {"success": False, "data": [], "message": str(e)}

    @staticmethod
    def get_employee_letters(employee_id=None):
        try:
            params = {'employee_id': employee_id} if employee_id else {}
            result = MultiTenantExecutor.execute_procedure('proc_get_employee_letters', params)
            return {"success": True, "data": DocumentService._extract_data(result)}
        except Exception as e:
            current_app.logger.error(f"get_employee_letters error: {str(e)}")
            return {"success": False, "data": [], "message": str(e)}
