from flask import Blueprint, request, current_app
from flask_jwt_extended import get_jwt_identity, get_jwt
from app.database.multi_tenant_executor import MultiTenantExecutor
from app.middleware.company_context import company_required
from app.middleware.role_guard import role_required
from app.middleware.multi_tenant_jwt import multi_tenant_jwt_required
from app.utils.response import success_response, error_response
from datetime import datetime, date, timedelta

dashboard_bp = Blueprint('dashboard', __name__)


# ─────────────────────────────────────────────────────────────────────────────
# HR DASHBOARD — single endpoint, all data in one shot
# ─────────────────────────────────────────────────────────────────────────────
@dashboard_bp.route('/hr-stats', methods=['GET'])
@company_required
@role_required('HR')
def get_hr_dashboard_statistics():
    """Fast HR dashboard — all stats in one response"""
    try:
        today = date.today()

        def get_today_stats():
            """Count present/absent/on-leave for today using a single lightweight query"""
            try:
                result = MultiTenantExecutor.execute_query("""
                    SELECT
                        COUNT(DISTINCT e.employee_id) AS total_employees,
                        SUM(CASE WHEN ad.status IN ('PRESENT','LATE','HALF_DAY') THEN 1 ELSE 0 END) AS present_today,
                        SUM(CASE WHEN ad.status = 'WFH' THEN 1 ELSE 0 END) AS on_leave_today
                    FROM employees e
                    INNER JOIN employee_official eo ON e.employee_id = eo.employee_id
                    LEFT JOIN attendance_daily ad
                        ON e.employee_id = ad.employee_id
                        AND ad.attendance_date = ?
                    WHERE e.status = 'ACTIVE'
                """, (today,))
                if result["success"] and result["data"]:
                    row = result["data"][0]
                    total = row.get("total_employees") or 0
                    present = row.get("present_today") or 0
                    on_leave = row.get("on_leave_today") or 0
                    denom = total - on_leave
                    pct = round((present / denom * 100), 1) if denom > 0 else 0
                    return {"total": total, "present": present, "on_leave": on_leave,
                            "absent": max(0, total - present - on_leave), "pct": pct}
            except Exception:
                pass
            return {"total": 0, "present": 0, "on_leave": 0, "absent": 0, "pct": 0}

        def get_pending_leaves():
            try:
                result = MultiTenantExecutor.execute_query("""
                    SELECT COUNT(*) AS cnt FROM leave_requests
                    WHERE status = 'PENDING'
                """)
                if result["success"] and result["data"]:
                    return result["data"][0].get("cnt") or 0
            except Exception:
                pass
            return 0

        def get_trend():
            """7-day trend — single query instead of 5 separate calls"""
            try:
                start = today - timedelta(days=6)
                result = MultiTenantExecutor.execute_query("""
                    SELECT
                        ad.attendance_date,
                        COUNT(DISTINCT CASE WHEN ad.status IN ('PRESENT','LATE','HALF_DAY') THEN ad.employee_id END) AS present,
                        COUNT(DISTINCT e.employee_id) AS total
                    FROM employees e
                    INNER JOIN employee_official eo ON e.employee_id = eo.employee_id
                    LEFT JOIN attendance_daily ad
                        ON e.employee_id = ad.employee_id
                        AND ad.attendance_date BETWEEN ? AND ?
                    WHERE e.status = 'ACTIVE'
                    GROUP BY ad.attendance_date
                    ORDER BY ad.attendance_date
                """, (start, today))
                if result["success"] and result["data"]:
                    trend = []
                    for row in result["data"]:
                        d = row.get("attendance_date")
                        if not d:
                            continue
                        if isinstance(d, str):
                            d = datetime.strptime(d.split('T')[0], '%Y-%m-%d').date()
                        if d.weekday() >= 5:  # skip weekends
                            continue
                        present = row.get("present") or 0
                        total = row.get("total") or 0
                        trend.append({
                            "date": d.strftime("%Y-%m-%d"),
                            "day": d.strftime("%a"),
                            "present": present,
                            "total": total,
                            "percentage": round((present / total * 100), 1) if total > 0 else 0
                        })
                    return trend
            except Exception as e:
                current_app.logger.error(f"Trend error: {e}")
            return []

        def get_alerts(pending_leaves_count, today_stats):
            alerts = []
            if pending_leaves_count > 0:
                alerts.append({
                    "severity": "warning",
                    "message": f"{pending_leaves_count} leave request{'s' if pending_leaves_count > 1 else ''} pending approval",
                    "action_route": "/leave"
                })
            # Payroll alert — quick check
            try:
                result = MultiTenantExecutor.execute_query("""
                    SELECT TOP 1 status FROM payroll_periods
                    WHERE YEAR(start_date) = ? AND MONTH(start_date) = ?
                    ORDER BY period_id DESC
                """, (today.year, today.month))
                if not (result["success"] and result["data"] and
                        result["data"][0].get("status") in ("PROCESSED", "PAID", "COMPLETED")):
                    alerts.append({
                        "severity": "error",
                        "message": f"Payroll not processed for {today.strftime('%B %Y')}",
                        "action_route": "/payroll"
                    })
            except Exception:
                pass
            return alerts

        def get_recent_activities():
            try:
                # Recent leave requests
                result = MultiTenantExecutor.execute_query("""
                    SELECT TOP 5
                        ep.first_name + ' ' + ep.last_name AS employee_name,
                        lt.leave_name,
                        lr.start_date, lr.end_date,
                        lr.status, lr.applied_on
                    FROM leave_requests lr
                    INNER JOIN employees e ON lr.employee_id = e.employee_id
                    INNER JOIN employee_personal ep ON e.employee_id = ep.employee_id
                    INNER JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
                    ORDER BY lr.applied_on DESC
                """)
                activities = []
                if result["success"] and result["data"]:
                    for row in result["data"]:
                        status = row.get("status", "PENDING")
                        atype = "LEAVE_PENDING" if status == "PENDING" else "LEAVE_APPROVED" if status == "APPROVED" else "LEAVE_REJECTED"
                        applied = row.get("applied_on")
                        activities.append({
                            "type": atype,
                            "description": f"{row.get('leave_name','Leave')} request — {status}",
                            "employee_name": row.get("employee_name", ""),
                            "date": str(applied).split(" ")[0] if applied else str(date.today()),
                            "time": "—",
                            "meta": f"{row.get('start_date','')} → {row.get('end_date','')}"
                        })
                return activities
            except Exception:
                return []

        # Run all queries sequentially — each is a simple fast query
        today_stats        = get_today_stats()
        pending_leaves_cnt = get_pending_leaves()
        trend              = get_trend()
        recent_activities  = get_recent_activities()

        alerts = get_alerts(pending_leaves_cnt, today_stats)

        return success_response(
            message="HR dashboard data retrieved successfully",
            data={
                # stats (used by hr-stats endpoint)
                "total_employees":      today_stats["total"],
                "present_today":        today_stats["present"],
                "on_leave_today":       today_stats["on_leave"],
                "absent_today":         today_stats["absent"],
                "attendance_percentage": today_stats["pct"],
                "pending_approvals":    pending_leaves_cnt,
                "report_date":          today.strftime('%Y-%m-%d'),
                # trend (used by hr-attendance-trend endpoint)
                "trend": trend,
                # alerts (used by hr-alerts endpoint)
                "alerts": alerts,
                # activities (used by hr-recent-activities endpoint)
                "activities": recent_activities,
            }
        )

    except Exception as e:
        current_app.logger.error(f"HR dashboard error: {e}")
        return error_response(f"Failed to retrieve HR dashboard data: {str(e)}", status_code=500)


# Keep old endpoints alive but delegate to the combined endpoint
# so existing frontend calls still work without any frontend changes

@dashboard_bp.route('/hr-alerts', methods=['GET'])
@company_required
@role_required('HR')
def get_hr_alerts():
    resp = get_hr_dashboard_statistics()
    try:
        import json
        data = json.loads(resp.get_data(as_text=True))
        alerts = data.get("data", {}).get("alerts", [])
        # Convert to old format the frontend expects
        formatted = [{"severity": a.get("severity"), "message": a.get("message"),
                      "action_route": a.get("action_route")} for a in alerts]
        return success_response("HR alerts retrieved", {"alerts": formatted})
    except Exception:
        return success_response("HR alerts retrieved", {"alerts": []})


@dashboard_bp.route('/hr-attendance-trend', methods=['GET'])
@company_required
@role_required('HR')
def get_hr_attendance_trend():
    resp = get_hr_dashboard_statistics()
    try:
        import json
        data = json.loads(resp.get_data(as_text=True))
        trend = data.get("data", {}).get("trend", [])
        return success_response("Attendance trend retrieved", {"trend": trend})
    except Exception:
        return success_response("Attendance trend retrieved", {"trend": []})


@dashboard_bp.route('/hr-recent-activities', methods=['GET'])
@company_required
@role_required('HR')
def get_hr_recent_activities():
    resp = get_hr_dashboard_statistics()
    try:
        import json
        data = json.loads(resp.get_data(as_text=True))
        activities = data.get("data", {}).get("activities", [])
        return success_response("Recent activities retrieved", {"activities": activities})
    except Exception:
        return success_response("Recent activities retrieved", {"activities": []})


# ─────────────────────────────────────────────────────────────────────────────
# EMPLOYEE DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────
@dashboard_bp.route('/employee-stats', methods=['GET'])
@company_required
@role_required('EMPLOYEE')
def get_employee_dashboard_stats():
    """Get dashboard stats for employee"""
    try:
        claims = get_jwt()
        employee_id = claims.get("employee_id")
        if not employee_id:
            return error_response("Employee ID not found in token", status_code=400)

        today = date.today()

        def get_attendance():
            try:
                result = MultiTenantExecutor.execute_query("""
                    SELECT
                        COUNT(CASE WHEN status IN ('PRESENT','LATE') THEN 1 END) AS days_present,
                        COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) AS days_absent,
                        COUNT(CASE WHEN status = 'LATE' THEN 1 END) AS days_late,
                        COUNT(*) AS total_days
                    FROM attendance_daily
                    WHERE employee_id = ?
                      AND YEAR(attendance_date) = ?
                      AND MONTH(attendance_date) = ?
                """, (employee_id, today.year, today.month))
                if result["success"] and result["data"]:
                    row = result["data"][0]
                    present = row.get("days_present") or 0
                    total = row.get("total_days") or 0
                    return {
                        "days_present": present,
                        "days_absent": row.get("days_absent") or 0,
                        "days_late": row.get("days_late") or 0,
                        "attendance_percentage": round((present / total * 100), 1) if total > 0 else 0
                    }
            except Exception:
                pass
            return {"days_present": 0, "days_absent": 0, "days_late": 0, "attendance_percentage": 0}

        def get_payslip():
            try:
                result = MultiTenantExecutor.execute_query("""
                    SELECT TOP 1 eps.period_id, pp.period_name
                    FROM employee_payroll_summary eps
                    INNER JOIN payroll_periods pp ON eps.period_id = pp.period_id
                    WHERE eps.employee_id = ?
                      AND pp.status IN ('PROCESSED','PAID','COMPLETED')
                    ORDER BY pp.end_date DESC
                """, (employee_id,))
                if result["success"] and result["data"]:
                    row = result["data"][0]
                    return {"available": True, "period_name": row.get("period_name"), "period_id": row.get("period_id")}
            except Exception:
                pass
            return {"available": False, "period_name": None, "period_id": None}

        attendance_data = get_attendance()
        payslip_status  = get_payslip()

        return success_response(
            message="Employee dashboard stats retrieved successfully",
            data={
                "attendance": attendance_data,
                "payslip_status": payslip_status,
                "month": today.month,
                "year": today.year
            }
        )

    except Exception as e:
        return error_response(f"Failed to retrieve employee dashboard data: {str(e)}", status_code=500)


# ─────────────────────────────────────────────────────────────────────────────
# SHARED ENDPOINTS (kept for compatibility)
# ─────────────────────────────────────────────────────────────────────────────
@dashboard_bp.route('/holidays', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_public_holidays():
    try:
        year = request.args.get('year', datetime.now().year, type=int)
        from app.admin.service import AdminService
        result = AdminService.list_holidays_by_year(year)
        if result["success"]:
            return success_response(f"Holidays for {year}", {"holidays": result["data"], "year": year})
        return error_response(result["message"], status_code=500)
    except Exception as e:
        return error_response(f"Failed to retrieve holidays: {str(e)}", status_code=500)


@dashboard_bp.route('/recent-activities', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_recent_activities():
    return success_response("Recent activities", {"activities": []})


@dashboard_bp.route('/manager-stats', methods=['GET'])
@company_required
@role_required('MANAGER')
def get_manager_dashboard_stats():
    return success_response("Manager stats", {
        "attendance": {"total_present": 0, "total_employees": 0},
        "pending_leaves": []
    })
