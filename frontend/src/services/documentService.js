import api from './api';

const documentService = {

    // ── TEMPLATES ──────────────────────────────────────────────
    getTemplates: async (activeOnly = false) => {
        const response = await api.get(`/documents/templates${activeOnly ? '?active_only=true' : ''}`);
        return response;
    },

    createTemplate: async (data) => {
        const response = await api.post('/documents/templates', data);
        return response;
    },

    updateTemplate: async (templateId, data) => {
        const response = await api.put(`/documents/templates/${templateId}`, data);
        return response;
    },

    deleteTemplate: async (templateId) => {
        const response = await api.delete(`/documents/templates/${templateId}`);
        return response;
    },

    // ── LETTER GENERATION ──────────────────────────────────────
    getEmployeeLetterData: async (employeeId) => {
        const response = await api.get(`/documents/employee-data/${employeeId}`);
        return response;
    },

    /**
     * Server-side generation — backend proc replaces all placeholders.
     * Only employee_id + template_id needed; backend handles the rest.
     */
    generateLetter: async (employeeId, templateId) => {
        const response = await api.post('/documents/generate', {
            employee_id: employeeId,
            template_id: templateId,
        });
        return response;
    },

    getTemplateVariables: async () => {
        const response = await api.get('/documents/template-variables');
        return response;
    },

    // ── LETTERS ────────────────────────────────────────────────
    getAllLetters: async (employeeId = null) => {
        const query = employeeId ? `?employee_id=${employeeId}` : '';
        const response = await api.get(`/documents/letters${query}`);
        return response;
    },

    getMyLetters: async () => {
        const response = await api.get('/documents/my-letters');
        return response;
    },

    // ── UTILS ──────────────────────────────────────────────────
    /**
     * Replace {{Variable}} placeholders in template content with actual employee data
     */
    fillTemplate: (templateContent, employeeData, companyName = '') => {
        if (!templateContent || !employeeData) return templateContent;
        const map = {
            '{{EmployeeName}}':  employeeData.EmployeeName  || '',
            '{{EmployeeID}}':    employeeData.EmployeeID    || '',
            '{{Designation}}':   employeeData.Designation   || '',
            '{{Department}}':    employeeData.Department    || '',
            '{{DOJ}}':           employeeData.DOJ           || '',
            '{{LastWorkingDay}}':employeeData.LastWorkingDay|| '',
            '{{CompanyName}}':   companyName                || '',
            '{{AnnualSalary}}':  employeeData.AnnualSalary
                ? '₹' + Number(employeeData.AnnualSalary).toLocaleString('en-IN')
                : '',
            '{{MonthlySalary}}': employeeData.MonthlySalary
                ? '₹' + Number(employeeData.MonthlySalary).toLocaleString('en-IN')
                : '',
            '{{AnnualCTC}}':     employeeData.AnnualCTC
                ? '₹' + Number(employeeData.AnnualCTC).toLocaleString('en-IN')
                : '',
            '{{IssueDate}}':     employeeData.IssueDate     || '',
            '{{ResponseDate}}':  employeeData.ResponseDate  || '',
            '{{EmployeeEmail}}': employeeData.EmployeeEmail || '',
            '{{EmployeePhone}}': employeeData.EmployeePhone || '',
        };
        return Object.entries(map).reduce(
            (content, [key, val]) => content.replaceAll(key, val),
            templateContent
        );
    },

    PLACEHOLDERS: [
        { key: '{{EmployeeName}}',   desc: 'Full name' },
        { key: '{{EmployeeID}}',     desc: 'Employee code' },
        { key: '{{Designation}}',    desc: 'Job title' },
        { key: '{{Department}}',     desc: 'Department' },
        { key: '{{DOJ}}',            desc: 'Date of joining' },
        { key: '{{LastWorkingDay}}', desc: 'Last working day' },
        { key: '{{CompanyName}}',    desc: 'Company name' },
        { key: '{{AnnualSalary}}',   desc: 'Annual salary' },
        { key: '{{MonthlySalary}}',  desc: 'Monthly salary' },
        { key: '{{AnnualCTC}}',      desc: 'Annual CTC' },
        { key: '{{IssueDate}}',      desc: 'Today\'s date' },
        { key: '{{ResponseDate}}',   desc: 'Response date' },
        { key: '{{EmployeeEmail}}',  desc: 'Employee email' },
        { key: '{{EmployeePhone}}',  desc: 'Employee phone' },
    ],

    CATEGORIES: ['Onboarding', 'Offboarding', 'Payroll', 'General', 'Legal'],

    // ── EMPLOYEE DOCUMENT UPLOADS (KYC / Identity docs) ────────

    getEmployeeDocuments: async (employeeId) => {
        const response = await api.get(`/documents/employee-docs/${employeeId}`);
        return response;
    },

    uploadEmployeeDocument: async (employeeId, file, documentType, documentName) => {
        const token = sessionStorage.getItem('hrms_token');
        const companyCode = import.meta.env.VITE_COMPANY_CODE;
        const currentView = localStorage.getItem('preferred_view') || 'HR';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', documentType);
        formData.append('document_name', documentName);

        const response = await fetch(`${api.baseURL}/documents/employee-docs/${employeeId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Company-Code': companyCode,
                'X-Current-View': currentView,
            },
            body: formData,
        });
        return response.json();
    },

    getDocumentFileUrl: (documentId) => {
        const token = sessionStorage.getItem('hrms_token');
        const companyCode = import.meta.env.VITE_COMPANY_CODE;
        // Returns a URL that can be opened in a new tab
        return `${api.baseURL}/documents/employee-docs/file/${documentId}`;
    },

    serveEmployeeDocument: async (documentId) => {
        const token = sessionStorage.getItem('hrms_token');
        const companyCode = import.meta.env.VITE_COMPANY_CODE;
        const currentView = localStorage.getItem('preferred_view') || 'HR';

        const response = await fetch(`${api.baseURL}/documents/employee-docs/file/${documentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Company-Code': companyCode,
                'X-Current-View': currentView,
            },
        });
        if (response.ok) {
            const blob = await response.blob();
            return { success: true, blob, contentType: response.headers.get('Content-Type') };
        }
        return { success: false, error: 'Failed to load file' };
    },

    deleteEmployeeDocument: async (documentId) => {
        const response = await api.delete(`/documents/employee-docs/${documentId}`);
        return response;
    },

    DOCUMENT_TYPES: [
        'Aadhar Card',
        'PAN Card',
        'Passport',
        'Degree Certificate',
        'Experience Letter',
        'Bank Details',
        'Medical Certificate',
        'Resume / CV',
        'Other',
    ],
};

export default documentService;
