from flask import current_app
from app.database.multi_tenant_executor import MultiTenantExecutor
from datetime import datetime, date


class EmployeeService:
    """Employee service layer"""
    
    @staticmethod
    def get_employee_list():
        """
        Get list of all employees
        
        Returns:
            dict: Employee list result
        """
        try:
            result = MultiTenantExecutor.execute_procedure('proc_get_employee_list')
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Employees retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve employee list",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Employee list error: {str(e)}")
            return {
                "success": False,
                "message": "Employee service error",
                "data": None
            }
    
    @staticmethod
    def get_active_employees_for_attendance():
        """
        Get list of only ACTIVE employees for attendance operations
        
        Returns:
            dict: Active employee list result
        """
        try:
            result = MultiTenantExecutor.execute_procedure('proc_get_active_employees_for_attendance')
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Active employees retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve active employee list",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Active employee list error: {str(e)}")
            return {
                "success": False,
                "message": "Employee service error",
                "data": None
            }
    
    @staticmethod
    def get_employee_profile(employee_id):
        """
        Get employee profile by ID
        
        Args:
            employee_id (int): Employee ID
            
        Returns:
            dict: Employee profile result
        """
        try:
            parameters = {'employee_id': employee_id}
            result = MultiTenantExecutor.execute_procedure('proc_get_employee_profile', parameters)
            
            if result["success"] and result["data"]:
                return {
                    "success": True,
                    "message": "Employee profile retrieved successfully",
                    "data": result["data"][0] if result["data"] else None
                }
            else:
                return {
                    "success": False,
                    "message": "Employee not found",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Employee profile error: {str(e)}")
            return {
                "success": False,
                "message": "Employee service error",
                "data": None
            }
    
    @staticmethod
    def search_employees(search_term):
        """
        Search employees by name or employee code
        
        Args:
            search_term (str): Search term
            
        Returns:
            dict: Search result
        """
        try:
            # For now, return all employees and filter on frontend
            # TODO: Create proc_search_employees if needed
            result = MultiTenantExecutor.execute_procedure('proc_get_employee_list')
            
            if result["success"]:
                # Filter results by search term
                filtered_data = []
                if result["data"]:
                    for employee in result["data"]:
                        if (search_term.lower() in str(employee.get('employee_name', '')).lower() or
                            search_term.lower() in str(employee.get('employee_code', '')).lower() or
                            search_term.lower() in str(employee.get('email', '')).lower()):
                            filtered_data.append(employee)
                
                return {
                    "success": True,
                    "message": "Employee search completed successfully",
                    "data": filtered_data
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to search employees",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Employee search error: {str(e)}")
            return {
                "success": False,
                "message": "Employee service error",
                "data": None
            }
    
    @staticmethod
    def get_employees_by_department(department):
        """
        Get employees by department
        
        Args:
            department (str): Department name
            
        Returns:
            dict: Department employees result
        """
        try:
            # For now, return all employees and filter on frontend
            # TODO: Create proc_get_employees_by_department if needed
            result = MultiTenantExecutor.execute_procedure('proc_get_employee_list')
            
            if result["success"]:
                # Filter results by department
                filtered_data = []
                if result["data"]:
                    for employee in result["data"]:
                        if employee.get('department') == department:
                            filtered_data.append(employee)
                
                return {
                    "success": True,
                    "message": "Department employees retrieved successfully",
                    "data": filtered_data
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve department employees",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Department employees error: {str(e)}")
            return {
                "success": False,
                "message": "Employee service error",
                "data": None
            }
    
    @staticmethod
    def add_employee(employee_data, created_by_user_id=None):
        """
        Add new employee using enhanced stored procedure with role mapping
        
        Args:
            employee_data (dict): Employee information
            created_by_user_id (int): ID of user creating the employee (for audit)
            
        Returns:
            dict: Add employee result with user credentials and role info
        """
        try:
            # Extract required data for the enhanced procedure
            parameters = {
                'employee_code': employee_data.get('employee_code'),
                'first_name': employee_data.get('first_name'),
                'last_name': employee_data.get('last_name'),
                'email': employee_data.get('email'),
                'phone': employee_data.get('phone'),
                'department': employee_data.get('department'),
                'designation': employee_data.get('designation'),
                'join_date': employee_data.get('date_of_joining') or employee_data.get('join_date'),
                'salary': employee_data.get('salary'),
                'created_by_user_id': created_by_user_id,
                'dob': employee_data.get('dob') or None,
                'gender': employee_data.get('gender') or None,
                'address': employee_data.get('address') or None,
                'emergency_contact': employee_data.get('emergency_contact') or None,
                'employment_type': employee_data.get('employment_type') or None,
                'work_location': employee_data.get('work_location') or None,
                'manager_id': employee_data.get('manager_id') or None,
            }
            
            current_app.logger.info(f"Adding employee with role mapping: {parameters['first_name']} {parameters['last_name']}, Email: {parameters['email']}, Designation: {parameters['designation']}")
            
            # Use the new procedure with role mapping
            result = MultiTenantExecutor.execute_procedure('proc_add_employee_with_role_mapping', parameters)
            
            if result["success"] and result["data"]:
                employee_result = result["data"][0]
                if employee_result.get('success') == 1:
                    assigned_role = employee_result.get('assigned_role', 'EMPLOYEE')
                    current_app.logger.info(f"✅ Employee and user created: Employee ID {employee_result.get('employee_id')}, User ID {employee_result.get('user_id')}, Role: {assigned_role}")
                    return {
                        "success": True,
                        "message": employee_result.get('message', 'Employee and user account created successfully'),
                        "data": {
                            "employee_id": employee_result.get('employee_id'),
                            "user_id": employee_result.get('user_id'),
                            "default_password": employee_result.get('default_password'),
                            "assigned_role": assigned_role,
                            "username": parameters['email'],
                            "credentials_info": {
                                "username": parameters['email'],
                                "password": employee_result.get('default_password'),
                                "role": assigned_role,
                                "requires_password_change": True
                            }
                        }
                    }
                else:
                    error_msg = employee_result.get('message', 'Failed to add employee')
                    current_app.logger.error(f"❌ Failed to add employee: {error_msg}")
                    return {
                        "success": False,
                        "message": error_msg,
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to add employee",
                    "data": None
                }
                
        except Exception as e:
            import traceback
            current_app.logger.error(f"❌ Add employee error: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return {
                "success": False,
                "message": f"Failed to add employee: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def update_employee(employee_id, employee_data):
        """
        Update employee information using stored procedure
        
        Args:
            employee_id (int): Employee ID
            employee_data (dict): Updated employee information
            
        Returns:
            dict: Update employee result
        """
        try:
            # Extract data
            first_name = employee_data.get('first_name')
            last_name = employee_data.get('last_name')
            email = employee_data.get('email')
            phone = employee_data.get('phone') or None
            
            # Handle date fields - convert empty strings to None
            dob = employee_data.get('dob')
            if dob and dob != 'Not provided' and not dob.startswith('0000'):
                # Valid date
                pass
            else:
                dob = None
            
            gender = employee_data.get('gender') or None
            address = employee_data.get('address') or None
            emergency_contact = employee_data.get('emergency_contact') or None
            department = employee_data.get('department')
            designation = employee_data.get('designation')
            
            # Handle date of joining
            date_of_joining = employee_data.get('date_of_joining')
            if date_of_joining and date_of_joining != 'Not provided' and not date_of_joining.startswith('0000'):
                # Valid date
                pass
            else:
                date_of_joining = None
            
            employment_type = employee_data.get('employment_type') or None
            work_location = employee_data.get('work_location') or None
            manager_id = employee_data.get('manager_id') or None
            worker_category = employee_data.get('worker_category') or None
            
            current_app.logger.info(f"Updating employee ID: {employee_id}")
            current_app.logger.info(f"DOB: {dob}, Date of Joining: {date_of_joining}")
            
            parameters = {
                'employee_id': employee_id,
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'phone': phone,
                'dob': dob,
                'gender': gender,
                'address': address,
                'emergency_contact': emergency_contact,
                'department': department,
                'designation': designation,
                'date_of_joining': date_of_joining,
                'employment_type': employment_type,
                'work_location': work_location,
                'manager_id': manager_id,
                'worker_category': worker_category
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_update_employee', parameters)
            
            if result["success"] and result["data"]:
                update_result = result["data"][0]
                if update_result.get('success') == 1:
                    current_app.logger.info(f"✅ Employee updated: ID {employee_id}")
                    return {
                        "success": True,
                        "message": update_result.get('message', 'Employee updated successfully'),
                        "data": {"employee_id": employee_id}
                    }
                else:
                    error_msg = update_result.get('message', 'Failed to update employee')
                    current_app.logger.error(f"❌ Failed to update employee: {error_msg}")
                    return {
                        "success": False,
                        "message": error_msg,
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to update employee",
                    "data": None
                }
                
        except Exception as e:
            import traceback
            current_app.logger.error(f"❌ Update employee error: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return {
                "success": False,
                "message": f"Failed to update employee: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def deactivate_employee(employee_id, deactivated_by_user_id, reason=None):
        """
        Deactivate an employee
        
        Args:
            employee_id (int): Employee ID to deactivate
            deactivated_by_user_id (int): User ID who is deactivating
            reason (str): Optional reason for deactivation
            
        Returns:
            dict: Deactivation result
        """
        try:
            parameters = {
                'employee_id': employee_id,
                'deactivated_by_user_id': deactivated_by_user_id,
                'reason': reason
            }
            result = MultiTenantExecutor.execute_procedure('proc_deactivate_employee', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Employee deactivated successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to deactivate employee"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to deactivate employee",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Deactivate employee error: {str(e)}")
            return {
                "success": False,
                "message": "Employee deactivation service error",
                "data": None
            }
    
    @staticmethod
    def reactivate_employee(employee_id, reactivated_by_user_id, reason=None):
        """
        Reactivate an employee
        
        Args:
            employee_id (int): Employee ID to reactivate
            reactivated_by_user_id (int): User ID who is reactivating
            reason (str): Optional reason for reactivation
            
        Returns:
            dict: Reactivation result
        """
        try:
            parameters = {
                'employee_id': employee_id,
                'reactivated_by_user_id': reactivated_by_user_id,
                'reason': reason
            }
            result = MultiTenantExecutor.execute_procedure('proc_reactivate_employee', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Employee reactivated successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to reactivate employee"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to reactivate employee",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Reactivate employee error: {str(e)}")
            return {
                "success": False,
                "message": "Employee reactivation service error",
                "data": None
            }
    
    @staticmethod
    def get_employee_status_history(employee_id):
        """
        Get employee status change history
        
        Args:
            employee_id (int): Employee ID
            
        Returns:
            dict: Status history result
        """
        try:
            parameters = {'employee_id': employee_id}
            result = MultiTenantExecutor.execute_procedure('proc_get_employee_status_history', parameters)
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Status history retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve status history",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get status history error: {str(e)}")
            return {
                "success": False,
                "message": "Status history service error",
                "data": None
            }
    
    @staticmethod
    def change_employee_status(employee_ids, new_status, reason, changed_by_user_id):
        """
        Change employee status (single or bulk)
        Supports: ACTIVE, INACTIVE, RESIGNED
        
        Args:
            employee_ids (list or str): Employee ID(s) - can be list or comma-separated string
            new_status (str): New status (ACTIVE, INACTIVE, RESIGNED)
            reason (str): Reason for status change
            changed_by_user_id (int): User ID making the change
            
        Returns:
            dict: Status change result
        """
        try:
            # Convert list to comma-separated string if needed
            if isinstance(employee_ids, list):
                employee_ids_str = ','.join(str(id) for id in employee_ids)
            else:
                employee_ids_str = str(employee_ids)
            
            parameters = {
                'employee_ids': employee_ids_str,
                'new_status': new_status,
                'reason': reason,
                'changed_by': changed_by_user_id
            }
            
            current_app.logger.info(f"Changing status for employees {employee_ids_str} to {new_status}")
            
            result = MultiTenantExecutor.execute_procedure('proc_change_employee_status', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Employee status changed successfully"),
                        "data": {
                            "employees_updated": proc_result.get("employees_updated", 0),
                            "new_status": new_status
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to change employee status"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to change employee status",
                    "data": None
                }
                
        except Exception as e:
            import traceback
            current_app.logger.error(f"Change employee status error: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return {
                "success": False,
                "message": f"Status change service error: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def get_employees_by_status(status=None, worker_category=None):
        """
        Get employees filtered by status and/or worker category
        
        Args:
            status (str): Employee status (ACTIVE, INACTIVE, RESIGNED) - optional
            worker_category (str): Worker category (FACTORY, OFFICE, ALL) - optional
            
        Returns:
            dict: Filtered employees result
        """
        try:
            parameters = {
                'status': status,
                'worker_category': worker_category or 'ALL'
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_get_employees_by_status', parameters)
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Employees retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve employees",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get employees by status error: {str(e)}")
            return {
                "success": False,
                "message": "Employee service error",
                "data": None
            }
    
    @staticmethod
    def rehire_employee(employee_id, rehire_reason, rehired_by_user_id):
        """
        Rehire a resigned employee (keeps same employee_code for biometric matching)
        
        Args:
            employee_id (int): Employee ID to rehire
            rehire_reason (str): Reason for rehiring
            rehired_by_user_id (int): User ID who is rehiring
            
        Returns:
            dict: Rehire result
        """
        try:
            parameters = {
                'employee_id': employee_id,
                'rehire_reason': rehire_reason,
                'rehired_by': rehired_by_user_id
            }
            
            current_app.logger.info(f"Rehiring employee ID: {employee_id}")
            
            result = MultiTenantExecutor.execute_procedure('proc_rehire_employee', parameters)
            
            if result["success"] and result["data"]:
                # The procedure returns nested results: [[result1], [result2]]
                # We need the last result which is from proc_rehire_employee itself
                proc_result = result["data"]
                
                # Get the last result set (from proc_rehire_employee)
                if isinstance(proc_result, list) and len(proc_result) > 0:
                    # Get last result set
                    last_result_set = proc_result[-1]
                    
                    # Extract the dict from the result set
                    if isinstance(last_result_set, list) and len(last_result_set) > 0:
                        proc_result = last_result_set[0]
                
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Employee rehired successfully"),
                        "data": {
                            "employee_id": employee_id,
                            "status": "ACTIVE"
                        }
                    }
                else:
                    error_msg = proc_result.get("message", "Failed to rehire employee") if isinstance(proc_result, dict) else "Failed to rehire employee"
                    return {
                        "success": False,
                        "message": error_msg,
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to rehire employee",
                    "data": None
                }
                
        except Exception as e:
            import traceback
            current_app.logger.error(f"Rehire employee error: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return {
                "success": False,
                "message": f"Rehire service error: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def get_factory_worker_exits(exit_status=None):
        """
        Get factory worker exit records
        
        Args:
            exit_status (str): Exit status filter (RESIGNED, REHIRED) - optional
            
        Returns:
            dict: Factory worker exits result
        """
        try:
            parameters = {'exit_status': exit_status}
            
            result = MultiTenantExecutor.execute_procedure('proc_get_factory_worker_exits', parameters)
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Factory worker exits retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve factory worker exits",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get factory worker exits error: {str(e)}")
            return {
                "success": False,
                "message": "Factory worker exits service error",
                "data": None
            }