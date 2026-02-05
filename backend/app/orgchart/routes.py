from flask import Blueprint
from app.orgchart.service import OrgChartService
from app.middleware.jwt_required import jwt_required
from app.utils.response import success_response, error_response

orgchart_bp = Blueprint('orgchart', __name__)


@orgchart_bp.route('/hierarchy', methods=['GET'])
@jwt_required
def get_organization_hierarchy():
    """Get complete organization hierarchy"""
    try:
        result = OrgChartService.get_organization_hierarchy()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"employees": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve organization hierarchy", status_code=500)


@orgchart_bp.route('/search', methods=['GET'])
@jwt_required
def search_employees():
    """Search employees in organization"""
    try:
        from flask import request
        search_term = request.args.get('q', '')
        
        if not search_term:
            return error_response("Search term is required", status_code=400)
        
        result = OrgChartService.search_employees(search_term)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"employees": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to search employees", status_code=500)
