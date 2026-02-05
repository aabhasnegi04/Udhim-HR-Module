from flask import current_app
from app.database.executor import StoredProcedureExecutor
from datetime import datetime, date


class LeaveService:
    """Leave service layer for leave management"""
    
    # ========================================================================
    # LEAVE TYPES (MASTER DATA)
    # ========================================================================
    
    @staticmethod
    def get_leave_types():
        """Get all active leave types"""
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
            current_app.logger.error(f"Get leave types error: {str(e)}")
            return {
                "success": False,
                "message": "Leave service error",
                "data": None
            }
    
    @staticmethod
    def get_leave_types_for_employee(employee_id):
        """Get leave types appropriate for a specific employee based on gender"""
        try:
            # First get all leave types
            result = StoredProcedureExecutor.execute_procedure('proc_list_leave_types')
            
            if not result["success"]:
                return {
                    "success": False,
                    "message": "Failed to retrieve leave types",
                    "data": None
                }
            
            # Get employee gender
            emp_result = StoredProcedureExecutor.execute_procedure('proc_get_employee_profile', {'employee_id': employee_id})
            
            if not emp_result["success"] or not emp_result["data"]:
                # If we can't get employee data, return all leave types (fallback)
                current_app.logger.warning(f"Employee profile not found for employee_id: {employee_id}, returning all leave types")
                return {
                    "success": True,
                    "message": "Leave types retrieved successfully (no gender filtering applied)",
                    "data": result["data"]
                }
            
            employee_data = emp_result["data"][0]
            employee_gender = employee_data.get('gender')
            
            # Handle None/NULL gender
            if employee_gender is None:
                employee_gender = ''
            else:
                employee_gender = employee_gender.strip()
            
            current_app.logger.info(f"Employee {employee_id} gender: '{employee_gender}'")
            
            # Filter leave types based on gender
            filtered_leave_types = []
            for leave_type in result["data"]:
                leave_name = leave_type.get('leave_name', '')
                
                # Apply gender-based filtering
                if leave_name == 'Maternity Leave' and employee_gender != 'Female':
                    current_app.logger.info(f"Filtering out Maternity Leave for {employee_gender} employee")
                    continue  # Skip maternity leave for non-female employees
                elif leave_name == 'Paternity Leave' and employee_gender != 'Male':
                    current_app.logger.info(f"Filtering out Paternity Leave for {employee_gender} employee")
                    continue  # Skip paternity leave for non-male employees
                else:
                    filtered_leave_types.append(leave_type)
            
            current_app.logger.info(f"Filtered leave types count: {len(filtered_leave_types)} (original: {len(result['data'])})")
            
            return {
                "success": True,
                "message": "Leave types retrieved successfully",
                "data": filtered_leave_types
            }
                
        except Exception as e:
            current_app.logger.error(f"Get leave types for employee error: {str(e)}")
            return {
                "success": False,
                "message": "Leave service error",
                "data": None
            }
    
    # ========================================================================
    # HELPER METHODS
    # ========================================================================
    
    @staticmethod
    def get_employee_id_from_user_id(user_id):
        """
        Get employee_id from user_id using stored procedure
        Helper method to avoid direct SQL in routes
        """
        try:
            parameters = {'user_id': user_id}
            # Use the new procedure that allows both active and inactive employees for leave viewing
            result = StoredProcedureExecutor.execute_procedure('proc_get_employee_id_by_user_id_for_leave_view', parameters)
            
            if result["success"] and result["data"] and len(result["data"]) > 0:
                employee_data = result["data"][0]
                return {
                    "success": True,
                    "employee_id": employee_data.get('employee_id'),
                    "employee_code": employee_data.get('employee_code'),
                    "employee_name": employee_data.get('employee_name'),
                    "status": employee_data.get('status')
                }
            else:
                return {
                    "success": False,
                    "employee_id": None,
                    "message": "Employee record not found for this user"
                }
        except Exception as e:
            current_app.logger.error(f"Get employee_id from user_id error: {str(e)}")
            return {
                "success": False,
                "employee_id": None,
                "message": "Database error occurred"
            }
    
    # ========================================================================
    # LEAVE BALANCE MANAGEMENT (HR ONLY)
    # ========================================================================
    
    @staticmethod
    def allocate_leave_balance(balance_data):
        """Allocate leave balance to employee (HR only)"""
        try:
            parameters = {
                'employee_id': balance_data.get('employee_id'),
                'leave_type_id': balance_data.get('leave_type_id'),
                'year': balance_data.get('year'),
                'total_allocated': balance_data.get('total_allocated')
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_allocate_leave_balance', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Leave balance allocated successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to allocate leave balance"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to allocate leave balance",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Allocate leave balance error: {str(e)}")
            return {
                "success": False,
                "message": "Leave service error",
                "data": None
            }
    
    @staticmethod
    def adjust_leave_balance(balance_id, adjustment, reason):
        """Adjust leave balance (HR only - manual correction)"""
        try:
            parameters = {
                'balance_id': balance_id,
                'adjustment': adjustment,
                'reason': reason
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_adjust_leave_balance', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Leave balance adjusted successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to adjust leave balance"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to adjust leave balance",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Adjust leave balance error: {str(e)}")
            return {
                "success": False,
                "message": "Leave service error",
                "data": None
            }
    
    @staticmethod
    def get_leave_balances_by_employee(employee_id, year=None):
        """Get leave balances for an employee"""
        try:
            parameters = {'employee_id': employee_id}
            if year:
                parameters['year'] = year
            
            result = StoredProcedureExecutor.execute_procedure('proc_get_leave_balances_by_employee', parameters)
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Leave balances retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve leave balances",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get leave balances error: {str(e)}")
            return {
                "success": False,
                "message": "Leave service error",
                "data": None
            }
    
    # ========================================================================
    # LEAVE APPLICATION (EMPLOYEE)
    # ========================================================================
    
    @staticmethod
    def apply_leave(leave_data):
        """Apply for leave (Employee)"""
        try:
            parameters = {
                'employee_id': leave_data.get('employee_id'),
                'leave_type_id': leave_data.get('leave_type_id'),
                'start_date': leave_data.get('start_date'),
                'end_date': leave_data.get('end_date'),
                'reason': leave_data.get('reason')
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_apply_leave', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Leave request submitted successfully"),
                        "data": {
                            "request_id": proc_result.get("request_id"),
                            "total_days": proc_result.get("total_days")
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to apply leave"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to apply leave",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Apply leave error: {str(e)}")
            return {
                "success": False,
                "message": "Leave service error",
                "data": None
            }
    
    # ========================================================================
    # APPROVAL WORKFLOW
    # ========================================================================
    
    @staticmethod
    def manager_approve_leave(request_id, approver_id, comment=None):
        """Manager approve leave (First level approval)"""
        try:
            parameters = {
                'request_id': request_id,
                'approver_id': approver_id,
                'comment': comment
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_manager_approve_leave', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Leave approved by manager"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to approve leave"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to approve leave",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Manager approve leave error: {str(e)}")
            return {
                "success": False,
                "message": "Leave service error",
                "data": None
            }
    
    @staticmethod
    def hr_approve_leave(request_id, approver_id, comment=None):
        """HR approve leave (Final approval - updates balance)"""
        try:
            parameters = {
                'request_id': request_id,
                'approver_id': approver_id,
                'comment': comment
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_hr_approve_leave', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Leave approved by HR"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to approve leave"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to approve leave",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"HR approve leave error: {str(e)}")
            return {
                "success": False,
                "message": "Leave service error",
                "data": None
            }
    
    @staticmethod
    def reject_leave(request_id, approver_id, approver_role, comment):
        """Reject leave request"""
        try:
            parameters = {
                'request_id': request_id,
                'approver_id': approver_id,
                'approver_role': approver_role,
                'comment': comment
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_reject_leave', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Leave request rejected"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to reject leave"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to reject leave",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Reject leave error: {str(e)}")
            return {
                "success": False,
                "message": "Leave service error",
                "data": None
            }
    
    # ========================================================================
    # CANCEL LEAVE
    # ========================================================================
    
    @staticmethod
    def cancel_leave(request_id, employee_id):
        """Cancel leave request (Employee)"""
        try:
            parameters = {
                'request_id': request_id,
                'employee_id': employee_id
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_cancel_leave', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Leave request cancelled"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to cancel leave"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to cancel leave",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Cancel leave error: {str(e)}")
            return {
                "success": False,
                "message": "Leave service error",
                "data": None
            }
    
    # ========================================================================
    # REPORTING
    # ========================================================================
    
    @staticmethod
    def get_leaves_by_employee(employee_id, year=None):
        """Get leave history for an employee"""
        try:
            parameters = {'employee_id': employee_id}
            if year:
                parameters['year'] = year
            
            result = StoredProcedureExecutor.execute_procedure('proc_get_leaves_by_employee', parameters)
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Leave history retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve leave history",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get leaves by employee error: {str(e)}")
            return {
                "success": False,
                "message": "Leave service error",
                "data": None
            }
    
    @staticmethod
    def get_leaves_by_department(department, year=None):
        """Get leaves for a department"""
        try:
            parameters = {'department': department}
            if year:
                parameters['year'] = year
            
            result = StoredProcedureExecutor.execute_procedure('proc_get_leaves_by_department', parameters)
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Department leaves retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve department leaves",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get leaves by department error: {str(e)}")
            return {
                "success": False,
                "message": "Leave service error",
                "data": None
            }
    
    @staticmethod
    def get_leave_register(start_date=None, end_date=None, status=None):
        """Get complete leave register"""
        try:
            parameters = {}
            if start_date:
                parameters['start_date'] = start_date
            if end_date:
                parameters['end_date'] = end_date
            if status:
                parameters['status'] = status
            
            result = StoredProcedureExecutor.execute_procedure('proc_get_leave_register', parameters)
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Leave register retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve leave register",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get leave register error: {str(e)}")
            return {
                "success": False,
                "message": "Leave service error",
                "data": None
            }
    
    @staticmethod
    def get_pending_leaves(approver_role=None):
        """Get pending leaves for approval"""
        try:
            parameters = {}
            if approver_role:
                parameters['approver_role'] = approver_role
            
            result = StoredProcedureExecutor.execute_procedure('proc_get_pending_leaves', parameters)
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Pending leaves retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve pending leaves",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get pending leaves error: {str(e)}")
            return {
                "success": False,
                "message": "Leave service error",
                "data": None
            }
