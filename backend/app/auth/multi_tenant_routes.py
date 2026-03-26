"""
Multi-Tenant Authentication Routes
Handles login with company context
"""

from flask import Blueprint, request, current_app
from app.auth.multi_tenant_auth_service import MultiTenantAuthService
from app.middleware.company_context import company_required
from app.middleware.multi_tenant_jwt import multi_tenant_jwt_required, get_current_user
from app.utils.response import success_response, error_response, unauthorized_response

# Create blueprint
multi_tenant_auth_bp = Blueprint('multi_tenant_auth', __name__, url_prefix='/api/auth')


@multi_tenant_auth_bp.route('/login', methods=['POST'])
@company_required
def login():
    """
    Multi-tenant login endpoint
    
    Expects:
    - company_code: In header (X-Company-Code) or body
    - email: User email
    - password: User password
    """
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", status_code=400)
        
        email = data.get('email')
        password = data.get('password')
        company_code = data.get('company_code') or request.headers.get('X-Company-Code')
        
        # Validate required fields
        if not email or not password:
            return error_response("Email and password are required", status_code=400)
        
        if not company_code:
            return error_response("Company code is required", status_code=400)
        
        # Authenticate user
        result = MultiTenantAuthService.authenticate_user(email, password, company_code)
        
        if result["success"]:
            return success_response(
                data=result["data"],
                message=result["message"]
            )
        else:
            return unauthorized_response(result["message"])
            
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return error_response("Login failed", status_code=500)


@multi_tenant_auth_bp.route('/me', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_current_user_info():
    """Get current user information"""
    try:
        user_info = get_current_user()
        
        if not user_info:
            return unauthorized_response("User not found")
        
        return success_response(
            data=user_info,
            message="User information retrieved"
        )
        
    except Exception as e:
        current_app.logger.error(f"Get user info error: {str(e)}")
        return error_response("Failed to get user information", status_code=500)


@multi_tenant_auth_bp.route('/change-password', methods=['POST'])
@company_required
@multi_tenant_jwt_required
def change_password():
    """Change user password"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", status_code=400)
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return error_response("Current and new passwords are required", status_code=400)
        
        # Get current user ID from JWT
        user_info = get_current_user()
        user_id = user_info.get('user_id')
        
        if not user_id:
            return unauthorized_response("User not authenticated")
        
        # Change password
        result = MultiTenantAuthService.change_password(user_id, current_password, new_password)
        
        if result["success"]:
            return success_response(
                data=None,
                message=result["message"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        current_app.logger.error(f"Change password error: {str(e)}")
        return error_response("Failed to change password", status_code=500)


@multi_tenant_auth_bp.route('/validate-token', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def validate_token():
    """Validate JWT token"""
    try:
        user_info = get_current_user()
        
        return success_response(
            data={
                "valid": True,
                "user": user_info
            },
            message="Token is valid"
        )
        
    except Exception as e:
        current_app.logger.error(f"Token validation error: {str(e)}")
        return unauthorized_response("Invalid token")
