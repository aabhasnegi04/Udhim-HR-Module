import api from './api';

const payrollService = {
    // ============================================
    // PAYROLL DASHBOARD
    // ============================================
    
    /**
     * Get payroll dashboard data
     * @param {number} periodId - Optional period ID
     * @returns {Promise} Dashboard data with period summary, department summary, and recent activities
     */
    getDashboard: async (periodId = null) => {
        try {
            const endpoint = periodId ? `/payroll/dashboard?period_id=${periodId}` : '/payroll/dashboard';
            const response = await api.get(endpoint);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Check if payroll is ready to be processed
     * @param {number} year - Year (optional, defaults to current year)
     * @param {number} month - Month (optional, defaults to current month)
     * @returns {Promise} Readiness check data with summary, employees without salary, missing attendance, pending leaves
     */
    getPayrollReadiness: async (year = null, month = null) => {
        try {
            const params = new URLSearchParams();
            if (year) params.append('year', year);
            if (month) params.append('month', month);
            const query = params.toString() ? `?${params.toString()}` : '';
            const response = await api.get(`/payroll/readiness${query}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ============================================
    // PAYROLL COMPONENTS
    // ============================================
    
    /**
     * Get all payroll components (earnings, deductions, employer contributions)
     * @returns {Promise} Payroll components grouped by type
     */
    getComponents: async () => {
        try {
            const response = await api.get('/payroll/components');
            return response.data;
        } catch (error) {
            console.error('Get payroll components error:', error);
            throw error;
        }
    },

    // ============================================
    // PAYROLL PERIODS
    // ============================================
    
    /**
     * Get all payroll periods
     * @returns {Promise} List of payroll periods
     */
    getPeriods: async () => {
        try {
            const response = await api.get('/payroll/periods');
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Create a new payroll period
     * @param {string} periodName - Name of the period (e.g., "April 2026")
     * @param {string} periodType - Type of period (MONTHLY, WEEKLY, etc.)
     * @param {string} startDate - Period start date (YYYY-MM-DD)
     * @param {string} endDate - Period end date (YYYY-MM-DD)
     * @param {string} salaryDate - Salary payment date (YYYY-MM-DD)
     * @returns {Promise} Created period data
     */
    createPayrollPeriod: async (periodName, periodType, startDate, endDate, salaryDate) => {
        try {
            const response = await api.post('/payroll/periods', {
                period_name: periodName,
                period_type: periodType,
                start_date: startDate,
                end_date: endDate,
                salary_date: salaryDate
            });
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Delete a payroll period (only DRAFT periods)
     * @param {number} periodId - Period ID to delete
     * @returns {Promise} Success response
     */
    deletePeriod: async (periodId) => {
        try {
            const response = await api.delete(`/payroll/periods/delete?period_id=${periodId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // ============================================
    // SALARY STRUCTURE MANAGEMENT
    // ============================================
    
    /**
     * Get employee salary structure
     * @param {number} employeeId - Employee ID
     * @returns {Promise} Employee salary structure with earnings and deductions
     */
    getEmployeeSalaryStructure: async (employeeId) => {
        try {
            const response = await api.get(`/payroll/salary-structure/${employeeId}`);
            return response.data;
        } catch (error) {
            console.error('Get employee salary structure error:', error);
            throw error;
        }
    },

    /**
     * Add salary component to employee
     * @param {number} employeeId - Employee ID
     * @param {Object} componentData - Component data (component_id, amount, percentage, formula, effective_from)
     * @returns {Promise} Success response
     */
    addSalaryComponent: async (employeeId, componentData) => {
        try {
            const response = await api.post(`/payroll/salary-structure/${employeeId}/component`, componentData);
            return response.data;
        } catch (error) {
            console.error('Add salary component error:', error);
            throw error;
        }
    },

    /**
     * Update salary component for employee
     * @param {number} employeeId - Employee ID
     * @param {number} componentId - Component ID
     * @param {Object} componentData - Updated component data (amount, percentage, formula)
     * @returns {Promise} Success response
     */
    updateSalaryComponent: async (employeeId, componentId, componentData) => {
        try {
            const response = await api.put(`/payroll/salary-structure/${employeeId}/component/${componentId}`, componentData);
            return response.data;
        } catch (error) {
            console.error('Update salary component error:', error);
            throw error;
        }
    },

    /**
     * Remove salary component from employee
     * @param {number} employeeId - Employee ID
     * @param {number} componentId - Component ID
     * @returns {Promise} Success response
     */
    removeSalaryComponent: async (employeeId, componentId) => {
        try {
            const response = await api.delete(`/payroll/salary-structure/${employeeId}/component/${componentId}`);
            return response.data;
        } catch (error) {
            console.error('Remove salary component error:', error);
            throw error;
        }
    },

    // ============================================
    // PAYROLL CALCULATION
    // ============================================
    
    /**
     * Calculate payroll for a specific employee
     * @param {number} employeeId - Employee ID
     * @param {number} periodId - Period ID
     * @returns {Promise} Calculation result with earnings, deductions, and net salary
     */
    calculateEmployeePayroll: async (employeeId, periodId) => {
        try {
            const response = await api.post(`/payroll/calculate/${employeeId}`, { period_id: periodId });
            return response.data;
        } catch (error) {
            console.error('Calculate employee payroll error:', error);
            throw error;
        }
    },

    /**
     * Process bulk payroll for all employees in a period
     * @param {number} periodId - Period ID
     * @returns {Promise} Bulk processing result
     */
    processBulkPayroll: async (periodId) => {
        try {
            const response = await api.post('/payroll/process-bulk', { period_id: periodId });
            return response;
        } catch (error) {
            throw error;
        }
    },

    // ============================================
    // PAYSLIP MANAGEMENT
    // ============================================
    
    /**
     * Get employee payslip
     * @param {number} employeeId - Employee ID
     * @param {number} periodId - Period ID
     * @returns {Promise} Payslip data with employee details, earnings, and deductions
     */
    getEmployeePayslip: async (employeeId, periodId) => {
        try {
            const response = await api.get(`/payroll/payslip/${employeeId}?period_id=${periodId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get current employee's payslip (for employee view)
     * @param {number} periodId - Period ID
     * @returns {Promise} Current employee's payslip data
     */
    getMyPayslip: async (periodId) => {
        try {
            const response = await api.get('/payroll/my-payslip', {
                params: { period_id: periodId }
            });
            return response.data;
        } catch (error) {
            console.error('Get my payslip error:', error);
            throw error;
        }
    },

    // ============================================
    // PAYROLL SUMMARY
    // ============================================
    
    /**
     * Get payroll summary for all employees in a period
     * @param {number} periodId - Period ID
     * @returns {Promise} Payroll summary for all employees
     */
    getPayrollSummary: async (periodId) => {
        try {
            const response = await api.get(`/payroll/summary?period_id=${periodId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // ============================================
    // PAYROLL ADJUSTMENTS
    // ============================================

    getAdjustments: async (periodId) => {
        try {
            const response = await api.get(`/payroll/adjustments?period_id=${periodId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    addAdjustment: async (data) => {
        try {
            const response = await api.post('/payroll/adjustments', data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    deleteAdjustment: async (adjustmentId) => {
        try {
            const response = await api.delete(`/payroll/adjustments/${adjustmentId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // ============================================
    // PHASE P2: SALARY TEMPLATE MANAGEMENT
    // ============================================
    
    /**
     * Get all salary structure templates
     * @returns {Promise} List of salary structure templates
     */
    getSalaryStructures: async () => {
        try {
            const response = await api.get('/payroll/salary-structures');
            return response.data;
        } catch (error) {
            console.error('Get salary structures error:', error);
            throw error;
        }
    },

    /**
     * Create a new salary structure template
     * @param {string} structureName - Name of the structure
     * @param {string} description - Description of the structure
     * @param {string} structureType - Type of structure (STANDARD, CUSTOM, etc.)
     * @returns {Promise} Created structure data
     */
    createSalaryStructure: async (structureName, description = null, structureType = 'STANDARD') => {
        try {
            const response = await api.post('/payroll/salary-structures', {
                structure_name: structureName,
                description: description,
                structure_type: structureType
            });
            return response;
        } catch (error) {
            console.error('Create salary structure error:', error);
            throw error;
        }
    },

    /**
     * Add a component to a salary structure template
     * @param {number} structureId - Structure ID
     * @param {number} componentId - Component ID
     * @param {string} calculationType - FIXED, PERCENTAGE, or FORMULA
     * @param {number} amount - Fixed amount (if FIXED)
     * @param {number} percentage - Percentage value (if PERCENTAGE)
     * @param {string} formula - Formula string (if FORMULA)
     * @returns {Promise} Success response
     */
    addStructureComponent: async (structureId, componentId, calculationType, amount = null, percentage = null, formula = null, base = null) => {
        try {
            const response = await api.post(`/payroll/salary-structures/${structureId}/components`, {
                component_id: componentId,
                calculation_type: calculationType,
                amount: amount,
                percentage: percentage,
                formula: formula,
                base: base
            });
            return response;
        } catch (error) {
            console.error('Add structure component error:', error);
            throw error;
        }
    },

    /**
     * Get all salary structure templates
     * @returns {Promise} List of salary structure templates
     */
    getSalaryStructures_OLD: async () => {
        try {
            const response = await api.get('/payroll/salary-structures');
            return response.data;
        } catch (error) {
            console.error('Get salary structures error:', error);
            throw error;
        }
    },

    /**
     * Get components of a salary structure template
     * @param {number} structureId - Structure ID
     * @returns {Promise} List of components in the structure
     */
    getStructureComponents: async (structureId) => {
        try {
            const response = await api.get(`/payroll/salary-structures/${structureId}/components`);
            return response.data;
        } catch (error) {
            console.error('Get structure components error:', error);
            throw error;
        }
    },

    /**
     * Update a salary structure template
     * @param {number} structureId - Structure ID
     * @param {string} structureName - New name (optional)
     * @param {string} description - New description (optional)
     * @param {string} structureType - New type (optional)
     * @returns {Promise} Success response
     */
    updateSalaryStructure: async (structureId, structureName = null, description = null, structureType = null) => {
        try {
            const response = await api.put(`/payroll/salary-structures/${structureId}`, {
                structure_name: structureName,
                description: description,
                structure_type: structureType
            });
            return response;
        } catch (error) {
            console.error('Update salary structure error:', error);
            throw error;
        }
    },

    /**
     * Deactivate a salary structure template
     * @param {number} structureId - Structure ID
     * @returns {Promise} Success response
     */
    deactivateSalaryStructure: async (structureId) => {
        try {
            const response = await api.post(`/payroll/salary-structures/${structureId}/deactivate`);
            return response;
        } catch (error) {
            console.error('Deactivate salary structure error:', error);
            throw error;
        }
    },

    updateSalaryStructureComponents: async (structureId, components) => {
        try {
            const response = await api.put(`/payroll/salary-structures/${structureId}/components`, { components });
            return response;
        } catch (error) {
            console.error('Update structure components error:', error);
            throw error;
        }
    },

    /**
     * Assign salary template to employee
     * @param {number} employeeId - Employee ID
     * @param {number} structureId - Structure ID
     * @param {number} monthlyCTC - Monthly CTC amount
     * @param {string} effectiveFrom - Effective date (YYYY-MM-DD)
     * @returns {Promise} Success response with assigned salary details
     */
    assignSalaryTemplate: async (employeeId, structureId, monthlyCTC, effectiveFrom = null) => {
        try {
            const response = await api.post('/payroll/salary-structures/assign', {
                employee_id: employeeId,
                structure_id: structureId,
                monthly_ctc: monthlyCTC,
                effective_from: effectiveFrom
            });
            return response; // Return full response with success, message, data
        } catch (error) {
            console.error('Assign salary template error:', error);
            throw error;
        }
    },

    /**
     * Deactivate salary template assignment for employee
     * @param {number} employeeId - Employee ID
     * @param {string} reason - Reason for deactivation (optional)
     * @returns {Promise} Success response
     */
    deactivateSalaryAssignment: async (employeeId, reason = null) => {
        try {
            // Send empty body for DELETE request to avoid JSON parsing issues
            const response = await api.delete(`/payroll/salary-structures/deactivate/${employeeId}`);
            return response.data;
        } catch (error) {
            console.error('Deactivate salary assignment error:', error);
            throw error;
        }
    },

    /**
     * Get complete salary details for an employee
     * @param {number} employeeId - Employee ID
     * @returns {Promise} Employee salary details with components
     */
    getEmployeeSalaryDetails: async (employeeId) => {
        try {
            const response = await api.get(`/payroll/salary/${employeeId}`);
            return response; // Return full response with success, message, data
        } catch (error) {
            console.error('Get employee salary details error:', error);
            throw error;
        }
    },

    /**
     * Update salary component amount for an employee
     * @param {number} employeeId - Employee ID
     * @param {number} componentId - Component ID
     * @param {number} amount - New amount
     * @returns {Promise} Success response
     */
    updateEmployeeSalaryComponentAmount: async (employeeId, componentId, amount) => {
        try {
            const response = await api.put(`/payroll/salary/${employeeId}/component/${componentId}`, {
                amount: amount
            });
            return response.data;
        } catch (error) {
            console.error('Update salary component amount error:', error);
            throw error;
        }
    },

    /**
     * Validate employee salary structure before payroll
     * @param {number} employeeId - Employee ID
     * @returns {Promise} Validation result
     */
    validateEmployeeSalary: async (employeeId) => {
        try {
            const response = await api.get(`/payroll/salary/${employeeId}/validate`);
            return response.data;
        } catch (error) {
            console.error('Validate employee salary error:', error);
            throw error;
        }
    },

    /**
     * Get list of employees without salary structure
     * @returns {Promise} List of employees without salary
     */
    getEmployeesWithoutSalary: async () => {
        try {
            const response = await api.get('/payroll/salary/missing');
            return response.data;
        } catch (error) {
            console.error('Get employees without salary error:', error);
            throw error;
        }
    },

    // ============================================
    // PHASE 3: PAYROLL OPERATIONAL APIs
    // ============================================
    
    /**
     * Lock payroll period after verification
     * @param {number} periodId - Period ID
     * @returns {Promise} Success response
     */
    lockPayroll: async (periodId) => {
        try {
            const response = await api.post('/payroll/lock', { period_id: periodId });
            return response;
        } catch (error) {
            throw error;
        }
    },

    unlockPayroll: async (periodId, reason) => {
        try {
            const response = await api.post('/payroll/unlock', { period_id: periodId, reason });
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Mark salaries as paid after bank transfer
     * @param {number} periodId - Period ID
     * @param {string} paymentReference - Bank payment reference number
     * @returns {Promise} Success response with employees updated count
     */
    getBankAdvice: async (periodId) => {
        try {
            const response = await api.get(`/payroll/bank-advice?period_id=${periodId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    updateBankDetails: async (employeeId, data) => {
        try {
            const response = await api.put(`/payroll/bank-details/${employeeId}`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    markSalariesPaid: async (periodId, paymentReference) => {
        try {
            const response = await api.post('/payroll/mark-paid', {
                period_id: periodId,
                payment_reference: paymentReference
            });
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get complete salary register report
     * @param {number} periodId - Period ID
     * @returns {Promise} Salary register with period summary, employee salaries, and component totals
     */
    getSalaryRegister: async (periodId) => {
        try {
            const response = await api.get(`/payroll/salary-register?period_id=${periodId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },



    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    /**
     * Format currency amount
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    },

    /**
     * Format date for display
     * @param {string} dateString - Date string to format
     * @returns {string} Formatted date string
     */
    formatDate: (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Get status color for payment status
     * @param {string} status - Payment status
     * @returns {string} MUI color name
     */
    getStatusColor: (status) => {
        switch (status?.toUpperCase()) {
            case 'PAID':
                return 'success';
            case 'PENDING':
                return 'warning';
            case 'HOLD':
                return 'error';
            default:
                return 'default';
        }
    },

    // ============================================
    // COMPLIANCE REPORTS
    // ============================================
    
    /**
     * Get PF (Provident Fund) summary report
     * @param {number} periodId - Period ID
     * @returns {Promise} PF summary data
     */
    getPFSummary: async (periodId) => {
        try {
            const response = await api.get(`/payroll/compliance/pf?period_id=${periodId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get ESI (Employee State Insurance) summary report
     * @param {number} periodId - Period ID
     * @returns {Promise} ESI summary data
     */
    getESISummary: async (periodId) => {
        try {
            const response = await api.get(`/payroll/compliance/esi?period_id=${periodId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get Professional Tax summary report
     * @param {number} periodId - Period ID
     * @returns {Promise} PT summary data
     */
    getPTSummary: async (periodId) => {
        try {
            const response = await api.get(`/payroll/compliance/pt?period_id=${periodId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get TDS (Tax Deducted at Source) summary report
     * @param {number} periodId - Period ID
     * @returns {Promise} TDS summary data
     */
    getTDSSummary: async (periodId) => {
        try {
            const response = await api.get(`/payroll/compliance/tds?period_id=${periodId}`);
            return response;
        } catch (error) {
            throw error;
        }
    }
};

export default payrollService;
