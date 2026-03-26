import apiService from './api';

class DashboardService {
  // Get HR Dashboard stats
  async getHRDashboardStats(date = null) {
    try {
      const url = date ? `/dashboard/hr-stats?date=${date}` : '/dashboard/hr-stats';
      const response = await apiService.get(url);
      return response;
    } catch (error) {
      console.error('Get HR dashboard stats failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get HR recent activities
  async getHRRecentActivities(limit = 10) {
    try {
      const response = await apiService.get(`/dashboard/hr-recent-activities?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Get HR recent activities failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get Manager Dashboard stats
  async getManagerDashboardStats() {
    try {
      const response = await apiService.get('/dashboard/manager-stats');
      return response;
    } catch (error) {
      console.error('Get manager dashboard stats failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get HR alerts (needs attention)
  async getHRAlerts() {
    try {
      const response = await apiService.get('/dashboard/hr-alerts');
      return response;
    } catch (error) {
      console.error('Get HR alerts failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get 7-day attendance trend
  async getHRAttendanceTrend() {
    try {
      const response = await apiService.get('/dashboard/hr-attendance-trend');
      return response;
    } catch (error) {
      console.error('Get HR attendance trend failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get Employee Dashboard stats
  async getEmployeeDashboardStats() {
    try {
      const response = await apiService.get('/dashboard/employee-stats');
      return response;
    } catch (error) {
      console.error('Get employee dashboard stats failed:', error);
      return { success: false, error: error.message };
    }
  }
  // Get recent activities
  async getRecentActivities() {
    try {
      const response = await apiService.get('/dashboard/recent-activities');
      return response;
    } catch (error) {
      console.error('Get recent activities failed:', error);
      return { success: false, error: error.message };
    }
  }
}

const dashboardService = new DashboardService();
export default dashboardService;
