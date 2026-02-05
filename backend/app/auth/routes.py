from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from app.auth.service import AuthService
from app.middleware.jwt_required import jwt_required, get_current_user
from app.utils.response import (
    success_response, 
    error_response, 
    validation_error_response,
    unauthorized_response
)

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        email = data.get('email', '').strip()
        password = data.get('password', '')
        role = data.get('role', '').strip()
        
        if not email:
            return validation_error_response("Email is required")
        
        if not password:
            return validation_error_response("Password is required")
        
        if not role:
            return validation_error_response("Role is required")
        
        if role not in ['HR', 'MANAGER', 'EMPLOYEE']:
            return validation_error_response("Invalid role. Must be HR, MANAGER, or EMPLOYEE")
        
        # Authenticate user (role is optional now since it's stored in DB)
        auth_result = AuthService.authenticate_user(email, password)
        
        if not auth_result["success"]:
            return unauthorized_response(auth_result["message"])
        
        return success_response(
            message="Login successful",
            data=auth_result["data"]
        )
        
    except Exception as e:
        return error_response("Login failed", status_code=500)


@auth_bp.route('/me', methods=['GET'])
@jwt_required
def get_current_user_info():
    """Get current user information"""
    try:
        # Get user ID from JWT
        user_id = get_jwt_identity()
        
        if not user_id:
            return unauthorized_response("Invalid token")
        
        # Get user details from database
        user_data = AuthService.get_user_by_id(user_id)
        
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
                    "role_name": user_data.get("role_name")
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
@jwt_required
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
        result = AuthService.change_password(user_id, current_password, new_password)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=None
            )
        else:
            return error_response(result["message"], status_code=400)
        
    except Exception as e:
        return error_response("Password change failed", status_code=500)