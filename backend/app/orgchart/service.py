from flask import current_app
from app.database.multi_tenant_executor import MultiTenantExecutor


class OrgChartService:
    """Organization Chart service layer"""
    
    @staticmethod
    def get_organization_hierarchy():
        """Get complete organization hierarchy with manager-employee relationships"""
        try:
            # Use stored procedure to get ACTIVE employees only
            result = MultiTenantExecutor.execute_procedure(
                'proc_get_employee_list_with_status',
                {'status_filter': 'ACTIVE'}
            )
            
            if not result["success"]:
                return {
                    "success": False,
                    "message": "Failed to retrieve employee list",
                    "data": None
                }
            
            employees = result["data"] or []
            
            # Get designation levels from database
            designation_levels = {}
            try:
                designations_result = MultiTenantExecutor.execute_procedure('proc_list_designations')
                if designations_result["success"] and designations_result["data"]:
                    for desig in designations_result["data"]:
                        designation_levels[desig.get('designation_name')] = desig.get('designation_level', 10)
            except Exception as e:
                current_app.logger.warning(f"Could not fetch designation levels: {str(e)}")
            
            # Transform data for org chart
            org_data = []
            
            for emp in employees:
                employee_id = emp.get('employee_id')
                employee_code = emp.get('employee_code')
                employee_name = emp.get('employee_name')
                designation = emp.get('designation')
                department = emp.get('department')
                
                # Get level from designation table (lower number = higher in hierarchy)
                # Default to 10 if not found
                level = designation_levels.get(designation, 10)
                
                emp_data = {
                    "id": employee_code,
                    "employee_id": employee_id,
                    "name": employee_name,
                    "designation": designation or "N/A",
                    "department": department or "N/A",
                    "manager_id": None,  # Not available in current schema
                    "level": level,
                    "reports": []  # Empty for now since we don't have manager relationships
                }
                
                org_data.append(emp_data)
            
            return {
                "success": True,
                "message": "Organization hierarchy retrieved successfully",
                "data": org_data
            }
                
        except Exception as e:
            current_app.logger.error(f"Get organization hierarchy error: {str(e)}")
            import traceback
            current_app.logger.error(traceback.format_exc())
            return {
                "success": False,
                "message": "Failed to retrieve organization hierarchy",
                "data": None
            }
    
    @staticmethod
    def search_employees(search_term):
        """Search employees by name, designation, or department"""
        try:
            # Use stored procedure to get ACTIVE employees only
            result = MultiTenantExecutor.execute_procedure(
                'proc_get_employee_list_with_status',
                {'status_filter': 'ACTIVE'}
            )
            
            if not result["success"]:
                return {
                    "success": False,
                    "message": "Failed to search employees",
                    "data": None
                }
            
            employees = result["data"] or []
            
            # Filter by search term
            search_lower = search_term.lower()
            filtered = []
            
            for emp in employees:
                employee_name = str(emp.get('employee_name', '')).lower()
                employee_code = str(emp.get('employee_code', '')).lower()
                designation = str(emp.get('designation', '')).lower()
                department = str(emp.get('department', '')).lower()
                
                if (search_lower in employee_name or 
                    search_lower in employee_code or
                    search_lower in designation or
                    search_lower in department):
                    filtered.append({
                        "id": emp.get('employee_code'),
                        "employee_id": emp.get('employee_id'),
                        "name": emp.get('employee_name'),
                        "designation": emp.get('designation') or "N/A",
                        "department": emp.get('department') or "N/A"
                    })
            
            return {
                "success": True,
                "message": f"Found {len(filtered)} employees",
                "data": filtered
            }
                
        except Exception as e:
            current_app.logger.error(f"Search employees error: {str(e)}")
            return {
                "success": False,
                "message": "Failed to search employees",
                "data": None
            }
