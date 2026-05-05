import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, CircularProgress, MenuItem, TextField,
  Card, CardContent, Grid
} from '@mui/material';
import {
  Add as AddIcon, Calculate as CalculateIcon, Lock as LockIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import factoryPayrollService from '../../services/factoryPayrollService';

export default function PayrollPeriods() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [summary, setSummary] = useState([]);
  const [periodForm, setPeriodForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const response = await factoryPayrollService.getPayrollPeriods();
      if (response.success) {
        setPeriods(response.data || []);
      }
    } catch (err) {
      setError('Failed to load payroll periods');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePeriod = async () => {
    try {
      const response = await factoryPayrollService.createPayrollPeriod(
        periodForm.year,
        periodForm.month
      );

      if (response.success) {
        setSuccess('Payroll period created successfully');
        setCreateDialogOpen(false);
        fetchPeriods();
      } else {
        setError(response.message || 'Failed to create period');
      }
    } catch (err) {
      setError('Failed to create period');
    }
  };

  const handleCalculatePayroll = async (period) => {
    if (!confirm(`Calculate payroll for ${period.period_name}?`)) return;

    try {
      setCalculating(true);
      const response = await factoryPayrollService.calculatePayroll(period.period_id);

      if (response.success) {
        setSuccess(`Payroll calculated successfully for ${period.period_name}`);
        fetchPeriods();
      } else {
        setError(response.message || 'Failed to calculate payroll');
      }
    } catch (err) {
      setError('Failed to calculate payroll');
    } finally {
      setCalculating(false);
    }
  };

  const handleViewSummary = async (period) => {
    try {
      setSelectedPeriod(period);
      const response = await factoryPayrollService.getPayrollSummary(period.period_id);

      if (response.success) {
        setSummary(response.data || []);
        setSummaryDialogOpen(true);
      } else {
        setError('Failed to load summary');
      }
    } catch (err) {
      setError('Failed to load summary');
    }
  };

  const handleLockPeriod = async (period) => {
    if (!confirm(`Lock payroll period ${period.period_name}? This cannot be undone.`)) return;

    try {
      const response = await factoryPayrollService.lockPayrollPeriod(period.period_id);

      if (response.success) {
        setSuccess(`Period ${period.period_name} locked successfully`);
        fetchPeriods();
      } else {
        setError(response.message || 'Failed to lock period');
      }
    } catch (err) {
      setError('Failed to lock period');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'CALCULATED':
        return 'primary';
      case 'LOCKED':
        return 'success';
      default:
        return 'default';
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Payroll Periods</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Period
        </Button>
      </Box>

      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Periods Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell>Period</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell align="right">Employees</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {periods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">No payroll periods found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              periods.map((period) => (
                <TableRow key={period.period_id} hover>
                  <TableCell><strong>{period.period_name}</strong></TableCell>
                  <TableCell>{new Date(period.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(period.end_date).toLocaleDateString()}</TableCell>
                  <TableCell align="right">{period.total_employees || 0}</TableCell>
                  <TableCell align="right">
                    ₹{period.total_amount ? period.total_amount.toLocaleString() : '0.00'}
                  </TableCell>
                  <TableCell>
                    <Chip label={period.status} color={getStatusColor(period.status)} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      {period.status === 'DRAFT' && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleCalculatePayroll(period)}
                          disabled={calculating}
                          title="Calculate Payroll"
                        >
                          <CalculateIcon />
                        </IconButton>
                      )}
                      {period.status === 'CALCULATED' && (
                        <>
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleViewSummary(period)}
                            title="View Summary"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleLockPeriod(period)}
                            title="Lock Period"
                          >
                            <LockIcon />
                          </IconButton>
                        </>
                      )}
                      {period.status === 'LOCKED' && (
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleViewSummary(period)}
                          title="View Summary"
                        >
                          <ViewIcon />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Period Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Payroll Period</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Year"
              value={periodForm.year}
              onChange={(e) => setPeriodForm({ ...periodForm, year: e.target.value })}
              fullWidth
            >
              {[2024, 2025, 2026, 2027].map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Month"
              value={periodForm.month}
              onChange={(e) => setPeriodForm({ ...periodForm, month: e.target.value })}
              fullWidth
            >
              {months.map((month, index) => (
                <MenuItem key={index + 1} value={index + 1}>{month}</MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePeriod} variant="contained">
            Create Period
          </Button>
        </DialogActions>
      </Dialog>

      {/* Summary Dialog */}
      <Dialog open={summaryDialogOpen} onClose={() => setSummaryDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Payroll Summary - {selectedPeriod?.period_name}
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell>Employee</TableCell>
                  <TableCell align="right">Days Present</TableCell>
                  <TableCell align="right">Hours Worked</TableCell>
                  <TableCell align="right">Basic Pay</TableCell>
                  <TableCell align="right">OT Pay</TableCell>
                  <TableCell align="right">Net Salary</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.map((row) => (
                  <TableRow key={row.employee_id}>
                    <TableCell>{row.employee_name}</TableCell>
                    <TableCell align="right">{row.days_present}</TableCell>
                    <TableCell align="right">{row.total_hours_worked?.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{row.basic_pay?.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{row.overtime_pay?.toFixed(2)}</TableCell>
                    <TableCell align="right"><strong>₹{row.net_salary?.toFixed(2)}</strong></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSummaryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
