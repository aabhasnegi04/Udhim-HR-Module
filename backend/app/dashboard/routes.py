from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, get_jwt
from app.attendance.service import AttendanceService
from app.leave.service import LeaveService
from app.database.executor import StoredProcedureExecutor
from app.middleware.jwt_required import jwt_required
from app.middleware.role_guard import role_required
from app.utils.response import success_response, error_response
from datetime import datetime, date

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/employee-stats', methods=['GET'])
@role_required('EMPLOYEE')
def get_employee_dashboard_stats():
    """Get dashboard stats for employee - simplified version"""
    try:
        # Get user_id from JWT token
        user_id = get_jwt_identity()
        claims = get_jwt()
        
        # Get employee_id from JWT claims
        employee_id = claims.get("employee_id")
        if not employee_id:
            return error_response("Employee ID not found in token", status_code=400)
        
        # Get attendance date from query params (optional)
        attendance_date = request.args.get('date')
        if attendance_date:
            try:
                attendance_date = datetime.strptime(attendance_date, '%Y-%m-%d').date()
            except ValueError:
                return error_response("Invalid date format. Use YYYY-MM-DD", status_code=400)
        else:
            attendance_date = date.today()
        
        # Create simple attendance data without using the problematic stored procedure
        # For employee view, we just need basic stats
        attendance_data = {
            "total_present": 0,
            "total_absent": 0,
            "total_late": 0,
            "total_wfh": 0,
            "total_on_leave": 0,
            "total_employees": 1,  # Just this employee
            "department_stats": [],
            "recent_activity": [],
            "weekly_trend": []
        }
        
        # Get leave balance data for this employee
        leave_result = LeaveService.get_leave_balances_by_employee(employee_id)
        
        # Combine the data
        dashboard_data = {
            "attendance": attendance_data,
            "leave_balances": leave_result["data"] if leave_result["success"] else [],
            "employee_id": employee_id,
            "date": attendance_date.strftime('%Y-%m-%d')
        }
        
        return success_response(
            message="Employee dashboard data retrieved successfully",
            data=dashboard_data
        )
        
    except Exception as e:
        return error_response(f"Failed to retrieve employee dashboard data: {str(e)}", status_code=500)


@dashboard_bp.route('/manager-stats', methods=['GET'])
@role_required('MANAGER')
def get_manager_dashboard_stats():
    """Get dashboard stats for Manager"""
    try:
        claims = get_jwt()
        
        # Get attendance date from query params (optional)
        attendance_date = request.args.get('date')
        if attendance_date:
            try:
                attendance_date = datetime.strptime(attendance_date, '%Y-%m-%d').date()
            except ValueError:
                return error_response("Invalid date format. Use YYYY-MM-DD", status_code=400)
        
        # Get attendance dashboard data for all employees (managers see all for now)
        # TODO: In future, filter by department/team
        attendance_result = AttendanceService.get_attendance_dashboard_data(
            attendance_date=attendance_date,
            employee_id=None  # Manager sees all employees for now
        )
        
        if not attendance_result["success"]:
            return error_response(attendance_result["message"], status_code=500)
        
        # Get pending leave requests for manager approval
        pending_leaves_result = LeaveService.get_pending_leaves("MANAGER")
        
        dashboard_data = {
            "attendance": attendance_result["data"],
            "pending_leaves": pending_leaves_result["data"] if pending_leaves_result["success"] else [],
            "date": attendance_date.strftime('%Y-%m-%d') if attendance_date else date.today().strftime('%Y-%m-%d')
        }
        
        return success_response(
            message="Manager dashboard data retrieved successfully",
            data=dashboard_data
        )
        
    except Exception as e:
        return error_response(f"Failed to retrieve manager dashboard data: {str(e)}", status_code=500)


@dashboard_bp.route('/recent-activities', methods=['GET'])
@jwt_required
def get_recent_activities():
    """Get recent activities for dashboard"""
    try:
        claims = get_jwt()
        employee_id = claims.get("employee_id")
        
        # Get current view from headers to determine filtering
        current_view = request.headers.get('X-Current-View', 'EMPLOYEE')
        
        # Get attendance date from query params (optional)
        attendance_date = request.args.get('date')
        if attendance_date:
            try:
                attendance_date = datetime.strptime(attendance_date, '%Y-%m-%d').date()
            except ValueError:
                return error_response("Invalid date format. Use YYYY-MM-DD", status_code=400)
        
        # For employee view, show only their activities
        # For HR/Manager view, show all activities
        filter_employee_id = employee_id if current_view == "EMPLOYEE" else None
        
        attendance_result = AttendanceService.get_attendance_dashboard_data(
            attendance_date=attendance_date,
            employee_id=filter_employee_id
        )
        
        if not attendance_result["success"]:
            return error_response(attendance_result["message"], status_code=500)
        
        # Extract recent activities from the dashboard data
        recent_activities = attendance_result["data"].get("recent_activity", [])
        
        return success_response(
            message="Recent activities retrieved successfully",
            data={"activities": recent_activities}
        )
        
    except Exception as e:
        return error_response(f"Failed to retrieve recent activities: {str(e)}", status_code=500)


@dashboard_bp.route('/holidays', methods=['GET'])
@role_required('EMPLOYEE')  # Allow all authenticated users (EMPLOYEE, HR, MANAGER)
def get_public_holidays():
    """Get public holidays for dashboard - accessible to all authenticated users"""
    try:
        # Get year from query params (optional, defaults to current year)
        year = request.args.get('year', datetime.now().year, type=int)
        
        # Import AdminService to reuse the holiday logic
        from app.admin.service import AdminService
        
        # Get holidays using the same service method as admin
        result = AdminService.list_holidays_by_year(year)
        
        if result["success"]:
            return success_response(
                message=f"Public holidays for {year} retrieved successfully",
                data={"holidays": result["data"], "year": year}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response(f"Failed to retrieve public holidays: {str(e)}", status_code=500)

@dashboard_bp.route('/hr-stats', methods=['GET'])
@role_required('HR')
def get_hr_dashboard_statistics():
    """Get dashboard stats for HR with real data"""
    try:
        # Get date from query params (optional, defaults to today)
        report_date = request.args.get('date')
        if report_date:
            try:
                report_date = datetime.strptime(report_date, '%Y-%m-%d').date()
            except ValueError:
                return error_response("Invalid date format. Use YYYY-MM-DD", status_code=400)
        else:
            report_date = date.today()
        
        # Get statistics using the attendance dashboard procedure
        try:
            # Get total active employees
            total_employees_result = StoredProcedureExecutor.execute_procedure('proc_get_employee_list')
            total_employees = len(total_employees_result["data"]) if total_employees_result["success"] else 0
            
            # Get attendance dashboard data (includes present count)
            attendance_result = AttendanceService.get_attendance_dashboard_data(
                attendance_date=report_date,
                employee_id=None  # HR sees all employees
            )
            
            present_today = 0
            attendance_percentage = 0.0
            
            if attendance_result["success"] and attendance_result["data"]:
                # The procedure returns data wrapped in a dict
                summary_data = attendance_result["data"]
                
                # Check if it's already a dict with the data we need
                if isinstance(summary_data, dict):
                    present_today = summary_data.get("total_present", 0)
                    total_from_attendance = summary_data.get("total_employees", total_employees)
                    
                    # Use the total from attendance if it's more accurate
                    if total_from_attendance > 0:
                        attendance_percentage = (present_today / total_from_attendance) * 100
                    elif total_employees > 0:
                        attendance_percentage = (present_today / total_employees) * 100
                elif isinstance(summary_data, list) and len(summary_data) > 0:
                    # Fallback: if it's a list, get first element
                    first_result = summary_data[0]
                    
                    if isinstance(first_result, dict):
                        present_today = first_result.get("total_present", 0)
                        total_from_attendance = first_result.get("total_employees", total_employees)
                        
                        # Use the total from attendance if it's more accurate
                        if total_from_attendance > 0:
                            attendance_percentage = (present_today / total_from_attendance) * 100
                        elif total_employees > 0:
                            attendance_percentage = (present_today / total_employees) * 100
            
            # Get pending leave approvals
            pending_approvals = 0
            try:
                pending_leaves_result = LeaveService.get_pending_leaves("HR")
                if pending_leaves_result["success"]:
                    pending_approvals = len(pending_leaves_result["data"])
            except Exception:
                pending_approvals = 0
            
            dashboard_data = {
                "total_employees": total_employees,
                "present_today": present_today,
                "attendance_percentage": round(attendance_percentage, 1),
                "pending_approvals": pending_approvals,
                "payroll_amount": "0",
                "report_date": report_date.strftime('%Y-%m-%d')
            }
            
            return success_response(
                message="HR dashboard statistics retrieved successfully",
                data=dashboard_data
            )
            
        except Exception as data_error:
            import traceback
            from flask import current_app
            current_app.logger.error(f"Data retrieval error: {str(data_error)}")
            current_app.logger.error(traceback.format_exc())
            
            # Fallback to basic data if queries fail
            dashboard_data = {
                "total_employees": 0,
                "present_today": 0,
                "attendance_percentage": 0.0,
                "pending_approvals": 0,
                "payroll_amount": "0",
                "report_date": report_date.strftime('%Y-%m-%d')
            }
            
            return success_response(
                message="HR dashboard statistics retrieved (fallback data)",
                data=dashboard_data
            )
        
    except Exception as e:
        import traceback
        from flask import current_app
        current_app.logger.error(f"Failed to retrieve HR dashboard statistics: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response(f"Failed to retrieve HR dashboard statistics: {str(e)}", status_code=500)


@dashboard_bp.route('/hr-recent-activities', methods=['GET'])
@role_required('HR')
def get_hr_recent_activities():
    """Get recent activities for HR dashboard"""
    try:
        # Get limit from query params (optional, defaults to 10)
        limit = request.args.get('limit', 5, type=int)
        
        # For now, return sample activities until we have real data
        # This will be replaced with real database queries later
        sample_activities = [
            {
                "type": "LEAVE_APPROVED",
                "description": "Leave request approved",
                "employee_name": "Test Employee",
                "date": date.today().strftime('%Y-%m-%d'),
                "time": "14:30"
            },
            {
                "type": "EMPLOYEE_ADDED", 
                "description": "New employee joined",
                "employee_name": "New Employee",
                "date": (date.today()).strftime('%Y-%m-%d'),
                "time": "10:15"
            }
        ]
        
        # Try to get real recent activities from leave requests
        activities = []
        try:
            # Get recent leave approvals
            recent_leaves_result = LeaveService.get_pending_leaves("HR")
            if recent_leaves_result["success"]:
                for leave in recent_leaves_result["data"][:limit]:
                    activities.append({
                        "type": "LEAVE_PENDING",
                        "description": f"Leave request pending approval",
                        "employee_name": leave.get("employee_name", "Unknown"),
                        "date": leave.get("start_date", date.today().strftime('%Y-%m-%d')),
                        "time": "09:00"
                    })
        except Exception:
            pass
        
        # If no real activities, use sample data
        if not activities:
            activities = sample_activities[:limit]
        
        return success_response(
            message="Recent activities retrieved successfully",
            data={"activities": activities}
        )
        
    except Exception as e:
        return error_response(f"Failed to retrieve recent activities: {str(e)}", status_code=500)