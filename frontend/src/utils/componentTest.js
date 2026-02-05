// Simple component test utility to check for basic rendering errors
// This can be run in the browser console to test components

// Test if a component can be imported and has basic structure
export const testComponentImport = async (componentPath) => {
  try {
    const component = await import(componentPath);
    console.log(`✅ ${componentPath} imported successfully`);
    return { success: true, component };
  } catch (error) {
    console.error(`❌ ${componentPath} import failed:`, error);
    return { success: false, error };
  }
};

// Test basic component structure
export const testComponentStructure = (component) => {
  try {
    if (typeof component.default === 'function') {
      console.log('✅ Component is a valid React function component');
      return { success: true };
    } else {
      console.log('❌ Component is not a valid React function component');
      return { success: false, error: 'Not a function component' };
    }
  } catch (error) {
    console.error('❌ Component structure test failed:', error);
    return { success: false, error };
  }
};

// Run all attendance component tests
export const testAttendanceComponents = async () => {
  console.log('🧪 Testing Attendance Components...\n');
  
  const components = [
    '../pages/Attendance/AttendanceDashboard.jsx',
    '../pages/Attendance/ManualAttendance.jsx',
    '../pages/Attendance/Regularization.jsx',
    '../pages/Attendance/AttendanceTable.jsx',
    '../pages/Attendance/AttendanceReports.jsx'
  ];
  
  const results = [];
  
  for (const componentPath of components) {
    console.log(`Testing ${componentPath}...`);
    const importResult = await testComponentImport(componentPath);
    
    if (importResult.success) {
      const structureResult = testComponentStructure(importResult.component);
      results.push({
        path: componentPath,
        import: importResult.success,
        structure: structureResult.success,
        overall: importResult.success && structureResult.success
      });
    } else {
      results.push({
        path: componentPath,
        import: false,
        structure: false,
        overall: false,
        error: importResult.error
      });
    }
    console.log('---');
  }
  
  console.log('\n📊 Test Results Summary:');
  results.forEach(result => {
    const status = result.overall ? '✅' : '❌';
    console.log(`${status} ${result.path}: ${result.overall ? 'PASS' : 'FAIL'}`);
    if (result.error) {
      console.log(`   Error: ${result.error.message || result.error}`);
    }
  });
  
  const passCount = results.filter(r => r.overall).length;
  console.log(`\n🎯 Overall: ${passCount}/${results.length} components passed`);
  
  return results;
};

// Export for browser console use
if (typeof window !== 'undefined') {
  window.testAttendanceComponents = testAttendanceComponents;
  window.testComponentImport = testComponentImport;
  window.testComponentStructure = testComponentStructure;
}