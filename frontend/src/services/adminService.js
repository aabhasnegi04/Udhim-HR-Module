import apiService from './api';

class AdminService {
  // ADMIN DASHBOARD
  async getDashboardStats() {
    try {
      const response = await apiService.get('/admin/dashboard');
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get dashboard stats failed:', error);
      return { success: false, error: error.message };
    }
  }

  // DEPARTMENTS
  async getDepartments() {
    try {
      const response = await apiService.get('/admin/departments');
      if (response.success) {
        return { success: true, data: response.data.departments };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get departments failed:', error);
      return { success: false, error: error.message };
    }
  }

  async addDepartment(departmentData) {
    try {
      const response = await apiService.post('/admin/departments', departmentData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Add department failed:', error);
      return { success: false, error: error.message };
    }
  }

  // DESIGNATIONS
  async getDesignations() {
    try {
      const response = await apiService.get('/admin/designations');
      if (response.success) {
        return { success: true, data: response.data.designations };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get designations failed:', error);
      return { success: false, error: error.message };
    }
  }

  async addDesignation(designationData) {
    try {
      const response = await apiService.post('/admin/designations', designationData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Add designation failed:', error);
      return { success: false, error: error.message };
    }
  }

  // LOCATIONS
  async getLocations() {
    try {
      const response = await apiService.get('/admin/locations');
      if (response.success) {
        return { success: true, data: response.data.locations };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get locations failed:', error);
      return { success: false, error: error.message };
    }
  }

  async addLocation(locationData) {
    try {
      const response = await apiService.post('/admin/locations', locationData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Add location failed:', error);
      return { success: false, error: error.message };
    }
  }

  // HOLIDAYS
  async getHolidays(year = new Date().getFullYear()) {
    try {
      const response = await apiService.get(`/admin/holidays?year=${year}`);
      if (response.success) {
        return { success: true, data: response.data.holidays };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get holidays failed:', error);
      return { success: false, error: error.message };
    }
  }

  async addHoliday(holidayData) {
    try {
      const response = await apiService.post('/admin/holidays', holidayData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Add holiday failed:', error);
      return { success: false, error: error.message };
    }
  }

  async updateHoliday(holidayId, holidayData) {
    try {
      const response = await apiService.put(`/admin/holidays/${holidayId}`, holidayData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Update holiday failed:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteHoliday(holidayId) {
    try {
      const response = await apiService.delete(`/admin/holidays/${holidayId}`);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Delete holiday failed:', error);
      return { success: false, error: error.message };
    }
  }

  // LEAVE TYPES
  async getLeaveTypes() {
    try {
      const response = await apiService.get('/admin/leave-types');
      if (response.success) {
        return { success: true, data: response.data.leave_types };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get leave types failed:', error);
      return { success: false, error: error.message };
    }
  }

  async addLeaveType(leaveTypeData) {
    try {
      const response = await apiService.post('/admin/leave-types', leaveTypeData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Add leave type failed:', error);
      return { success: false, error: error.message };
    }
  }

  // SALARY STRUCTURES
  async getSalaryStructures() {
    try {
      const response = await apiService.get('/admin/salary-structures');
      if (response.success) {
        return { success: true, data: response.data.salary_structures };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get salary structures failed:', error);
      return { success: false, error: error.message };
    }
  }

  async addSalaryStructure(salaryStructureData) {
    try {
      const response = await apiService.post('/admin/salary-structures', salaryStructureData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Add salary structure failed:', error);
      return { success: false, error: error.message };
    }
  }

  // LETTER TEMPLATES
  async getLetterTemplates() {
    try {
      const response = await apiService.get('/admin/letter-templates');
      if (response.success) {
        return { success: true, data: response.data.templates };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get letter templates failed:', error);
      return { success: false, error: error.message };
    }
  }

  async addLetterTemplate(templateData) {
    try {
      const response = await apiService.post('/admin/letter-templates', templateData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Add letter template failed:', error);
      return { success: false, error: error.message };
    }
  }

  async updateLetterTemplate(templateId, templateData) {
    try {
      const response = await apiService.put(`/admin/letter-templates/${templateId}`, templateData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Update letter template failed:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteLetterTemplate(templateId) {
    try {
      const response = await apiService.delete(`/admin/letter-templates/${templateId}`);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Delete letter template failed:', error);
      return { success: false, error: error.message };
    }
  }

  // COMPANY POLICIES
  async getCompanyPolicies() {
    try {
      const response = await apiService.get('/admin/company-policies');
      if (response.success) {
        return { success: true, data: response.data.policies };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get company policies failed:', error);
      return { success: false, error: error.message };
    }
  }

  async addCompanyPolicy(policyData) {
    try {
      const response = await apiService.post('/admin/company-policies', policyData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Add company policy failed:', error);
      return { success: false, error: error.message };
    }
  }

  // SYSTEM REPORTS
  async generateSystemReport(reportType, filters = {}) {
    try {
      const requestData = {
        report_type: reportType,
        ...filters
      };
      
      const response = await apiService.post('/admin/reports/generate', requestData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Generate system report failed:', error);
      return { success: false, error: error.message };
    }
  }

  // BULK UPLOAD
  async downloadBulkUploadTemplate(templateType) {
    try {
      const response = await fetch(`${apiService.baseURL}/admin/bulk-upload/templates/${templateType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${templateType}_template.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to download template' };
      }
    } catch (error) {
      console.error('Download template failed:', error);
      return { success: false, error: error.message };
    }
  }

  async processBulkUpload(file, uploadType) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_type', uploadType);

      const response = await fetch(`${apiService.baseURL}/admin/bulk-upload/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, error: result.message };
    } catch (error) {
      console.error('Process bulk upload failed:', error);
      return { success: false, error: error.message };
    }
  }

  // DESIGNATION ROLE MAPPINGS
  async getDesignationMappings() {
    try {
      const response = await apiService.get('/admin/designation-mappings');
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Get designation mappings failed:', error);
      return { success: false, message: error.message };
    }
  }

  async addDesignationMapping(mappingData) {
    try {
      const response = await apiService.post('/admin/designation-mappings', mappingData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Add designation mapping failed:', error);
      return { success: false, message: error.message };
    }
  }

  async updateDesignationMapping(mappingId, mappingData) {
    try {
      const response = await apiService.put(`/admin/designation-mappings/${mappingId}`, mappingData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Update designation mapping failed:', error);
      return { success: false, message: error.message };
    }
  }

  async deleteDesignationMapping(mappingId) {
    try {
      const response = await apiService.delete(`/admin/designation-mappings/${mappingId}`);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Delete designation mapping failed:', error);
      return { success: false, message: error.message };
    }
  }

  async getAvailableRoles() {
    try {
      const response = await apiService.get('/admin/available-roles');
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Get available roles failed:', error);
      return { success: false, message: error.message };
    }
  }
}

// Create singleton instance
const adminService = new AdminService();

export default adminService;