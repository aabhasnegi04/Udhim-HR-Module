"""
Factory Payroll Routes
API endpoints for factory worker rate management and payroll
"""
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, get_jwt
from app.factory_payroll import factory_payroll_bp
from app.factory_payroll.service import FactoryPayrollService
from app.middleware.jwt_required import jwt_required
from app.middleware.role_guard import role_required
from app.middleware.company_context import company_required
from app.utils.response import success_response, error_response


# ============================================
# RATE MANAGEMENT ENDPOINTS
# ============================================

@factory_payroll_bp.route('/rates/assign', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def assign_worker_rate():
    """
    Assign or update daily rate for a factory worker
    
    Request Body:
        {
            "employee_id": 218,
            "daily_rate": 575.00,
            "effective_from": "2026-04-01"
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        employee_id = data.get('employee_id')
        daily_rate = data.get('daily_rate')
        effective_from = data.get('effective_from')
        
        # Validation
        if not employee_id:
            return error_response("employee_id is required", 400)
        
        if not daily_rate:
            return error_response("daily_rate is required", 400)
        
        if daily_rate <= 0:
            return error_response("daily_rate must be greater than zero", 400)
        
        if not effective_from:
            return error_response("effective_from date is required", 400)
        
        # Get current user ID
        created_by = get_jwt_identity()
        
        # Call service
        result = FactoryPayrollService.assign_worker_rate(
            employee_id=employee_id,
            daily_rate=daily_rate,
            effective_from=effective_from,
            created_by=created_by
        )
        
        if result['success']:
            return success_response(result['message'], result.get('data'))
        else:
            return error_response(result['message'], 400)
            
    except Exception as e:
        return error_response(f"Error assigning rate: {str(e)}", 500)


@factory_payroll_bp.route('/rates/current/<int:employee_id>', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_worker_current_rate(employee_id):
    """
    Get current active rate for a factory worker
    
    Query Parameters:
        as_of_date (optional): Date to check rate (YYYY-MM-DD)
    """
    try:
        as_of_date = request.args.get('as_of_date')
        
        result = FactoryPayrollService.get_worker_current_rate(
            employee_id=employee_id,
            as_of_date=as_of_date
        )
        
        if result['success']:
            return success_response(result['message'], result.get('data'))
        else:
            return error_response(result['message'], 404)
            
    except Exception as e:
        return error_response(f"Error retrieving rate: {str(e)}", 500)


@factory_payroll_bp.route('/rates/history/<int:employee_id>', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_worker_rate_history(employee_id):
    """
    Get complete rate history for a factory worker
    """
    try:
        result = FactoryPayrollService.get_worker_rate_history(employee_id)
        
        if result['success']:
            return success_response(result['message'], result.get('data'))
        else:
            return error_response(result['message'], 404)
            
    except Exception as e:
        return error_response(f"Error retrieving rate history: {str(e)}", 500)


@factory_payroll_bp.route('/rates/bulk-assign', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def bulk_assign_rates():
    """
    Bulk assign rates to multiple factory workers
    
    Request Body:
        {
            "rates": [
                {"employee_id": 214, "daily_rate": 500.00},
                {"employee_id": 215, "daily_rate": 550.00},
                {"employee_id": 216, "daily_rate": 600.00}
            ],
            "effective_from": "2026-04-01"
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        rates = data.get('rates')
        effective_from = data.get('effective_from')
        
        # Validation
        if not rates or not isinstance(rates, list):
            return error_response("rates array is required", 400)
        
        if len(rates) == 0:
            return error_response("rates array cannot be empty", 400)
        
        if not effective_from:
            return error_response("effective_from date is required", 400)
        
        # Validate each rate entry
        for idx, rate_entry in enumerate(rates):
            if 'employee_id' not in rate_entry:
                return error_response(f"rates[{idx}]: employee_id is required", 400)
            
            if 'daily_rate' not in rate_entry:
                return error_response(f"rates[{idx}]: daily_rate is required", 400)
            
            if rate_entry['daily_rate'] <= 0:
                return error_response(f"rates[{idx}]: daily_rate must be greater than zero", 400)
        
        # Get current user ID
        created_by = get_jwt_identity()
        
        # Call service
        result = FactoryPayrollService.bulk_assign_rates(
            rate_data_list=rates,
            effective_from=effective_from,
            created_by=created_by
        )
        
        if result['success']:
            return success_response(result['message'], result.get('data'))
        else:
            return error_response(result['message'], 400)
            
    except Exception as e:
        return error_response(f"Error in bulk rate assignment: {str(e)}", 500)


@factory_payroll_bp.route('/workers-with-rates', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_all_workers_with_rates():
    """
    Get all factory workers with their current rates
    
    Returns list of all factory workers showing:
    - Employee details
    - Current rate (if assigned)
    - Shift information
    - Rate status
    """
    try:
        result = FactoryPayrollService.get_all_workers_with_rates()
        
        if result['success']:
            return success_response(result['message'], result.get('data'))
        else:
            return error_response(result['message'], 400)
            
    except Exception as e:
        return error_response(f"Error retrieving factory workers: {str(e)}", 500)


# ============================================
# STATISTICS & SUMMARY
# ============================================

@factory_payroll_bp.route('/rates/statistics', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_rate_statistics():
    """
    Get statistics about factory worker rates
    
    Returns:
    - Total factory workers
    - Workers with rates assigned
    - Workers without rates
    - Average daily rate
    - Min/Max rates
    """
    try:
        result = FactoryPayrollService.get_all_workers_with_rates()
        
        if not result['success']:
            return error_response(result['message'], 400)
        
        workers = result.get('data', [])
        
        # Calculate statistics
        total_workers = len(workers)
        workers_with_rates = sum(1 for w in workers if w.get('daily_rate') is not None)
        workers_without_rates = total_workers - workers_with_rates
        
        rates = [w['daily_rate'] for w in workers if w.get('daily_rate') is not None]
        
        statistics = {
            'total_workers': total_workers,
            'workers_with_rates': workers_with_rates,
            'workers_without_rates': workers_without_rates,
            'average_daily_rate': round(sum(rates) / len(rates), 2) if rates else 0,
            'min_daily_rate': min(rates) if rates else 0,
            'max_daily_rate': max(rates) if rates else 0,
            'average_hourly_rate': round(sum(rates) / len(rates) / 8, 2) if rates else 0
        }
        
        return success_response('Statistics retrieved successfully', statistics)
        
    except Exception as e:
        return error_response(f"Error calculating statistics: {str(e)}", 500)


# ============================================
# PAYROLL CONFIGURATION ENDPOINTS
# ============================================

@factory_payroll_bp.route('/config', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_payroll_config():
    """Get current payroll configuration settings"""
    try:
        result = FactoryPayrollService.get_payroll_config()
        
        if result['success']:
            return success_response(result['message'], result.get('data'))
        else:
            return error_response(result['message'], 400)
            
    except Exception as e:
        return error_response(f"Error retrieving configuration: {str(e)}", 500)


@factory_payroll_bp.route('/config', methods=['PUT'])
@jwt_required
@company_required
@role_required("HR")
def update_payroll_config():
    """
    Update payroll configuration settings (Admin only)
    
    Request Body:
        {
            "full_day_hours": 12.0,
            "half_day_minimum_hours": 6.0,
            "absent_threshold_hours": 6.0,
            "hourly_divisor": 8,
            "overtime_multiplier": 2.0,
            "sunday_bonus_hours": 4.0
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        # Get current user ID
        updated_by = get_jwt_identity()
        
        result = FactoryPayrollService.update_payroll_config(
            full_day_hours=data.get('full_day_hours'),
            half_day_minimum_hours=data.get('half_day_minimum_hours'),
            absent_threshold_hours=data.get('absent_threshold_hours'),
            hourly_divisor=data.get('hourly_divisor'),
            overtime_multiplier=data.get('overtime_multiplier'),
            sunday_bonus_hours=data.get('sunday_bonus_hours'),
            updated_by=updated_by
        )
        
        if result['success']:
            return success_response(result['message'], result.get('data'))
        else:
            return error_response(result['message'], 400)
            
    except Exception as e:
        return error_response(f"Error updating configuration: {str(e)}", 500)


# ============================================
# PAYROLL PERIOD ENDPOINTS
# ============================================

@factory_payroll_bp.route('/periods', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_payroll_periods():
    """Get all factory payroll periods"""
    try:
        result = FactoryPayrollService.get_payroll_periods()
        
        if result['success']:
            return success_response(result['message'], result.get('data'))
        else:
            return error_response(result['message'], 400)
            
    except Exception as e:
        return error_response(f"Error retrieving periods: {str(e)}", 500)


@factory_payroll_bp.route('/periods', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def create_payroll_period():
    """
    Create a new factory payroll period
    
    Request Body:
        {
            "year": 2026,
            "month": 4
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        year = data.get('year')
        month = data.get('month')
        
        if not year or not month:
            return error_response("year and month are required", 400)
        
        # Get current user ID
        created_by = get_jwt_identity()
        
        result = FactoryPayrollService.create_payroll_period(
            year=year,
            month=month,
            created_by=created_by
        )
        
        if result['success']:
            return success_response(result['message'], result.get('data'))
        else:
            return error_response(result['message'], 400)
            
    except Exception as e:
        return error_response(f"Error creating period: {str(e)}", 500)


# ============================================
# PAYROLL CALCULATION ENDPOINTS
# ============================================

@factory_payroll_bp.route('/calculate', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def calculate_payroll():
    """
    Calculate payroll for a period
    
    Request Body:
        {
            "period_id": 1
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        period_id = data.get('period_id')
        
        if not period_id:
            return error_response("period_id is required", 400)
        
        # Get current user ID
        calculated_by = get_jwt_identity()
        
        result = FactoryPayrollService.calculate_payroll(
            period_id=period_id,
            calculated_by=calculated_by
        )
        
        if result['success']:
            return success_response(result['message'], result.get('data'))
        else:
            return error_response(result['message'], 400)
            
    except Exception as e:
        return error_response(f"Error calculating payroll: {str(e)}", 500)


@factory_payroll_bp.route('/summary/<int:period_id>', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_payroll_summary(period_id):
    """Get payroll summary for a period"""
    try:
        result = FactoryPayrollService.get_payroll_summary(period_id)
        
        if result['success']:
            return success_response(result['message'], result.get('data'))
        else:
            return error_response(result['message'], 400)
            
    except Exception as e:
        return error_response(f"Error retrieving summary: {str(e)}", 500)


@factory_payroll_bp.route('/lock', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def lock_payroll_period():
    """
    Lock a payroll period
    
    Request Body:
        {
            "period_id": 1
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        period_id = data.get('period_id')
        
        if not period_id:
            return error_response("period_id is required", 400)
        
        # Get current user ID
        locked_by = get_jwt_identity()
        
        result = FactoryPayrollService.lock_payroll_period(
            period_id=period_id,
            locked_by=locked_by
        )
        
        if result['success']:
            return success_response(result['message'], result.get('data'))
        else:
            return error_response(result['message'], 400)
            
    except Exception as e:
        return error_response(f"Error locking period: {str(e)}", 500)


# ============================================
# PAYROLL CALCULATION ENDPOINTS (Phase 2 - Step 2)
# ============================================
# TODO: Add payroll calculation endpoints here
# - POST /periods - Create payroll period
# - POST /calculate - Calculate payroll for period
# - GET /summary - Get payroll summary
# etc.
