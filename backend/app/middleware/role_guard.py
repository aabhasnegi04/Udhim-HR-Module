from functools import wraps
from flask import current_app, request
from flask_jwt_extended import get_jwt
from app.utils.response import forbidden_response, error_response
from app.middleware.jwt_required import jwt_required


def role_required(*allowed_roles):
    """Role-based access control decorator with profile switching support"""
    def decorator(f):
        @wraps(f)
        @jwt_required
        def decorated_function(*args, **kwargs):
            try:
                # Get role from JWT claims
                claims = get_jwt()
                user_role = claims.get("role")
                
                if not user_role:
                    current_app.logger.warning("JWT token missing role claim")
                    return forbidden_response("No role assigned")
                
                # Check for profile switching context
                current_view = request.headers.get('X-Current-View', 'EMPLOYEE')
                
                # Determine effective role based on current view and user's actual role
                effective_role = get_effective_role(user_role, current_view)
                
                if effective_role not in allowed_roles:
                    current_app.logger.warning(f"Access denied for role '{user_role}' in view '{current_view}' (effective: '{effective_role}'). Required: {allowed_roles}")
                    return forbidden_response(f"Access denied. Required roles: {', '.join(allowed_roles)}")
                
                return f(*args, **kwargs)
            except Exception as e:
                current_app.logger.error(f"Role validation error: {str(e)}")
                # Return 500 instead of 403 for actual errors
                return error_response("Role validation failed", status_code=500)
        
        return decorated_function
    return decorator


def get_effective_role(user_role, current_view):
    """
    Determine the effective role based on user's actual role and current view
    
    Args:
        user_role (str): User's actual role from JWT (HR, MANAGER, EMPLOYEE)
        current_view (str): Current profile view (EMPLOYEE, HR, MANAGER)
    
    Returns:
        str: Effective role for permission checking
    """
    # If user is in Employee view, they get Employee permissions regardless of actual role
    if current_view == 'EMPLOYEE':
        return 'EMPLOYEE'
    
    # If user is in HR view, they need HR role to access HR functions
    if current_view == 'HR':
        return user_role if user_role == 'HR' else 'EMPLOYEE'
    
    # If user is in Manager view, they need Manager role to access Manager functions
    if current_view == 'MANAGER':
        return user_role if user_role == 'MANAGER' else 'EMPLOYEE'
    
    # Default to user's actual role
    return user_role


# Convenience decorators for common roles
def hr_required(f):
    """Require HR role"""
    return role_required("HR")(f)


def manager_required(f):
    """Require Manager role"""
    return role_required("MANAGER")(f)


def employee_required(f):
    """Require Employee role"""
    return role_required("EMPLOYEE")(f)


def hr_or_manager_required(f):
    """Require HR or Manager role"""
    return role_required("HR", "MANAGER")(f)