from flask import current_app
from app.database.multi_tenant_executor import MultiTenantExecutor
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
            
            result = MultiTenantExecutor.execute_procedure('proc_add_department', parameters)
            
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
            result = MultiTenantExecutor.execute_procedure('proc_list_departments')
            
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

    @staticmethod
    def update_department(department_id, department_code=None, department_name=None):
        """Update an existing department"""
        try:
            parameters = {
                'department_id': department_id,
                'department_code': department_code,
                'department_name': department_name
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_update_department', parameters)
            
            if result["success"] and result["data"]:
                return {
                    "success": True,
                    "message": "Department updated successfully",
                    "data": result["data"][0] if result["data"] else None
                }
            else:
                return {
                    "success": False,
                    "message": result.get("message", "Failed to update department"),
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Update department error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }

    @staticmethod
    def delete_department(department_id):
        """Delete a department"""
        try:
            parameters = {'department_id': department_id}
            
            result = MultiTenantExecutor.execute_procedure('proc_delete_department', parameters)
            
            if result["success"] and result["data"]:
                # Check the 'success' column in the returned data
                proc_result = result["data"][0] if result["data"] else {}
                proc_success = proc_result.get('success', 0)
                proc_message = proc_result.get('message', 'Unknown error')
                
                if proc_success == 1:
                    return {
                        "success": True,
                        "message": proc_message,
                        "data": proc_result
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_message,
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": result.get("message", "Failed to delete department"),
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Delete department error: {str(e)}")
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
            
            result = MultiTenantExecutor.execute_procedure('proc_add_designation', parameters)
            
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
            result = MultiTenantExecutor.execute_procedure('proc_list_designations')
            
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

    @staticmethod
    def update_designation(designation_id, designation_name=None, designation_level=None):
        """Update an existing designation"""
        try:
            parameters = {
                'designation_id': designation_id,
                'designation_name': designation_name,
                'designation_level': designation_level
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_update_designation', parameters)
            
            if result["success"] and result["data"]:
                return {
                    "success": True,
                    "message": "Designation updated successfully",
                    "data": result["data"][0] if result["data"] else None
                }
            else:
                return {
                    "success": False,
                    "message": result.get("message", "Failed to update designation"),
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Update designation error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }

    @staticmethod
    def delete_designation(designation_id):
        """Delete a designation"""
        try:
            parameters = {'designation_id': designation_id}
            
            result = MultiTenantExecutor.execute_procedure('proc_delete_designation', parameters)
            
            if result["success"] and result["data"]:
                return {
                    "success": True,
                    "message": "Designation deleted successfully",
                    "data": result["data"][0] if result["data"] else None
                }
            else:
                return {
                    "success": False,
                    "message": result.get("message", "Failed to delete designation"),
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Delete designation error: {str(e)}")
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
            
            result = MultiTenantExecutor.execute_procedure('proc_add_location', parameters)
            
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
            result = MultiTenantExecutor.execute_procedure('proc_list_locations')
            
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

    @staticmethod
    def update_location(location_id, location_name=None, city=None, country=None):
        """Update an existing location"""
        try:
            parameters = {
                'location_id': location_id,
                'location_name': location_name,
                'city': city,
                'country': country
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_update_location', parameters)
            
            if result["success"] and result["data"]:
                return {
                    "success": True,
                    "message": "Location updated successfully",
                    "data": result["data"][0] if result["data"] else None
                }
            else:
                return {
                    "success": False,
                    "message": result.get("message", "Failed to update location"),
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Update location error: {str(e)}")
            return {
                "success": False,
                "message": "Admin service error",
                "data": None
            }

    @staticmethod
    def delete_location(location_id):
        """Delete a location"""
        try:
            parameters = {'location_id': location_id}
            
            result = MultiTenantExecutor.execute_procedure('proc_delete_location', parameters)
            
            if result["success"] and result["data"]:
                return {
                    "success": True,
                    "message": "Location deleted successfully",
                    "data": result["data"][0] if result["data"] else None
                }
            else:
                return {
                    "success": False,
                    "message": result.get("message", "Failed to delete location"),
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Delete location error: {str(e)}")
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
            
            result = MultiTenantExecutor.execute_procedure('proc_add_holiday', parameters)
            
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
            result = MultiTenantExecutor.execute_procedure('proc_list_holidays_by_year', parameters)
            
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
            
            result = MultiTenantExecutor.execute_procedure('proc_update_holiday', parameters)
            
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
            result = MultiTenantExecutor.execute_procedure('proc_delete_holiday', parameters)
            
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
    
    @staticmethod
    def bulk_upload_holiday(holiday_data):
        """Bulk upload single holiday (called for each row in Excel)"""
        try:
            parameters = {
                'holiday_date': holiday_data.get('holiday_date'),
                'holiday_name': holiday_data.get('holiday_name'),
                'holiday_type': holiday_data.get('holiday_type'),
                'calendar_year': holiday_data.get('calendar_year'),
                'dry_run': 0  # Actual insert
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_bulk_upload_holiday', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Holiday uploaded successfully"),
                        "data": proc_result
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("error_message", "Failed to upload holiday"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to upload holiday",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Bulk upload holiday error: {str(e)}")
            return {
                "success": False,
                "message": str(e),
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
            
            result = MultiTenantExecutor.execute_procedure('proc_add_leave_type', parameters)
            
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
    def deactivate_leave_type(leave_type_id):
        """Soft-delete a leave type (sets is_active=0, preserves history)"""
        try:
            result = MultiTenantExecutor.execute_procedure('proc_deactivate_leave_type', {'leave_type_id': leave_type_id})
            if result["success"] and result["data"]:
                row = result["data"][0]
                if isinstance(row, list): row = row[0]
                return {"success": bool(row.get("success")), "message": row.get("message", "")}
            return {"success": False, "message": "Failed to deactivate leave type"}
        except Exception as e:
            current_app.logger.error(f"Deactivate leave type error: {str(e)}")
            return {"success": False, "message": "Admin service error"}

    @staticmethod
    def list_leave_types():
        """Get list of all leave types"""
        try:
            result = MultiTenantExecutor.execute_procedure('proc_list_leave_types')
            
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
            
            result = MultiTenantExecutor.execute_procedure('proc_add_salary_structure', parameters)
            
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
            result = MultiTenantExecutor.execute_procedure('proc_list_salary_structures')
            
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
            result = MultiTenantExecutor.execute_procedure('proc_get_admin_dashboard_stats')
            
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
            result = MultiTenantExecutor.execute_procedure('proc_list_letter_templates')
            
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
            
            result = MultiTenantExecutor.execute_procedure('proc_add_letter_template', parameters)
            
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
            
            result = MultiTenantExecutor.execute_procedure('proc_update_letter_template', parameters)
            
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
            result = MultiTenantExecutor.execute_procedure('proc_delete_letter_template', parameters)
            
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
            result = MultiTenantExecutor.execute_procedure('proc_list_company_policies')
            
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
            
            result = MultiTenantExecutor.execute_procedure('proc_add_company_policy', parameters)
            
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

    @staticmethod
    def update_company_policy(policy_id, policy_data):
        """Update an existing company policy"""
        try:
            parameters = {
                'policy_id': policy_id,
                'policy_title': policy_data.get('policy_title'),
                'policy_category': policy_data.get('policy_category'),
                'policy_description': policy_data.get('policy_description'),
                'policy_version': policy_data.get('policy_version'),
                'effective_date': policy_data.get('effective_date'),
                'policy_status': policy_data.get('policy_status'),
                'visibility_settings': json.dumps(policy_data.get('visibility_settings', [])) if policy_data.get('visibility_settings') is not None else None
            }
            result = MultiTenantExecutor.execute_procedure('proc_update_company_policy', parameters)
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {"success": True, "message": proc_result.get("message", "Policy updated"), "data": None}
                else:
                    return {"success": False, "message": proc_result.get("message", "Failed to update policy"), "data": None}
            return {"success": False, "message": "Failed to update policy", "data": None}
        except Exception as e:
            current_app.logger.error(f"Update company policy error: {str(e)}")
            return {"success": False, "message": "Admin service error", "data": None}

    @staticmethod
    def delete_company_policy(policy_id):
        """Delete a company policy"""
        try:
            parameters = {'policy_id': policy_id}
            result = MultiTenantExecutor.execute_procedure('proc_delete_company_policy', parameters)
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {"success": True, "message": proc_result.get("message", "Policy deleted"), "data": None}
                else:
                    return {"success": False, "message": proc_result.get("message", "Failed to delete policy"), "data": None}
            return {"success": False, "message": "Failed to delete policy", "data": None}
        except Exception as e:
            current_app.logger.error(f"Delete company policy error: {str(e)}")
            return {"success": False, "message": "Admin service error", "data": None}

    @staticmethod
    def get_company_settings():
        """Get company settings"""
        try:
            result = MultiTenantExecutor.execute_procedure('proc_get_company_settings')
            if result["success"]:
                return {"success": True, "message": "Settings retrieved", "data": result["data"][0] if result["data"] else {}}
            return {"success": False, "message": "Failed to retrieve settings", "data": None}
        except Exception as e:
            current_app.logger.error(f"Get company settings error: {str(e)}")
            return {"success": False, "message": "Admin service error", "data": None}

    @staticmethod
    def save_company_settings(settings_data):
        """Save company settings (upsert)"""
        try:
            parameters = {
                'company_name': settings_data.get('company_name'),
                'industry': settings_data.get('industry'),
                'company_size': settings_data.get('company_size'),
                'founded_year': settings_data.get('founded_year'),
                'website': settings_data.get('website'),
                'description': settings_data.get('description'),
                'email': settings_data.get('email'),
                'phone': settings_data.get('phone'),
                'alternate_phone': settings_data.get('alternate_phone'),
                'address_street': settings_data.get('address_street'),
                'address_city': settings_data.get('address_city'),
                'address_state': settings_data.get('address_state'),
                'address_country': settings_data.get('address_country'),
                'address_postal': settings_data.get('address_postal'),
                'working_days_per_week': settings_data.get('working_days_per_week'),
                'working_hours_per_day': settings_data.get('working_hours_per_day'),
                'week_start_day': settings_data.get('week_start_day'),
                'fiscal_year_start': settings_data.get('fiscal_year_start'),
                'leave_year_start': settings_data.get('leave_year_start'),
                'probation_period': settings_data.get('probation_period'),
                'notice_period': settings_data.get('notice_period'),
                'currency': settings_data.get('currency'),
                'payroll_cycle': settings_data.get('payroll_cycle'),
                'salary_processing_day': settings_data.get('salary_processing_day'),
                'pf_rate': settings_data.get('pf_rate'),
                'esi_rate': settings_data.get('esi_rate'),
                'professional_tax': settings_data.get('professional_tax'),
                'gratuity_eligibility': settings_data.get('gratuity_eligibility'),
            }
            result = MultiTenantExecutor.execute_procedure('proc_save_company_settings', parameters)
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {"success": True, "message": proc_result.get("message", "Settings saved"), "data": None}
                else:
                    return {"success": False, "message": proc_result.get("message", "Failed to save settings"), "data": None}
            return {"success": False, "message": "Failed to save settings", "data": None}
        except Exception as e:
            current_app.logger.error(f"Save company settings error: {str(e)}")
            return {"success": False, "message": "Admin service error", "data": None}

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
            
            result = MultiTenantExecutor.execute_procedure('proc_generate_system_report', parameters)
            
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

    # BULK UPLOAD LOGS
    @staticmethod
    def log_bulk_upload(file_name, module, total, success, failed, user_id):
        try:
            result = MultiTenantExecutor.execute_procedure('proc_log_bulk_upload', {
                'file_name': file_name, 'module': module,
                'total_records': total, 'success_records': success,
                'failed_records': failed, 'uploaded_by': int(user_id)
            })
            return {"success": result.get("success", False)}
        except Exception as e:
            current_app.logger.error(f"Log bulk upload error: {str(e)}")
            return {"success": False}

    @staticmethod
    def get_bulk_upload_logs():
        try:
            result = MultiTenantExecutor.execute_procedure('proc_get_bulk_upload_logs', {})
            if result["success"]:
                data = result["data"] or []
                # Flatten nested list if needed
                if data and isinstance(data[0], list):
                    data = data[0]
                # Filter out any non-dict rows (e.g. success/message rows)
                data = [r for r in data if isinstance(r, dict) and 'file_name' in r]
                return {"success": True, "data": data}
            return {"success": False, "data": []}
        except Exception as e:
            current_app.logger.error(f"Get bulk upload logs error: {str(e)}")
            return {"success": False, "data": []}

    # BULK EMPLOYEE UPLOAD
    @staticmethod
    def bulk_upload_employee(employee_data, dry_run=False):
        """Upload single employee record with validation (matches actual schema)"""
        try:
            # Determine worker_category: if shift is provided, it's FACTORY, otherwise OFFICE
            worker_category = 'OFFICE'  # Default
            if employee_data.get('shift') or employee_data.get('shift_id'):
                worker_category = 'FACTORY'
            
            # Allow explicit worker_category override
            if employee_data.get('worker_category'):
                worker_category = employee_data.get('worker_category').upper()
            
            parameters = {
                'employee_code': employee_data.get('employee_code'),
                'first_name': employee_data.get('first_name'),
                'last_name': employee_data.get('last_name'),
                'email': employee_data.get('email'),
                'phone': employee_data.get('phone'),
                'dob': employee_data.get('dob'),
                'gender': employee_data.get('gender'),
                'address': employee_data.get('address'),
                'emergency_contact': employee_data.get('emergency_contact'),
                'department': employee_data.get('department'),
                'designation': employee_data.get('designation'),
                'date_of_joining': employee_data.get('date_of_joining'),
                'work_location': employee_data.get('work_location'),
                'employment_type': employee_data.get('employment_type'),
                'worker_category': worker_category,
                'dry_run': 1 if dry_run else 0
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_bulk_upload_employees', parameters)
            
            if result["success"] and result["data"]:
                row = result["data"][0]
                return {
                    "success": bool(row.get("success")),
                    "message": row.get("message") or row.get("error_message", ""),
                    "employee_code": row.get("employee_code")
                }
            return {"success": False, "message": "Unknown error", "employee_code": employee_data.get('employee_code')}
                
        except Exception as e:
            current_app.logger.error(f"Bulk upload employee error: {str(e)}")
            return {
                "success": False,
                "message": f"Service error: {str(e)}",
                "employee_code": employee_data.get('employee_code')
            }

    # AUDIT LOGS
    @staticmethod
    def create_audit_log(user_id, action, module, description, reference_id=None):
        try:
            MultiTenantExecutor.execute_procedure('proc_create_audit_log', {
                'user_id': int(user_id), 'action': action,
                'module': module, 'reference_id': reference_id,
                'description': description
            })
        except Exception:
            pass  # audit logs must never break main flow

    @staticmethod
    def get_audit_logs(module=None, user_id=None, from_date=None, to_date=None):
        try:
            params = {}
            if module: params['module'] = module
            if user_id: params['user_id'] = int(user_id)
            if from_date: params['from_date'] = from_date
            if to_date: params['to_date'] = to_date
            result = MultiTenantExecutor.execute_procedure('proc_get_audit_logs', params)
            if result["success"]:
                data = result["data"]
                if data and isinstance(data[0], list): data = data[0]
                return {"success": True, "data": data or []}
            return {"success": False, "data": []}
        except Exception as e:
            current_app.logger.error(f"Get audit logs error: {str(e)}")
            return {"success": False, "data": []}
