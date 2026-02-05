from flask import current_app
from app.database.executor import StoredProcedureExecutor


class DesignationService:
    """Service for managing designation-role mappings"""
    
    @staticmethod
    def get_designation_mappings():
        """
        Get all designation-role mappings
        
        Returns:
            dict: List of designation mappings
        """
        try:
            parameters = {'action': 'LIST'}
            result = StoredProcedureExecutor.execute_procedure('proc_manage_designation_role_mapping', parameters)
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Designation mappings retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve designation mappings",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get designation mappings error: {str(e)}")
            return {
                "success": False,
                "message": "Designation service error",
                "data": None
            }
    
    @staticmethod
    def add_designation_mapping(designation_name, role_code):
        """
        Add new designation-role mapping
        
        Args:
            designation_name (str): Designation name
            role_code (str): Role code (HR, MANAGER, EMPLOYEE)
            
        Returns:
            dict: Add result
        """
        try:
            parameters = {
                'action': 'ADD',
                'designation_name': designation_name,
                'role_code': role_code
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_manage_designation_role_mapping', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if proc_result.get('success') == 1:
                    return {
                        "success": True,
                        "message": proc_result.get('message', 'Designation mapping added successfully'),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get('message', 'Failed to add designation mapping'),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to add designation mapping",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Add designation mapping error: {str(e)}")
            return {
                "success": False,
                "message": "Failed to add designation mapping",
                "data": None
            }
    
    @staticmethod
    def update_designation_mapping(mapping_id, role_code):
        """
        Update designation-role mapping
        
        Args:
            mapping_id (int): Mapping ID
            role_code (str): New role code
            
        Returns:
            dict: Update result
        """
        try:
            parameters = {
                'action': 'UPDATE',
                'mapping_id': mapping_id,
                'role_code': role_code
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_manage_designation_role_mapping', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if proc_result.get('success') == 1:
                    return {
                        "success": True,
                        "message": proc_result.get('message', 'Designation mapping updated successfully'),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get('message', 'Failed to update designation mapping'),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to update designation mapping",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Update designation mapping error: {str(e)}")
            return {
                "success": False,
                "message": "Failed to update designation mapping",
                "data": None
            }
    
    @staticmethod
    def delete_designation_mapping(mapping_id):
        """
        Delete designation-role mapping
        
        Args:
            mapping_id (int): Mapping ID
            
        Returns:
            dict: Delete result
        """
        try:
            parameters = {
                'action': 'DELETE',
                'mapping_id': mapping_id
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_manage_designation_role_mapping', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if proc_result.get('success') == 1:
                    return {
                        "success": True,
                        "message": proc_result.get('message', 'Designation mapping deleted successfully'),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get('message', 'Failed to delete designation mapping'),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to delete designation mapping",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Delete designation mapping error: {str(e)}")
            return {
                "success": False,
                "message": "Failed to delete designation mapping",
                "data": None
            }
    
    @staticmethod
    def get_available_roles():
        """
        Get available roles for mapping
        
        Returns:
            dict: List of available roles
        """
        try:
            # Get roles from the roles table
            result = StoredProcedureExecutor.execute_procedure('proc_list_roles')
            
            if result["success"]:
                # Filter to only show HR, MANAGER, EMPLOYEE roles
                roles = result["data"] if result["data"] else []
                filtered_roles = [
                    role for role in roles 
                    if role.get('role_code') in ['HR', 'MANAGER', 'EMPLOYEE'] and role.get('is_active', 1)
                ]
                
                return {
                    "success": True,
                    "message": "Available roles retrieved successfully",
                    "data": filtered_roles
                }
            else:
                # Fallback to hardcoded roles if procedure doesn't exist
                return {
                    "success": True,
                    "message": "Available roles retrieved successfully",
                    "data": [
                        {"role_code": "HR", "role_name": "Human Resources"},
                        {"role_code": "MANAGER", "role_name": "Manager"},
                        {"role_code": "EMPLOYEE", "role_name": "Employee"}
                    ]
                }
                
        except Exception as e:
            current_app.logger.error(f"Get available roles error: {str(e)}")
            # Return hardcoded roles as fallback
            return {
                "success": True,
                "message": "Available roles retrieved successfully",
                "data": [
                    {"role_code": "HR", "role_name": "Human Resources"},
                    {"role_code": "MANAGER", "role_name": "Manager"},
                    {"role_code": "EMPLOYEE", "role_name": "Employee"}
                ]
            }