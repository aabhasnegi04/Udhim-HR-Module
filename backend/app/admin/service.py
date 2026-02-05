from flask import current_app
from app.database.executor import StoredProcedureExecutor
import os
import json
from datetime import datetime


class AdminService:
    """Admin service layer for master data management"""
    
    # DEPARTMENTS
    @staticmethod
    def add_department(department_data):
        """Add new department"""
        try:
            parameters = {
                'department_code': department_data.get('department_code'),
                'department_name': department_data.get('department_name')
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_add_department', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Department added successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to add department"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to add department",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Add department error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }
    
    @staticmethod
    def list_departments():
        """Get list of all departments"""
        try:
            result = StoredProcedureExecutor.execute_procedure('proc_list_departments')
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Departments retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve departments",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"List departments error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }
    
    # DESIGNATIONS
    @staticmethod
    def add_designation(designation_data):
        """Add new designation"""
        try:
            parameters = {
                'designation_name': designation_data.get('designation_name'),
                'designation_level': designation_data.get('designation_level')
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_add_designation', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Designation added successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to add designation"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to add designation",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Add designation error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }
    
    @staticmethod
    def list_designations():
        """Get list of all designations"""
        try:
            result = StoredProcedureExecutor.execute_procedure('proc_list_designations')
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Designations retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve designations",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"List designations error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }
    
    # LOCATIONS
    @staticmethod
    def add_location(location_data):
        """Add new location"""
        try:
            parameters = {
                'location_name': location_data.get('location_name'),
                'city': location_data.get('city'),
                'country': location_data.get('country')
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_add_location', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Location added successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to add location"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to add location",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Add location error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }
    
    @staticmethod
    def list_locations():
        """Get list of all locations"""
        try:
            result = StoredProcedureExecutor.execute_procedure('proc_list_locations')
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Locations retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve locations",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"List locations error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }
    
    # HOLIDAYS
    @staticmethod
    def add_holiday(holiday_data):
        """Add new holiday"""
        try:
            parameters = {
                'holiday_date': holiday_data.get('holiday_date'),
                'holiday_name': holiday_data.get('holiday_name'),
                'holiday_type': holiday_data.get('holiday_type'),
                'calendar_year': holiday_data.get('calendar_year')
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_add_holiday', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Holiday added successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to add holiday"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to add holiday",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Add holiday error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }
    
    @staticmethod
    def list_holidays_by_year(year):
        """Get holidays for a specific year"""
        try:
            parameters = {'calendar_year': year}
            result = StoredProcedureExecutor.execute_procedure('proc_list_holidays_by_year', parameters)
            
            if result["success"]:
                return {
                    "success": True,
                    "message": f"Holidays for {year} retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve holidays",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"List holidays error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }
    
    @staticmethod
    def update_holiday(holiday_id, holiday_data):
        """Update holiday"""
        try:
            parameters = {
                'holiday_id': holiday_id,
                'holiday_date': holiday_data.get('holiday_date'),
                'holiday_name': holiday_data.get('holiday_name'),
                'holiday_type': holiday_data.get('holiday_type'),
                'calendar_year': holiday_data.get('calendar_year')
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_update_holiday', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Holiday updated successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to update holiday"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to update holiday",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Update holiday error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }
    
    @staticmethod
    def delete_holiday(holiday_id):
        """Delete holiday"""
        try:
            parameters = {'holiday_id': holiday_id}
            result = StoredProcedureExecutor.execute_procedure('proc_delete_holiday', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Holiday deleted successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to delete holiday"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to delete holiday",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Delete holiday error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }
    
    # LEAVE TYPES
    @staticmethod
    def add_leave_type(leave_type_data):
        """Add new leave type"""
        try:
            parameters = {
                'leave_code': leave_type_data.get('leave_code'),
                'leave_name': leave_type_data.get('leave_name'),
                'max_days_per_year': leave_type_data.get('max_days_per_year')
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_add_leave_type', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Leave type added successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to add leave type"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to add leave type",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Add leave type error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }
    
    @staticmethod
    def list_leave_types():
        """Get list of all leave types"""
        try:
            result = StoredProcedureExecutor.execute_procedure('proc_list_leave_types')
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Leave types retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve leave types",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"List leave types error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }
    
    # SALARY STRUCTURES
    @staticmethod
    def add_salary_structure(structure_data):
        """Add new salary structure"""
        try:
            parameters = {
                'structure_name': structure_data.get('structure_name'),
                'structure_type': structure_data.get('structure_type')
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_add_salary_structure', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Salary structure added successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to add salary structure"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to add salary structure",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Add salary structure error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }
    
    @staticmethod
    def list_salary_structures():
        """Get list of all salary structures"""
        try:
            result = StoredProcedureExecutor.execute_procedure('proc_list_salary_structures')
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Salary structures retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve salary structures",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"List salary structures error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }

    # ADMIN DASHBOARD
    @staticmethod
    def get_dashboard_stats():
        """Get admin dashboard statistics"""
        try:
            result = StoredProcedureExecutor.execute_procedure('proc_get_admin_dashboard_stats')
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Dashboard stats retrieved successfully",
                    "data": result["data"][0] if result["data"] else {}
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve dashboard stats",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get dashboard stats error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }

    # LETTER TEMPLATES
    @staticmethod
    def list_letter_templates():
        """Get list of all letter templates"""
        try:
            result = StoredProcedureExecutor.execute_procedure('proc_list_letter_templates')
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Letter templates retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve letter templates",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"List letter templates error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }

    @staticmethod
    def add_letter_template(template_data):
        """Add new letter template"""
        try:
            parameters = {
                'template_name': template_data.get('template_name'),
                'template_category': template_data.get('template_category'),
                'template_content': template_data.get('template_content'),
                'description': template_data.get('description'),
                'is_active': template_data.get('is_active', True)
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_add_letter_template', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Letter template added successfully"),
                        "data": {"template_id": proc_result.get("template_id")}
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to add letter template"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to add letter template",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Add letter template error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }

    @staticmethod
    def update_letter_template(template_id, template_data):
        """Update letter template"""
        try:
            parameters = {
                'template_id': template_id,
                'template_name': template_data.get('template_name'),
                'template_category': template_data.get('template_category'),
                'template_content': template_data.get('template_content'),
                'description': template_data.get('description'),
                'is_active': template_data.get('is_active', True)
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_update_letter_template', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Letter template updated successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to update letter template"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to update letter template",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Update letter template error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }

    @staticmethod
    def delete_letter_template(template_id):
        """Delete letter template"""
        try:
            parameters = {'template_id': template_id}
            result = StoredProcedureExecutor.execute_procedure('proc_delete_letter_template', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Letter template deleted successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to delete letter template"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to delete letter template",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Delete letter template error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }

    # COMPANY POLICIES
    @staticmethod
    def list_company_policies():
        """Get list of all company policies"""
        try:
            result = StoredProcedureExecutor.execute_procedure('proc_list_company_policies')
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Company policies retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve company policies",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"List company policies error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }

    @staticmethod
    def add_company_policy(policy_data):
        """Add new company policy"""
        try:
            parameters = {
                'policy_title': policy_data.get('policy_title'),
                'policy_category': policy_data.get('policy_category'),
                'policy_description': policy_data.get('policy_description'),
                'policy_version': policy_data.get('policy_version', '1.0'),
                'effective_date': policy_data.get('effective_date'),
                'policy_status': policy_data.get('policy_status', 'Active'),
                'visibility_settings': json.dumps(policy_data.get('visibility_settings', [])),
                'file_path': policy_data.get('file_path'),
                'file_size': policy_data.get('file_size')
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_add_company_policy', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Company policy added successfully"),
                        "data": {"policy_id": proc_result.get("policy_id")}
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to add company policy"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to add company policy",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Add company policy error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }

    # SYSTEM REPORTS
    @staticmethod
    def generate_system_report(report_type, filters=None):
        """Generate system report"""
        try:
            parameters = {
                'report_type': report_type,
                'date_from': filters.get('date_from') if filters else None,
                'date_to': filters.get('date_to') if filters else None,
                'department_filter': filters.get('department') if filters else None
            }
            
            # Remove None values
            parameters = {k: v for k, v in parameters.items() if v is not None}
            
            result = StoredProcedureExecutor.execute_procedure('proc_generate_system_report', parameters)
            
            if result["success"]:
                return {
                    "success": True,
                    "message": f"{report_type} report generated successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to generate report",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Generate system report error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }