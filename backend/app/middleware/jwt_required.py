from functools import wraps
from flask import current_app
from flask_jwt_extended import jwt_required as flask_jwt_required, get_jwt_identity, get_jwt
from app.utils.response import unauthorized_response, error_response


def jwt_required(f):
    """JWT token validation middleware"""
    @wraps(f)
    @flask_jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            # Get current user identity from JWT
            current_user_id = get_jwt_identity()
            if not current_user_id:
                current_app.logger.warning("JWT token missing user identity")
                return unauthorized_response("Invalid token")
            
            return f(*args, **kwargs)
        except Exception as e:
            current_app.logger.error(f"JWT validation error: {str(e)}")
            return error_response("Token validation failed", status_code=500)
    
    return decorated_function


def get_current_user():
    """Get current user info from JWT token"""
    try:
        claims = get_jwt()
        return {
            "user_id": get_jwt_identity(),
            "role": claims.get("role"),
            "email": claims.get("email")
        }
    except Exception:
        return None