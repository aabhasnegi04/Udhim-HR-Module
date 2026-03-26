"""
Company Context Middleware
Extracts company_code from request and injects it into the request context
"""

from functools import wraps
from flask import request, g, current_app
from app.utils.response import error_response, unauthorized_response
from app.database.master_db import master_db


def company_required(f):
    """
    Middleware to extract and validate company context from request
    
    Expects company_code in:
    1. Request header: X-Company-Code
    2. Request JSON body: company_code
    3. Query parameter: company_code
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Extract company_code from various sources
            company_code = None
            
            # Priority 1: Header
            company_code = request.headers.get('X-Company-Code')
            
            # Priority 2: JSON body
            if not company_code and request.is_json:
                company_code = request.json.get('company_code')
            
            # Priority 3: Query parameter
            if not company_code:
                company_code = request.args.get('company_code')
            
            # Priority 4: Form data
            if not company_code and request.form:
                company_code = request.form.get('company_code')
            
            if not company_code:
                current_app.logger.warning("Company code not provided in request")
                return error_response("Company code is required", status_code=400)
            
            # Validate company exists and is active
            company_info = master_db.get_company_connection_info(company_code)
            
            if not company_info:
                current_app.logger.warning(f"Company not found or inactive: {company_code}")
                return unauthorized_response("Invalid or inactive company")
            
            # Store company context in Flask's g object
            g.company_code = company_code
            g.company_id = company_info.get('company_id')
            g.company_name = company_info.get('company_name')
            g.company_info = company_info
            
            current_app.logger.debug(f"Company context set: {company_code}")
            
            return f(*args, **kwargs)
            
        except Exception as e:
            current_app.logger.error(f"Company context error: {str(e)}")
            return error_response("Failed to validate company context", status_code=500)
    
    return decorated_function


def get_company_context():
    """
    Get current company context from Flask g object
    
    Returns:
        dict: Company context with company_code, company_id, company_name
    """
    return {
        'company_code': getattr(g, 'company_code', None),
        'company_id': getattr(g, 'company_id', None),
        'company_name': getattr(g, 'company_name', None),
        'company_info': getattr(g, 'company_info', None)
    }


def get_company_code():
    """Get current company code from context"""
    return getattr(g, 'company_code', None)


def get_company_id():
    """Get current company ID from context"""
    return getattr(g, 'company_id', None)
