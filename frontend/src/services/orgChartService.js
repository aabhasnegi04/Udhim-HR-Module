import apiService from './api';

class OrgChartService {
  // Get organization hierarchy
  async getOrganizationHierarchy() {
    try {
      const response = await apiService.get('/orgchart/hierarchy');
      if (response.success) {
        return { success: true, data: response.data.employees };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get organization hierarchy failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Search employees
  async searchEmployees(searchTerm) {
    try {
      const response = await apiService.get(`/orgchart/search?q=${encodeURIComponent(searchTerm)}`);
      if (response.success) {
        return { success: true, data: response.data.employees };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Search employees failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const orgChartService = new OrgChartService();

export default orgChartService;
