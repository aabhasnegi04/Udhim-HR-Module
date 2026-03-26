from flask import Blueprint, request, jsonify, current_app
from app.payroll.service import PayrollService
from app.middleware.jwt_required import jwt_required
from app.middleware.role_guard import role_required
from app.middleware.company_context import company_required
from app.utils.response import success_response, error_response

# Create payroll blueprint
payroll_bp = Blueprint('payroll', __name__, url_prefix='/payroll')

# ============================================
# PAYROLL DASHBOARD
# ============================================

@payroll_bp.route('/dashboard', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_payroll_dashboard():
    """Get payroll dashboard data"""
    try:
        period_id = request.args.get('period_id', type=int)
        
        result = PayrollService.get_payroll_dashboard(period_id)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Dashboard error: {str(e)}", 500)

@payroll_bp.route('/readiness', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_payroll_readiness():
    """Check if payroll is ready to be processed"""
    try:
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        
        result = PayrollService.get_payroll_readiness(year, month)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Readiness check error: {str(e)}", 500)

# ============================================
# PAYROLL CALCULATION
# ============================================

@payroll_bp.route('/calculate/<int:employee_id>', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def calculate_employee_payroll(employee_id):
    """Calculate payroll for a specific employee"""
    try:
        data = request.get_json()
        period_id = data.get('period_id')
        
        if not period_id:
            return error_response("Period ID is required", 400)
        
        result = PayrollService.calculate_employee_payroll(period_id, employee_id)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Payroll calculation error: {str(e)}", 500)

@payroll_bp.route('/process-bulk', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def process_bulk_payroll():
    """Process payroll for all employees in a period"""
    try:
        data = request.get_json()
        period_id = data.get('period_id')
        
        if not period_id:
            return error_response("Period ID is required", 400)
        
        from flask_jwt_extended import get_jwt_identity
        processed_by = get_jwt_identity()
        
        result = PayrollService.process_bulk_payroll(period_id, processed_by)
        
        if result["success"]:
            # Fire notifications for all employees in this period
            try:
                from app.notifications.service import NotificationService
                from app.database.multi_tenant_executor import MultiTenantExecutor
                summary_result = MultiTenantExecutor.execute_procedure('proc_get_payroll_summary', {'period_id': period_id})
                rows = summary_result.get('data', [])
                if rows and isinstance(rows[0], list):
                    rows = rows[0]
                for emp in (rows or []):
                    uid = emp.get('user_id')
                    if uid:
                        NotificationService.create(
                            user_id=uid,
                            title='Salary Processed',
                            message=f'Your salary for this period has been processed successfully.',
                            module='PAYROLL',
                            reference_id=period_id
                        )
            except Exception:
                pass  # notifications are non-critical
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Bulk payroll processing error: {str(e)}", 500)

# ============================================
# PAYSLIP MANAGEMENT
# ============================================

@payroll_bp.route('/payslip/<int:employee_id>', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER", "EMPLOYEE")
def get_employee_payslip(employee_id):
    """Get payslip data for an employee"""
    try:
        period_id = request.args.get('period_id', type=int)
        
        if not period_id:
            return error_response("Period ID is required", 400)
        
        # Check if employee can access this payslip
        from flask_jwt_extended import get_jwt
        claims = get_jwt()
        current_role = claims.get('role')
        current_employee_id = claims.get('employee_id')
        
        # Employees can only view their own payslips
        if current_role == 'EMPLOYEE' and current_employee_id != employee_id:
            return error_response("Access denied: You can only view your own payslip", 403)
        
        result = PayrollService.get_employee_payslip(period_id, employee_id)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Payslip retrieval error: {str(e)}", 500)

# ============================================
# SALARY STRUCTURE MANAGEMENT
# ============================================

@payroll_bp.route('/salary-structure/<int:employee_id>', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_employee_salary_structure(employee_id):
    """Get salary structure for an employee"""
    try:
        result = PayrollService.get_employee_salary_structure(employee_id)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Salary structure retrieval error: {str(e)}", 500)

@payroll_bp.route('/salary-structure/<int:employee_id>/component', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def add_salary_component(employee_id):
    """Add a salary component to employee"""
    try:
        data = request.get_json()
        
        component_id = data.get('component_id')
        amount = data.get('amount')
        percentage = data.get('percentage')
        formula = data.get('formula')
        effective_from = data.get('effective_from')
        
        if not component_id:
            return error_response("Component ID is required", 400)
        
        result = PayrollService.add_salary_component(
            employee_id, component_id, amount, percentage, formula, effective_from
        )
        
        if result["success"]:
            return success_response(result["data"], result["message"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Add salary component error: {str(e)}", 500)

@payroll_bp.route('/salary-structure/<int:employee_id>/component/<int:component_id>', methods=['PUT'])
@jwt_required
@company_required
@role_required("HR")
def update_salary_component(employee_id, component_id):
    """Update a salary component for employee"""
    try:
        data = request.get_json()
        
        amount = data.get('amount')
        percentage = data.get('percentage')
        formula = data.get('formula')
        
        result = PayrollService.update_salary_component(
            employee_id, component_id, amount, percentage, formula
        )
        
        if result["success"]:
            return success_response(result["data"], result["message"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Update salary component error: {str(e)}", 500)

@payroll_bp.route('/salary-structure/<int:employee_id>/component/<int:component_id>', methods=['DELETE'])
@jwt_required
@company_required
@role_required("HR")
def remove_salary_component(employee_id, component_id):
    """Remove a salary component from employee"""
    try:
        result = PayrollService.remove_salary_component(employee_id, component_id)
        
        if result["success"]:
            return success_response(result["data"], result["message"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Remove salary component error: {str(e)}", 500)

# ============================================
# PAYROLL COMPONENTS
# ============================================

@payroll_bp.route('/components', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_payroll_components():
    """Get all available payroll components"""
    try:
        result = PayrollService.get_payroll_components()
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Payroll components retrieval error: {str(e)}", 500)

# ============================================
# PAYROLL PERIODS
# ============================================

@payroll_bp.route('/periods', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER", "EMPLOYEE")
def get_payroll_periods():
    """Get all payroll periods"""
    try:
        result = PayrollService.get_payroll_periods()
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Payroll periods retrieval error: {str(e)}", 500)

@payroll_bp.route('/periods', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def create_payroll_period():
    """Create a new payroll period"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        period_name = data.get('period_name')
        period_type = data.get('period_type', 'MONTHLY')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        salary_date = data.get('salary_date')
        
        if not all([period_name, start_date, end_date, salary_date]):
            return error_response("period_name, start_date, end_date, and salary_date are required", 400)
        
        # Get current user ID for audit
        from flask_jwt_extended import get_jwt_identity
        created_by = get_jwt_identity()
        
        result = PayrollService.create_payroll_period(
            period_name, period_type, start_date, end_date, salary_date, created_by
        )
        
        if result["success"]:
            response = success_response(result["message"], result["data"])
            response.status_code = 201
            return response
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Create payroll period error: {str(e)}", 500)
@payroll_bp.route('/periods/delete', methods=['DELETE'])
@jwt_required
@company_required
@role_required("HR")
def delete_payroll_period():
    """Delete a payroll period (only DRAFT periods)"""
    try:
        period_id = request.args.get('period_id', type=int)
        if not period_id:
            return error_response("period_id is required", 400)
            
        result = PayrollService.delete_payroll_period(period_id)

        if result["success"]:
            return success_response(result["message"], None)
        else:
            return error_response(result["message"], 400)

    except Exception as e:
        return error_response(f"Delete payroll period error: {str(e)}", 500)


# ============================================
# EMPLOYEE PAYROLL SUMMARY
# ============================================

@payroll_bp.route('/summary', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_payroll_summary():
    """Get payroll summary for all employees in a period"""
    try:
        period_id = request.args.get('period_id', type=int)
        
        if not period_id:
            return error_response("Period ID is required", 400)
        
        # Use stored procedure instead of inline SQL
        from app.payroll.service import PayrollService
        
        result = PayrollService.get_payroll_summary(period_id)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Payroll summary error: {str(e)}", 500)

# ============================================
# MY PAYSLIP (Employee View)
# ============================================

@payroll_bp.route('/my-payslip', methods=['GET'])
@jwt_required
@company_required
@role_required("EMPLOYEE")
def get_my_payslip():
    """Get current employee's payslip"""
    try:
        from flask_jwt_extended import get_jwt
        claims = get_jwt()
        employee_id = claims.get('employee_id')
        
        if not employee_id:
            return error_response("Employee ID not found", 400)
        
        period_id = request.args.get('period_id', type=int)
        
        if not period_id:
            return error_response("Period ID is required", 400)
        
        result = PayrollService.get_employee_payslip(period_id, employee_id)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"My payslip error: {str(e)}", 500)

# ============================================
# PAYROLL ADJUSTMENTS
# ============================================

@payroll_bp.route('/adjustments', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_adjustments():
    """Get all adjustments for a payroll period"""
    try:
        period_id = request.args.get('period_id', type=int)
        if not period_id:
            return error_response("Period ID is required", 400)
        result = PayrollService.get_payroll_adjustments(period_id)
        if result["success"]:
            return success_response(result["message"], result["data"])
        return error_response(result["message"], 400)
    except Exception as e:
        return error_response(f"Get adjustments error: {str(e)}", 500)


@payroll_bp.route('/adjustments', methods=['POST'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def add_adjustment():
    """Add a manual adjustment for an employee"""
    try:
        from flask_jwt_extended import get_jwt
        claims = get_jwt()
        user_id = claims.get('user_id') or claims.get('sub')

        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)

        required = ['period_id', 'employee_id', 'adjustment_type', 'description', 'amount']
        for field in required:
            if field not in data:
                return error_response(f"{field} is required", 400)

        result = PayrollService.add_payroll_adjustment(
            period_id=data['period_id'],
            employee_id=data['employee_id'],
            adjustment_type=data['adjustment_type'],
            description=data['description'],
            amount=data['amount'],
            is_taxable=data.get('is_taxable', False),
            created_by=user_id
        )
        if result["success"]:
            return success_response(result["message"], result.get("data"))
        return error_response(result["message"], 400)
    except Exception as e:
        return error_response(f"Add adjustment error: {str(e)}", 500)


@payroll_bp.route('/adjustments/<int:adjustment_id>', methods=['DELETE'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def delete_adjustment(adjustment_id):
    """Delete a manual adjustment"""
    try:
        from flask_jwt_extended import get_jwt
        claims = get_jwt()
        user_id = claims.get('user_id') or claims.get('sub')

        result = PayrollService.delete_payroll_adjustment(adjustment_id, user_id)
        if result["success"]:
            return success_response(result["message"])
        return error_response(result["message"], 400)
    except Exception as e:
        return error_response(f"Delete adjustment error: {str(e)}", 500)


# ============================================
# PHASE P2: SALARY MANAGEMENT APIs
# ============================================
@payroll_bp.route('/salary-structures', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_salary_structures():
    """Get all salary structure templates (HR or Manager)"""
    try:
        result = PayrollService.get_salary_structures()
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Salary structures retrieval error: {str(e)}", 500)

@payroll_bp.route('/salary-structures', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def create_salary_structure():
    """Create a new salary structure template (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        structure_name = data.get('structure_name')
        description = data.get('description')
        structure_type = data.get('structure_type', 'STANDARD')
        
        if not structure_name:
            return error_response("structure_name is required", 400)
        
        result = PayrollService.create_salary_structure(structure_name, description, structure_type)
        
        if result["success"]:
            response = success_response(result["message"], result["data"])
            response.status_code = 201
            return response
        else:
            return error_response(result["message"], None, 400)
            
    except Exception as e:
        return error_response(f"Create salary structure error: {str(e)}", 500)

@payroll_bp.route('/salary-structures/<int:structure_id>/components', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def add_structure_component(structure_id):
    """Add a component to a salary structure template (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        component_id = data.get('component_id')
        calculation_type = data.get('calculation_type')
        amount = data.get('amount')
        percentage = data.get('percentage')
        formula = data.get('formula')
        base = data.get('base')  # Add base parameter
        
        if not component_id or not calculation_type:
            return error_response("component_id and calculation_type are required", 400)
        
        result = PayrollService.add_structure_component(
            structure_id, component_id, calculation_type, amount, percentage, formula, base
        )
        
        if result["success"]:
            response = success_response(result["message"], result["data"])
            response.status_code = 201
            return response
        else:
            return error_response(result["message"], None, 400)
            
    except Exception as e:
        return error_response(f"Add structure component error: {str(e)}", 500)

@payroll_bp.route('/salary-structures/<int:structure_id>/components', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_structure_components(structure_id):
    """Get components of a salary structure template (HR or Manager)"""
    try:
        result = PayrollService.get_structure_components(structure_id)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Structure components retrieval error: {str(e)}", 500)

@payroll_bp.route('/salary-structures/assign', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def assign_salary_template():
    """Assign salary template to employee (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        employee_id = data.get('employee_id')
        structure_id = data.get('structure_id')
        monthly_ctc = data.get('monthly_ctc')
        effective_from = data.get('effective_from')
        
        if not employee_id or not structure_id or not monthly_ctc:
            return error_response("employee_id, structure_id, and monthly_ctc are required", 400)
        
        result = PayrollService.assign_salary_template(employee_id, structure_id, monthly_ctc, effective_from)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Assign salary template error: {str(e)}", 500)

@payroll_bp.route('/salary-structures/deactivate/<int:employee_id>', methods=['DELETE'])
@jwt_required
@company_required
@role_required("HR")
def deactivate_salary_assignment(employee_id):
    """Deactivate salary template assignment for employee (HR only)"""
    try:
        # Try to get JSON data, but don't fail if it's not present
        try:
            data = request.get_json(silent=True) or {}
        except:
            data = {}
        
        reason = data.get('reason')
        
        # Get current user ID for audit
        from flask_jwt_extended import get_jwt_identity
        deactivated_by = get_jwt_identity()
        
        result = PayrollService.deactivate_salary_assignment(employee_id, deactivated_by, reason)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Deactivate salary assignment error: {str(e)}", 500)

# EMPLOYEE SALARY MANAGEMENT
@payroll_bp.route('/salary/<int:employee_id>', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_employee_salary_details(employee_id):
    """Get complete salary details for an employee (HR or Manager)"""
    try:
        result = PayrollService.get_employee_salary_details(employee_id)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Employee salary retrieval error: {str(e)}", 500)

@payroll_bp.route('/salary/<int:employee_id>/component/<int:component_id>', methods=['PUT'])
@jwt_required
@company_required
@role_required("HR")
def update_employee_salary_component_amount(employee_id, component_id):
    """Update salary component amount for an employee (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        amount = data.get('amount')
        
        if amount is None:
            return error_response("amount is required", 400)
        
        # Get current user ID for audit
        from flask_jwt_extended import get_jwt_identity
        updated_by = get_jwt_identity()
        
        result = PayrollService.update_employee_salary_component_amount(
            employee_id, component_id, amount, updated_by
        )
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Update salary component error: {str(e)}", 500)

@payroll_bp.route('/salary/<int:employee_id>/validate', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def validate_employee_salary_structure(employee_id):
    """Validate employee salary structure before payroll (HR or Manager)"""
    try:
        result = PayrollService.validate_employee_salary_structure(employee_id)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Salary validation error: {str(e)}", 500)

@payroll_bp.route('/salary/missing', methods=['GET'])
@jwt_required
@company_required
@role_required("HR")
def get_employees_without_salary():
    """Get list of employees without salary structure (HR only)"""
    try:
        result = PayrollService.get_employees_without_salary()
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Employees without salary retrieval error: {str(e)}", 500)

# ============================================
# PHASE 3: PAYROLL OPERATIONAL APIs
# ============================================

@payroll_bp.route('/lock', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def lock_payroll():
    """Lock payroll period after verification (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        period_id = data.get('period_id')
        
        if not period_id:
            return error_response("period_id is required", 400)
        
        # Get current user ID for audit
        from flask_jwt_extended import get_jwt_identity
        locked_by = get_jwt_identity()
        
        result = PayrollService.lock_payroll(period_id, locked_by)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Lock payroll error: {str(e)}", 500)

@payroll_bp.route('/unlock', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def unlock_payroll():
    """Emergency unlock payroll period (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        period_id = data.get('period_id')
        reason = data.get('reason')
        
        if not period_id or not reason:
            return error_response("period_id and reason are required", 400)
        
        # Get current user ID for audit
        from flask_jwt_extended import get_jwt_identity
        unlocked_by = get_jwt_identity()
        
        result = PayrollService.unlock_payroll(period_id, unlocked_by, reason)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Unlock payroll error: {str(e)}", 500)

@payroll_bp.route('/bank-advice', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_bank_advice():
    """Get bank advice for a locked payroll period"""
    try:
        period_id = request.args.get('period_id', type=int)
        if not period_id:
            return error_response("Period ID is required", 400)
        result = PayrollService.get_bank_advice(period_id)
        if result["success"]:
            return success_response(result["message"], result["data"])
        return error_response(result["message"], 400)
    except Exception as e:
        return error_response(f"Bank advice error: {str(e)}", 500)


@payroll_bp.route('/bank-details/<int:employee_id>', methods=['PUT'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def update_bank_details(employee_id):
    """Update employee bank details"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)
        result = PayrollService.update_employee_bank_details(
            employee_id=employee_id,
            bank_account_number=data.get('bank_account_number', ''),
            bank_name=data.get('bank_name', ''),
            bank_ifsc_code=data.get('bank_ifsc_code', ''),
            bank_branch=data.get('bank_branch', '')
        )
        if result["success"]:
            return success_response(result["message"])
        return error_response(result["message"], 400)
    except Exception as e:
        return error_response(f"Update bank details error: {str(e)}", 500)


@payroll_bp.route('/mark-paid', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def mark_salaries_paid():
    """Mark salaries as paid after bank transfer (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        period_id = data.get('period_id')
        payment_reference = data.get('payment_reference')
        
        if not period_id or not payment_reference:
            return error_response("period_id and payment_reference are required", 400)
        
        # Get current user ID for audit
        from flask_jwt_extended import get_jwt_identity
        paid_by = get_jwt_identity()
        
        result = PayrollService.mark_salaries_paid(period_id, payment_reference, paid_by)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Mark salaries paid error: {str(e)}", 500)

@payroll_bp.route('/salary-register', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_salary_register():
    """Get complete salary register report (HR or Manager)"""
    try:
        period_id = request.args.get('period_id', type=int)
        
        if not period_id:
            return error_response("period_id is required", 400)
        
        result = PayrollService.get_salary_register(period_id)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Salary register retrieval error: {str(e)}", 500)

# ============================================
# COMPLIANCE REPORTS
# ============================================

@payroll_bp.route('/compliance/pf', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_pf_summary():
    """Get PF (Provident Fund) summary report"""
    try:
        period_id = request.args.get('period_id', type=int)
        
        if not period_id:
            return error_response("period_id is required", 400)
        
        result = PayrollService.get_pf_summary(period_id)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Get PF summary error: {str(e)}", 500)

@payroll_bp.route('/compliance/esi', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_esi_summary():
    """Get ESI (Employee State Insurance) summary report"""
    try:
        period_id = request.args.get('period_id', type=int)
        
        if not period_id:
            return error_response("period_id is required", 400)
        
        result = PayrollService.get_esi_summary(period_id)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Get ESI summary error: {str(e)}", 500)

@payroll_bp.route('/compliance/pt', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_pt_summary():
    """Get Professional Tax summary report"""
    try:
        period_id = request.args.get('period_id', type=int)
        
        if not period_id:
            return error_response("period_id is required", 400)
        
        result = PayrollService.get_pt_summary(period_id)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Get PT summary error: {str(e)}", 500)

@payroll_bp.route('/compliance/tds', methods=['GET'])
@jwt_required
@company_required
@role_required("HR", "MANAGER")
def get_tds_summary():
    """Get TDS (Tax Deducted at Source) summary report"""
    try:
        period_id = request.args.get('period_id', type=int)
        
        if not period_id:
            return error_response("period_id is required", 400)
        
        result = PayrollService.get_tds_summary(period_id)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], 400)
            
    except Exception as e:
        return error_response(f"Get TDS summary error: {str(e)}", 500)

@payroll_bp.route('/salary-structures/<int:structure_id>', methods=['PUT'])
@jwt_required
@company_required
@role_required("HR")
def update_salary_structure(structure_id):
    """Update a salary structure template (HR only)"""
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        structure_name = data.get('structure_name')
        description = data.get('description')
        structure_type = data.get('structure_type')
        
        result = PayrollService.update_salary_structure(structure_id, structure_name, description, structure_type)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], None, 400)
            
    except Exception as e:
        return error_response(f"Update salary structure error: {str(e)}", 500)

@payroll_bp.route('/salary-structures/<int:structure_id>/deactivate', methods=['POST'])
@jwt_required
@company_required
@role_required("HR")
def deactivate_salary_structure(structure_id):
    """Deactivate a salary structure template (HR only)"""
    try:
        result = PayrollService.deactivate_salary_structure(structure_id)
        
        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], None, 400)
            
    except Exception as e:
        return error_response(f"Deactivate salary structure error: {str(e)}", 500)

@payroll_bp.route('/salary-structures/<int:structure_id>/components', methods=['PUT'])
@jwt_required
@company_required
@role_required("HR")
def update_structure_components(structure_id):
    """Replace all components of a salary structure template (HR only)"""
    try:
        data = request.get_json()
        components = data.get('components', []) if data else []

        if not isinstance(components, list):
            return error_response("components must be an array", 400)

        result = PayrollService.update_salary_structure_components(structure_id, components)

        if result["success"]:
            return success_response(result["message"], result["data"])
        else:
            return error_response(result["message"], None, 400)

    except Exception as e:
        return error_response(f"Update structure components error: {str(e)}", 500)
