// API Configuration and Base Service
// Automatically detect environment: production uses VITE_API_BASE from .env, local uses localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('hrms_token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('hrms_token', token);
    } else {
      localStorage.removeItem('hrms_token');
    }
  }

  // Get authentication headers
  getHeaders(isFormData = false) {
    // Always get the latest token from localStorage
    this.token = localStorage.getItem('hrms_token');
    
    const headers = {};

    // Don't set Content-Type for FormData - browser will set it with boundary
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    // Add company code header for multi-tenant support
    const companyCode = import.meta.env.VITE_COMPANY_CODE;
    if (companyCode) {
      headers['X-Company-Code'] = companyCode;
    }

    // Add current view header for profile switching
    const currentView = this.getCurrentView();
    if (currentView) {
      headers['X-Current-View'] = currentView;
    } else {
      headers['X-Current-View'] = 'EMPLOYEE';
    }

    return headers;
  }

  // Get current view from profile switching context
  getCurrentView() {
    try {
      // Check current URL path to determine appropriate view
      const currentPath = window.location.pathname;
      
      // HR-specific routes should always use HR view
      const hrRoutes = ['/payroll', '/employees', '/admin', '/dashboard'];
      const isHRRoute = hrRoutes.some(route => currentPath.startsWith(route));
      
      // Try to get from localStorage (where ProfileSwitchingContext stores it)
      const preferredView = localStorage.getItem('preferred_view');
      
      // If on HR route and no preferred view set, default to HR
      if (isHRRoute && !preferredView) {
        return 'HR';
      }
      
      if (preferredView) {
        return preferredView;
      }

      // Try to get from user data in sessionStorage
      const userData = sessionStorage.getItem('hrms_user');
      
      if (userData) {
        const user = JSON.parse(userData);
        
        if (user.profile_switching && user.profile_switching.default_view) {
          return user.profile_switching.default_view;
        }
      }

      // If on HR route, default to HR view
      if (isHRRoute) {
        return 'HR';
      }

      // Default to EMPLOYEE view
      return 'EMPLOYEE';
    } catch (error) {
      console.warn('Error getting current view:', error);
      return 'EMPLOYEE';
    }
  }

  // Generic API request method with retry logic
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.isFormData),
      ...options,
    };

    // Remove isFormData from config as it's not a valid fetch option
    delete config.isFormData;

    // Retry configuration
    const maxRetries = options.maxRetries || 2;
    const retryDelay = options.retryDelay || 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
          // Handle 401 Unauthorized or token expiration
          if (response.status === 401 || 
              (response.status === 500 && data.message && 
               (data.message.includes('Signature has expired') || 
                data.message.includes('Token has expired') ||
                data.message.includes('Invalid token')))) {
            console.warn('Token expired or invalid, logging out...');
            this.handleTokenExpiration();
            throw new Error('Session expired. Please login again.');
          }

          // For 500 errors, retry if we have attempts left
          if (response.status === 500 && attempt < maxRetries) {
            console.warn(`API Request failed with 500 error, retrying... (attempt ${attempt + 1}/${maxRetries + 1})`);
            await this.delay(retryDelay * (attempt + 1)); // Exponential backoff
            continue;
          }
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
      } catch (error) {
        // If it's a token expiration error, don't retry
        if (error.message.includes('Session expired')) {
          throw error;
        }

        // For network errors, retry if we have attempts left
        if (attempt < maxRetries && (error.name === 'TypeError' || error.message.includes('fetch'))) {
          console.warn(`Network error, retrying... (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);
          await this.delay(retryDelay * (attempt + 1));
          continue;
        }
        
        console.error('API Request failed:', error);
        throw error;
      }
    }
  }

  // Handle token expiration - clear session and redirect to login
  handleTokenExpiration() {
    // Clear all session data
    localStorage.removeItem('hrms_token');
    sessionStorage.removeItem('hrms_user');
    localStorage.removeItem('preferred_view');
    
    // Redirect to login page
    window.location.href = '/login';
  }

  // Helper method for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // GET request
  async get(endpoint, options = {}) {
    // Handle query parameters
    if (options.params) {
      const queryString = new URLSearchParams(options.params).toString();
      endpoint = `${endpoint}?${queryString}`;
      delete options.params; // Remove params from options as it's now in the URL
    }
    
    return this.request(endpoint, { method: 'GET', ...options });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    const isFormData = data instanceof FormData;
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      isFormData,
      ...options,
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;