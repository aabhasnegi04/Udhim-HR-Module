import apiService from './api';

class AuthService {
  // Login user
  async login(email, password) {
    try {
      const companyCode = import.meta.env.VITE_COMPANY_CODE;
      
      const response = await apiService.post('/auth/multi-tenant/login', {
        email,
        password,
        company_code: companyCode,
      });

      if (response.success) {
        const { access_token, user, requires_password_change, profile_switching } = response.data;
        
        // Set token in API service (now uses sessionStorage)
        apiService.setToken(access_token);
        
        // Store user data in sessionStorage
        const userData = {
          email: user.email,
          name: user.email.split('@')[0],
          role: user.role,
          role_name: user.role_name,
          user_id: user.user_id,
          employee_id: user.employee_id,
          employee_status: user.employee_status,
          user_is_active: user.user_is_active,
          company_code: user.company_code,
          company_name: user.company_name || null,
          profile_switching: profile_switching
        };
        
        sessionStorage.setItem('hrms_user', JSON.stringify(userData));
        
        const result = { 
          success: true, 
          user: userData,
          requires_password_change: requires_password_change || false
        };
        
        return result;
      }
      
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  }

  // Get current user info
  async getCurrentUser() {
    try {
      const response = await apiService.get('/auth/multi-tenant/me');
      
      if (response.success) {
        return { success: true, user: response.data.user };
      }
      
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Get current user failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Logout user
  async logout() {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      // Clear session storage regardless of API response
      apiService.setToken(null);
      sessionStorage.removeItem('hrms_user');
      sessionStorage.removeItem('hrms_session_active');
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('hrms_token');
    const user = sessionStorage.getItem('hrms_user');
    return !!(token && user);
  }

  // Get stored user data
  getStoredUser() {
    const userData = sessionStorage.getItem('hrms_user');
    return userData ? JSON.parse(userData) : null;
  }

  // Change password
  async changePassword(currentPassword, newPassword, confirmPassword) {
    try {
      const response = await apiService.post('/auth/multi-tenant/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (response.success) {
        return { success: true, message: response.message };
      }
      
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Change password failed:', error);
      return { success: false, error: error.message || 'Password change failed' };
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;