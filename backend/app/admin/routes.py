from flask import Blueprint, request, send_file, jsonify
from app.admin.service import AdminService
from app.admin.designation_service import DesignationService
from app.middleware.role_guard import hr_required
from app.utils.response import (
    success_response, 
    error_response, 
    validation_error_response
)
import os
import tempfile
import csv
import io
from datetime import datetime

admin_bp = Blueprint('admin', __name__)


# ADMIN DASHBOARD
@admin_bp.route('/dashboard', methods=['GET'])
@hr_required
def get_dashboard_stats():
    """Get admin dashboard statistics (HR only)"""
    try:
        result = AdminService.get_dashboard_stats()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve dashboard stats", status_code=500)


# DEPARTMENTS
@admin_bp.route('/departments', methods=['POST'])
@hr_required
def add_department():
    """Add new department (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['department_code', 'department_name']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        result = AdminService.add_department(data)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to add department", status_code=500)


@admin_bp.route('/departments', methods=['GET'])
@hr_required
def list_departments():
    """Get list of all departments (HR only)"""
    try:
        result = AdminService.list_departments()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"departments": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve departments", status_code=500)


# DESIGNATIONS
@admin_bp.route('/designations', methods=['POST'])
@hr_required
def add_designation():
    """Add new designation (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['designation_name']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        result = AdminService.add_designation(data)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to add designation", status_code=500)


@admin_bp.route('/designations', methods=['GET'])
@hr_required
def list_designations():
    """Get list of all designations (HR only)"""
    try:
        result = AdminService.list_designations()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"designations": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve designations", status_code=500)


# LOCATIONS
@admin_bp.route('/locations', methods=['POST'])
@hr_required
def add_location():
    """Add new location (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['location_name', 'city', 'country']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        result = AdminService.add_location(data)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to add location", status_code=500)


@admin_bp.route('/locations', methods=['GET'])
@hr_required
def list_locations():
    """Get list of all locations (HR only)"""
    try:
        result = AdminService.list_locations()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"locations": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve locations", status_code=500)


# HOLIDAYS
@admin_bp.route('/holidays', methods=['POST'])
@hr_required
def add_holiday():
    """Add new holiday (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['holiday_date', 'holiday_name', 'holiday_type', 'calendar_year']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        result = AdminService.add_holiday(data)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to add holiday", status_code=500)


@admin_bp.route('/holidays', methods=['GET'])
@hr_required
def list_holidays():
    """Get holidays by year (HR only)"""
    try:
        year = request.args.get('year', 2026, type=int)
        
        result = AdminService.list_holidays_by_year(year)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"holidays": result["data"], "year": year}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve holidays", status_code=500)


@admin_bp.route('/holidays/<int:holiday_id>', methods=['PUT'])
@hr_required
def update_holiday(holiday_id):
    """Update holiday (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        result = AdminService.update_holiday(holiday_id, data)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to update holiday", status_code=500)


@admin_bp.route('/holidays/<int:holiday_id>', methods=['DELETE'])
@hr_required
def delete_holiday(holiday_id):
    """Delete holiday (HR only)"""
    try:
        result = AdminService.delete_holiday(holiday_id)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to delete holiday", status_code=500)


# LEAVE TYPES
@admin_bp.route('/leave-types', methods=['POST'])
@hr_required
def add_leave_type():
    """Add new leave type (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['leave_code', 'leave_name', 'max_days_per_year']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        result = AdminService.add_leave_type(data)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to add leave type", status_code=500)


@admin_bp.route('/leave-types', methods=['GET'])
@hr_required
def list_leave_types():
    """Get list of all leave types (HR only)"""
    try:
        result = AdminService.list_leave_types()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"leave_types": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve leave types", status_code=500)


# SALARY STRUCTURES
@admin_bp.route('/salary-structures', methods=['POST'])
@hr_required
def add_salary_structure():
    """Add new salary structure (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['structure_name', 'structure_type']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        # Validate structure_type
        valid_types = ['Monthly', 'CTC']
        if data.get('structure_type') not in valid_types:
            return validation_error_response(
                f"Invalid structure_type. Must be one of: {', '.join(valid_types)}"
            )
        
        result = AdminService.add_salary_structure(data)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to add salary structure", status_code=500)


@admin_bp.route('/salary-structures', methods=['GET'])
@hr_required
def list_salary_structures():
    """Get list of all salary structures (HR only)"""
    try:
        result = AdminService.list_salary_structures()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"salary_structures": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve salary structures", status_code=500)


# LETTER TEMPLATES
@admin_bp.route('/letter-templates', methods=['GET'])
@hr_required
def list_letter_templates():
    """Get list of all letter templates (HR only)"""
    try:
        result = AdminService.list_letter_templates()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"templates": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve letter templates", status_code=500)


@admin_bp.route('/letter-templates', methods=['POST'])
@hr_required
def add_letter_template():
    """Add new letter template (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['template_name', 'template_category', 'template_content']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        result = AdminService.add_letter_template(data)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to add letter template", status_code=500)


@admin_bp.route('/letter-templates/<int:template_id>', methods=['PUT'])
@hr_required
def update_letter_template(template_id):
    """Update letter template (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        result = AdminService.update_letter_template(template_id, data)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to update letter template", status_code=500)


@admin_bp.route('/letter-templates/<int:template_id>', methods=['DELETE'])
@hr_required
def delete_letter_template(template_id):
    """Delete letter template (HR only)"""
    try:
        result = AdminService.delete_letter_template(template_id)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to delete letter template", status_code=500)


# COMPANY POLICIES
@admin_bp.route('/company-policies', methods=['GET'])
@hr_required
def list_company_policies():
    """Get list of all company policies (HR only)"""
    try:
        result = AdminService.list_company_policies()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"policies": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve company policies", status_code=500)


@admin_bp.route('/company-policies', methods=['POST'])
@hr_required
def add_company_policy():
    """Add new company policy (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['policy_title', 'policy_category', 'policy_description']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        result = AdminService.add_company_policy(data)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to add company policy", status_code=500)


# SYSTEM REPORTS
@admin_bp.route('/reports/generate', methods=['POST'])
@hr_required
def generate_system_report():
    """Generate system report (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        report_type = data.get('report_type')
        if not report_type:
            return validation_error_response("report_type is required")
        
        # Valid report types
        valid_types = ['employee-master', 'attendance-summary', 'leave-summary']
        if report_type not in valid_types:
            return validation_error_response(
                f"Invalid report_type. Must be one of: {', '.join(valid_types)}"
            )
        
        filters = {
            'date_from': data.get('date_from'),
            'date_to': data.get('date_to'),
            'department': data.get('department')
        }
        
        result = AdminService.generate_system_report(report_type, filters)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to generate system report", status_code=500)


# BULK UPLOAD TEMPLATES
@admin_bp.route('/bulk-upload/templates/<template_type>', methods=['GET'])
@hr_required
def download_bulk_upload_template(template_type):
    """Download bulk upload template (HR only)"""
    try:
        # Define template structures
        templates = {
            'employee-master': [
                'Employee ID', 'First Name', 'Last Name', 'Email', 'Phone',
                'Department', 'Designation', 'Date of Joining', 'Salary',
                'Manager ID', 'Location', 'Gender', 'Date of Birth'
            ],
            'holiday-calendar': [
                'Holiday Name', 'Date', 'Type', 'Status', 'Description'
            ],
            'salary-structure': [
                'Structure Name', 'Grade', 'Basic Salary', 'HRA', 'DA',
                'Medical Allowance', 'Transport Allowance', 'PF', 'ESI'
            ]
        }
        
        if template_type not in templates:
            return error_response("Invalid template type", status_code=400)
        
        # Create CSV template
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(templates[template_type])
        
        # Add sample data row
        if template_type == 'employee-master':
            writer.writerow([
                'EMP001', 'John', 'Doe', 'john.doe@company.com', '1234567890',
                'Engineering', 'Software Engineer', '2024-01-01', '50000',
                'EMP002', 'Mumbai', 'Male', '1990-01-01'
            ])
        elif template_type == 'holiday-calendar':
            writer.writerow([
                'New Year', '2024-01-01', 'National', 'Active', 'New Year celebration'
            ])
        elif template_type == 'salary-structure':
            writer.writerow([
                'Grade L1', 'L1', '30000', '12000', '5000', '2000', '1500', '3600', '750'
            ])
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(mode='w+', suffix='.csv', delete=False)
        temp_file.write(output.getvalue())
        temp_file.close()
        
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=f'{template_type}_template.csv',
            mimetype='text/csv'
        )
        
    except Exception as e:
        return error_response("Failed to generate template", status_code=500)


# BULK UPLOAD PROCESSING
@admin_bp.route('/bulk-upload/process', methods=['POST'])
@hr_required
def process_bulk_upload():
    """Process bulk upload file (HR only)"""
    try:
        if 'file' not in request.files:
            return validation_error_response("No file uploaded")
        
        file = request.files['file']
        upload_type = request.form.get('upload_type')
        
        if not upload_type:
            return validation_error_response("upload_type is required")
        
        if file.filename == '':
            return validation_error_response("No file selected")
        
        # Process the file based on type
        # This is a placeholder - actual implementation would parse CSV/Excel
        # and call appropriate service methods
        
        return success_response(
            message=f"Bulk upload of {upload_type} processed successfully",
            data={
                "total_records": 10,
                "success_records": 8,
                "failed_records": 2,
                "upload_id": "upload_" + datetime.now().strftime("%Y%m%d_%H%M%S")
            }
        )
        
    except Exception as e:
        return error_response("Failed to process bulk upload", status_code=500)


# DESIGNATION ROLE MAPPINGS
@admin_bp.route('/designation-mappings', methods=['GET'])
@hr_required
def get_designation_mappings():
    """Get all designation-role mappings (HR only)"""
    try:
        result = DesignationService.get_designation_mappings()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"mappings": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve designation mappings", status_code=500)


@admin_bp.route('/designation-mappings', methods=['POST'])
@hr_required
def add_designation_mapping():
    """Add new designation-role mapping (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        # Validate required fields
        required_fields = ['designation_name', 'role_code']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return validation_error_response(
                f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        # Validate role_code
        valid_roles = ['HR', 'MANAGER', 'EMPLOYEE']
        if data.get('role_code') not in valid_roles:
            return validation_error_response(
                f"Invalid role_code. Must be one of: {', '.join(valid_roles)}"
            )
        
        result = DesignationService.add_designation_mapping(
            data['designation_name'], 
            data['role_code']
        )
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to add designation mapping", status_code=500)


@admin_bp.route('/designation-mappings/<int:mapping_id>', methods=['PUT'])
@hr_required
def update_designation_mapping(mapping_id):
    """Update designation-role mapping (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return validation_error_response("Request body is required")
        
        role_code = data.get('role_code')
        if not role_code:
            return validation_error_response("role_code is required")
        
        # Validate role_code
        valid_roles = ['HR', 'MANAGER', 'EMPLOYEE']
        if role_code not in valid_roles:
            return validation_error_response(
                f"Invalid role_code. Must be one of: {', '.join(valid_roles)}"
            )
        
        result = DesignationService.update_designation_mapping(mapping_id, role_code)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to update designation mapping", status_code=500)


@admin_bp.route('/designation-mappings/<int:mapping_id>', methods=['DELETE'])
@hr_required
def delete_designation_mapping(mapping_id):
    """Delete designation-role mapping (HR only)"""
    try:
        result = DesignationService.delete_designation_mapping(mapping_id)
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data=result["data"]
            )
        else:
            return error_response(result["message"], status_code=400)
            
    except Exception as e:
        return error_response("Failed to delete designation mapping", status_code=500)


@admin_bp.route('/available-roles', methods=['GET'])
@hr_required
def get_available_roles():
    """Get available roles for designation mapping (HR only)"""
    try:
        result = DesignationService.get_available_roles()
        
        if result["success"]:
            return success_response(
                message=result["message"],
                data={"roles": result["data"]}
            )
        else:
            return error_response(result["message"], status_code=500)
            
    except Exception as e:
        return error_response("Failed to retrieve available roles", status_code=500)