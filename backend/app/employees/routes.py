from flask import Blueprint, request, current_app, send_file
from app.employees.service import EmployeeService
from app.middleware.jwt_required import jwt_required
from app.middleware.role_guard import hr_required, hr_or_manager_required
from app.utils.response import (
    success_response, 
    error_response, 
    validation_error_response,
    not_found_response
)
import os
from datetime import datetime
from werkzeug.utils import secure_filename
from flask_jwt_extended import get_jwt

employees_bp = Blueprint('employees', __name__)

# Photo upload configuration
UPLOAD_FOLDER = os.path.join(os.path.expanduser('~'), 'employee_photos')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@employees_bp.route('/', methods=['GET'])
@hr_required
def get_employee_list():
    """Get list of all employees (HR only)"""
    try:
        result = EmployeeService.get_employee_list()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"employees": result["data"]}
            )
        else:
            current_app.logger.error(f"Employee service error: {result['message']}")
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        current_app.logger.error(f"Employee list route error: {str(e)}")
        return error_response("Failed to retrieve employee list", status_code=500)


@employees_bp.route('/active', methods=['GET'])
@hr_required
def get_active_employees_for_attendance():
    """Get list of only ACTIVE employees for attendance operations (HR only)"""
    try:
        result = EmployeeService.get_active_employees_for_attendance()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"employees": result["data"]}
            )
        else:
            current_app.logger.error(f"Active employee service error: {result['message']}")
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        current_app.logger.error(f"Active employee list route error: {str(e)}")
        return error_response("Failed to retrieve active employee list", status_code=500)


@employees_bp.route('/<int:employee_id>', methods=['GET'])
@hr_or_manager_required
def get_employee_profile(employee_id):
    """Get employee profile by ID (HR or Manager)"""
    try:
        result = EmployeeService.get_employee_profile(employee_id)
        
        if result["success"]:
            if result["data"]:
                return success_response(
                    message=result["message"],
                    data={"employee": result["data"]}
                )
            else:
                return not_found_response("Employee not found")
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve employee profile", status_code=500)


@employees_bp.route('/', methods=['POST'])
@hr_required
def add_employee():
    """Add new employee with auto user creation (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email', 'department', 'designation', 'join_date']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        # Generate employee code if not provided
        if not data.get('employee_code'):
            # Get next sequential employee code from database
            from app.database.executor import StoredProcedureExecutor
            code_result = StoredProcedureExecutor.execute_procedure('proc_get_next_employee_code')
            if code_result["success"] and code_result["data"]:
                next_code = code_result["data"][0].get('next_employee_code')
                data['employee_code'] = next_code
            else:
                return error_response("Failed to generate employee code", status_code=500)
        
        # Get current user ID for audit
        from flask_jwt_extended import get_jwt_identity
        current_user_id = get_jwt_identity()
        
        result = EmployeeService.add_employee(data, created_by_user_id=current_user_id)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        import traceback
        current_app.logger.error(f"Add employee error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response("Failed to add employee", status_code=500)


@employees_bp.route('/<int:employee_id>', methods=['PUT'])
@hr_required
def update_employee(employee_id):
    """Update employee information (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        result = EmployeeService.update_employee(employee_id, data)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to update employee", status_code=500)


@employees_bp.route('/search', methods=['GET'])
@hr_or_manager_required
def search_employees():
    """Search employees by name or employee code (HR or Manager)"""
    try:
        query = request.args.get('q', '')
        
        if query:
            result = EmployeeService.search_employees(query)
        else:
            result = EmployeeService.get_employee_list()
        
        if result["success"]:
            return success_response(
                message="Employee search results",
                data={"employees": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to search employees", status_code=500)


@employees_bp.route('/department/<department>', methods=['GET'])
@hr_or_manager_required
def get_employees_by_department(department):
    """Get employees by department (HR or Manager)"""
    try:
        result = EmployeeService.get_employees_by_department(department)
        
        if result["success"]:
            return success_response(
                message="Employees retrieved successfully",
                data={"employees": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve employees by department", status_code=500)


@employees_bp.route('/<int:employee_id>/photo', methods=['POST'])
@hr_required
def upload_employee_photo(employee_id):
    """Upload/update employee photo and register face (HR only)"""
    try:
        from app.attendance.face_recognition_service import FaceRecognitionService
        
        # Check if photo is provided (either file upload or base64)
        photo_file = request.files.get('photo')
        photo_base64 = request.form.get('photo_base64')
        
        if not photo_file and not photo_base64:
            return validation_error_response("Photo is required (either file upload or base64)")
        
        # Get current user for audit
        claims = get_jwt()
        current_user_id = claims.get("user_id")
        
        # Handle file upload
        if photo_file:
            if photo_file.filename == '':
                return validation_error_response("No file selected")
            
            if not allowed_file(photo_file.filename):
                return validation_error_response("Invalid file type. Only PNG, JPG, JPEG allowed")
            
            # Check file size
            photo_file.seek(0, os.SEEK_END)
            file_size = photo_file.tell()
            photo_file.seek(0)
            
            if file_size > MAX_FILE_SIZE:
                return validation_error_response("File size too large. Maximum 5MB allowed")
            
            # Save photo
            filename = secure_filename(photo_file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            photo_filename = f"emp_{employee_id}_{timestamp}_{filename}"
            photo_path = os.path.join(UPLOAD_FOLDER, photo_filename)
            photo_file.save(photo_path)
            
            # Read file as base64 for face recognition
            with open(photo_path, 'rb') as f:
                import base64
                photo_base64 = base64.b64encode(f.read()).decode('utf-8')
                photo_base64 = f"data:image/jpeg;base64,{photo_base64}"
        
        # Register face with face recognition
        if not FaceRecognitionService.is_available():
            return error_response(
                "Face recognition service not available. Photo saved but face not registered",
                status_code=503
            )
        
        result = FaceRecognitionService.register_employee_face(
            employee_id,
            photo_base64,
            created_by=f"user_{current_user_id}"
        )
        
        if result["success"]:
            # Update photo path in database
            from app.database.executor import StoredProcedureExecutor
            photo_path_relative = photo_filename if photo_file else None
            
            if photo_path_relative:
                StoredProcedureExecutor.execute_procedure(
                    'proc_update_employee_photo',
                    {'employee_id': employee_id, 'photo_path': photo_path_relative}
                )
            
            return success_response(
                message="Employee photo uploaded and face registered successfully",
                data={
                    "employee_id": employee_id,
                    "photo_path": photo_path_relative,
                    "face_registered": True
                }
            )
        else:
            # Face registration failed, but photo might be saved
            return error_response(
                f"Photo uploaded but face registration failed: {result['message']}",
                status_code=400
            )
            
    except Exception as e:
        import traceback
        current_app.logger.error(f"Upload photo error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response(f"Failed to upload photo: {str(e)}", status_code=500)


@employees_bp.route('/<int:employee_id>/photo', methods=['DELETE'])
@hr_required
def delete_employee_photo(employee_id):
    """Delete employee photo and face registration (HR only)"""
    try:
        from app.database.executor import StoredProcedureExecutor
        
        # Get current photo path
        result = EmployeeService.get_employee_profile(employee_id)
        if not result["success"] or not result["data"]:
            return not_found_response("Employee not found")
        
        photo_path = result["data"].get("photo_path")
        
        # Clear photo path and face encoding using stored procedure
        # First clear photo
        StoredProcedureExecutor.execute_procedure(
            'proc_update_employee_photo',
            {'employee_id': employee_id, 'photo_path': None}
        )
        
        # Then clear face encoding by registering NULL
        StoredProcedureExecutor.execute_procedure(
            'proc_register_employee_face',
            {
                'employee_id': employee_id,
                'face_encoding_json': None,
                'photo_path': None,
                'registered_by': None
            }
        )
        
        # Delete physical file if exists
        if photo_path:
            full_path = os.path.join(UPLOAD_FOLDER, photo_path)
            if os.path.exists(full_path):
                os.remove(full_path)
        
        return success_response(
            message="Employee photo and face registration deleted successfully",
            data={"employee_id": employee_id}
        )
        
    except Exception as e:
        import traceback
        current_app.logger.error(f"Delete photo error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response(f"Failed to delete photo: {str(e)}", status_code=500)


@employees_bp.route('/<int:employee_id>/photo', methods=['GET'])
def get_employee_photo(employee_id):
    """Get employee photo (public access for display)"""
    try:
        # Get employee photo path
        result = EmployeeService.get_employee_profile(employee_id)
        if not result["success"] or not result["data"]:
            return not_found_response("Employee not found")
        
        photo_path = result["data"].get("photo_path")
        
        if not photo_path:
            return not_found_response("No photo found for this employee")
        
        # Serve photo file
        full_path = os.path.join(UPLOAD_FOLDER, photo_path)
        if not os.path.exists(full_path):
            return not_found_response("Photo file not found")
        
        return send_file(full_path, mimetype='image/jpeg')
        
    except Exception as e:
        current_app.logger.error(f"Get photo error: {str(e)}")
        return error_response(f"Failed to get photo: {str(e)}", status_code=500)


@employees_bp.route('/<int:employee_id>/deactivate', methods=['POST'])
@hr_required
def deactivate_employee(employee_id):
    """Deactivate an employee (HR only)"""
    try:
        data = request.get_json() or {}
        reason = data.get('reason', 'Employee deactivated by HR')
        
        # Get current user ID for audit
        from flask_jwt_extended import get_jwt_identity
        current_user_id = get_jwt_identity()
        
        result = EmployeeService.deactivate_employee(
            employee_id, 
            int(current_user_id), 
            reason
        )
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"employee_id": employee_id, "status": "INACTIVE"}
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        current_app.logger.error(f"Deactivate employee route error: {str(e)}")
        return error_response("Failed to deactivate employee", status_code=500)


@employees_bp.route('/<int:employee_id>/reactivate', methods=['POST'])
@hr_required
def reactivate_employee(employee_id):
    """Reactivate an employee (HR only)"""
    try:
        data = request.get_json() or {}
        reason = data.get('reason', 'Employee reactivated by HR')
        
        # Get current user ID for audit
        from flask_jwt_extended import get_jwt_identity
        current_user_id = get_jwt_identity()
        
        result = EmployeeService.reactivate_employee(
            employee_id, 
            int(current_user_id), 
            reason
        )
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"employee_id": employee_id, "status": "ACTIVE"}
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        current_app.logger.error(f"Reactivate employee route error: {str(e)}")
        return error_response("Failed to reactivate employee", status_code=500)


@employees_bp.route('/<int:employee_id>/status-history', methods=['GET'])
@hr_or_manager_required
def get_employee_status_history(employee_id):
    """Get employee status change history (HR or Manager)"""
    try:
        result = EmployeeService.get_employee_status_history(employee_id)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"history": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        current_app.logger.error(f"Get status history route error: {str(e)}")
        return error_response("Failed to retrieve status history", status_code=500)