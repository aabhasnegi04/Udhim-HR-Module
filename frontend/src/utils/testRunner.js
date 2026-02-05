// HRMS System Test Runner
// Run this in browser console to test API connectivity and basic functionality

class HRMSTestRunner {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.token = localStorage.getItem('hrms_token');
    this.results = [];
  }

  // Get authorization headers
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  // Log test result
  logResult(testName, success, data = null, error = null) {
    const result = {
      test: testName,
      success,
      timestamp: new Date().toISOString(),
      data,
      error: error?.message || error
    };
    
    this.results.push(result);
    
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}`);
    
    if (error) {
      console.error(`   Error: ${error.message || error}`);
    }
    
    if (data && success) {
      console.log(`   Response:`, data);
    }
  }

  // Test API endpoint
  async testAPI(endpoint, method = 'GET', body = null, testName = null) {
    const name = testName || `${method} ${endpoint}`;
    
    try {
      const options = {
        method,
        headers: this.getHeaders()
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(`${this.baseURL}${endpoint}`, options);
      const data = await response.json();
      
      if (response.ok && data.success !== false) {
        this.logResult(name, true, data);
        return { success: true, data };
      } else {
        this.logResult(name, false, data, data.message || 'API returned error');
        return { success: false, error: data.message || 'API error' };
      }
    } catch (error) {
      this.logResult(name, false, null, error);
      return { success: false, error };
    }
  }

  // Test Phase 2.5 - Admin APIs
  async testAdminAPIs() {
    console.log('\n🔧 Testing Phase 2.5 - Admin Master APIs...\n');
    
    const tests = [
      { endpoint: '/admin/departments', name: 'Get Departments' },
      { endpoint: '/admin/designations', name: 'Get Designations' },
      { endpoint: '/admin/locations', name: 'Get Locations' },
      { endpoint: '/admin/holidays', name: 'Get Holidays' },
      { endpoint: '/admin/leave-types', name: 'Get Leave Types' },
      { endpoint: '/admin/salary-structures', name: 'Get Salary Structures' }
    ];
    
    for (const test of tests) {
      await this.testAPI(test.endpoint, 'GET', null, test.name);
    }
  }

  // Test Phase 3 - Attendance APIs
  async testAttendanceAPIs() {
    console.log('\n📊 Testing Phase 3 - Attendance Management APIs...\n');
    
    const tests = [
      { endpoint: '/attendance/dashboard', name: 'Get Dashboard Data' },
      { endpoint: '/attendance/employee/1', name: 'Get Employee Attendance' },
      { endpoint: '/attendance/regularizations/pending', name: 'Get Pending Regularizations' },
      { endpoint: '/attendance/reports/monthly-summary?year=2024&month=1', name: 'Get Monthly Summary' },
      { endpoint: '/attendance/reports/date-range?start_date=2024-01-01&end_date=2024-01-31', name: 'Get Date Range Report' }
    ];
    
    for (const test of tests) {
      await this.testAPI(test.endpoint, 'GET', null, test.name);
    }
  }

  // Test POST operations (Create operations)
  async testCreateOperations() {
    console.log('\n➕ Testing Create Operations...\n');
    
    // Test create department
    const deptData = {
      name: `Test Department ${Date.now()}`,
      description: 'Test department created by automated test'
    };
    await this.testAPI('/admin/departments', 'POST', deptData, 'Create Department');
    
    // Test manual attendance
    const attendanceData = {
      employee_id: 1,
      attendance_date: new Date().toISOString().split('T')[0],
      status: 'PRESENT'
    };
    await this.testAPI('/attendance/manual', 'POST', attendanceData, 'Mark Manual Attendance');
    
    // Test regularization request
    const regularizationData = {
      employee_id: 1,
      attendance_date: '2024-01-15',
      requested_status: 'PRESENT',
      reason: 'Test regularization request'
    };
    await this.testAPI('/attendance/regularize', 'POST', regularizationData, 'Apply Regularization');
  }

  // Test authentication
  async testAuthentication() {
    console.log('\n🔐 Testing Authentication...\n');
    
    if (!this.token) {
      this.logResult('JWT Token Check', false, null, 'No token found in localStorage');
      return false;
    }
    
    this.logResult('JWT Token Check', true, { tokenLength: this.token.length });
    
    // Test a protected endpoint to verify token validity
    await this.testAPI('/admin/departments', 'GET', null, 'Token Validation');
    
    return true;
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting HRMS System Tests...\n');
    console.log('='.repeat(50));
    
    this.results = [];
    const startTime = Date.now();
    
    // Test authentication first
    const authValid = await this.testAuthentication();
    
    if (!authValid) {
      console.log('\n❌ Authentication failed. Please login first.');
      return this.generateReport();
    }
    
    // Run all test suites
    await this.testAdminAPIs();
    await this.testAttendanceAPIs();
    await this.testCreateOperations();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n' + '='.repeat(50));
    console.log(`🏁 Tests completed in ${duration}ms`);
    
    return this.generateReport();
  }

  // Generate test report
  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
    
    console.log('\n📊 TEST REPORT SUMMARY');
    console.log('='.repeat(30));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Pass Rate: ${passRate}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   • ${r.test}: ${r.error}`);
        });
    }
    
    console.log('\n💡 Recommendations:');
    if (failedTests === 0) {
      console.log('   🎉 All tests passed! System is working correctly.');
    } else if (passRate >= 80) {
      console.log('   ⚠️  Most tests passed. Check failed tests for minor issues.');
    } else if (passRate >= 50) {
      console.log('   🔧 Several tests failed. Check backend connectivity and API endpoints.');
    } else {
      console.log('   🚨 Many tests failed. Verify backend is running and properly configured.');
    }
    
    return {
      totalTests,
      passedTests,
      failedTests,
      passRate,
      results: this.results
    };
  }

  // Quick health check
  async quickHealthCheck() {
    console.log('🏥 Quick Health Check...\n');
    
    const healthTests = [
      { endpoint: '/admin/departments', name: 'Admin API Health' },
      { endpoint: '/attendance/dashboard', name: 'Attendance API Health' }
    ];
    
    for (const test of healthTests) {
      await this.testAPI(test.endpoint, 'GET', null, test.name);
    }
    
    return this.generateReport();
  }
}

// Create global instance for browser console use
const testRunner = new HRMSTestRunner();

// Export functions for browser console
if (typeof window !== 'undefined') {
  window.testRunner = testRunner;
  window.runAllTests = () => testRunner.runAllTests();
  window.quickHealthCheck = () => testRunner.quickHealthCheck();
  window.testAdminAPIs = () => testRunner.testAdminAPIs();
  window.testAttendanceAPIs = () => testRunner.testAttendanceAPIs();
  
  console.log('🧪 HRMS Test Runner loaded!');
  console.log('Available commands:');
  console.log('  • runAllTests() - Run complete test suite');
  console.log('  • quickHealthCheck() - Quick API health check');
  console.log('  • testAdminAPIs() - Test admin APIs only');
  console.log('  • testAttendanceAPIs() - Test attendance APIs only');
}

export default HRMSTestRunner;