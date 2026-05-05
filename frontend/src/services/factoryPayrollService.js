import api from './api';

const factoryPayrollService = {
  // ============================================
  // RATE MANAGEMENT
  // ============================================
  
  // Get all factory workers with their rates
  getAllWorkersWithRates: async () => {
    const response = await api.get('/factory-payroll/workers-with-rates');
    return response;
  },

  // Assign rate to a worker
  assignWorkerRate: async (employeeId, dailyRate, effectiveFrom) => {
    const response = await api.post('/factory-payroll/rates/assign', {
      employee_id: employeeId,
      daily_rate: dailyRate,
      effective_from: effectiveFrom
    });
    return response;
  },

  // Get current rate for a worker
  getWorkerCurrentRate: async (employeeId, asOfDate = null) => {
    const params = asOfDate ? { as_of_date: asOfDate } : {};
    const response = await api.get(`/factory-payroll/rates/current/${employeeId}`, { params });
    return response;
  },

  // Get rate history for a worker
  getWorkerRateHistory: async (employeeId) => {
    const response = await api.get(`/factory-payroll/rates/history/${employeeId}`);
    return response;
  },

  // Bulk assign rates
  bulkAssignRates: async (rates, effectiveFrom) => {
    const response = await api.post('/factory-payroll/rates/bulk-assign', {
      rates,
      effective_from: effectiveFrom
    });
    return response;
  },

  // Get rate statistics
  getRateStatistics: async () => {
    const response = await api.get('/factory-payroll/rates/statistics');
    return response;
  },

  // ============================================
  // PAYROLL CONFIGURATION
  // ============================================
  
  // Get payroll configuration
  getPayrollConfig: async () => {
    const response = await api.get('/factory-payroll/config');
    return response;
  },

  // Update payroll configuration
  updatePayrollConfig: async (config) => {
    const response = await api.put('/factory-payroll/config', config);
    return response;
  },

  // ============================================
  // PAYROLL PERIODS
  // ============================================
  
  // Get all payroll periods
  getPayrollPeriods: async () => {
    const response = await api.get('/factory-payroll/periods');
    return response;
  },

  // Create new payroll period
  createPayrollPeriod: async (year, month) => {
    const response = await api.post('/factory-payroll/periods', {
      year,
      month
    });
    return response;
  },

  // ============================================
  // PAYROLL CALCULATION
  // ============================================
  
  // Calculate payroll for a period
  calculatePayroll: async (periodId) => {
    const response = await api.post('/factory-payroll/calculate', {
      period_id: periodId
    });
    return response;
  },

  // Get payroll summary for a period
  getPayrollSummary: async (periodId) => {
    const response = await api.get(`/factory-payroll/summary/${periodId}`);
    return response;
  },

  // Lock payroll period
  lockPayrollPeriod: async (periodId) => {
    const response = await api.post('/factory-payroll/lock', {
      period_id: periodId
    });
    return response;
  }
};

export default factoryPayrollService;
