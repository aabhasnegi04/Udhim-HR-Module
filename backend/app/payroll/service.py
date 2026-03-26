from flask import current_app
from app.database.multi_tenant_executor import MultiTenantExecutor
from datetime import datetime, date
import json


class PayrollService:
    """Payroll service layer for payroll management"""
    
    # PAYROLL DASHBOARD
    @staticmethod
    def get_payroll_dashboard(period_id=None):
        """Get payroll dashboard data"""
        try:
            parameters = {}
            if period_id:
                parameters['period_id'] = period_id
            
            result = MultiTenantExecutor.execute_procedure('proc_get_payroll_dashboard', parameters)
            
            def convert_row(row):
                """Convert Decimal/date values to JSON-serializable types"""
                from decimal import Decimal
                import datetime
                converted = {}
                for k, v in row.items():
                    if isinstance(v, Decimal):
                        converted[k] = float(v)
                    elif isinstance(v, (datetime.date, datetime.datetime)):
                        converted[k] = v.isoformat()
                    else:
                        converted[k] = v
                return converted

            if result["success"] and result["data"]:
                all_results = result["data"]
                
                dashboard_data = {
                    "period_summary": {},
                    "department_summary": [],
                    "recent_activities": []
                }
                
                if isinstance(all_results, list) and len(all_results) > 0:
                    if len(all_results[0]) > 0:
                        dashboard_data["period_summary"] = convert_row(all_results[0][0])
                    
                    if len(all_results) > 1:
                        dashboard_data["department_summary"] = [convert_row(r) for r in (all_results[1] or [])]
                    
                    if len(all_results) > 2:
                        dashboard_data["recent_activities"] = [convert_row(r) for r in (all_results[2] or [])]
                
                return {
                    "success": True,
                    "message": "Payroll dashboard data retrieved successfully",
                    "data": dashboard_data
                }
            else:
                return {
                    "success": True,
                    "message": "No payroll data for this period",
                    "data": {
                        "period_summary": {},
                        "department_summary": [],
                        "recent_activities": []
                    }
                }
                
        except Exception as e:
            current_app.logger.error(f"Get payroll dashboard error: {str(e)}")
            return {
                "success": False,
                "message": f"Failed to load dashboard: {str(e)}",
                "data": {
                    "period_summary": {},
                    "department_summary": [],
                    "recent_activities": []
                }
            }
    
    # PAYROLL READINESS CHECK
    @staticmethod
    def get_payroll_readiness(year=None, month=None):
        """Check if payroll is ready to be processed"""
        try:
            parameters = {}
            if year:
                parameters['year'] = year
            if month:
                parameters['month'] = month
            
            result = MultiTenantExecutor.execute_procedure('proc_payroll_readiness_check', parameters)
            
            if result["success"] and result["data"]:
                # The procedure returns 4 result sets:
                # 1. Overall readiness summary
                # 2. Employees without salary
                # 3. Employees with missing attendance
                # 4. Pending leave requests
                
                all_results = result["data"]
                
                readiness_data = {
                    "summary": {},
                    "employees_without_salary": [],
                    "employees_with_missing_attendance": [],
                    "pending_leave_requests": []
                }
                
                if isinstance(all_results, list) and len(all_results) > 0:
                    # Result set 1: Summary
                    if len(all_results) > 0 and len(all_results[0]) > 0:
                        readiness_data["summary"] = all_results[0][0]
                    
                    # Result set 2: Employees without salary
                    if len(all_results) > 1:
                        readiness_data["employees_without_salary"] = all_results[1] or []
                    
                    # Result set 3: Employees with missing attendance
                    if len(all_results) > 2:
                        readiness_data["employees_with_missing_attendance"] = all_results[2] or []
                    
                    # Result set 4: Pending leave requests
                    if len(all_results) > 3:
                        readiness_data["pending_leave_requests"] = all_results[3] or []
                
                return {
                    "success": True,
                    "message": "Payroll readiness check completed successfully",
                    "data": readiness_data
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to check payroll readiness",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get payroll readiness error: {str(e)}")
            return {
                "success": False,
                "message": f"Payroll readiness check error: {str(e)}",
                "data": None
            }
    
    # PAYROLL CALCULATION
    @staticmethod
    def calculate_employee_payroll(period_id, employee_id):
        """Calculate payroll for a specific employee"""
        try:
            parameters = {
                'period_id': period_id,
                'employee_id': employee_id
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_calculate_employee_payroll', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Payroll calculated successfully"),
                        "data": {
                            "total_earnings": proc_result.get("total_earnings", 0),
                            "total_deductions": proc_result.get("total_deductions", 0),
                            "net_salary": proc_result.get("net_salary", 0)
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to calculate payroll"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to calculate payroll",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Calculate employee payroll error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    @staticmethod
    def process_bulk_payroll(period_id, processed_by):
        """Process payroll for all employees in a period"""
        try:
            parameters = {
                'period_id': period_id,
                'processed_by': processed_by
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_process_bulk_payroll', parameters)
            
            if result["success"] and result["data"]:
                # The procedure returns a list of result sets
                # Get the last result set which contains the success/failure info
                proc_result = result["data"][-1] if isinstance(result["data"], list) else result["data"]
                
                # Handle if proc_result is a list (single row result set)
                if isinstance(proc_result, list) and len(proc_result) > 0:
                    proc_result = proc_result[0]
                
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Bulk payroll processed successfully"),
                        "data": {
                            "total_employees": proc_result.get("total_employees", 0),
                            "successful_calculations": proc_result.get("successful_calculations", 0),
                            "failed_calculations": proc_result.get("failed_calculations", 0),
                            "employees_without_salary": proc_result.get("employees_without_salary", 0)
                        }
                    }
                else:
                    message = proc_result.get("message", "Failed to process bulk payroll") if isinstance(proc_result, dict) else "Failed to process bulk payroll"
                    return {
                        "success": False,
                        "message": message,
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to process bulk payroll",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Process bulk payroll error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    # PAYSLIP GENERATION
    @staticmethod
    def get_employee_payslip(period_id, employee_id):
        """Get payslip data for an employee"""
        from decimal import Decimal

        def convert_row(row):
            """Convert Decimal values to float for JSON serialization"""
            return {k: float(v) if isinstance(v, Decimal) else v for k, v in row.items()}

        try:
            parameters = {
                'period_id': period_id,
                'employee_id': employee_id
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_get_employee_payslip', parameters)
            
            if result["success"] and result["data"]:
                all_results = result["data"]
                
                payslip_data = {
                    "employee_details": {},
                    "earnings": [],
                    "deductions": [],
                    "adjustments": []
                }
                
                if isinstance(all_results, list) and len(all_results) > 0:
                    # Result set 1: Employee details
                    if len(all_results[0]) > 0:
                        payslip_data["employee_details"] = convert_row(all_results[0][0])
                    
                    # Result set 2: Earnings
                    if len(all_results) > 1:
                        payslip_data["earnings"] = [convert_row(r) for r in (all_results[1] or [])]
                    
                    # Result set 3: Deductions
                    if len(all_results) > 2:
                        payslip_data["deductions"] = [convert_row(r) for r in (all_results[2] or [])]
                    
                    # Result set 4: Adjustments (bonus, penalty, etc.)
                    if len(all_results) > 3:
                        payslip_data["adjustments"] = [convert_row(r) for r in (all_results[3] or [])]
                    else:
                        payslip_data["adjustments"] = []
                
                return {
                    "success": True,
                    "message": "Payslip data retrieved successfully",
                    "data": payslip_data
                }
            else:
                return {
                    "success": False,
                    "message": result.get("message", "No payslip data found"),
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get employee payslip error: {str(e)}")
            return {
                "success": False,
                "message": f"Failed to retrieve payslip: {str(e)}",
                "data": None
            }
    
    # SALARY STRUCTURE MANAGEMENT
    @staticmethod
    def get_employee_salary_structure(employee_id):
        """Get salary structure for an employee"""
        try:
            parameters = {
                'action': 'GET',
                'employee_id': employee_id
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_manage_salary_structure', parameters)
            
            if result["success"]:
                # Group components by type
                earnings = []
                deductions = []
                
                for component in result["data"]:
                    if component.get("component_type") == "EARNING":
                        earnings.append(component)
                    elif component.get("component_type") == "DEDUCTION":
                        deductions.append(component)
                
                return {
                    "success": True,
                    "message": "Salary structure retrieved successfully",
                    "data": {
                        "earnings": earnings,
                        "deductions": deductions
                    }
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve salary structure",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get salary structure error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    @staticmethod
    def add_salary_component(employee_id, component_id, amount=None, percentage=None, formula=None, effective_from=None):
        """Add a salary component to employee"""
        try:
            parameters = {
                'action': 'ADD',
                'employee_id': employee_id,
                'component_id': component_id,
                'amount': amount,
                'percentage': percentage,
                'formula': formula,
                'effective_from': effective_from
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_manage_salary_structure', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Salary component added successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to add salary component"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to add salary component",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Add salary component error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    @staticmethod
    def update_salary_component(employee_id, component_id, amount=None, percentage=None, formula=None):
        """Update a salary component for employee"""
        try:
            parameters = {
                'action': 'UPDATE',
                'employee_id': employee_id,
                'component_id': component_id,
                'amount': amount,
                'percentage': percentage,
                'formula': formula
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_manage_salary_structure', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Salary component updated successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to update salary component"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to update salary component",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Update salary component error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    @staticmethod
    def remove_salary_component(employee_id, component_id):
        """Remove a salary component from employee"""
        try:
            parameters = {
                'action': 'DELETE',
                'employee_id': employee_id,
                'component_id': component_id
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_manage_salary_structure', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Salary component removed successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to remove salary component"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to remove salary component",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Remove salary component error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    # PAYROLL COMPONENTS
    @staticmethod
    def get_payroll_components():
        """Get all available payroll components"""
        try:
            result = MultiTenantExecutor.execute_procedure('proc_get_payroll_components', {})
            
            if result["success"]:
                # Group components by type
                earnings = []
                deductions = []
                employer_contributions = []
                
                for component in result["data"]:
                    if component.get("component_type") == "EARNING":
                        earnings.append(component)
                    elif component.get("component_type") == "DEDUCTION":
                        deductions.append(component)
                    elif component.get("component_type") == "EMPLOYER_CONTRIBUTION":
                        employer_contributions.append(component)
                
                return {
                    "success": True,
                    "message": "Payroll components retrieved successfully",
                    "data": {
                        "earnings": earnings,
                        "deductions": deductions,
                        "employer_contributions": employer_contributions
                    }
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve payroll components",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get payroll components error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    # PAYROLL PERIODS
    @staticmethod
    def get_payroll_periods():
        """Get all payroll periods"""
        try:
            result = MultiTenantExecutor.execute_procedure('proc_get_payroll_periods', {})
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Payroll periods retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve payroll periods",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get payroll periods error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    @staticmethod
    def create_payroll_period(period_name, period_type, start_date, end_date, salary_date, created_by):
        """Create a new payroll period"""
        try:
            parameters = {
                'period_name': period_name,
                'period_type': period_type,
                'start_date': start_date,
                'end_date': end_date,
                'salary_date': salary_date,
                'created_by': created_by
            }
            result = MultiTenantExecutor.execute_procedure('proc_create_payroll_period', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Payroll period created successfully"),
                        "data": {
                            "period_id": proc_result.get("period_id"),
                            "period_name": proc_result.get("period_name"),
                            "period_type": proc_result.get("period_type"),
                            "start_date": proc_result.get("start_date"),
                            "end_date": proc_result.get("end_date"),
                            "salary_date": proc_result.get("salary_date"),
                            "status": proc_result.get("status")
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to create payroll period"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to create payroll period",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Create payroll period error: {str(e)}")
            return {
                "success": False,
                "message": f"Create payroll period error: {str(e)}",
                "data": None
            }
    @staticmethod
    def delete_payroll_period(period_id):
        """Delete a payroll period (only DRAFT periods can be deleted)"""
        try:
            parameters = {
                'period_id': period_id
            }
            result = MultiTenantExecutor.execute_procedure('proc_delete_payroll_period', parameters)

            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Payroll period deleted successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to delete payroll period"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to delete payroll period",
                    "data": None
                }

        except Exception as e:
            current_app.logger.error(f"Delete payroll period error: {str(e)}")
            return {
                "success": False,
                "message": f"Delete payroll period error: {str(e)}",
                "data": None
            }

    
    # PAYROLL SUMMARY
    @staticmethod
    def get_payroll_summary(period_id):
        """Get payroll summary for all employees in a period"""
        try:
            from decimal import Decimal
            
            parameters = {'period_id': period_id}
            result = MultiTenantExecutor.execute_procedure('proc_get_payroll_summary', parameters)
            
            if result["success"]:
                # Convert Decimal to float for JSON serialization
                data = result["data"]
                for row in data:
                    for key, value in row.items():
                        if isinstance(value, Decimal):
                            row[key] = float(value)
                
                return {
                    "success": True,
                    "message": "Payroll summary retrieved successfully",
                    "data": data
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve payroll summary",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get payroll summary error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    # ============================================
    # PAYROLL ADJUSTMENTS
    # ============================================

    @staticmethod
    def get_payroll_adjustments(period_id):
        """Get all adjustments for a payroll period"""
        try:
            from decimal import Decimal
            result = MultiTenantExecutor.execute_procedure('proc_get_payroll_adjustments', {'period_id': period_id})
            if result["success"]:
                data = result["data"]
                for row in data:
                    for key, value in row.items():
                        if isinstance(value, Decimal):
                            row[key] = float(value)
                return {"success": True, "message": "Adjustments retrieved", "data": data}
            return {"success": False, "message": "Failed to retrieve adjustments", "data": []}
        except Exception as e:
            current_app.logger.error(f"Get adjustments error: {str(e)}")
            return {"success": False, "message": "Service error", "data": []}

    @staticmethod
    def add_payroll_adjustment(period_id, employee_id, adjustment_type, description, amount, is_taxable, created_by):
        """Add a manual adjustment"""
        try:
            from decimal import Decimal
            parameters = {
                'period_id': period_id,
                'employee_id': employee_id,
                'adjustment_type': adjustment_type,
                'description': description,
                'amount': amount,
                'is_taxable': 1 if is_taxable else 0,
                'created_by': created_by
            }
            result = MultiTenantExecutor.execute_procedure('proc_add_payroll_adjustment', parameters)
            if result["success"] and result["data"]:
                row = result["data"][0]
                for key, value in row.items():
                    if isinstance(value, Decimal):
                        row[key] = float(value)
                if row.get('success') == 1:
                    return {"success": True, "message": row.get('message', 'Adjustment added'), "data": row}
                return {"success": False, "message": row.get('message', 'Failed to add adjustment')}
            return {"success": False, "message": "Failed to add adjustment"}
        except Exception as e:
            current_app.logger.error(f"Add adjustment error: {str(e)}")
            return {"success": False, "message": "Service error"}

    @staticmethod
    def delete_payroll_adjustment(adjustment_id, deleted_by):
        """Delete a manual adjustment"""
        try:
            parameters = {'adjustment_id': adjustment_id, 'deleted_by': deleted_by}
            result = MultiTenantExecutor.execute_procedure('proc_delete_payroll_adjustment', parameters)
            if result["success"] and result["data"]:
                row = result["data"][0]
                if row.get('success') == 1:
                    return {"success": True, "message": row.get('message', 'Adjustment deleted')}
                return {"success": False, "message": row.get('message', 'Failed to delete adjustment')}
            return {"success": False, "message": "Failed to delete adjustment"}
        except Exception as e:
            current_app.logger.error(f"Delete adjustment error: {str(e)}")
            return {"success": False, "message": "Service error"}

    # ============================================
    # PHASE P2: SALARY MANAGEMENT APIs
    # ============================================
    
    # SALARY TEMPLATES
    @staticmethod
    def get_salary_structures():
        """Get all salary structure templates"""
        try:
            result = MultiTenantExecutor.execute_procedure('proc_get_salary_structures', {})
            
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
            current_app.logger.error(f"Get salary structures error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    @staticmethod
    def create_salary_structure(structure_name, description=None, structure_type='STANDARD'):
        """Create a new salary structure template"""
        try:
            parameters = {
                'structure_name': structure_name,
                'description': description,
                'structure_type': structure_type
            }
            result = MultiTenantExecutor.execute_procedure('proc_create_salary_structure', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Salary structure created successfully"),
                        "data": {
                            "structure_id": proc_result.get("structure_id"),
                            "structure_name": structure_name
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to create salary structure"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to create salary structure",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Create salary structure error: {str(e)}")
            return {
                "success": False,
                "message": f"Payroll service error: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def add_structure_component(structure_id, component_id, calculation_type, amount=None, percentage=None, formula=None, base=None):
        """Add a component to a salary structure template"""
        try:
            # Note: formula parameter is accepted but not used - stored procedure only supports FIXED and PERCENTAGE
            parameters = {
                'structure_id': structure_id,
                'component_id': component_id,
                'calculation_type': calculation_type,
                'amount': amount,
                'percentage': percentage,
                'base_component': base or 'CTC'  # Default to CTC if not provided
            }
            result = MultiTenantExecutor.execute_procedure('proc_add_structure_component', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Component added successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to add component"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to add component",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Add structure component error: {str(e)}")
            return {
                "success": False,
                "message": f"Payroll service error: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def get_structure_components(structure_id):
        """Get components of a salary structure template"""
        try:
            parameters = {'structure_id': structure_id}
            result = MultiTenantExecutor.execute_procedure('proc_get_structure_components', parameters)
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Structure components retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve structure components",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get structure components error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    @staticmethod
    def assign_salary_template(employee_id, structure_id, monthly_ctc, effective_from=None):
        """Assign salary template to employee"""
        try:
            parameters = {
                'employee_id': employee_id,
                'structure_id': structure_id,
                'monthly_ctc': monthly_ctc,
                'effective_from': effective_from
            }
            result = MultiTenantExecutor.execute_procedure('proc_assign_salary_template', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Salary template assigned successfully"),
                        "data": {
                            "employee_id": proc_result.get("employee_id"),
                            "structure_id": proc_result.get("structure_id"),
                            "monthly_ctc": proc_result.get("monthly_ctc"),
                            "annual_ctc": proc_result.get("annual_ctc")
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to assign salary template"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to assign salary template",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Assign salary template error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    @staticmethod
    def deactivate_salary_assignment(employee_id, deactivated_by=None, reason=None):
        """Deactivate salary template assignment for an employee"""
        try:
            parameters = {
                'employee_id': employee_id,
                'deactivated_by': deactivated_by,
                'reason': reason
            }
            result = MultiTenantExecutor.execute_procedure('proc_deactivate_salary_assignment', parameters)
            
            if result["success"] and result["data"]:
                # Handle both single dict and list of result sets
                data = result["data"]
                if isinstance(data, list) and len(data) > 0:
                    # If it's a list of result sets, get the first result set
                    proc_result = data[0] if isinstance(data[0], list) else data
                    if isinstance(proc_result, list) and len(proc_result) > 0:
                        proc_result = proc_result[0]
                else:
                    proc_result = data
                
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Salary assignment deactivated successfully"),
                        "data": {
                            "employee_id": proc_result.get("employee_id")
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to deactivate salary assignment") if isinstance(proc_result, dict) else "Failed to deactivate salary assignment",
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": result.get("message", "Failed to deactivate salary assignment"),
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Deactivate salary assignment error: {str(e)}")
            return {
                "success": False,
                "message": f"Deactivate salary assignment error: {str(e)}",
                "data": None
            }
    
    # EMPLOYEE SALARY MANAGEMENT
    @staticmethod
    def get_employee_salary_details(employee_id):
        """Get complete salary details for an employee"""
        try:
            parameters = {'employee_id': employee_id}
            result = MultiTenantExecutor.execute_procedure('proc_get_employee_salary', parameters)
            
            if result["success"] and result["data"]:
                # The procedure returns 2 result sets:
                # 1. Employee details
                # 2. Salary components
                
                all_results = result["data"]
                
                salary_data = {
                    "employee_details": {},
                    "components": []
                }
                
                if isinstance(all_results, list) and len(all_results) > 0:
                    # Result set 1: Employee details
                    if len(all_results) > 0 and len(all_results[0]) > 0:
                        salary_data["employee_details"] = all_results[0][0]
                    
                    # Result set 2: Salary components
                    if len(all_results) > 1:
                        salary_data["components"] = all_results[1] or []
                
                return {
                    "success": True,
                    "message": "Employee salary details retrieved successfully",
                    "data": salary_data
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve employee salary details",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get employee salary details error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    @staticmethod
    def update_employee_salary_component_amount(employee_id, component_id, amount, updated_by=None):
        """Update salary component amount for an employee"""
        try:
            parameters = {
                'employee_id': employee_id,
                'component_id': component_id,
                'amount': amount,
                'updated_by': updated_by
            }
            result = MultiTenantExecutor.execute_procedure('proc_update_employee_salary_component', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Salary component updated successfully"),
                        "data": {
                            "employee_id": proc_result.get("employee_id"),
                            "component_id": proc_result.get("component_id"),
                            "new_amount": proc_result.get("new_amount")
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to update salary component"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to update salary component",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Update salary component error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    @staticmethod
    def validate_employee_salary_structure(employee_id):
        """Validate employee salary structure before payroll"""
        try:
            parameters = {'employee_id': employee_id}
            result = MultiTenantExecutor.execute_procedure('proc_validate_employee_salary', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict):
                    return {
                        "success": True,
                        "message": "Salary validation completed",
                        "data": {
                            "valid": proc_result.get("valid") == 1,
                            "message": proc_result.get("message"),
                            "component_count": proc_result.get("component_count", 0)
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": "Invalid validation response",
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to validate salary structure",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Validate salary structure error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    @staticmethod
    def get_employees_without_salary():
        """Get list of employees who don't have salary structure assigned"""
        try:
            result = MultiTenantExecutor.execute_procedure('proc_get_employees_without_salary', {})
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Employees without salary retrieved successfully",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve employees without salary",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get employees without salary error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }

    # ============================================
    # BANK ADVICE
    # ============================================

    @staticmethod
    def get_bank_advice(period_id):
        """Get bank advice for a locked payroll period"""
        try:
            from decimal import Decimal
            result = MultiTenantExecutor.execute_procedure('proc_get_bank_advice', {'period_id': period_id})
            if result["success"]:
                data = result["data"]
                if data and isinstance(data[0], list):
                    data = data[0]
                if not data:
                    data = []
                for row in data:
                    for key, value in row.items():
                        if isinstance(value, Decimal):
                            row[key] = float(value)
                return {"success": True, "message": "Bank advice retrieved", "data": data}
            return {"success": False, "message": result.get("message", "Failed to retrieve bank advice"), "data": []}
        except Exception as e:
            current_app.logger.error(f"Get bank advice error: {str(e)}")
            return {"success": False, "message": f"Service error: {str(e)}", "data": []}

    @staticmethod
    def update_employee_bank_details(employee_id, bank_account_number, bank_name, bank_ifsc_code, bank_branch):
        """Update employee bank details"""
        try:
            parameters = {
                'employee_id': employee_id,
                'bank_account_number': bank_account_number,
                'bank_name': bank_name,
                'bank_ifsc_code': bank_ifsc_code,
                'bank_branch': bank_branch
            }
            result = MultiTenantExecutor.execute_procedure('proc_update_employee_bank_details', parameters)
            if result["success"] and result["data"]:
                row = result["data"][0]
                if row.get('success') == 1:
                    return {"success": True, "message": row.get('message', 'Bank details updated')}
                return {"success": False, "message": row.get('message', 'Failed to update bank details')}
            return {"success": False, "message": "Failed to update bank details"}
        except Exception as e:
            current_app.logger.error(f"Update bank details error: {str(e)}")
            return {"success": False, "message": "Service error"}

    # PAYROLL OPERATIONAL PROCEDURES (PHASE 3)
    @staticmethod
    def lock_payroll(period_id, locked_by):
        """Lock payroll period after verification"""
        try:
            parameters = {
                'period_id': period_id,
                'locked_by': locked_by
            }
            result = MultiTenantExecutor.execute_procedure('proc_lock_payroll', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Payroll locked successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to lock payroll"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to lock payroll",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Lock payroll error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    @staticmethod
    def unlock_payroll(period_id, unlocked_by, reason):
        """Emergency unlock payroll period"""
        try:
            parameters = {
                'period_id': period_id,
                'unlocked_by': unlocked_by,
                'reason': reason
            }
            result = MultiTenantExecutor.execute_procedure('proc_unlock_payroll', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Payroll unlocked successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to unlock payroll"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to unlock payroll",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Unlock payroll error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    @staticmethod
    def mark_salaries_paid(period_id, payment_reference, paid_by):
        """Mark salaries as paid after bank transfer"""
        try:
            parameters = {
                'period_id': period_id,
                'payment_reference': payment_reference,
                'paid_by': paid_by
            }
            result = MultiTenantExecutor.execute_procedure('proc_mark_salary_paid', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Salaries marked as paid successfully"),
                        "data": {
                            "employees_updated": proc_result.get("employees_updated", 0)
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to mark salaries as paid"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to mark salaries as paid",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Mark salaries paid error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    @staticmethod
    def get_salary_register(period_id):
        """Get complete salary register report"""
        from decimal import Decimal

        def convert_row(row):
            return {k: float(v) if isinstance(v, Decimal) else v for k, v in row.items()}

        try:
            parameters = {'period_id': period_id}
            result = MultiTenantExecutor.execute_procedure('proc_get_salary_register', parameters)

            if result["success"] and result["data"]:
                data = result["data"]

                # Single result set — flat list of employee rows
                if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                    employees = [convert_row(r) for r in data]
                    return {
                        "success": True,
                        "message": "Salary register retrieved successfully",
                        "data": employees
                    }

                # Multiple result sets (future-proofing)
                if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                    employees = [convert_row(r) for r in (data[0] or [])]
                    return {
                        "success": True,
                        "message": "Salary register retrieved successfully",
                        "data": employees
                    }

                return {
                    "success": True,
                    "message": "Salary register retrieved successfully",
                    "data": []
                }
            else:
                return {
                    "success": False,
                    "message": result.get("message", "Failed to retrieve salary register"),
                    "data": None
                }

        except Exception as e:
            current_app.logger.error(f"Get salary register error: {str(e)}")
            return {
                "success": False,
                "message": "Payroll service error",
                "data": None
            }
    
    # ============================================
    # COMPLIANCE REPORTS
    # ============================================
    
    @staticmethod
    def get_pf_summary(period_id):
        """Get PF (Provident Fund) summary report"""
        from decimal import Decimal
        try:
            parameters = {'period_id': period_id}
            result = MultiTenantExecutor.execute_procedure('proc_get_pf_summary', parameters)
            if result["success"] and result["data"]:
                data = [{k: float(v) if isinstance(v, Decimal) else v for k, v in row.items()} for row in result["data"]]
                return {"success": True, "message": "PF summary retrieved successfully", "data": data}
            else:
                return {"success": True, "message": "No PF data found", "data": []}
        except Exception as e:
            current_app.logger.error(f"Get PF summary error: {str(e)}")
            return {"success": False, "message": "Payroll service error", "data": []}
    
    @staticmethod
    def get_esi_summary(period_id):
        """Get ESI (Employee State Insurance) summary report"""
        from decimal import Decimal
        try:
            parameters = {'period_id': period_id}
            result = MultiTenantExecutor.execute_procedure('proc_get_esi_summary', parameters)
            if result["success"] and result["data"]:
                data = [{k: float(v) if isinstance(v, Decimal) else v for k, v in row.items()} for row in result["data"]]
                return {"success": True, "message": "ESI summary retrieved successfully", "data": data}
            else:
                return {"success": True, "message": "No ESI data found", "data": []}
        except Exception as e:
            current_app.logger.error(f"Get ESI summary error: {str(e)}")
            return {"success": False, "message": "Payroll service error", "data": []}
    
    @staticmethod
    def get_pt_summary(period_id):
        """Get Professional Tax summary report"""
        from decimal import Decimal
        try:
            parameters = {'period_id': period_id}
            result = MultiTenantExecutor.execute_procedure('proc_get_pt_summary', parameters)
            if result["success"] and result["data"]:
                data = [{k: float(v) if isinstance(v, Decimal) else v for k, v in row.items()} for row in result["data"]]
                return {"success": True, "message": "PT summary retrieved successfully", "data": data}
            else:
                return {"success": True, "message": "No PT data found", "data": []}
        except Exception as e:
            current_app.logger.error(f"Get PT summary error: {str(e)}")
            return {"success": False, "message": "Payroll service error", "data": []}
    
    @staticmethod
    def get_tds_summary(period_id):
        """Get TDS (Tax Deducted at Source) summary report"""
        from decimal import Decimal
        try:
            parameters = {'period_id': period_id}
            result = MultiTenantExecutor.execute_procedure('proc_get_tds_summary', parameters)
            if result["success"] and result["data"]:
                data = [{k: float(v) if isinstance(v, Decimal) else v for k, v in row.items()} for row in result["data"]]
                return {"success": True, "message": "TDS summary retrieved successfully", "data": data}
            else:
                return {"success": True, "message": "No TDS data found", "data": []}
        except Exception as e:
            current_app.logger.error(f"Get TDS summary error: {str(e)}")
            return {"success": False, "message": "Payroll service error", "data": []}

    @staticmethod
    def update_salary_structure(structure_id, structure_name=None, description=None, structure_type=None):
        """Update a salary structure template"""
        try:
            parameters = {
                'structure_id': structure_id,
                'structure_name': structure_name,
                'description': description,
                'structure_type': structure_type
            }
            result = MultiTenantExecutor.execute_procedure('proc_update_salary_structure', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Salary structure updated successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to update salary structure"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to update salary structure",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Update salary structure error: {str(e)}")
            return {
                "success": False,
                "message": f"Payroll service error: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def deactivate_salary_structure(structure_id):
        """Deactivate a salary structure template"""
        try:
            parameters = {'structure_id': structure_id}
            result = MultiTenantExecutor.execute_procedure('proc_deactivate_salary_structure', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Salary structure deactivated successfully"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to deactivate salary structure"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to deactivate salary structure",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Deactivate salary structure error: {str(e)}")
            return {
                "success": False,
                "message": f"Payroll service error: {str(e)}",
                "data": None
            }

    @staticmethod
    def update_salary_structure_components(structure_id, components):
        """Replace all components of a salary structure template"""
        try:
            # Step 1: Clear existing components
            clear_result = MultiTenantExecutor.execute_procedure(
                'proc_update_salary_structure_components',
                {'structure_id': structure_id, 'action': 'CLEAR'}
            )
            if not clear_result["success"]:
                return {"success": False, "message": "Failed to clear existing components", "data": None}

            # Check clear proc result
            if clear_result.get("data"):
                clear_row = clear_result["data"][0]
                if isinstance(clear_row, dict) and clear_row.get("success") != 1:
                    return {"success": False, "message": clear_row.get("message", "Failed to clear components"), "data": None}

            # Step 2: Add new components one by one
            errors = []
            for i, comp in enumerate(components):
                # Convert component_id to int to avoid type mismatch
                comp_id = comp.get('component_id')
                try:
                    comp_id = int(comp_id)
                except (TypeError, ValueError):
                    errors.append(f"Component {i+1}: Invalid component ID")
                    continue

                add_result = MultiTenantExecutor.execute_procedure(
                    'proc_update_salary_structure_components',
                    {
                        'structure_id': structure_id,
                        'action': 'ADD',
                        'component_id': comp_id,
                        'calculation_type': comp.get('calculation_type'),
                        'amount': comp.get('amount') or None,
                        'percentage': comp.get('percentage') or None,
                        'base_component': comp.get('base', 'CTC')
                    }
                )
                if add_result["success"] and add_result.get("data"):
                    row = add_result["data"][0]
                    if isinstance(row, dict) and row.get("success") != 1:
                        errors.append(f"Component {i+1}: {row.get('message', 'Failed to add')}")
                elif not add_result["success"]:
                    errors.append(f"Component {i+1}: {add_result.get('message', 'Failed to add')}")

            if errors:
                return {"success": False, "message": "; ".join(errors), "data": None}

            return {"success": True, "message": "Components updated successfully", "data": None}

        except Exception as e:
            current_app.logger.error(f"Update structure components error: {str(e)}")
            return {"success": False, "message": f"Payroll service error: {str(e)}", "data": None}
