from flask import Blueprint, request, current_app
from app.attendance.service import AttendanceService
from app.database.multi_tenant_executor import MultiTenantExecutor
from app.middleware.multi_tenant_jwt import multi_tenant_jwt_required
from app.middleware.company_context import company_required
from app.middleware.role_guard import hr_required, manager_required, employee_required, hr_or_manager_required, role_required
from app.middleware.active_employee_required import active_employee_required
from app.utils.response import (
    success_response, 
    error_response, 
    validation_error_response
)
from datetime import datetime, date
import os
from werkzeug.utils import secure_filename

attendance_bp = Blueprint('attendance', __name__)

# File upload configuration
UPLOAD_FOLDER = os.path.join(os.path.expanduser('~'), 'attendance_uploads')
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# FACE RECOGNITION / RAW LOGGING
@attendance_bp.route('/face-log', methods=['POST'])
@company_required
@hr_required  # Only HR can access face recognition logs directly
def mark_face_attendance_raw():
    """Mark face recognition attendance raw log (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['employee_id']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        # Set default values
        data['log_time'] = data.get('log_time', datetime.now())
        data['source'] = data.get('source', 'FACE')
        
        result = AttendanceService.mark_attendance_raw(data)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to mark face attendance", status_code=500)


# DAILY ATTENDANCE GENERATION
@attendance_bp.route('/generate-daily', methods=['POST'])
@company_required
@hr_required  # Only HR can trigger daily generation
def generate_daily_attendance():
    """Generate daily attendance for a specific date (HR only)"""
    try:
        data = request.get_json() or {}
        
        # Parse attendance date
        attendance_date = None
        if data.get('attendance_date'):
            try:
                attendance_date = datetime.strptime(data['attendance_date'], '%Y-%m-%d').date()
            except ValueError:
                return validation_error_response("Invalid date format. Use YYYY-MM-DD")
        
        result = AttendanceService.generate_daily_attendance(attendance_date)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to generate daily attendance", status_code=500)


# MANUAL ATTENDANCE
@attendance_bp.route('/manual', methods=['POST'])
@company_required
@hr_or_manager_required  # HR and Manager can mark manual attendance
def mark_manual_attendance():
    """Mark manual attendance (HR/Manager only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['employee_id', 'attendance_date', 'status']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        # Validate status
        valid_statuses = ['PRESENT', 'ABSENT', 'LATE', 'WFH', 'HOLIDAY']
        if data.get('status') not in valid_statuses:
            return validation_error_response(
                f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        # Parse attendance date
        try:
            data['attendance_date'] = datetime.strptime(data['attendance_date'], '%Y-%m-%d').date()
        except ValueError:
            return validation_error_response("Invalid date format. Use YYYY-MM-DD")
        
        result = AttendanceService.mark_manual_attendance(data)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to mark manual attendance", status_code=500)


# VIEW ATTENDANCE
@attendance_bp.route('/employee/<int:employee_id>', methods=['GET'])
@company_required
@role_required("EMPLOYEE", "HR", "MANAGER")  # All authenticated users can access
def get_employee_attendance(employee_id):
    """Get attendance records for a specific employee"""
    try:
        from flask_jwt_extended import get_jwt
        
        # Get current user info from JWT
        claims = get_jwt()
        current_user_role = claims.get("role")
        current_employee_id = claims.get("employee_id")
        
        # Role-based access control:
        # - HR can view any employee
        # - Manager can view reportees only (TODO: implement reportee check)
        # - Employee can view self only
        if current_user_role in ['HR', 'MANAGER']:
            # HR and Managers can view any employee's attendance
            pass
        elif current_user_role == 'EMPLOYEE':
            # Employees can only view their own attendance
            if employee_id != current_employee_id:
                return error_response("Access denied. You can only view your own attendance records.", status_code=403)
        else:
            return error_response("Access denied. Invalid role.", status_code=403)
        
        result = AttendanceService.get_attendance_by_employee(employee_id)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"attendance_records": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        current_app.logger.error(f"Get employee attendance error: {str(e)}")
        return error_response("Failed to retrieve attendance records", status_code=500)


# REGULARIZATION WORKFLOW
@attendance_bp.route('/regularize', methods=['POST'])
@company_required
@employee_required  # All roles can apply for regularization
@active_employee_required  # Must be active employee
def apply_regularization():
    """Apply for attendance regularization"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['employee_id', 'attendance_date', 'requested_status', 'reason']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        # Validate requested status
        valid_statuses = ['PRESENT', 'ABSENT', 'LATE', 'WFH']
        if data.get('requested_status') not in valid_statuses:
            return validation_error_response(
                f"Invalid requested status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        # Parse attendance date
        try:
            data['attendance_date'] = datetime.strptime(data['attendance_date'], '%Y-%m-%d').date()
        except ValueError:
            return validation_error_response("Invalid date format. Use YYYY-MM-DD")
        
        result = AttendanceService.apply_attendance_regularization(data)
        
        if result["success"]:
            # Notify employee confirmation + notify HR
            try:
                from app.notifications.service import NotificationService
                from app.database.multi_tenant_executor import MultiTenantExecutor
                from flask_jwt_extended import get_jwt_identity
                uid = get_jwt_identity()
                NotificationService.create(
                    user_id=uid,
                    title='Regularization Submitted',
                    message=f'Your attendance regularization request for {data["attendance_date"]} has been submitted.',
                    module='ATTENDANCE'
                )
                hr_rows = MultiTenantExecutor.execute_procedure('proc_get_hr_user_ids', {}).get('data', [])
                if hr_rows and isinstance(hr_rows[0], list): hr_rows = hr_rows[0]
                emp_r = MultiTenantExecutor.execute_procedure('proc_get_employee_info', {'employee_id': data['employee_id']}).get('data', [])
                if emp_r and isinstance(emp_r[0], list): emp_r = emp_r[0]
                emp_name = emp_r[0].get('full_name', 'An employee') if emp_r else 'An employee'
                for hr in (hr_rows or []):
                    if hr.get('user_id'):
                        NotificationService.create(
                            user_id=hr['user_id'],
                            title='Regularization Request',
                            message=f'{emp_name} has submitted an attendance regularization request.',
                            module='ATTENDANCE'
                        )
            except Exception:
                pass
            return success_response(message=result["message"], data=result["data"])
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to apply for regularization", status_code=500)


@attendance_bp.route('/regularize/<int:request_id>/approve', methods=['PUT'])
@company_required
@hr_or_manager_required  # HR and Manager can approve regularization
def approve_regularization(request_id):
    """Approve attendance regularization request"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['approved_status', 'approver_comment']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        # Validate approved status
        valid_statuses = ['PRESENT', 'ABSENT', 'LATE', 'WFH']
        if data.get('approved_status') not in valid_statuses:
            return validation_error_response(
                f"Invalid approved status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        result = AttendanceService.approve_attendance_regularization(
            request_id, 
            data['approved_status'], 
            data['approver_comment']
        )
        
        if result["success"]:
            try:
                from app.notifications.service import NotificationService
                from app.database.multi_tenant_executor import MultiTenantExecutor
                r = MultiTenantExecutor.execute_procedure('proc_get_regularization_user', {'request_id': request_id}).get('data', [])
                if r and isinstance(r[0], list): r = r[0]
                if r and r[0].get('user_id'):
                    NotificationService.create(
                        user_id=r[0]['user_id'],
                        title='Regularization Approved',
                        message=f'Your attendance regularization request has been approved.',
                        module='ATTENDANCE',
                        reference_id=request_id
                    )
            except Exception:
                pass
            return success_response(message=result["message"], data=result["data"])
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to approve regularization", status_code=500)


@attendance_bp.route('/regularize/<int:request_id>/reject', methods=['PUT'])
@company_required
@hr_or_manager_required  # HR and Manager can reject regularization
def reject_regularization(request_id):
    """Reject attendance regularization request"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        if not data.get('comment'):
            return validation_error_response("Comment is required for rejection")
        
        result = AttendanceService.reject_attendance_regularization(
            request_id, 
            data['comment']
        )
        
        if result["success"]:
            try:
                from app.notifications.service import NotificationService
                from app.database.multi_tenant_executor import MultiTenantExecutor
                r = MultiTenantExecutor.execute_procedure('proc_get_regularization_user', {'request_id': request_id}).get('data', [])
                if r and isinstance(r[0], list): r = r[0]
                if r and r[0].get('user_id'):
                    NotificationService.create(
                        user_id=r[0]['user_id'],
                        title='Regularization Rejected',
                        message=f'Your attendance regularization request has been rejected. Reason: {data["comment"]}',
                        module='ATTENDANCE',
                        reference_id=request_id
                    )
            except Exception:
                pass
            return success_response(message=result["message"], data=result["data"])
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to reject regularization", status_code=500)


# DASHBOARD & REPORTS
@attendance_bp.route('/dashboard', methods=['GET'])
@company_required
@hr_or_manager_required  # HR and Manager can view dashboard
def get_attendance_dashboard():
    """Get attendance dashboard data"""
    try:
        attendance_date = request.args.get('date')
        
        # Parse date if provided
        if attendance_date:
            try:
                attendance_date = datetime.strptime(attendance_date, '%Y-%m-%d').date()
            except ValueError:
                return validation_error_response("Invalid date format. Use YYYY-MM-DD")
        
        result = AttendanceService.get_attendance_dashboard_data(attendance_date)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        import traceback
        from flask import current_app
        current_app.logger.error(f"Dashboard error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response(f"Failed to retrieve dashboard data: {str(e)}", status_code=500)


@attendance_bp.route('/currently-present', methods=['GET'])
@company_required
@hr_or_manager_required  # HR and Manager can view currently present employees
def get_currently_present():
    """Get employees who are currently present (checked in but not checked out)"""
    try:
        target_date = request.args.get('date')
        
        # Parse date if provided
        if target_date:
            try:
                target_date = datetime.strptime(target_date, '%Y-%m-%d').date()
            except ValueError:
                return validation_error_response("Invalid date format. Use YYYY-MM-DD")
        
        result = AttendanceService.get_currently_present_employees(target_date)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        import traceback
        from flask import current_app
        current_app.logger.error(f"Currently present error: {str(e)}")


@attendance_bp.route('/all-active-employees', methods=['GET'])
@company_required
@hr_or_manager_required
def get_all_active_employees():
    """Get all active employees with basic info"""
    try:
        result = AttendanceService.get_all_active_employees()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        current_app.logger.error(f"Get all active employees error: {str(e)}")
        return error_response("Failed to retrieve active employees", status_code=500)
        current_app.logger.error(traceback.format_exc())
        return error_response(f"Failed to retrieve currently present employees: {str(e)}", status_code=500)


@attendance_bp.route('/reports/date-range', methods=['GET'])
@company_required
@multi_tenant_jwt_required  # All authenticated users can access, role-based logic handled inside
def get_attendance_by_date_range():
    """Get attendance records for a date range"""
    try:
        from flask_jwt_extended import get_jwt
        
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        employee_id = request.args.get('employee_id', type=int)
        worker_category = request.args.get('worker_category')  # 'OFFICE' or 'FACTORY'
        department = request.args.get('department')
        
        if not start_date or not end_date:
            return validation_error_response("start_date and end_date are required")
        
        # Parse dates
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return validation_error_response("Invalid date format. Use YYYY-MM-DD")
        
        # Get current user info from JWT
        claims = get_jwt()
        current_user_role = claims.get("role")
        current_employee_id = claims.get("employee_id")
        
        # Permission check: 
        # - HR and Managers can view any employee's attendance
        # - Employees can only view their own attendance
        if current_user_role in ['HR', 'MANAGER']:
            # HR and Managers can view any employee's attendance
            pass
        elif current_user_role == 'EMPLOYEE':
            # Employees can only view their own attendance
            if employee_id and employee_id != current_employee_id:
                return error_response("Access denied. You can only view your own attendance records.", status_code=403)
            # If no employee_id specified, default to current employee
            if not employee_id:
                employee_id = current_employee_id
        else:
            return error_response("Access denied. Invalid role.", status_code=403)
        
        result = AttendanceService.get_attendance_by_date_range(
            start_date, end_date, employee_id, worker_category, department
        )
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"attendance_records": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        current_app.logger.error(f"Get attendance by date range error: {str(e)}")
        return error_response("Failed to retrieve attendance records", status_code=500)


@attendance_bp.route('/regularizations/pending', methods=['GET'])
@company_required
@hr_or_manager_required  # HR and Manager can view pending regularizations
def get_pending_regularizations():
    """Get pending regularization requests"""
    try:
        result = AttendanceService.get_pending_regularizations()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"regularization_requests": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve pending regularizations", status_code=500)


@attendance_bp.route('/regularizations/my', methods=['GET'])
@company_required
@role_required("EMPLOYEE", "HR", "MANAGER")  # All roles can view their own regularizations
def get_my_regularizations():
    """Get my regularization requests"""
    try:
        from flask_jwt_extended import get_jwt
        
        # Get current user's employee ID from JWT
        claims = get_jwt()
        employee_id = claims.get("employee_id")
        
        if not employee_id:
            return error_response("Employee ID not found in token", status_code=400)
        
        result = AttendanceService.get_regularizations_by_employee(employee_id)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"regularization_requests": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve my regularizations", status_code=500)


@attendance_bp.route('/reports/monthly-summary', methods=['GET'])
@company_required
@hr_or_manager_required  # HR and Manager can view monthly summary
def get_monthly_attendance_summary():
    """Get monthly attendance summary"""
    try:
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        employee_id = request.args.get('employee_id', type=int)
        
        if not year or not month:
            return validation_error_response("year and month are required")
        
        if month < 1 or month > 12:
            return validation_error_response("month must be between 1 and 12")
        
        result = AttendanceService.get_monthly_attendance_summary(year, month, employee_id)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"monthly_summary": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve monthly attendance summary", status_code=500)


# FACE RECOGNITION ENDPOINTS
@attendance_bp.route('/mark-face', methods=['POST'])
@company_required
@employee_required  # All employees can mark face attendance
@active_employee_required  # Must be active employee
def mark_face_attendance():
    """Mark attendance using face recognition"""
    try:
        from app.attendance.face_recognition_service import FaceRecognitionService
        from flask_jwt_extended import get_jwt_identity, get_jwt
        
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        if not data.get('image'):
            return validation_error_response("Image is required")
        
        if not data.get('type'):
            return validation_error_response("Attendance type is required (checkin/checkout)")
        
        attendance_type = data.get('type').lower()
        if attendance_type not in ['checkin', 'checkout']:
            return validation_error_response("Attendance type must be 'checkin' or 'checkout'")
        
        # Check if face recognition is available
        if not FaceRecognitionService.is_available():
            return error_response(
                "Face recognition service is not available. Please contact administrator",
                status_code=503
            )
        
        # Get current user info from JWT
        user_id = get_jwt_identity()
        claims = get_jwt()
        current_employee_id = claims.get("employee_id")
        
        if not current_employee_id:
            return error_response("Employee ID not found in session", status_code=403)
        
        # Check if current user has a registered face
        face_status = FaceRecognitionService.check_face_registration_status(current_employee_id)
        if not face_status["success"] or not face_status["data"]["is_registered"]:
            return error_response(
                "Face not registered. Please register your face with HR before using face recognition attendance.",
                status_code=403
            )
        
        # First recognize the face to see who it matches
        recognition_result = FaceRecognitionService.recognize_face(data.get('image'))
        
        if not recognition_result["success"]:
            return error_response(recognition_result["message"], status_code=400)
        
        recognized_employee_id = recognition_result["data"]["employee_id"]
        confidence = recognition_result["data"]["confidence"]
        
        # SECURITY CHECK: Ensure recognized face matches logged-in user
        if recognized_employee_id != current_employee_id:
            current_app.logger.warning(
                f"Security violation: User {user_id} (employee {current_employee_id}) "
                f"tried to use face recognition but was matched to employee {recognized_employee_id}"
            )
            return error_response(
                "Face recognition failed: The detected face does not match your registered profile. "
                "Please ensure you are using your own face for attendance.",
                status_code=403
            )
        
        # CONFIDENCE CHECK: Ensure confidence meets minimum threshold
        if confidence < FaceRecognitionService.MIN_CONFIDENCE_THRESHOLD:
            return error_response(
                f"Face recognition confidence too low ({confidence:.1f}%). "
                f"Please ensure good lighting and clear face visibility.",
                status_code=400
            )
        
        # Mark attendance with face recognition (now we know it's the correct user)
        result = FaceRecognitionService.mark_attendance_with_face(
            data.get('image'),
            attendance_type
        )
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        import traceback
        current_app.logger.error(f"Face attendance error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response(f"Failed to mark face attendance: {str(e)}", status_code=500)


@attendance_bp.route('/register-face', methods=['POST'])
@company_required
@hr_required  # Only HR can register employee faces
def register_employee_face():
    """Register employee face for recognition (HR only)"""
    try:
        from app.attendance.face_recognition_service import FaceRecognitionService
        from flask_jwt_extended import get_jwt
        
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        if not data.get('image'):
            return validation_error_response("Image is required")
        
        if not data.get('employee_id'):
            return validation_error_response("Employee ID is required")
        
        # Get current user from JWT
        claims = get_jwt()
        current_user_id = claims.get("user_id")
        user_role = claims.get("role")
        
        # Only HR can register faces
        if user_role != "HR":
            return error_response("Only HR can register employee faces", status_code=403)
        
        # Check if face recognition is available
        if not FaceRecognitionService.is_available():
            return error_response(
                "Face recognition service is not available. Please contact administrator",
                status_code=503
            )
        
        # Register face
        result = FaceRecognitionService.register_employee_face(
            data.get('employee_id'),
            data.get('image'),
            created_by=f"user_{current_user_id}"
        )
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        import traceback
        current_app.logger.error(f"Face registration error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response(f"Failed to register face: {str(e)}", status_code=500)


@attendance_bp.route('/face-status/<int:employee_id>', methods=['GET'])
@company_required
@role_required("EMPLOYEE", "HR", "MANAGER")  # All authenticated users can check face registration status
def check_face_registration_status(employee_id):
    """Check if employee has registered face (employees can only check their own)"""
    try:
        from app.attendance.face_recognition_service import FaceRecognitionService
        from flask_jwt_extended import get_jwt
        
        # Security: Employees can only check their own face status, HR can check anyone
        claims = get_jwt()
        user_role = claims.get("role")
        jwt_employee_id = claims.get("employee_id")
        
        if user_role != "HR" and jwt_employee_id != employee_id:
            return error_response("You can only check your own face registration status", status_code=403)
        
        result = FaceRecognitionService.check_face_registration_status(employee_id)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to check face registration status", status_code=500)


@attendance_bp.route('/today-status/<int:employee_id>', methods=['GET'])
@company_required
@role_required("EMPLOYEE", "HR", "MANAGER")  # All authenticated users can check their today's attendance
def get_today_attendance_status(employee_id):
    """Get today's attendance status for employee (employees can only check their own)"""
    try:
        from datetime import date
        from flask_jwt_extended import get_jwt
        
        # Security: Employees can only check their own attendance, HR can check anyone
        claims = get_jwt()
        user_role = claims.get("role")
        jwt_employee_id = claims.get("employee_id")
        
        if user_role != "HR" and jwt_employee_id != employee_id:
            return error_response("You can only check your own attendance status", status_code=403)
        
        parameters = {
            'employee_id': employee_id,
            'attendance_date': date.today()
        }
        
        result = MultiTenantExecutor.execute_procedure('proc_get_today_attendance_status', parameters)
        
        if result["success"] and result["data"]:
            # Handle both dict and list responses from stored procedure
            status_data = result["data"][0] if isinstance(result["data"], list) else result["data"]
            
            # If status_data is still a list (column-based result), convert to dict
            if isinstance(status_data, list):
                # Assuming order: employee_id, attendance_date, status_code, first_check_in, last_check_out, total_logs
                response_data = {
                    "employee_id": status_data[0] if len(status_data) > 0 else employee_id,
                    "attendance_date": status_data[1] if len(status_data) > 1 else date.today(),
                    "has_checked_in": (status_data[2] if len(status_data) > 2 else 0) >= 1,
                    "has_checked_out": (status_data[2] if len(status_data) > 2 else 0) >= 2,
                    "check_in_time": status_data[3].strftime('%I:%M %p') if len(status_data) > 3 and status_data[3] else None,
                    "check_out_time": status_data[4].strftime('%I:%M %p') if len(status_data) > 4 and status_data[4] else None,
                    "total_logs": status_data[5] if len(status_data) > 5 else 0
                }
            else:
                # Dict-based result
                response_data = {
                    "employee_id": status_data.get('employee_id'),
                    "attendance_date": status_data.get('attendance_date'),
                    "has_checked_in": status_data.get('status_code', 0) >= 1,
                    "has_checked_out": status_data.get('status_code', 0) >= 2,
                    "check_in_time": status_data.get('first_check_in').strftime('%I:%M %p') if status_data.get('first_check_in') else None,
                    "check_out_time": status_data.get('last_check_out').strftime('%I:%M %p') if status_data.get('last_check_out') else None,
                    "total_logs": status_data.get('total_logs', 0)
                }
            
            return success_response(
                message="Today's attendance status retrieved",
                data=response_data
            )
        else:
            # No attendance records for today
            return success_response(
                message="No attendance records for today",
                data={
                    "employee_id": employee_id,
                    "attendance_date": date.today(),
                    "has_checked_in": False,
                    "has_checked_out": False,
                    "check_in_time": None,
                    "check_out_time": None,
                    "total_logs": 0
                }
            )
            
    except Exception as e:
        import traceback
        current_app.logger.error(f"Get today status error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response("Failed to retrieve today's attendance status", status_code=500)


# BULK UPLOAD ENDPOINTS
@attendance_bp.route('/bulk-upload', methods=['POST'])
@company_required
@hr_required
def bulk_upload_attendance():
    """Bulk upload attendance from Excel file (HR only)"""
    try:
        from app.attendance.bulk_upload import BulkAttendanceUpload
        
        # Check if file is present
        if 'file' not in request.files:
            return validation_error_response("No file provided")
        
        file = request.files['file']
        
        if file.filename == '':
            return validation_error_response("No file selected")
        
        if not file.filename.lower().endswith(('.xlsx', '.xls')):
            return validation_error_response("Invalid file type. Only .xlsx and .xls files are allowed")
        
        # Save file temporarily
        import tempfile
        temp_file = tempfile.NamedTemporaryFile(mode='wb', suffix='.xlsx', delete=False)
        file.save(temp_file.name)
        temp_file.close()
        
        current_app.logger.info(f"Processing bulk upload file: {temp_file.name}")
        
        try:
            # Process file
            result = BulkAttendanceUpload.validate_and_process_file(temp_file.name)
            
            # Clean up file
            try:
                os.remove(temp_file.name)
            except:
                pass
            
            if result['success']:
                return success_response(
                    message=result['message'],
                    data={
                        'total_rows': result['total_rows'],
                        'successful_rows': result['successful_rows'],
                        'failed_rows': result['failed_rows'],
                        'errors': result['errors'],
                        'date_range': result.get('date_range')
                    }
                )
            else:
                return error_response(result['message'], status_code=400)
        except Exception as e:
            # Clean up temp file on error
            try:
                os.remove(temp_file.name)
            except:
                pass
            raise e
            
    except Exception as e:
        import traceback
        current_app.logger.error(f"Bulk upload error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response(f"Failed to process bulk upload: {str(e)}", status_code=500)


@attendance_bp.route('/bulk-upload/template', methods=['GET'])
@company_required
@hr_required
def download_bulk_upload_template():
    """Download Excel template for bulk upload (HR only)"""
    try:
        from app.attendance.bulk_upload import BulkAttendanceUpload
        from flask import send_file
        
        current_app.logger.info("Generating bulk upload template...")
        
        result = BulkAttendanceUpload.generate_template()
        
        if result['success']:
            current_app.logger.info(f"Template generated at: {result['file_path']}")
            return send_file(
                result['file_path'],
                as_attachment=True,
                download_name='attendance_upload_template.xlsx',
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        else:
            current_app.logger.error(f"Template generation failed: {result.get('error')}")
            return error_response(f"Failed to generate template: {result.get('error')}", status_code=500)
            
    except Exception as e:
        import traceback
        current_app.logger.error(f"Template download error: {str(e)}")
        current_app.logger.error(traceback.format_exc())


@attendance_bp.route('/bulk-upload/preview', methods=['POST'])
@company_required
@hr_required
def preview_bulk_upload():
    """Preview multiple Excel files before processing (HR only)"""
    try:
        from app.attendance.bulk_upload import BulkAttendanceUpload
        
        # Check if files are present
        if 'files' not in request.files:
            return validation_error_response("No files provided")
        
        files = request.files.getlist('files')
        
        if not files or len(files) == 0:
            return validation_error_response("No files selected")
        
        # Validate file types
        for file in files:
            if not file.filename.lower().endswith(('.xlsx', '.xls')):
                return validation_error_response(f"Invalid file type: {file.filename}. Only .xlsx and .xls files are allowed")
        
        # Save files temporarily
        import tempfile
        temp_files = []
        
        try:
            for file in files:
                temp_file = tempfile.NamedTemporaryFile(mode='wb', suffix='.xlsx', delete=False)
                file.save(temp_file.name)
                temp_file.close()
                temp_files.append(temp_file.name)
            
            current_app.logger.info(f"Previewing {len(temp_files)} file(s)")
            
            # Preview files
            result = BulkAttendanceUpload.preview_files(temp_files)
            
            # Clean up temp files
            for temp_path in temp_files:
                try:
                    os.remove(temp_path)
                except:
                    pass
            
            if result['success']:
                return success_response(
                    message=f"Preview generated for {result['total_files']} file(s)",
                    data=result
                )
            else:
                return error_response(result['message'], status_code=400)
                
        except Exception as e:
            # Clean up temp files on error
            for temp_path in temp_files:
                try:
                    os.remove(temp_path)
                except:
                    pass
            raise e
            
    except Exception as e:
        import traceback
        current_app.logger.error(f"Preview error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response(f"Failed to preview files: {str(e)}", status_code=500)


@attendance_bp.route('/bulk-upload/process-multiple', methods=['POST'])
@company_required
@hr_required
def process_multiple_bulk_upload():
    """Process multiple Excel files at once (HR only)"""
    try:
        from app.attendance.bulk_upload import BulkAttendanceUpload
        
        # Check if files are present
        if 'files' not in request.files:
            return validation_error_response("No files provided")
        
        files = request.files.getlist('files')
        
        if not files or len(files) == 0:
            return validation_error_response("No files selected")
        
        # Validate file types
        for file in files:
            if not file.filename.lower().endswith(('.xlsx', '.xls')):
                return validation_error_response(f"Invalid file type: {file.filename}. Only .xlsx and .xls files are allowed")
        
        # Save files temporarily
        import tempfile
        temp_files = []
        
        try:
            for file in files:
                temp_file = tempfile.NamedTemporaryFile(mode='wb', suffix='.xlsx', delete=False)
                file.save(temp_file.name)
                temp_file.close()
                temp_files.append(temp_file.name)
            
            current_app.logger.info(f"Processing {len(temp_files)} file(s)")
            
            # Process all files
            result = BulkAttendanceUpload.process_multiple_files(temp_files)
            
            # Clean up temp files
            for temp_path in temp_files:
                try:
                    os.remove(temp_path)
                except:
                    pass
            
            if result['success']:
                return success_response(
                    message=result['message'],
                    data={
                        'total_rows': result['total_rows'],
                        'successful_rows': result['successful_rows'],
                        'failed_rows': result['failed_rows'],
                        'errors': result['errors'],
                        'date_range': result.get('date_range')
                    }
                )
            else:
                return error_response(result['message'], status_code=400)
                
        except Exception as e:
            # Clean up temp files on error
            for temp_path in temp_files:
                try:
                    os.remove(temp_path)
                except:
                    pass
            raise e
            
    except Exception as e:
        import traceback
        current_app.logger.error(f"Multi-file upload error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response(f"Failed to process files: {str(e)}", status_code=500)
        return error_response(f"Failed to download template: {str(e)}", status_code=500)


# ============================================================================
# EDIT ATTENDANCE (HR ONLY)
# ============================================================================

@attendance_bp.route('/edit/<int:attendance_id>', methods=['PUT'])
@company_required
@hr_required  # Only HR can edit attendance records
def edit_attendance_record(attendance_id):
    """Edit attendance record (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['employee_id', 'attendance_date', 'status']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        # Parse date - handle multiple formats
        try:
            date_str = data['attendance_date']
            # If it's already a date object or datetime string from frontend
            if isinstance(date_str, str):
                # Try multiple date formats
                for fmt in ['%Y-%m-%d', '%a, %d %b %Y %H:%M:%S %Z', '%Y-%m-%dT%H:%M:%S.%fZ']:
                    try:
                        attendance_date = datetime.strptime(date_str, fmt).date()
                        break
                    except ValueError:
                        continue
                else:
                    # If none of the formats worked, raise error
                    raise ValueError(f"Unsupported date format: {date_str}")
            else:
                attendance_date = date_str
        except (ValueError, AttributeError) as e:
            return validation_error_response("Invalid date format. Use YYYY-MM-DD or ISO format")
        
        # Parse times if provided - keep as strings for SQL Server
        check_in_time = None
        check_out_time = None
        
        if data.get('check_in_time'):
            try:
                # Validate format but keep as string
                datetime.strptime(data['check_in_time'], '%H:%M:%S')
                check_in_time = data['check_in_time']  # Keep as string
            except ValueError:
                return validation_error_response("Invalid check_in_time format. Use HH:MM:SS")
        
        if data.get('check_out_time'):
            try:
                # Validate format but keep as string
                datetime.strptime(data['check_out_time'], '%H:%M:%S')
                check_out_time = data['check_out_time']  # Keep as string
            except ValueError:
                return validation_error_response("Invalid check_out_time format. Use HH:MM:SS")
        
        # Calculate working minutes if both times provided
        working_minutes = None
        if check_in_time and check_out_time:
            # Convert to datetime for calculation
            check_in_time_obj = datetime.strptime(check_in_time, '%H:%M:%S').time()
            check_out_time_obj = datetime.strptime(check_out_time, '%H:%M:%S').time()
            check_in_dt = datetime.combine(attendance_date, check_in_time_obj)
            check_out_dt = datetime.combine(attendance_date, check_out_time_obj)
            
            if check_out_dt > check_in_dt:
                working_minutes = int((check_out_dt - check_in_dt).total_seconds() / 60)
        
        # Use the upsert procedure to update the record
        result = AttendanceService.upsert_attendance_record(
            employee_id=data['employee_id'],
            attendance_date=attendance_date,
            status=data['status'],
            check_in_time=check_in_time,
            check_out_time=check_out_time,
            working_minutes=working_minutes
        )
        
        if result["success"]:
            # Don't regenerate factory attendance after manual edit
            # Manual edits should be preserved, not recalculated from raw logs
            
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to edit attendance record", status_code=500)



# ============================================================================
# KIOSK ENDPOINTS
# Face Recognition Attendance Kiosk System
# ============================================================================

@attendance_bp.route('/kiosk/verify-pin', methods=['POST'])
@company_required
def verify_kiosk_pin():
    """Verify kiosk PIN"""
    try:
        from app.attendance.kiosk_service import KioskService
        
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        if not data.get('kiosk_id'):
            return validation_error_response("kiosk_id is required")
        
        if not data.get('pin'):
            return validation_error_response("PIN is required")
        
        result = KioskService.verify_kiosk_pin(data['kiosk_id'], data['pin'])
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=401)
            
    except Exception as e:
        current_app.logger.error(f"Verify kiosk PIN error: {str(e)}")
        return error_response("Failed to verify PIN", status_code=500)


@attendance_bp.route('/kiosk/<int:kiosk_id>/mark-attendance', methods=['POST'])
@company_required
def mark_kiosk_attendance(kiosk_id):
    """Mark attendance via kiosk using face recognition"""
    try:
        from app.attendance.kiosk_service import KioskService
        
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        if not data.get('image'):
            return validation_error_response("Image is required")
        
        result = KioskService.mark_attendance_with_face(kiosk_id, data['image'])
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        import traceback
        current_app.logger.error(f"Kiosk mark attendance error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response("Failed to mark attendance", status_code=500)


@attendance_bp.route('/kiosk/<int:kiosk_id>/today-logs', methods=['GET'])
@company_required
def get_kiosk_today_logs(kiosk_id):
    """Get today's attendance logs for kiosk"""
    try:
        from app.attendance.kiosk_service import KioskService
        
        result = KioskService.get_today_logs(kiosk_id)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"logs": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        current_app.logger.error(f"Get kiosk logs error: {str(e)}")
        return error_response("Failed to retrieve logs", status_code=500)


@attendance_bp.route('/kiosk/<int:kiosk_id>/settings', methods=['GET'])
@company_required
def get_kiosk_settings(kiosk_id):
    """Get kiosk settings"""
    try:
        from app.attendance.kiosk_service import KioskService
        
        result = KioskService.get_kiosk_settings(kiosk_id)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=404)
            
    except Exception as e:
        current_app.logger.error(f"Get kiosk settings error: {str(e)}")
        return error_response("Failed to retrieve settings", status_code=500)


# Kiosk management endpoints

@attendance_bp.route('/kiosk/list', methods=['GET'])
@company_required
def list_all_kiosks():
    """List all kiosks"""
    try:
        from app.attendance.kiosk_service import KioskService
        
        result = KioskService.list_all_kiosks()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        current_app.logger.error(f"List kiosks error: {str(e)}")
        return error_response("Failed to retrieve kiosks", status_code=500)


@attendance_bp.route('/kiosk/create', methods=['POST'])
@company_required
@hr_required
def create_kiosk():
    """Create new kiosk (HR only)"""
    try:
        from app.attendance.kiosk_service import KioskService
        
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        required_fields = ['kiosk_name', 'kiosk_location', 'kiosk_pin']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        result = KioskService.create_kiosk(
            data['kiosk_name'],
            data['kiosk_location'],
            data['kiosk_pin']
        )
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        current_app.logger.error(f"Create kiosk error: {str(e)}")
        return error_response("Failed to create kiosk", status_code=500)


@attendance_bp.route('/kiosk/<int:kiosk_id>/update', methods=['PUT'])
@company_required
def update_kiosk(kiosk_id):
    """Update kiosk settings"""
    try:
        from app.attendance.kiosk_service import KioskService
        
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        required_fields = ['kiosk_name', 'kiosk_location']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        result = KioskService.update_kiosk_settings(
            kiosk_id,
            data['kiosk_name'],
            data['kiosk_location'],
            data.get('kiosk_pin')  # Optional
        )
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        current_app.logger.error(f"Update kiosk error: {str(e)}")
        return error_response("Failed to update kiosk", status_code=500)


# ============================================================================
# SHIFT MANAGEMENT (HR ONLY)
# ============================================================================

@attendance_bp.route('/shifts', methods=['GET'])
@company_required
@hr_required
def get_shifts():
    """Get all shift definitions"""
    try:
        result = MultiTenantExecutor.execute_procedure('proc_get_shift_definitions')
        if result['success']:
            shifts = result['data']
            # Convert TIME objects to strings for JSON serialization
            for s in shifts:
                if s.get('start_time') and not isinstance(s['start_time'], str):
                    s['start_time'] = str(s['start_time'])
                if s.get('end_time') and not isinstance(s['end_time'], str):
                    s['end_time'] = str(s['end_time'])
            return success_response(message='Shifts retrieved', data={'shifts': shifts})
        return error_response('Failed to retrieve shifts', status_code=500)
    except Exception as e:
        return error_response(str(e), status_code=500)


@attendance_bp.route('/shifts', methods=['POST'])
@company_required
@hr_required
def create_shift():
    """Create a new shift definition"""
    try:
        data = request.get_json()
        if not data:
            return validation_error_response('Request body required')
        result = MultiTenantExecutor.execute_procedure('proc_add_shift_definition', {
            'shift_name':               data.get('shift_name'),
            'start_time':               data.get('start_time'),
            'end_time':                 data.get('end_time'),
            'is_night_shift':           data.get('is_night_shift', 0),
            'checkin_grace_minutes':    data.get('checkin_grace_minutes', 15),
            'checkout_grace_minutes':   data.get('checkout_grace_minutes', 15),
            'half_day_minimum_hours':   data.get('half_day_minimum_hours', 6.0),
            'overtime_buffer_minutes':  data.get('overtime_buffer_minutes', 60),
        })
        if result['success'] and result['data']:
            r = result['data'][0]
            if r.get('success') == 1:
                return success_response(message=r.get('message'), data={'shift_id': r.get('shift_id')})
            return error_response(r.get('message', 'Failed'), status_code=400)
        return error_response('Failed to create shift', status_code=500)
    except Exception as e:
        return error_response(str(e), status_code=500)


@attendance_bp.route('/shifts/<int:shift_id>', methods=['PUT'])
@company_required
@hr_required
def update_shift(shift_id):
    """Update an existing shift definition"""
    try:
        data = request.get_json()
        if not data:
            return validation_error_response('Request body required')
        result = MultiTenantExecutor.execute_procedure('proc_update_shift_definition', {
            'shift_id':                 shift_id,
            'shift_name':               data.get('shift_name'),
            'start_time':               data.get('start_time'),
            'end_time':                 data.get('end_time'),
            'is_night_shift':           data.get('is_night_shift', 0),
            'checkin_grace_minutes':    data.get('checkin_grace_minutes', 15),
            'checkout_grace_minutes':   data.get('checkout_grace_minutes', 15),
            'half_day_minimum_hours':   data.get('half_day_minimum_hours', 6.0),
            'overtime_buffer_minutes':  data.get('overtime_buffer_minutes', 60),
        })
        if result['success'] and result['data']:
            r = result['data'][0]
            if r.get('success') == 1:
                return success_response(message=r.get('message'))
            return error_response(r.get('message', 'Failed'), status_code=400)
        return error_response('Failed to update shift', status_code=500)
    except Exception as e:
        return error_response(str(e), status_code=500)


@attendance_bp.route('/shifts/assign', methods=['POST'])
@company_required
@hr_required
def assign_shift():
    """Assign a shift to an employee"""
    try:
        from flask_jwt_extended import get_jwt_identity
        data = request.get_json()
        if not data:
            return validation_error_response('Request body required')
        result = MultiTenantExecutor.execute_procedure('proc_assign_employee_shift', {
            'employee_id':    data.get('employee_id'),
            'shift_id':       data.get('shift_id'),
            'effective_from': data.get('effective_from'),
            'assigned_by':    data.get('assigned_by'),
        })
        if result['success'] and result['data']:
            r = result['data'][0]
            if r.get('success') == 1:
                return success_response(message=r.get('message'))
            return error_response(r.get('message', 'Failed'), status_code=400)
        return error_response('Failed to assign shift', status_code=500)
    except Exception as e:
        return error_response(str(e), status_code=500)


@attendance_bp.route('/shifts/employee/<int:employee_id>', methods=['GET'])
@company_required
@hr_required
def get_employee_shift(employee_id):
    """Get current shift assignment for an employee"""
    try:
        result = MultiTenantExecutor.execute_procedure(
            'proc_get_employee_current_shift', {'employee_id': employee_id}
        )
        if result['success']:
            data = result['data'][0] if result['data'] else None
            if data:
                if data.get('start_time') and not isinstance(data['start_time'], str):
                    data['start_time'] = str(data['start_time'])
                if data.get('end_time') and not isinstance(data['end_time'], str):
                    data['end_time'] = str(data['end_time'])
            return success_response(message='Shift retrieved', data={'assignment': data})
        return error_response('Failed to retrieve shift', status_code=500)
    except Exception as e:
        return success_response(message='No shift assigned', data={'assignment': None})


# ============================================================================
# FACTORY ATTENDANCE PROCESSING
# ============================================================================

@attendance_bp.route('/factory/process', methods=['POST'])
@company_required
@hr_required
def process_factory_attendance():
    """
    Manually trigger factory attendance generation for a date range.
    HR uses this to reprocess attendance after shift changes or corrections.
    """
    try:
        data = request.get_json() or {}
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if not start_date:
            return validation_error_response('start_date is required')
        if not end_date:
            end_date = start_date

        result = MultiTenantExecutor.execute_procedure(
            'proc_generate_factory_attendance',
            {'start_date': start_date, 'end_date': end_date}
        )
        if result['success'] and result['data']:
            r = result['data'][0]
            return success_response(message=r.get('message', 'Attendance processed'))
        return error_response('Failed to process attendance', status_code=500)
    except Exception as e:
        current_app.logger.error(f"Factory attendance process error: {str(e)}")
        return error_response(str(e), status_code=500)


@attendance_bp.route('/factory/process-yesterday', methods=['POST'])
def process_yesterday_factory_attendance():
    """
    Internal endpoint called by Windows Task Scheduler every night.
    Protected by gateway secret instead of JWT.
    """
    import os
    secret = request.headers.get('X-Gateway-Secret', '')
    if secret != os.environ.get('GATEWAY_SECRET', 'change-this-secret'):
        return error_response('Unauthorized', status_code=401)

    try:
        from datetime import date, timedelta
        yesterday = (date.today() - timedelta(days=1)).strftime('%Y-%m-%d')

        # Process for all active companies
        from app.database.master_db import master_db
        from app.database.multi_tenant_connection import connection_manager
        from app.middleware.company_context import get_company_code
        from flask import g

        companies = master_db.execute_procedure('proc_mt_get_all_companies', {'status_filter': 'ACTIVE'})

        processed = []
        for company in companies:
            company_code = company.get('company_code')
            try:
                conn = connection_manager.get_company_connection(company_code)
                cursor = conn.cursor()
                cursor.execute(
                    "EXEC proc_generate_factory_attendance @start_date=?, @end_date=?",
                    (yesterday, yesterday)
                )
                conn.commit()
                connection_manager.return_connection(company_code, conn)
                processed.append(company_code)
            except Exception as ce:
                current_app.logger.error(f"Failed for {company_code}: {ce}")

        return success_response(
            message=f'Processed {len(processed)} companies for {yesterday}',
            data={'companies': processed, 'date': yesterday}
        )
    except Exception as e:
        current_app.logger.error(f"Scheduled process error: {str(e)}")
        return error_response(str(e), status_code=500)


@attendance_bp.route('/shifts/remove', methods=['POST'])
@company_required
@hr_required
def remove_employee_shift():
    """Remove shift assignment from an employee"""
    try:
        data = request.get_json()
        if not data or not data.get('employee_id'):
            return validation_error_response('employee_id is required')
        result = MultiTenantExecutor.execute_procedure(
            'proc_remove_employee_shift',
            {'employee_id': data.get('employee_id')}
        )
        if result['success'] and result['data']:
            r = result['data'][0]
            if r.get('success') == 1:
                return success_response(message=r.get('message'))
            return error_response(r.get('message', 'Failed'), status_code=400)
        return error_response('Failed to remove shift', status_code=500)
    except Exception as e:
        return error_response(str(e), status_code=500)


@attendance_bp.route('/factory/pending', methods=['GET'])
@company_required
@hr_required
def get_pending_factory_attendance():
    """Get all PENDING attendance records needing HR correction"""
    try:
        days_back = request.args.get('days_back', 30, type=int)
        result = MultiTenantExecutor.execute_procedure(
            'proc_get_pending_factory_attendance',
            {'days_back': days_back}
        )
        if result['success']:
            return success_response(
                message='Pending records retrieved',
                data={'pending': result['data'], 'count': len(result['data'])}
            )
        return error_response('Failed to retrieve pending records', status_code=500)
    except Exception as e:
        return error_response(str(e), status_code=500)


@attendance_bp.route('/reports/summary', methods=['GET'])
@company_required
@hr_required
def get_attendance_summary_report():
    """Get attendance summary report in grid format"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        department = request.args.get('department')
        employee_type = request.args.get('employee_type')
        
        if not start_date or not end_date:
            return validation_error_response('start_date and end_date are required')
        
        params = {
            'start_date': start_date,
            'end_date': end_date
        }
        
        if department and department != 'All':
            params['department'] = department
        
        if employee_type and employee_type != 'All':
            params['employee_type'] = employee_type
        
        result = MultiTenantExecutor.execute_procedure(
            'proc_get_attendance_summary_report',
            params
        )
        
        if result['success']:
            return success_response(
                message='Summary report retrieved',
                data={'records': result['data']}
            )
        return error_response('Failed to retrieve summary report', status_code=500)
    except Exception as e:
        return error_response(str(e), status_code=500)


# ============================================================================
# DEPARTMENT SHIFT SUMMARY REPORT
# ============================================================================

@attendance_bp.route('/reports/department-shift-summary', methods=['GET'])
@company_required
@hr_or_manager_required  # HR and Manager can view department shift summary
def get_department_shift_summary():
    """Get department-wise employee count grouped by shift for a specific date"""
    try:
        report_date = request.args.get('report_date')
        
        if not report_date:
            return validation_error_response("report_date is required")
        
        # Parse date
        try:
            report_date = datetime.strptime(report_date, '%Y-%m-%d').date()
        except ValueError:
            return validation_error_response("Invalid date format. Use YYYY-MM-DD")
        
        # Execute stored procedure
        parameters = {'report_date': report_date}
        result = MultiTenantExecutor.execute_procedure('proc_get_department_shift_summary', parameters)
        
        if result["success"] and result["data"]:
            # The first result set contains the department shift summary
            summary_data = result["data"][0] if isinstance(result["data"], list) and len(result["data"]) > 0 else []
            
            # Group data by department for easier frontend processing
            departments = {}
            total_by_shift = {}
            grand_total = 0
            
            for row in summary_data:
                dept = row.get('department', 'Unassigned')
                shift = row.get('shift_name', 'No Shift')
                count = row.get('employee_count', 0)
                
                if dept not in departments:
                    departments[dept] = {}
                
                departments[dept][shift] = count
                
                # Track totals by shift
                if shift not in total_by_shift:
                    total_by_shift[shift] = 0
                total_by_shift[shift] += count
                
                grand_total += count
            
            return success_response(
                message="Department shift summary retrieved successfully",
                data={
                    "report_date": report_date.strftime('%Y-%m-%d'),
                    "departments": departments,
                    "total_by_shift": total_by_shift,
                    "grand_total": grand_total,
                    "raw_data": summary_data
                }
            )
        else:
            return success_response(
                message="No data available for the selected date",
                data={
                    "report_date": report_date.strftime('%Y-%m-%d'),
                    "departments": {},
                    "total_by_shift": {},
                    "grand_total": 0,
                    "raw_data": []
                }
            )
            
    except Exception as e:
        import traceback
        current_app.logger.error(f"Department shift summary error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response("Failed to retrieve department shift summary", status_code=500)


@attendance_bp.route('/reports/employee-list', methods=['GET'])
@company_required
@hr_or_manager_required
def get_employee_list_report():
    """Get employee list with all fields for reporting/download"""
    try:
        department = request.args.get('department')
        worker_category = request.args.get('worker_category')
        status = request.args.get('status', 'ACTIVE')

        query = """
            SELECT 
                e.employee_id,
                e.employee_code,
                p.first_name,
                p.last_name,
                o.department,
                o.designation,
                o.date_of_joining,
                p.email,
                p.phone,
                p.dob,
                p.gender,
                p.address,
                p.emergency_contact,
                o.work_location,
                o.employment_type,
                ISNULL(o.worker_category, 'OFFICE') AS worker_category,
                s.shift_name,
                e.status
            FROM employees e
            LEFT JOIN employee_personal p ON e.employee_id = p.employee_id
            LEFT JOIN employee_official o ON e.employee_id = o.employee_id
            LEFT JOIN employee_shift_assignment esa 
                ON e.employee_id = esa.employee_id AND esa.effective_to IS NULL
            LEFT JOIN shift_definitions s ON esa.shift_id = s.shift_id
            WHERE 1=1
        """

        params = []

        if status and status != 'ALL':
            query += " AND e.status = ?"
            params.append(status)

        if department and department != 'ALL':
            query += " AND o.department = ?"
            params.append(department)

        if worker_category and worker_category != 'ALL':
            query += " AND o.worker_category = ?"
            params.append(worker_category)

        query += " ORDER BY TRY_CAST(e.employee_code AS INT), e.employee_code"

        result = MultiTenantExecutor.execute_query(query, tuple(params) if params else None)

        if not result["success"]:
            current_app.logger.error(f"Employee list query failed: {result.get('message')}")
            return error_response(f"Query failed: {result.get('message')}", status_code=500)

        employees = result["data"] or []

        return success_response(
            message="Employee list retrieved successfully",
            data={
                "employees": employees,
                "total_count": len(employees)
            }
        )

    except Exception as e:
        import traceback
        current_app.logger.error(f"Employee list report error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response("Failed to retrieve employee list", status_code=500)
