import apiService from './api';

class HolidayService {
  // GET ALL HOLIDAYS FOR A YEAR (Public endpoint for all users)
  async getPublicHolidays(year = new Date().getFullYear()) {
    try {
      const response = await apiService.get(`/dashboard/holidays?year=${year}`);
      if (response.success) {
        return { success: true, data: response.data.holidays };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get public holidays failed:', error);
      return { success: false, error: error.message };
    }
  }

  // GET ALL HOLIDAYS FOR A YEAR (Admin endpoint - HR only)
  async getHolidaysByYear(year = new Date().getFullYear()) {
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

  // ADD NEW HOLIDAY
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

  // UPDATE HOLIDAY
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

  // DELETE HOLIDAY
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
}

// Create singleton instance
const holidayService = new HolidayService();

export default holidayService;
