from flask import current_app
from app.database.executor import StoredProcedureExecutor


class OrgChartService:
    """Organization Chart service layer"""
    
    @staticmethod
    def get_organization_hierarchy():
        """Get complete organization hierarchy with manager-employee relationships"""
        try:
            # Use existing stored procedure to get all employees
            result = StoredProcedureExecutor.execute_procedure('proc_get_employee_list')
            
            if not result["success"]:
                return {
                    "success": False,
                    "message": "Failed to retrieve employee list",
                    "data": None
                }
            
            employees = result["data"] or []
            
            # Transform data for org chart
            # Since manager_id is not available, create a flat structure grouped by department
            org_data = []
            
            for emp in employees:
                employee_id = emp.get('employee_id')
                employee_code = emp.get('employee_code')
                employee_name = emp.get('employee_name')
                designation = emp.get('designation')
                department = emp.get('department')
                
                # Assign level based on designation keywords
                level = 3  # Default employee level
                designation_lower = (designation or '').lower()
                
                if any(word in designation_lower for word in ['ceo', 'chief', 'president', 'director']):
                    level = 0  # CEO/Executive level
                elif any(word in designation_lower for word in ['vp', 'vice president', 'head']):
                    level = 1  # VP level
                elif any(word in designation_lower for word in ['manager', 'lead', 'senior manager']):
                    level = 2  # Manager level
                
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
            # Use existing stored procedure
            result = StoredProcedureExecutor.execute_procedure('proc_get_employee_list')
            
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
