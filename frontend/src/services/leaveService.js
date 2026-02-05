import apiService from './api';

class LeaveService {
  // ========================================================================
  // LEAVE TYPES (MASTER DATA)
  // ========================================================================

  async getLeaveTypes() {
    try {
      const response = await apiService.get('/leave/types');
      if (response.success) {
        return { success: true, data: response.data.leave_types };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get leave types failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getLeaveTypesForEmployee(employeeId) {
    try {
      const response = await apiService.get(`/leave/types/employee/${employeeId}`);
      if (response.success) {
        return { success: true, data: response.data.leave_types };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get leave types for employee failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================================================
  // LEAVE BALANCE MANAGEMENT (HR ONLY)
  // ========================================================================

  async allocateLeaveBalance(balanceData) {
    try {
      const response = await apiService.post('/leave/balance/allocate', balanceData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Allocate leave balance failed:', error);
      return { success: false, error: error.message };
    }
  }

  async adjustLeaveBalance(balanceId, adjustment, reason) {
    try {
      const response = await apiService.put(`/leave/balance/${balanceId}/adjust`, {
        adjustment,
        reason
      });
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Adjust leave balance failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getLeaveBalances(employeeId, year = null) {
    try {
      const url = year 
        ? `/leave/balance/employee/${employeeId}?year=${year}`
        : `/leave/balance/employee/${employeeId}`;
      
      const response = await apiService.get(url);
      if (response.success) {
        return { success: true, data: response.data.balances };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get leave balances failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================================================
  // LEAVE APPLICATION (EMPLOYEE)
  // ========================================================================

  async applyLeave(leaveData) {
    try {
      const response = await apiService.post('/leave/apply', leaveData);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Apply leave failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================================================
  // APPROVAL WORKFLOW
  // ========================================================================

  async managerApproveLeave(requestId, comment = null) {
    try {
      const response = await apiService.put(`/leave/${requestId}/approve/manager`, {
        comment
      });
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Manager approve leave failed:', error);
      return { success: false, error: error.message };
    }
  }

  async hrApproveLeave(requestId, comment = null) {
    try {
      const response = await apiService.put(`/leave/${requestId}/approve/hr`, {
        comment
      });
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('HR approve leave failed:', error);
      return { success: false, error: error.message };
    }
  }

  async rejectLeave(requestId, comment) {
    try {
      const response = await apiService.put(`/leave/${requestId}/reject`, {
        comment
      });
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Reject leave failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================================================
  // CANCEL LEAVE
  // ========================================================================

  async cancelLeave(requestId) {
    try {
      const response = await apiService.put(`/leave/${requestId}/cancel`);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Cancel leave failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================================================
  // REPORTING
  // ========================================================================

  async getMyLeaves(year = null) {
    try {
      const url = year ? `/leave/my?year=${year}` : '/leave/my';
      const response = await apiService.get(url);
      
      if (response.success) {
        return { success: true, data: response.data.leaves };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get my leaves failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getEmployeeLeaves(employeeId, year = null) {
    try {
      const url = year 
        ? `/leave/employee/${employeeId}?year=${year}`
        : `/leave/employee/${employeeId}`;
      
      const response = await apiService.get(url);
      if (response.success) {
        return { success: true, data: response.data.leaves };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get employee leaves failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getDepartmentLeaves(department, year = null) {
    try {
      const url = year 
        ? `/leave/department/${department}?year=${year}`
        : `/leave/department/${department}`;
      
      const response = await apiService.get(url);
      if (response.success) {
        return { success: true, data: response.data.leaves };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get department leaves failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getLeaveRegister(startDate = null, endDate = null, status = null) {
    try {
      let url = '/leave/register?';
      const params = [];
      
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (status) params.push(`status=${status}`);
      
      url += params.join('&');
      
      const response = await apiService.get(url);
      if (response.success) {
        return { success: true, data: response.data.leaves };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get leave register failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getPendingLeaves() {
    try {
      const response = await apiService.get('/leave/pending');
      if (response.success) {
        return { success: true, data: response.data.leaves };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get pending leaves failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  formatDate(date) {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  }

  calculateLeaveDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  getStatusColor(status) {
    const statusColors = {
      'PENDING': 'warning',
      'MANAGER_APPROVED': 'info',
      'HR_APPROVED': 'success',
      'REJECTED': 'error',
      'CANCELLED': 'default'
    };
    return statusColors[status] || 'default';
  }

  getStatusLabel(status) {
    const statusLabels = {
      'PENDING': 'Pending',
      'MANAGER_APPROVED': 'Manager Approved',
      'HR_APPROVED': 'Approved',
      'REJECTED': 'Rejected',
      'CANCELLED': 'Cancelled'
    };
    return statusLabels[status] || status;
  }
}

// Create singleton instance
const leaveService = new LeaveService();

export default leaveService;
