// Quick test for employee service
import employeeService from '../services/employeeService.js';

export const testEmployeeService = async () => {
  console.log('🧪 Testing Employee Service...');
  
  try {
    // Test getEmployees method
    const result = await employeeService.getEmployees();
    
    if (result.success) {
      console.log('✅ Employee Service Working!');
      console.log(`📊 Found ${result.data.length} employees`);
      
      if (result.isMockData) {
        console.log('⚠️ Using mock data (API not available)');
      } else {
        console.log('✅ Using real API data');
      }
      
      // Show sample employee
      if (result.data.length > 0) {
        console.log('👤 Sample employee:', result.data[0]);
      }
      
      return result;
    } else {
      console.log('❌ Employee Service Failed:', result.error);
      return result;
    }
  } catch (error) {
    console.log('❌ Employee Service Error:', error.message);
    return { success: false, error: error.message };
  }
};

// Make it available in browser console
if (typeof window !== 'undefined') {
  window.testEmployeeService = testEmployeeService;
}