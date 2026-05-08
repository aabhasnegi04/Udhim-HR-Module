from flask import Blueprint, request, current_app, send_file
from app.employees.service import EmployeeService
from app.middleware.company_context import company_required
from app.middleware.multi_tenant_jwt import multi_tenant_jwt_required
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
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def _photo_folder(claims) -> str:
    """Return the company-namespaced employee_photos folder for this request."""
    from app.utils.upload_path import get_upload_folder
    company_code = claims.get('company_code', 'default')
    return get_upload_folder(company_code, 'employee_photos')


@employees_bp.route('/', methods=['GET'])
@company_required
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
@company_required
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
@company_required
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


@employees_bp.route('/<string:employee_code>', methods=['GET'])
@company_required
@hr_or_manager_required
def get_employee_profile_by_code(employee_code):
    """Get employee profile by employee code (HR or Manager)"""
    try:
        # Get employee ID from employee code
        from app.database.multi_tenant_executor import MultiTenantExecutor
        result = MultiTenantExecutor.execute_procedure(
            'proc_get_employee_id_by_code',
            {'employee_code': employee_code}
        )
        
        if not result.get("success") or not result.get("data"):
            return not_found_response(f"Employee with code '{employee_code}' not found")
        
        employee_id = result["data"][0].get("employee_id")
        
        if not employee_id:
            return not_found_response(f"Employee with code '{employee_code}' not found")
        
        # Get employee profile
        profile_result = EmployeeService.get_employee_profile(employee_id)
        
        if profile_result["success"]:
            if profile_result["data"]:
                return success_response(
                    message=profile_result["message"],
                    data={"employee": profile_result["data"]}
                )
            else:
                return not_found_response("Employee not found")
        else:
            return error_response(profile_result["message"], status_code=500)
            
    except Exception as e:
        current_app.logger.error(f"Get employee by code error: {str(e)}")
        return error_response("Failed to retrieve employee profile", status_code=500)


@employees_bp.route('/', methods=['POST'])
@company_required
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
            from app.database.multi_tenant_executor import MultiTenantExecutor
            code_result = MultiTenantExecutor.execute_procedure('proc_get_next_employee_code')
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
            # Notify the new employee's user account + notify all HR
            try:
                from app.notifications.service import NotificationService
                from app.database.multi_tenant_executor import MultiTenantExecutor
                new_emp_id = result['data'].get('employee_id') if isinstance(result.get('data'), dict) else None
                if new_emp_id:
                    emp_r = MultiTenantExecutor.execute_procedure('proc_get_employee_info', {'employee_id': new_emp_id}).get('data', [])
                    if emp_r and isinstance(emp_r[0], list): emp_r = emp_r[0]
                    if emp_r and emp_r[0].get('user_id'):
                        NotificationService.create(
                            user_id=emp_r[0]['user_id'],
                            title='Welcome to the Team',
                            message=f'Your employee profile has been created. Welcome aboard!',
                            module='GENERAL'
                        )
                hr_rows = MultiTenantExecutor.execute_procedure('proc_get_hr_user_ids', {}).get('data', [])
                if hr_rows and isinstance(hr_rows[0], list): hr_rows = hr_rows[0]
                emp_name = data.get('first_name', '') + ' ' + data.get('last_name', '')
                for hr in (hr_rows or []):
                    if hr.get('user_id') and hr['user_id'] != int(current_user_id):
                        NotificationService.create(
                            user_id=hr['user_id'],
                            title='New Employee Added',
                            message=f'{emp_name.strip()} has been added as a new employee.',
                            module='GENERAL'
                        )
            except Exception:
                pass
            return success_response(message=result["message"], data=result["data"])
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        import traceback
        current_app.logger.error(f"Add employee error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response("Failed to add employee", status_code=500)


@employees_bp.route('/<int:employee_id>', methods=['PUT'])
@company_required
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
@company_required
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
@company_required
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
@company_required
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
        upload_folder = _photo_folder(claims)

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
            photo_path = os.path.join(upload_folder, photo_filename)
            photo_file.save(photo_path)
            
            # Read file as base64 for face recognition
            with open(photo_path, 'rb') as f:
                import base64
                photo_base64 = base64.b64encode(f.read()).decode('utf-8')
                photo_base64 = f"data:image/jpeg;base64,{photo_base64}"
        
        # Register face with face recognition
        if not FaceRecognitionService.is_available():
            return error_response(
                "Face recognition service not available. Please install face_recognition library.",
                status_code=503
            )
        
        result = FaceRecognitionService.register_employee_face(
            employee_id,
            photo_base64,
            created_by=f"user_{current_user_id}"
        )
        
        if result["success"]:
            # Update photo path in database
            from app.database.multi_tenant_executor import MultiTenantExecutor
            photo_path_relative = photo_filename if photo_file else None
            
            if photo_path_relative:
                MultiTenantExecutor.execute_procedure(
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
@company_required
@hr_required
def delete_employee_photo(employee_id):
    """Delete employee photo and face registration (HR only)"""
    try:
        from app.database.multi_tenant_executor import MultiTenantExecutor
        
        # Get current photo path
        result = EmployeeService.get_employee_profile(employee_id)
        if not result["success"] or not result["data"]:
            return not_found_response("Employee not found")
        
        photo_path = result["data"].get("photo_path")
        
        # Clear photo path and face encoding using stored procedure
        # First clear photo
        MultiTenantExecutor.execute_procedure(
            'proc_update_employee_photo',
            {'employee_id': employee_id, 'photo_path': None}
        )
        
        # Then clear face encoding by registering NULL
        MultiTenantExecutor.execute_procedure(
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
            claims = get_jwt()
            upload_folder = _photo_folder(claims)
            full_path = os.path.join(upload_folder, photo_path)
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
    """Get employee photo (public access for display) with caching and optimization"""
    try:
        from flask import Response, send_file
        from PIL import Image
        import io
        
        # Get company code from query parameter or header
        company_code = request.args.get('company') or request.headers.get('X-Company-Code')
        
        if not company_code:
            company_code = os.environ.get('COMPANY_CODE', 'default')
        
        # Get employee photo path from database
        from app.database.multi_tenant_executor import MultiTenantExecutor
        from app.utils.upload_path import get_upload_folder
        from flask import g
        g.company_code = company_code
        
        result = MultiTenantExecutor.execute_procedure('proc_get_employee_photo', {'employee_id': employee_id})
        
        if not result.get("success") or not result.get("data") or len(result["data"]) == 0:
            return not_found_response("No photo found for this employee")
        
        photo_path = result["data"][0].get("photo_path")
        
        if not photo_path:
            return not_found_response("No photo found for this employee")
        
        upload_folder = get_upload_folder(company_code, 'employee_photos')
        full_path = os.path.join(upload_folder, photo_path)
        
        if not os.path.exists(full_path):
            return not_found_response("Photo file not found")
        
        # Get size parameter for thumbnail (default: 100px for list view)
        size = request.args.get('size', '100')
        try:
            size = int(size)
            size = min(max(size, 40), 800)  # Clamp between 40 and 800
        except:
            size = 100
        
        # Resize image for performance
        try:
            img = Image.open(full_path)
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize maintaining aspect ratio
            img.thumbnail((size, size), Image.Resampling.LANCZOS)
            
            # Compress to JPEG with quality optimization
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            output.seek(0)
            
            # Return with cache headers
            response = Response(output.getvalue(), mimetype='image/jpeg')
            response.headers['Cache-Control'] = 'public, max-age=86400'  # Cache for 24 hours
            response.headers['ETag'] = f'"{employee_id}-{size}"'
            response.headers['Access-Control-Allow-Origin'] = '*'  # Allow CORS for images
            
            return response
            
        except Exception as e:
            current_app.logger.error(f"Image processing error: {str(e)}")
            # Fallback: return original image
            return send_file(full_path, mimetype='image/jpeg')
        
    except Exception as e:
        current_app.logger.error(f"Get photo error: {str(e)}")
        return not_found_response("Photo not found")


@employees_bp.route('/<int:employee_id>/deactivate', methods=['POST'])
@company_required
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
@company_required
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
@company_required
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


@employees_bp.route('/change-status', methods=['POST'])
@company_required
@hr_required
def change_employee_status():
    """
    Change employee status (single or bulk)
    Supports: ACTIVE, INACTIVE, RESIGNED
    
    Request body:
    {
        "employee_ids": [123, 456] or "123,456" or 123,
        "new_status": "INACTIVE",
        "reason": "Gone to hometown for festival"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        employee_ids = data.get('employee_ids')
        new_status = data.get('new_status')
        reason = data.get('reason')
        
        # Validate required fields
        if not employee_ids:
            return validation_error_response("employee_ids is required")
        
        if not new_status:
            return validation_error_response("new_status is required")
        
        if not reason:
            return validation_error_response("reason is required")
        
        # Validate status value
        valid_statuses = ['ACTIVE', 'INACTIVE', 'RESIGNED']
        if new_status not in valid_statuses:
            return validation_error_response(
                f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        # Get current user ID for audit
        from flask_jwt_extended import get_jwt_identity
        current_user_id = get_jwt_identity()
        
        result = EmployeeService.change_employee_status(
            employee_ids=employee_ids,
            new_status=new_status,
            reason=reason,
            changed_by_user_id=int(current_user_id)
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
        current_app.logger.error(f"Change status route error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response("Failed to change employee status", status_code=500)


@employees_bp.route('/by-status', methods=['GET'])
@company_required
@hr_required
def get_employees_by_status():
    """
    Get employees filtered by status
    
    Query params:
    - status: ACTIVE, INACTIVE, RESIGNED (optional - returns all if not specified)
    - worker_category: FACTORY, OFFICE, ALL (optional - defaults to ALL)
    """
    try:
        status = request.args.get('status')
        worker_category = request.args.get('worker_category', 'ALL')
        
        # Validate status if provided
        if status:
            valid_statuses = ['ACTIVE', 'INACTIVE', 'RESIGNED']
            if status not in valid_statuses:
                return validation_error_response(
                    f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                )
        
        result = EmployeeService.get_employees_by_status(
            status=status,
            worker_category=worker_category
        )
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"employees": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        current_app.logger.error(f"Get employees by status route error: {str(e)}")
        return error_response("Failed to retrieve employees", status_code=500)


@employees_bp.route('/<int:employee_id>/rehire', methods=['POST'])
@company_required
@hr_required
def rehire_employee(employee_id):
    """
    Rehire a resigned employee
    Keeps same employee_code for biometric device compatibility
    
    Request body:
    {
        "reason": "Rejoined after completing personal commitments"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        reason = data.get('reason')
        
        if not reason:
            return validation_error_response("reason is required")
        
        # Get current user ID for audit
        from flask_jwt_extended import get_jwt_identity
        current_user_id = get_jwt_identity()
        
        result = EmployeeService.rehire_employee(
            employee_id=employee_id,
            rehire_reason=reason,
            rehired_by_user_id=int(current_user_id)
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
        current_app.logger.error(f"Rehire employee route error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return error_response("Failed to rehire employee", status_code=500)


@employees_bp.route('/factory-exits', methods=['GET'])
@company_required
@hr_required
def get_factory_worker_exits():
    """
    Get factory worker exit records
    
    Query params:
    - exit_status: RESIGNED, REHIRED (optional - returns all if not specified)
    """
    try:
        exit_status = request.args.get('exit_status')
        
        # Validate exit_status if provided
        if exit_status:
            valid_statuses = ['RESIGNED', 'REHIRED']
            if exit_status not in valid_statuses:
                return validation_error_response(
                    f"Invalid exit_status. Must be one of: {', '.join(valid_statuses)}"
                )
        
        result = EmployeeService.get_factory_worker_exits(exit_status=exit_status)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"exits": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        current_app.logger.error(f"Get factory exits route error: {str(e)}")
        return error_response("Failed to retrieve factory worker exits", status_code=500)


@employees_bp.route('/company-policies', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_company_policies_for_employees():
    """Get company policies visible to current user based on their role"""
    try:
        from app.admin.service import AdminService
        from flask_jwt_extended import get_jwt
        import json
        
        # Get all policies
        result = AdminService.list_company_policies()
        
        if not result["success"]:
            return error_response(result["message"], status_code=500)
        
        all_policies = result["data"]
        claims = get_jwt()
        current_view = claims.get('current_view', 'EMPLOYEE')
        
        current_app.logger.info(f"Total policies from DB: {len(all_policies)}")
        current_app.logger.info(f"Current view: {current_view}")
        
        # Filter policies based on visibility and current view
        filtered_policies = []
        for policy in all_policies:
            current_app.logger.info(f"Policy: {policy.get('policy_title')}, Status: {policy.get('policy_status')}, Visibility: {policy.get('visibility_settings')}")
            
            # Check if policy is active (policy_status should be 'Active')
            if policy.get('policy_status') != 'Active':
                current_app.logger.info(f"  -> Skipped: Not active (status={policy.get('policy_status')})")
                continue
                
            visibility = policy.get('visibility_settings', '')
            
            # Parse visibility - it's stored as JSON string
            visible_roles = []
            if isinstance(visibility, str):
                try:
                    # Try to parse as JSON first
                    visible_roles = json.loads(visibility)
                except:
                    # Fallback to comma-separated
                    visible_roles = [v.strip() for v in visibility.split(',')]
            elif isinstance(visibility, list):
                visible_roles = visibility
            
            current_app.logger.info(f"  -> Visible roles (parsed): {visible_roles}")
            
            # Check if current view is in visible roles (case-insensitive)
            visible_roles_upper = [v.upper() for v in visible_roles]
            if current_view.upper() in visible_roles_upper:
                # Rename fields to match frontend expectations
                policy['category'] = policy.get('policy_category')
                policy['description'] = policy.get('policy_description')
                policy['is_active'] = policy.get('policy_status') == 'Active'
                policy['visibility'] = visibility
                filtered_policies.append(policy)
                current_app.logger.info(f"  -> INCLUDED")
            else:
                current_app.logger.info(f"  -> Skipped: {current_view.upper()} not in {visible_roles_upper}")
        
        current_app.logger.info(f"Filtered policies count: {len(filtered_policies)}")
        
        return success_response(
            message="Company policies retrieved successfully",
            data={"policies": filtered_policies}
        )
        
    except Exception as e:
        current_app.logger.error(f"Get company policies error: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return error_response("Failed to retrieve company policies", status_code=500)