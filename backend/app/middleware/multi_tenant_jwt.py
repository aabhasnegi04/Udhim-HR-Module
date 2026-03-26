"""
Multi-Tenant JWT Middleware
Validates JWT tokens and ensures company context matches
"""

from functools import wraps
from flask import current_app, g
from flask_jwt_extended import jwt_required as flask_jwt_required, get_jwt_identity, get_jwt
from app.utils.response import unauthorized_response, error_response


def multi_tenant_jwt_required(f):
    """
    JWT validation with company context verification
    
    Validates:
    1. JWT token is valid
    2. Company code in JWT matches company code in request context
    """
    @wraps(f)
    @flask_jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            # Get current user identity from JWT
            current_user_id = get_jwt_identity()
            if not current_user_id:
                current_app.logger.warning("JWT token missing user identity")
                return unauthorized_response("Invalid token")
            
            # Get JWT claims
            claims = get_jwt()
            token_company_code = claims.get("company_code")
            
            # Get company code from request context (set by company_required middleware)
            request_company_code = getattr(g, 'company_code', None)
            
            # Verify company codes match
            if token_company_code and request_company_code:
                if token_company_code != request_company_code:
                    current_app.logger.warning(
                        f"Company mismatch: token={token_company_code}, request={request_company_code}"
                    )
                    return unauthorized_response("Company context mismatch")
            
            # Store user info in g for easy access
            g.current_user_id = current_user_id
            g.current_user_role = claims.get("role")
            g.current_user_email = claims.get("email")
            g.current_employee_id = claims.get("employee_id")
            
            return f(*args, **kwargs)
            
        except Exception as e:
            current_app.logger.error(f"JWT validation error: {str(e)}")
            return error_response("Token validation failed", status_code=500)
    
    return decorated_function


def get_current_user():
    """Get current user info from JWT token and context"""
    try:
        claims = get_jwt()
        return {
            "user_id": get_jwt_identity(),
            "role": claims.get("role"),
            "email": claims.get("email"),
            "employee_id": claims.get("employee_id"),
            "company_code": claims.get("company_code"),
            "user_is_active": claims.get("user_is_active"),
            "employee_status": claims.get("employee_status")
        }
    except Exception:
        return None


def get_current_user_id():
    """Get current user ID from context"""
    return getattr(g, 'current_user_id', None)


def get_current_employee_id():
    """Get current employee ID from context"""
    return getattr(g, 'current_employee_id', None)


def get_current_user_role():
    """Get current user role from context"""
    return getattr(g, 'current_user_role', None)
