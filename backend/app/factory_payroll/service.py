"""
Factory Payroll Service
Business logic for factory worker rate management and payroll
"""
from app.database.multi_tenant_executor import MultiTenantExecutor
import json


class FactoryPayrollService:
    """Service class for factory payroll operations"""
    
    # ============================================
    # RATE MANAGEMENT
    # ============================================
    
    @staticmethod
    def assign_worker_rate(employee_id, daily_rate, effective_from, created_by):
        """
        Assign or update daily rate for a factory worker
        
        Args:
            employee_id (int): Employee ID
            daily_rate (float): Daily rate amount
            effective_from (str): Effective start date (YYYY-MM-DD)
            created_by (int): User ID who created the rate
            
        Returns:
            dict: Result with success status and message
        """
        try:
            params = {
                'employee_id': employee_id,
                'daily_rate': daily_rate,
                'effective_from': effective_from,
                'created_by': created_by
            }
            
            result = MultiTenantExecutor.execute_procedure(
                'proc_assign_factory_worker_rate',
                params
            )
            
            if result.get('success'):
                return {
                    'success': True,
                    'message': 'Factory worker rate assigned successfully',
                    'data': result.get('data')
                }
            else:
                return {
                    'success': False,
                    'message': result.get('message', 'Failed to assign rate')
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error assigning rate: {str(e)}'
            }
    
    @staticmethod
    def get_worker_current_rate(employee_id, as_of_date=None):
        """
        Get current active rate for a factory worker
        
        Args:
            employee_id (int): Employee ID
            as_of_date (str, optional): Date to check rate (YYYY-MM-DD)
            
        Returns:
            dict: Result with rate details
        """
        try:
            params = {
                'employee_id': employee_id
            }
            
            if as_of_date:
                params['as_of_date'] = as_of_date
            
            result = MultiTenantExecutor.execute_procedure(
                'proc_get_factory_worker_current_rate',
                params
            )
            
            if result.get('success'):
                data = result.get('data', [])
                # Handle both list and single dict responses
                if isinstance(data, list) and len(data) > 0:
                    rate_data = data[0] if isinstance(data[0], dict) else None
                else:
                    rate_data = data if isinstance(data, dict) else None
                
                # Convert datetime/time fields to strings
                if rate_data and isinstance(rate_data, dict):
                    for key in ['created_at', 'updated_at']:
                        if key in rate_data and rate_data[key]:
                            rate_data[key] = str(rate_data[key])
                
                if rate_data:
                    return {
                        'success': True,
                        'message': 'Current rate retrieved successfully',
                        'data': rate_data
                    }
                else:
                    return {
                        'success': False,
                        'message': 'No active rate found for this factory worker'
                    }
            else:
                return {
                    'success': False,
                    'message': result.get('message', 'Failed to retrieve rate')
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error retrieving rate: {str(e)}'
            }
    
    @staticmethod
    def get_worker_rate_history(employee_id):
        """
        Get complete rate history for a factory worker
        
        Args:
            employee_id (int): Employee ID
            
        Returns:
            dict: Result with rate history
        """
        try:
            params = {
                'employee_id': employee_id
            }
            
            result = MultiTenantExecutor.execute_procedure(
                'proc_get_factory_worker_rate_history',
                params
            )
            
            if result.get('success'):
                return {
                    'success': True,
                    'message': 'Rate history retrieved successfully',
                    'data': result.get('data', [])
                }
            else:
                return {
                    'success': False,
                    'message': result.get('message', 'Failed to retrieve rate history')
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error retrieving rate history: {str(e)}'
            }
    
    @staticmethod
    def bulk_assign_rates(rate_data_list, created_by, effective_from=None):
        """
        Bulk assign rates — each entry in rate_data_list can have its own effective_from.
        effective_from per entry takes priority; falls back to the global effective_from param.
        """
        try:
            import json as _json
            from datetime import date
            today = date.today().isoformat()

            # Ensure every entry has effective_from
            for entry in rate_data_list:
                if not entry.get('effective_from'):
                    entry['effective_from'] = effective_from or today

            rate_data_json = _json.dumps(rate_data_list)

            params = {
                'rate_data': rate_data_json,
                'created_by': created_by
            }

            result = MultiTenantExecutor.execute_procedure(
                'proc_bulk_assign_factory_rates',
                params
            )

            if result.get('success'):
                return {
                    'success': True,
                    'message': 'Bulk rate assignment completed',
                    'data': result.get('data')
                }
            else:
                return {
                    'success': False,
                    'message': result.get('message', 'Failed to assign rates')
                }

        except Exception as e:
            return {
                'success': False,
                'message': f'Error in bulk rate assignment: {str(e)}'
            }
    
    @staticmethod
    def get_all_workers_with_rates(employee_status='ACTIVE'):
        """
        Get all factory workers with their current rates
        
        Returns:
            dict: Result with list of all factory workers and their rates
        """
        try:
            result = MultiTenantExecutor.execute_procedure(
                'proc_get_all_factory_workers_with_rates',
                {'employee_status': employee_status}
            )
            
            if result.get('success'):
                data = result.get('data', [])
                
                # Convert time and date objects to strings for JSON serialization
                if isinstance(data, list):
                    for worker in data:
                        if isinstance(worker, dict):
                            # Convert all datetime, date, and time fields to strings
                            for key, value in list(worker.items()):
                                if value is not None:
                                    # Check if it's a datetime, date, or time object
                                    if hasattr(value, 'isoformat') or str(type(value).__name__) in ['datetime', 'date', 'time']:
                                        worker[key] = str(value)
                
                return {
                    'success': True,
                    'message': 'Factory workers retrieved successfully',
                    'data': data
                }
            else:
                return {
                    'success': False,
                    'message': result.get('message', 'Failed to retrieve factory workers')
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error retrieving factory workers: {str(e)}'
            }
    
    # ============================================
    # PAYROLL CONFIGURATION
    # ============================================
    
    @staticmethod
    def get_payroll_config():
        """Get current payroll configuration settings"""
        try:
            result = MultiTenantExecutor.execute_procedure(
                'proc_get_factory_payroll_config',
                {}
            )
            
            if result.get('success'):
                data = result.get('data', [])
                config = data[0] if isinstance(data, list) and len(data) > 0 else data
                
                return {
                    'success': True,
                    'message': 'Configuration retrieved successfully',
                    'data': config
                }
            else:
                return {
                    'success': False,
                    'message': 'Failed to retrieve configuration'
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error retrieving configuration: {str(e)}'
            }
    
    @staticmethod
    def update_payroll_config(full_day_hours, half_day_minimum_hours, absent_threshold_hours,
                              hourly_divisor, overtime_multiplier, sunday_bonus_hours, updated_by):
        """Update payroll configuration settings"""
        try:
            params = {
                'full_day_hours': full_day_hours,
                'half_day_minimum_hours': half_day_minimum_hours,
                'absent_threshold_hours': absent_threshold_hours,
                'hourly_divisor': hourly_divisor,
                'overtime_multiplier': overtime_multiplier,
                'sunday_bonus_hours': sunday_bonus_hours,
                'updated_by': updated_by
            }
            
            result = MultiTenantExecutor.execute_procedure(
                'proc_update_factory_payroll_config',
                params
            )
            
            if result.get('success'):
                return {
                    'success': True,
                    'message': 'Configuration updated successfully',
                    'data': result.get('data')
                }
            else:
                return {
                    'success': False,
                    'message': result.get('message', 'Failed to update configuration')
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error updating configuration: {str(e)}'
            }
    
    # ============================================
    # PAYROLL PERIOD MANAGEMENT
    # ============================================
    
    @staticmethod
    def create_payroll_period(year, month, created_by):
        """Create a new factory payroll period"""
        try:
            params = {
                'year': year,
                'month': month,
                'created_by': created_by
            }
            
            result = MultiTenantExecutor.execute_procedure(
                'proc_create_factory_payroll_period',
                params
            )
            
            if result.get('success'):
                return {
                    'success': True,
                    'message': 'Payroll period created successfully',
                    'data': result.get('data')
                }
            else:
                return {
                    'success': False,
                    'message': result.get('message', 'Failed to create period')
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error creating period: {str(e)}'
            }
    
    @staticmethod
    def get_payroll_periods():
        """Get all factory payroll periods"""
        try:
            result = MultiTenantExecutor.execute_procedure(
                'proc_get_factory_payroll_periods',
                {}
            )
            
            if result.get('success'):
                return {
                    'success': True,
                    'message': 'Payroll periods retrieved successfully',
                    'data': result.get('data', [])
                }
            else:
                return {
                    'success': False,
                    'message': 'Failed to retrieve periods'
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error retrieving periods: {str(e)}'
            }
    
    # ============================================
    # PAYROLL CALCULATION
    # ============================================
    
    @staticmethod
    def calculate_payroll(period_id, calculated_by):
        """Calculate payroll for all factory workers in a period"""
        try:
            params = {
                'period_id': period_id,
                'calculated_by': calculated_by
            }
            
            result = MultiTenantExecutor.execute_procedure(
                'proc_calculate_factory_payroll',
                params
            )
            
            if result.get('success'):
                return {
                    'success': True,
                    'message': 'Payroll calculated successfully',
                    'data': result.get('data')
                }
            else:
                return {
                    'success': False,
                    'message': result.get('message', 'Failed to calculate payroll')
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error calculating payroll: {str(e)}'
            }
    
    @staticmethod
    def get_payroll_summary(period_id):
        """Get payroll summary for a period"""
        try:
            params = {
                'period_id': period_id
            }
            
            result = MultiTenantExecutor.execute_procedure(
                'proc_get_factory_payroll_summary',
                params
            )
            
            if result.get('success'):
                return {
                    'success': True,
                    'message': 'Payroll summary retrieved successfully',
                    'data': result.get('data', [])
                }
            else:
                return {
                    'success': False,
                    'message': 'Failed to retrieve summary'
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error retrieving summary: {str(e)}'
            }

    @staticmethod
    def get_payroll_summary_by_month(year, month):
        """Get payroll summary for a year/month by looking up the period first"""
        try:
            # Find the period for this year/month
            period_result = MultiTenantExecutor.execute_query(
                "SELECT period_id FROM factory_payroll_periods WHERE year = ? AND month = ?",
                (year, month)
            )
            if not period_result.get('success') or not period_result.get('data'):
                return {
                    'success': True,
                    'message': 'No payroll period found for this month',
                    'data': []
                }
            period_id = period_result['data'][0]['period_id']
            return FactoryPayrollService.get_payroll_summary(period_id)
        except Exception as e:
            return {
                'success': False,
                'message': f'Error retrieving summary by month: {str(e)}'
            }
    
    @staticmethod
    def lock_payroll_period(period_id, locked_by):
        """Lock a payroll period"""
        try:
            params = {
                'period_id': period_id,
                'locked_by': locked_by
            }
            
            result = MultiTenantExecutor.execute_procedure(
                'proc_lock_factory_payroll_period',
                params
            )
            
            if result.get('success'):
                return {
                    'success': True,
                    'message': 'Payroll period locked successfully',
                    'data': result.get('data')
                }
            else:
                return {
                    'success': False,
                    'message': result.get('message', 'Failed to lock period')
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error locking period: {str(e)}'
            }
