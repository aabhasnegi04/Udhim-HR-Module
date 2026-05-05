from flask import jsonify


def success_response(message="Success", data=None):
    """Standard success response format"""
    return jsonify({
        "success": True,
        "message": message,
        "data": data if data is not None else {}
    })


def error_response(message="An error occurred", data=None, status_code=400):
    """Standard error response format"""
    response = jsonify({
        "success": False,
        "message": message,
        "data": data
    })
    response.status_code = status_code
    return response


def unauthorized_response(message="Unauthorized access"):
    """Standard unauthorized response"""
    return error_response(message, status_code=401)


def forbidden_response(message="Insufficient permissions"):
    """Standard forbidden response"""
    return error_response(message, status_code=403)


def not_found_response(message="Resource not found"):
    """Standard not found response"""
    return error_response(message, status_code=404)


def validation_error_response(message="Validation failed", errors=None):
    """Standard validation error response"""
    return error_response(message, data={"errors": errors or []}, status_code=422)