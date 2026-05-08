import apiService from './api';

class AttendanceService {
  // FACE RECOGNITION / RAW LOGGING
  async markFaceAttendance(attendanceData) {
    try {
      const response = await apiService.post('/attendance/face-log', attendanceData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Mark face attendance failed:', error);
      return { success: false, error: error.message };
    }
  }

  // DAILY ATTENDANCE GENERATION
  async generateDailyAttendance(attendanceDate = null) {
    try {
      const payload = attendanceDate ? { attendance_date: attendanceDate } : {};
      const response = await apiService.post('/attendance/generate-daily', payload);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Generate daily attendance failed:', error);
      return { success: false, error: error.message };
    }
  }

  // MANUAL ATTENDANCE
  async markManualAttendance(attendanceData) {
    try {
      const response = await apiService.post('/attendance/manual', attendanceData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Mark manual attendance failed:', error);
      return { success: false, error: error.message };
    }
  }

  // VIEW ATTENDANCE
  async getEmployeeAttendance(employeeId) {
    try {
      const response = await apiService.get(`/attendance/employee/${employeeId}`);
      if (response.success) {
        return { success: true, data: response.data.attendance_records };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get employee attendance failed:', error);
      return { success: false, error: error.message };
    }
  }

  // REGULARIZATION WORKFLOW
  async applyRegularization(regularizationData) {
    try {
      const response = await apiService.post('/attendance/regularize', regularizationData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Apply regularization failed:', error);
      return { success: false, error: error.message };
    }
  }

  async approveRegularization(requestId, approvalData) {
    try {
      const response = await apiService.put(`/attendance/regularize/${requestId}/approve`, approvalData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Approve regularization failed:', error);
      return { success: false, error: error.message };
    }
  }

  async rejectRegularization(requestId, rejectionData) {
    try {
      const response = await apiService.put(`/attendance/regularize/${requestId}/reject`, rejectionData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Reject regularization failed:', error);
      return { success: false, error: error.message };
    }
  }

  // DASHBOARD & REPORTS
  async getDashboardData(date = null) {
    try {
      // Always use the attendance dashboard endpoint for detailed attendance data
      const url = date ? `/attendance/dashboard?date=${date}` : '/attendance/dashboard';
      
      const response = await apiService.get(url);
      
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get dashboard data failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getCurrentlyPresent(date = null) {
    try {
      const url = date ? `/attendance/currently-present?date=${date}` : '/attendance/currently-present';
      
      const response = await apiService.get(url);
      
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get currently present failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllActiveEmployees() {
    try {
      const response = await apiService.get('/attendance/all-active-employees');
      
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get all active employees failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getAttendanceByDate(date) {
    try {
      const response = await apiService.get(`/attendance/date/${date}`);
      if (response.success) {
        return { success: true, data: response.data.attendance_records || [] };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get attendance by date failed:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async getAttendanceByDateRange(startDate, endDate, employeeId = null, workerCategory = null, department = null) {
    try {
      let url = `/attendance/reports/date-range?start_date=${startDate}&end_date=${endDate}`;
      if (employeeId) {
        url += `&employee_id=${employeeId}`;
      }
      if (workerCategory) {
        url += `&worker_category=${workerCategory}`;
      }
      if (department) {
        url += `&department=${encodeURIComponent(department)}`;
      }
      
      const response = await apiService.get(url);
      
      if (response.success) {
        return { success: true, data: response.data.attendance_records };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get attendance by date range failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getPendingRegularizations() {
    try {
      const response = await apiService.get('/attendance/regularizations/pending');
      if (response.success) {
        return { success: true, data: response.data.regularization_requests };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get pending regularizations failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getMyRegularizations(employeeId) {
    try {
      // Use the new employee-specific endpoint
      const response = await apiService.get('/attendance/regularizations/my');
      if (response.success) {
        return { success: true, data: response.data.regularization_requests || [] };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get my regularizations failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getMonthlyAttendanceSummary(year, month, employeeId = null) {
    try {
      let url = `/attendance/reports/monthly-summary?year=${year}&month=${month}`;
      if (employeeId) {
        url += `&employee_id=${employeeId}`;
      }
      const response = await apiService.get(url);
      if (response.success) {
        return { success: true, data: response.data.monthly_summary };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get monthly attendance summary failed:', error);
      return { success: false, error: error.message };
    }
  }

  // UTILITY METHODS
  formatDate(date) {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  }

  validateAttendanceData(data) {
    const errors = [];
    
    if (!data.employee_id) {
      errors.push('Employee ID is required');
    }
    
    if (!data.attendance_date) {
      errors.push('Attendance date is required');
    }
    
    if (!data.status) {
      errors.push('Status is required');
    }
    
    const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'WFH', 'HOLIDAY'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateRegularizationData(data) {
    const errors = [];
    
    if (!data.employee_id) {
      errors.push('Employee ID is required');
    }
    
    if (!data.attendance_date) {
      errors.push('Attendance date is required');
    }
    
    if (!data.requested_status) {
      errors.push('Requested status is required');
    }
    
    if (!data.reason) {
      errors.push('Reason is required');
    }
    
    const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'WFH'];
    if (data.requested_status && !validStatuses.includes(data.requested_status)) {
      errors.push(`Requested status must be one of: ${validStatuses.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // FACE RECOGNITION ATTENDANCE
  async markFaceAttendance(imageBase64, attendanceType) {
    try {
      const response = await apiService.post('/attendance/mark-face', {
        image: imageBase64,
        type: attendanceType
      });
      if (response.success) {
        return { success: true, data: response.data, message: response.message };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Mark face attendance failed:', error);
      return { success: false, error: error.message };
    }
  }

  async registerEmployeeFace(employeeId, imageBase64) {
    try {
      const response = await apiService.post('/attendance/register-face', {
        employee_id: employeeId,
        image: imageBase64
      });
      if (response.success) {
        return { success: true, data: response.data, message: response.message };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Register face failed:', error);
      return { success: false, error: error.message };
    }
  }

  async checkFaceRegistrationStatus(employeeId) {
    try {
      const response = await apiService.get(`/attendance/face-status/${employeeId}`);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Check face status failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getTodayAttendanceStatus(employeeId) {
    try {
      const response = await apiService.get(`/attendance/today-status/${employeeId}`);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get today status failed:', error);
      return { success: false, error: error.message };
    }
  }

  // BULK UPLOAD
  async bulkUploadAttendance(file) {
    try {
      const token = sessionStorage.getItem('hrms_token');
      const companyCode = import.meta.env.VITE_COMPANY_CODE;
      const currentView = localStorage.getItem('preferred_view') || 'HR';
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Current-View': currentView
      };
      
      if (companyCode) {
        headers['X-Company-Code'] = companyCode;
      }

      // Use fetch directly for file upload
      const response = await fetch(`${apiService.baseURL}/attendance/bulk-upload`, {
        method: 'POST',
        headers,
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return { 
          success: true, 
          data: {
            total_rows: result.data.total_rows,
            successful_rows: result.data.successful_rows,
            failed_rows: result.data.failed_rows,
            errors: result.data.errors || [],
            date_range: result.data.date_range || null
          }
        };
      }
      
      return { success: false, error: result.message || 'Failed to upload file' };
    } catch (error) {
      console.error('Bulk upload failed:', error);
      return { success: false, error: error.message };
    }
  }

  async downloadBulkUploadTemplate() {
    try {
      const token = sessionStorage.getItem('hrms_token');
      const companyCode = import.meta.env.VITE_COMPANY_CODE;
      const currentView = localStorage.getItem('preferred_view') || 'HR';
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Current-View': currentView
      };
      
      if (companyCode) {
        headers['X-Company-Code'] = companyCode;
      }
      
      // Use fetch directly for file download — use the rich admin template (dropdowns, validations)
      const response = await fetch(`${apiService.baseURL}/admin/bulk-upload/template/attendance`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to download template' }));
        throw new Error(errorData.message || 'Failed to download template');
      }

      // Get the blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Template download failed:', error);
      return { success: false, error: error.message };
    }
  }
  // EDIT ATTENDANCE (HR ONLY)
  async editAttendanceRecord(attendanceId, updateData) {
    try {
      const response = await apiService.put(`/attendance/edit/${attendanceId}`, updateData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Edit attendance record failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const attendanceService = new AttendanceService();

export default attendanceService;


// ============================================================================
// KIOSK ENDPOINTS
// ============================================================================

/**
 * Verify kiosk PIN
 */
export const verifyKioskPin = async (kioskId, pin) => {
  try {
    const response = await apiService.post('/attendance/kiosk/verify-pin', {
      kiosk_id: kioskId,
      pin: pin
    });
    return response;
  } catch (error) {
    console.error('Verify kiosk PIN error:', error);
    throw error;
  }
};

/**
 * Mark attendance via kiosk
 */
export const markKioskAttendance = async (kioskId, imageData) => {
  try {
    const response = await apiService.post(`/attendance/kiosk/${kioskId}/mark-attendance`, {
      image: imageData
    });
    return response;
  } catch (error) {
    console.error('Mark kiosk attendance error:', error);
    throw error;
  }
};

/**
 * Get today's logs for kiosk
 */
export const getKioskTodayLogs = async (kioskId) => {
  try {
    const response = await apiService.get(`/attendance/kiosk/${kioskId}/today-logs`);
    return response;
  } catch (error) {
    console.error('Get kiosk logs error:', error);
    throw error;
  }
};

/**
 * Get kiosk settings
 */
export const getKioskSettings = async (kioskId) => {
  try {
    const response = await apiService.get(`/attendance/kiosk/${kioskId}/settings`);
    return response;
  } catch (error) {
    console.error('Get kiosk settings error:', error);
    throw error;
  }
};

/**
 * List all kiosks (HR only)
 */
export const listKiosks = async () => {
  try {
    const response = await apiService.get('/attendance/kiosk/list');
    return response;
  } catch (error) {
    console.error('List kiosks error:', error);
    throw error;
  }
};


/**
 * Create new kiosk (HR only)
 */
export const createKiosk = async (kioskName, kioskLocation, kioskPin) => {
  try {
    const response = await apiService.post('/attendance/kiosk/create', {
      kiosk_name: kioskName,
      kiosk_location: kioskLocation,
      kiosk_pin: kioskPin
    });
    return response;
  } catch (error) {
    console.error('Create kiosk error:', error);
    throw error;
  }
};

/**
 * Update kiosk settings
 */
export const updateKiosk = async (kioskId, kioskName, kioskLocation, kioskPin = null) => {
  try {
    const payload = {
      kiosk_name: kioskName,
      kiosk_location: kioskLocation
    };
    
    if (kioskPin) {
      payload.kiosk_pin = kioskPin;
    }
    
    const response = await apiService.put(`/attendance/kiosk/${kioskId}/update`, payload);
    return response;
  } catch (error) {
    console.error('Update kiosk error:', error);
    throw error;
  }
};

// Kiosk functions are exported individually above
// They can be imported like: import { verifyKioskPin, markKioskAttendance } from './attendanceService'


// ============================================================================
// DAILY DEPARTMENT ASSIGNMENT
// ============================================================================

/**
 * Get daily department assignments for a specific date
 */
export const getDailyDepartmentAssignments = async (date, searchText = null, filterDepartment = null, employeeStatus = 'ACTIVE') => {
  try {
    let url = `/attendance/daily-department-assignments?date=${date}`;
    if (searchText) url += `&search=${encodeURIComponent(searchText)}`;
    if (filterDepartment && filterDepartment !== 'ALL') url += `&department=${encodeURIComponent(filterDepartment)}`;
    if (employeeStatus && employeeStatus !== 'ALL') url += `&status=${encodeURIComponent(employeeStatus)}`;
    
    const response = await apiService.get(url);
    return response;
  } catch (error) {
    console.error('Get daily department assignments error:', error);
    throw error;
  }
};

/**
 * Change department for single or multiple employees
 */
export const changeEmployeeDepartment = async (data) => {
  try {
    const response = await apiService.post('/attendance/change-department', data);
    return response;
  } catch (error) {
    console.error('Change employee department error:', error);
    throw error;
  }
};

/**
 * Get department change history for an employee
 */
export const getEmployeeDepartmentHistory = async (employeeId, limit = 50) => {
  try {
    const response = await apiService.get(`/attendance/department-history/${employeeId}?limit=${limit}`);
    return response;
  } catch (error) {
    console.error('Get employee department history error:', error);
    throw error;
  }
};

/**
 * Get list of all departments
 */
export const getDepartmentList = async () => {
  try {
    const response = await apiService.get('/attendance/departments');
    return response;
  } catch (error) {
    console.error('Get department list error:', error);
    throw error;
  }
};
