from functools import wraps
from flask import current_app
from flask_jwt_extended import get_jwt
from app.utils.response import error_response


def active_employee_required(f):
    """Middleware to check if employee is active"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Get JWT claims
            claims = get_jwt()
            employee_status = claims.get("employee_status", "ACTIVE")
            user_role = claims.get("role")
            
            # HR users can always access (they manage employee status)
            if user_role == "HR":
                return f(*args, **kwargs)
            
            # Check if employee is active
            if employee_status != "ACTIVE":
                current_app.logger.warning(f"Inactive employee attempted restricted action: {claims.get('email')}")
                return error_response(
                    "Access denied. Your employee account is inactive. Please contact HR for assistance.",
                    status_code=403
                )
            
            return f(*args, **kwargs)
            
        except Exception as e:
            current_app.logger.error(f"Active employee check error: {str(e)}")
            return error_response("Access validation failed", status_code=500)
    
    return decorated_function