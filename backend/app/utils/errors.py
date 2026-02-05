from flask import current_app
from flask_jwt_extended.exceptions import JWTExtendedException
from app.utils.response import error_response, unauthorized_response


def register_error_handlers(app):
    """Register global error handlers"""
    
    @app.errorhandler(400)
    def bad_request(error):
        return error_response("Bad request", status_code=400)
    
    @app.errorhandler(401)
    def unauthorized(error):
        return unauthorized_response("Authentication required")
    
    @app.errorhandler(403)
    def forbidden(error):
        return error_response("Access forbidden", status_code=403)
    
    @app.errorhandler(404)
    def not_found(error):
        return error_response("Resource not found", status_code=404)
    
    @app.errorhandler(500)
    def internal_error(error):
        current_app.logger.error(f"Internal server error: {str(error)}")
        return error_response("Internal server error", status_code=500)
    
    @app.errorhandler(JWTExtendedException)
    def jwt_exception_handler(error):
        return unauthorized_response(f"JWT Error: {str(error)}")
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        current_app.logger.error(f"Unhandled exception: {str(error)}")
        return error_response("An unexpected error occurred", status_code=500)