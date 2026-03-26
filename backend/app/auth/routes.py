from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from app.auth.multi_tenant_auth_service import MultiTenantAuthService
from app.middleware.company_context import company_required
from app.middleware.multi_tenant_jwt import multi_tenant_jwt_required, get_current_user
from app.utils.response import (
    success_response, 
    error_response, 
    validation_error_response,
    unauthorized_response
)
from app.utils.email_service import EmailService
import random
import string
import bcrypt

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
@company_required
def login():
    """Multi-tenant user login endpoint"""
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        email = data.get('email', '').strip()
        password = data.get('password', '')
        company_code = data.get('company_code') or request.headers.get('X-Company-Code')
        
        if not email:
            return validation_error_response("Email is required")
        
        if not password:
            return validation_error_response("Password is required")
        
        if not company_code:
            return validation_error_response("Company code is required")
        
        # Authenticate user with company context
        auth_result = MultiTenantAuthService.authenticate_user(email, password, company_code)
        
        if not auth_result["success"]:
            return unauthorized_response(auth_result["message"])
        
        return success_response(
            message="Login successful",
            data=auth_result["data"]
        )
        
    except Exception as e:
        return error_response("Login failed", status_code=500)


@auth_bp.route('/me', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_current_user_info():
    """Get current user information"""
    try:
        # Get user ID from JWT
        user_id = get_jwt_identity()
        
        if not user_id:
            return unauthorized_response("Invalid token")
        
        # Get user details from database
        user_data = MultiTenantAuthService.get_user_by_id(user_id)
        
        if not user_data:
            return error_response("User not found", status_code=404)
        
        # Get additional info from JWT claims
        current_user = get_current_user()
        
        return success_response(
            message="User information retrieved",
            data={
                "user": {
                    "user_id": user_data.get("user_id"),
                    "email": user_data.get("email"),
                    "role": current_user.get("role"),
                    "role_name": user_data.get("role_name"),
                    "company_code": current_user.get("company_code")
                }
            }
        )
        
    except Exception as e:
        return error_response("Failed to get user information", status_code=500)


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """User logout endpoint (optional - JWT is stateless)"""
    try:
        # In a stateless JWT system, logout is handled client-side
        # by removing the token. This endpoint is for consistency.
        # No authentication required since we're just clearing client-side token
        
        return success_response(
            message="Logout successful",
            data={"message": "Token should be removed from client storage"}
        )
        
    except Exception as e:
        return error_response("Logout failed", status_code=500)


@auth_bp.route('/change-password', methods=['POST'])
@company_required
@multi_tenant_jwt_required
def change_password():
    """Change user password endpoint"""
    try:
        # Get user ID from JWT
        user_id = get_jwt_identity()
        
        if not user_id:
            return unauthorized_response("Invalid token")
        
        # Get request data
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')
        
        if not current_password:
            return validation_error_response("Current password is required")
        
        if not new_password:
            return validation_error_response("New password is required")
        
        if not confirm_password:
            return validation_error_response("Password confirmation is required")
        
        if new_password != confirm_password:
            return validation_error_response("New password and confirmation do not match")
        
        if len(new_password) < 6:
            return validation_error_response("New password must be at least 6 characters long")
        
        # Change password
        result = MultiTenantAuthService.change_password(user_id, current_password, new_password)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=None
            )
        else:
            return error_response(result["message"], status_code=400)
        
    except Exception as e:
        return error_response("Password change failed", status_code=500)


@auth_bp.route('/forgot-password', methods=['POST'])
@company_required
def forgot_password():
    """Request password reset code"""
    try:
        from app.database.multi_tenant_executor import MultiTenantExecutor
        from flask import current_app
        
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        email = data.get('email', '').strip().lower()
        
        if not email:
            return validation_error_response("Email is required")
        
        # Generate 6-digit code
        reset_code = ''.join(random.choices(string.digits, k=6))
        
        # Create reset code in database
        result = MultiTenantExecutor.execute_procedure(
            'proc_create_password_reset_code',
            {
                'email': email,
                'reset_code': reset_code,
                'expiry_minutes': 15
            }
        )
        
        current_app.logger.info(f"Procedure result: {result}")
        
        # Check if procedure execution was successful
        if not result or not result.get('success'):
            return error_response("Database error", status_code=500)
        
        # Check the stored procedure result
        proc_result = result.get('data', [])
        if not proc_result or not proc_result[0].get('success'):
            message = proc_result[0].get('message', 'No account exists with this email address') if proc_result else 'No account exists with this email address'
            return error_response(message, status_code=404)
        
        # Send email
        email_result = EmailService.send_password_reset_email(email, reset_code, "Udhim HRMS")
        
        if not email_result['success']:
            current_app.logger.error(f"Email sending failed: {email_result.get('message')}")
            return error_response("Failed to send reset code email", status_code=500)
        
        return success_response(
            message="Password reset code sent to your email",
            data={"email": email}
        )
        
    except Exception as e:
        from flask import current_app
        current_app.logger.error(f"Forgot password error: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return error_response(f"Failed to process request: {str(e)}", status_code=500)


@auth_bp.route('/verify-reset-code', methods=['POST'])
@company_required
def verify_reset_code():
    """Verify password reset code"""
    try:
        from app.database.multi_tenant_executor import MultiTenantExecutor
        from flask import current_app
        
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        email = data.get('email', '').strip().lower()
        reset_code = data.get('code', '').strip()
        
        if not email:
            return validation_error_response("Email is required")
        
        if not reset_code:
            return validation_error_response("Reset code is required")
        
        # Verify code
        result = MultiTenantExecutor.execute_procedure(
            'proc_verify_reset_code',
            {
                'email': email,
                'reset_code': reset_code
            }
        )
        
        # Check if procedure execution was successful
        if not result or not result.get('success'):
            return error_response("Database error", status_code=500)
        
        # Check the stored procedure result
        proc_result = result.get('data', [])
        if not proc_result or not proc_result[0].get('success'):
            message = proc_result[0].get('message', 'Invalid or expired reset code') if proc_result else 'Invalid or expired reset code'
            return error_response(message, status_code=400)
        
        return success_response(
            message="Code verified successfully",
            data={"email": email, "code": reset_code}
        )
        
    except Exception as e:
        from flask import current_app
        current_app.logger.error(f"Verify reset code error: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return error_response(f"Failed to verify code: {str(e)}", status_code=500)


@auth_bp.route('/reset-password', methods=['POST'])
@company_required
def reset_password():
    """Reset password with verified code"""
    try:
        from app.database.multi_tenant_executor import MultiTenantExecutor
        from flask import current_app
        
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        email = data.get('email', '').strip().lower()
        reset_code = data.get('code', '').strip()
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')
        
        if not email:
            return validation_error_response("Email is required")
        
        if not reset_code:
            return validation_error_response("Reset code is required")
        
        if not new_password:
            return validation_error_response("New password is required")
        
        if not confirm_password:
            return validation_error_response("Password confirmation is required")
        
        if new_password != confirm_password:
            return validation_error_response("Passwords do not match")
        
        if len(new_password) < 6:
            return validation_error_response("Password must be at least 6 characters long")
        
        # Hash the new password using bcrypt (same as authentication service)
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Reset password
        result = MultiTenantExecutor.execute_procedure(
            'proc_reset_password_with_code',
            {
                'email': email,
                'reset_code': reset_code,
                'new_password_hash': password_hash
            }
        )
        
        # Check if procedure execution was successful
        if not result or not result.get('success'):
            return error_response("Database error", status_code=500)
        
        # Check the stored procedure result
        proc_result = result.get('data', [])
        if not proc_result or not proc_result[0].get('success'):
            message = proc_result[0].get('message', 'Failed to reset password') if proc_result else 'Failed to reset password'
            return error_response(message, status_code=400)
        
        return success_response(
            message="Password reset successfully. You can now login with your new password.",
            data=None
        )
        
    except Exception as e:
        from flask import current_app
        current_app.logger.error(f"Reset password error: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return error_response(f"Failed to reset password: {str(e)}", status_code=500)
