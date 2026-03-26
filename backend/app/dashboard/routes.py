from flask import Blueprint, request, current_app
from flask_jwt_extended import get_jwt_identity, get_jwt
from app.attendance.service import AttendanceService
from app.leave.service import LeaveService
from app.database.multi_tenant_executor import MultiTenantExecutor
from app.middleware.multi_tenant_jwt import multi_tenant_jwt_required
from app.middleware.company_context import company_required
from app.middleware.role_guard import role_required
from app.utils.response import success_response, error_response
from datetime import datetime, date, timedelta

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/employee-stats', methods=['GET'])
@company_required
@role_required('EMPLOYEE')
def get_employee_dashboard_stats():
    """Get dashboard stats for employee — attendance this month + payslip status"""
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        employee_id = claims.get("employee_id")
        if not employee_id:
            return error_response("Employee ID not found in token", status_code=400)

        today = date.today()
        current_month = today.month
        current_year = today.year

        # 1. Monthly attendance summary
        attendance_data = {"days_present": 0, "days_absent": 0, "days_late": 0, "attendance_percentage": 0}
        try:
            params = {"year": current_year, "month": current_month, "employee_id": employee_id}
            att_result = MultiTenantExecutor.execute_procedure('proc_get_monthly_attendance_summary', params)
            if att_result["success"] and att_result["data"]:
                rows = att_result["data"]
                row = rows[0] if isinstance(rows, list) and rows else rows
                if isinstance(row, dict):
                    present = row.get("days_present", 0) or 0
                    working = row.get("working_days", 0) or row.get("total_working_days", 0) or 0
                    attendance_data = {
                        "days_present": present,
                        "days_absent": row.get("days_absent", 0) or 0,
                        "days_late": row.get("days_late", 0) or 0,
                        "attendance_percentage": round((present / working * 100), 1) if working > 0 else 0
                    }
        except Exception:
            pass

        # 2. Latest payslip status (check if employee has any payslips)
        payslip_status = {"available": False, "period_name": None, "period_id": None}
        try:
            current_app.logger.info(f"Checking payslip for employee_id: {employee_id}")
            
            # Query to get the latest payslip for this employee from employee_payroll_summary
            query = """
                SELECT TOP 1 
                    eps.period_id,
                    pp.period_name,
                    pp.end_date,
                    pp.status
                FROM employee_payroll_summary eps
                INNER JOIN payroll_periods pp ON eps.period_id = pp.period_id
                WHERE eps.employee_id = ?
                    AND pp.status IN ('PROCESSED', 'PAID', 'COMPLETED')
                ORDER BY pp.end_date DESC
            """
            result = MultiTenantExecutor.execute_query(query, (employee_id,))
            
            current_app.logger.info(f"Payslip query result: {result}")
            
            if result["success"] and result["data"] and len(result["data"]) > 0:
                latest = result["data"][0]
                current_app.logger.info(f"Found payslip: {latest}")
                payslip_status = {
                    "available": True,
                    "period_name": latest.get("period_name", ""),
                    "period_id": latest.get("period_id")
                }
            else:
                current_app.logger.warning(f"No payslips found for employee {employee_id}")
        except Exception as e:
            current_app.logger.error(f"Error fetching payslip status: {str(e)}")
            import traceback
            current_app.logger.error(traceback.format_exc())

        return success_response(
            message="Employee dashboard stats retrieved successfully",
            data={
                "attendance": attendance_data,
                "payslip_status": payslip_status,
                "month": current_month,
                "year": current_year
            }
        )

    except Exception as e:
        return error_response(f"Failed to retrieve employee dashboard data: {str(e)}", status_code=500)


@dashboard_bp.route('/manager-stats', methods=['GET'])
@company_required
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
@company_required
@multi_tenant_jwt_required
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
@company_required
@multi_tenant_jwt_required
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
@company_required
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
            total_employees_result = MultiTenantExecutor.execute_procedure('proc_get_employee_list')
            total_employees = len(total_employees_result["data"]) if total_employees_result["success"] else 0
            
            # Get attendance dashboard data (includes present count)
            attendance_result = AttendanceService.get_attendance_dashboard_data(
                attendance_date=report_date,
                employee_id=None  # HR sees all employees
            )
            
            present_today = 0
            on_leave_today = 0
            attendance_percentage = 0.0

            if attendance_result["success"] and attendance_result["data"]:
                d = attendance_result["data"]
                if isinstance(d, dict):
                    present_today  = d.get("total_present", 0)
                    on_leave_today = d.get("total_on_leave", 0)
                    # Only use attendance proc's total if our employee list query failed
                    if total_employees == 0:
                        total_employees = d.get("total_employees", 0)
                elif isinstance(d, list) and d and isinstance(d[0], dict):
                    present_today  = d[0].get("total_present", 0)
                    on_leave_today = d[0].get("total_on_leave", 0)
                    if total_employees == 0:
                        total_employees = d[0].get("total_employees", 0)

            # Attendance % = present / (total - on_leave) so on-leave don't drag it down
            denominator = total_employees - on_leave_today
            if denominator > 0:
                attendance_percentage = (present_today / denominator) * 100
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
                "on_leave_today": on_leave_today,
                "absent_today": max(0, total_employees - present_today - on_leave_today),
                "attendance_percentage": round(min(attendance_percentage, 100.0), 1),
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
                "on_leave_today": 0,
                "absent_today": 0,
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
@company_required
@role_required('HR')
def get_hr_recent_activities():
    """Get recent activities for HR dashboard — real data from leaves and employees"""
    try:
        limit = request.args.get('limit', 5, type=int)
        activities = []

        # 1. Recent leave requests (pending + recently approved/rejected)
        try:
            leaves_result = LeaveService.get_pending_leaves("HR")
            if leaves_result["success"] and leaves_result["data"]:
                for leave in leaves_result["data"][:limit]:
                    activities.append({
                        "type": "LEAVE_PENDING",
                        "description": f"{leave.get('leave_name', 'Leave')} request pending approval",
                        "employee_name": leave.get("employee_name", "Unknown"),
                        "date": str(leave.get("applied_on") or leave.get("start_date") or date.today()),
                        "time": "—",
                        "meta": f"{leave.get('start_date', '')} → {leave.get('end_date', '')}"
                    })
        except Exception:
            pass

        # 2. Recent attendance check-ins from dashboard data
        try:
            att_result = AttendanceService.get_attendance_dashboard_data(
                attendance_date=date.today(), employee_id=None
            )
            if att_result["success"] and att_result["data"]:
                recent = att_result["data"].get("recent_activity", [])
                for entry in recent[:max(0, limit - len(activities))]:
                    activities.append({
                        "type": "ATTENDANCE",
                        "description": f"Checked in — {entry.get('status', 'PRESENT')}",
                        "employee_name": entry.get("employee_name", "Unknown"),
                        "date": date.today().strftime('%Y-%m-%d'),
                        "time": entry.get("time", "—"),
                        "meta": ""
                    })
        except Exception:
            pass

        # 3. Recently added employees — max 2, only if activities list is still short
        try:
            if len(activities) < limit:
                from app.database.multi_tenant_executor import MultiTenantExecutor
                emp_result = MultiTenantExecutor.execute_procedure('proc_get_employee_list', {})
                if emp_result["success"] and emp_result["data"]:
                    recent_emps = sorted(
                        emp_result["data"],
                        key=lambda e: str(e.get("date_of_joining") or ""),
                        reverse=True
                    )[:min(2, limit - len(activities))]  # cap at 2
                    for emp in recent_emps:
                        activities.append({
                            "type": "EMPLOYEE_ADDED",
                            "description": "New employee onboarded",
                            "employee_name": emp.get("employee_name") or f"{emp.get('first_name','')} {emp.get('last_name','')}".strip(),
                            "date": str(emp.get("date_of_joining") or date.today()),
                            "time": "—",
                            "meta": emp.get("department", "")
                        })
        except Exception:
            pass

        return success_response(
            message="Recent activities retrieved successfully",
            data={"activities": activities[:limit]}
        )

    except Exception as e:
        return error_response(f"Failed to retrieve recent activities: {str(e)}", status_code=500)


@dashboard_bp.route('/hr-alerts', methods=['GET'])
@company_required
@role_required('HR')
def get_hr_alerts():
    """Get actionable alerts for HR dashboard â€” pending leaves, payroll status, offboarding"""
    try:
        alerts = []
        today = date.today()

        # 1. Pending leave approvals
        try:
            pending_leaves = LeaveService.get_pending_leaves("HR")
            count = len(pending_leaves["data"]) if pending_leaves["success"] else 0
            if count > 0:
                alerts.append({
                    "type": "warning",
                    "module": "leave",
                    "message": f"{count} leave request{'s' if count > 1 else ''} pending approval",
                    "action_label": "Review",
                    "action_path": "/leave"
                })
        except Exception:
            pass

        # 2. Payroll not processed for current month
        try:
            current_month = today.month
            current_year = today.year
            result = MultiTenantExecutor.execute_procedure('proc_get_payroll_periods', {})
            if result["success"] and result["data"]:
                from datetime import datetime as dt
                periods = result["data"] if not isinstance(result["data"][0], list) else result["data"][0]
                month_processed = any(
                    p.get("status") in ("PROCESSED", "PAID") and
                    str(p.get("period_name", "")).find(f"{current_year}") != -1 and
                    (
                        (hasattr(p.get("start_date"), "month") and p["start_date"].month == current_month) or
                        (isinstance(p.get("start_date"), str) and f"-{current_month:02d}-" in p["start_date"])
                    )
                    for p in periods
                )
                if not month_processed:
                    month_name = today.strftime("%B")
                    alerts.append({
                        "type": "error",
                        "module": "payroll",
                        "message": f"Payroll not processed for {month_name} {current_year}",
                        "action_label": "Process",
                        "action_path": "/payroll"
                    })
        except Exception:
            pass

        # 3. Pending offboarding clearances
        try:
            from app.offboarding.service import OffboardingService
            exits = OffboardingService.get_all_exits()
            if exits["success"]:
                pending_exits = [e for e in (exits["data"] or []) if e.get("status") not in ("COMPLETED", "CANCELLED")]
                if pending_exits:
                    alerts.append({
                        "type": "warning",
                        "module": "offboarding",
                        "message": f"{len(pending_exits)} exit{'s' if len(pending_exits) > 1 else ''} pending clearance",
                        "action_label": "View",
                        "action_path": "/offboarding"
                    })
        except Exception:
            pass

        # 4. Employees with no attendance today (only on weekdays)
        try:
            if today.weekday() < 5:  # Mon-Fri only
                attendance_result = AttendanceService.get_attendance_dashboard_data(
                    attendance_date=today, employee_id=None
                )
                if attendance_result["success"] and attendance_result["data"]:
                    data = attendance_result["data"]
                    total = data.get("total_employees", 0)
                    present = data.get("total_present", 0)
                    absent = total - present - data.get("total_on_leave", 0)
                    if absent > 0:
                        alerts.append({
                            "type": "info",
                            "module": "attendance",
                            "message": f"{absent} employee{'s' if absent > 1 else ''} not marked present today",
                            "action_label": "View",
                            "action_path": "/attendance"
                        })
        except Exception:
            pass

        return success_response(
            message="HR alerts retrieved successfully",
            data={"alerts": alerts, "count": len(alerts)}
        )

    except Exception as e:
        return error_response(f"Failed to retrieve HR alerts: {str(e)}", status_code=500)


@dashboard_bp.route('/hr-attendance-trend', methods=['GET'])
@company_required
@role_required('HR')
def get_hr_attendance_trend():
    """Get last 7 days attendance trend for HR dashboard chart"""
    try:
        today = date.today()
        trend = []

        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            # Skip weekends
            if day.weekday() >= 5:
                continue
            try:
                result = AttendanceService.get_attendance_dashboard_data(
                    attendance_date=day, employee_id=None
                )
                present = 0
                total = 0
                if result["success"] and result["data"]:
                    d = result["data"]
                    present = d.get("total_present", 0)
                    total = d.get("total_employees", 0)
                trend.append({
                    "date": day.strftime("%Y-%m-%d"),
                    "day": day.strftime("%a"),
                    "present": present,
                    "total": total,
                    "percentage": round((present / total * 100), 1) if total > 0 else 0
                })
            except Exception:
                trend.append({
                    "date": day.strftime("%Y-%m-%d"),
                    "day": day.strftime("%a"),
                    "present": 0,
                    "total": 0,
                    "percentage": 0
                })

        return success_response(
            message="Attendance trend retrieved successfully",
            data={"trend": trend}
        )

    except Exception as e:
        return error_response(f"Failed to retrieve attendance trend: {str(e)}", status_code=500)
