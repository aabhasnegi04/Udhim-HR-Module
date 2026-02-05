import apiService from './api';

class EmployeeService {
  // GET ALL EMPLOYEES (alias for compatibility)
  async getEmployees() {
    return this.getAllEmployees();
  }

  // GET ALL EMPLOYEES
  async getAllEmployees() {
    try {
      const response = await apiService.get('/employees');
      if (response.success) {
        return { success: true, data: response.data.employees };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get all employees failed:', error);
      return { success: false, error: error.message };
    }
  }

  // GET ONLY ACTIVE EMPLOYEES (for attendance operations)
  async getActiveEmployees() {
    try {
      const response = await apiService.get('/employees/active');
      if (response.success) {
        return { success: true, data: response.data.employees };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get active employees failed:', error);
      return { success: false, error: error.message };
    }
  }

  // GET EMPLOYEE BY ID
  async getEmployeeById(employeeId) {
    try {
      const response = await apiService.get(`/employees/${employeeId}`);
      if (response.success) {
        return { success: true, data: response.data.employee };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get employee by ID failed:', error);
      return { success: false, error: error.message };
    }
  }

  // SEARCH EMPLOYEES
  async searchEmployees(query) {
    try {
      const response = await apiService.get(`/employees/search?q=${encodeURIComponent(query)}`);
      if (response.success) {
        return { success: true, data: response.data.employees };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Search employees failed:', error);
      return { success: false, error: error.message };
    }
  }

  // GET EMPLOYEES BY DEPARTMENT
  async getEmployeesByDepartment(departmentId) {
    try {
      const response = await apiService.get(`/employees/department/${departmentId}`);
      if (response.success) {
        return { success: true, data: response.data.employees };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get employees by department failed:', error);
      return { success: false, error: error.message };
    }
  }

  // MOCK DATA FALLBACK
  getMockEmployees() {
    return [
      { 
        id: 1, 
        employee_id: 1,
        employee_code: 'EMP001', 
        employee_name: 'John Smith', 
        email: 'john.smith@company.com',
        department: 'Engineering', 
        designation: 'Senior Developer',
        status: 'ACTIVE',
        join_date: '2023-01-15',
        phone: '+1-555-0101'
      },
      { 
        id: 2, 
        employee_id: 2,
        employee_code: 'EMP002', 
        employee_name: 'Sarah Johnson', 
        email: 'sarah.johnson@company.com',
        department: 'Engineering', 
        designation: 'Engineering Manager',
        status: 'ACTIVE',
        join_date: '2022-03-10',
        phone: '+1-555-0102'
      },
      { 
        id: 3, 
        employee_id: 3,
        employee_code: 'EMP003', 
        employee_name: 'Mike Chen', 
        email: 'mike.chen@company.com',
        department: 'Engineering', 
        designation: 'DevOps Engineer',
        status: 'ACTIVE',
        join_date: '2023-06-20',
        phone: '+1-555-0103'
      },
      { 
        id: 4, 
        employee_id: 4,
        employee_code: 'EMP004', 
        employee_name: 'Lisa Anderson', 
        email: 'lisa.anderson@company.com',
        department: 'Marketing', 
        designation: 'Marketing Manager',
        status: 'ACTIVE',
        join_date: '2022-11-05',
        phone: '+1-555-0104'
      },
      { 
        id: 5, 
        employee_id: 5,
        employee_code: 'EMP005', 
        employee_name: 'Robert Wilson', 
        email: 'robert.wilson@company.com',
        department: 'Sales', 
        designation: 'Sales Executive',
        status: 'ACTIVE',
        join_date: '2023-02-28',
        phone: '+1-555-0105'
      },
      { 
        id: 6, 
        employee_id: 6,
        employee_code: 'EMP006', 
        employee_name: 'Emily Davis', 
        email: 'emily.davis@company.com',
        department: 'Human Resources', 
        designation: 'HR Specialist',
        status: 'ACTIVE',
        join_date: '2022-08-12',
        phone: '+1-555-0106'
      },
      { 
        id: 7, 
        employee_id: 7,
        employee_code: 'EMP007', 
        employee_name: 'David Martinez', 
        email: 'david.martinez@company.com',
        department: 'Engineering', 
        designation: 'Frontend Developer',
        status: 'ACTIVE',
        join_date: '2023-04-18',
        phone: '+1-555-0107'
      },
      { 
        id: 8, 
        employee_id: 8,
        employee_code: 'EMP008', 
        employee_name: 'Jennifer Taylor', 
        email: 'jennifer.taylor@company.com',
        department: 'Sales', 
        designation: 'VP Sales',
        status: 'ACTIVE',
        join_date: '2021-12-01',
        phone: '+1-555-0108'
      },
    ];
  }

  // CREATE EMPLOYEE
  async createEmployee(employeeData) {
    try {
      const response = await apiService.post('/employees', employeeData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Create employee failed:', error);
      return { success: false, error: error.message };
    }
  }

  // UPDATE EMPLOYEE
  async updateEmployee(employeeId, employeeData) {
    try {
      const response = await apiService.put(`/employees/${employeeId}`, employeeData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Update employee failed:', error);
      return { success: false, error: error.message };
    }
  }

  // DELETE EMPLOYEE
  async deleteEmployee(employeeId) {
    try {
      const response = await apiService.delete(`/employees/${employeeId}`);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Delete employee failed:', error);
      return { success: false, error: error.message };
    }
  }

  // UPLOAD EMPLOYEE PHOTO
  async uploadEmployeePhoto(employeeId, photoFile) {
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

      const response = await apiService.post(`/employees/${employeeId}/photo`, formData);

      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Upload employee photo failed:', error);
      return { success: false, error: error.message };
    }
  }

  // DELETE EMPLOYEE PHOTO
  async deleteEmployeePhoto(employeeId) {
    try {
      const response = await apiService.delete(`/employees/${employeeId}/photo`);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Delete employee photo failed:', error);
      return { success: false, error: error.message };
    }
  }

  // DEACTIVATE EMPLOYEE
  async deactivateEmployee(employeeId, reason = null) {
    try {
      const response = await apiService.post(`/employees/${employeeId}/deactivate`, {
        reason: reason
      });
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Deactivate employee failed:', error);
      return { success: false, error: error.message };
    }
  }

  // REACTIVATE EMPLOYEE
  async reactivateEmployee(employeeId, reason = null) {
    try {
      const response = await apiService.post(`/employees/${employeeId}/reactivate`, {
        reason: reason
      });
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Reactivate employee failed:', error);
      return { success: false, error: error.message };
    }
  }

  // GET EMPLOYEE STATUS HISTORY
  async getEmployeeStatusHistory(employeeId) {
    try {
      const response = await apiService.get(`/employees/${employeeId}/status-history`);
      if (response.success) {
        return { success: true, data: response.data.history };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get employee status history failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const employeeService = new EmployeeService();

export default employeeService;