import { useState, useEffect } from 'react';
import AppDatePicker from '../../components/common/AppDatePicker';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Avatar,
    IconButton,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Alert,
    InputAdornment,
    Stepper,
    Step,
    StepLabel,
    LinearProgress,
    CircularProgress
} from '@mui/material';
import {
    PlayArrow as ProcessIcon,
    Lock as LockIcon,
    LockOpen as UnlockIcon,
    Edit as EditIcon,
    Visibility as ViewIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    CheckCircle as CompleteIcon,
    Warning as WarningIcon,
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import payrollService from '../../services/payrollService';
import employeeService from '../../services/employeeService';

// Remove mock data - using real API data now

const PayrollProcessing = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [payrollData, setPayrollData] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isLocked, setIsLocked] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [showCreatePeriodDialog, setShowCreatePeriodDialog] = useState(false);
    const [adjustments, setAdjustments] = useState([]);
    const [showPayslipDialog, setShowPayslipDialog] = useState(false);
    const [viewEmployee, setViewEmployee] = useState(null);
    const [payslipData, setPayslipData] = useState(null);
    const [payslipLoading, setPayslipLoading] = useState(false);
    const [adjustmentForm, setAdjustmentForm] = useState({
        employee_id: '',
        adjustment_type: '',
        description: '',
        amount: '',
        is_taxable: false
    });
    const [newPeriod, setNewPeriod] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        salaryDate: ''
    });

    const steps = [
        'Select Payroll Period',
        'Review Data Sources',
        'Calculate Payroll',
        'Manual Adjustments',
        'Final Review',
        'Lock & Generate'
    ];

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load periods and employees
            const [periodsResponse, employeesResponse] = await Promise.all([
                payrollService.getPeriods(),
                employeeService.getEmployees()
            ]);

            if (periodsResponse && periodsResponse.success) {
                setPeriods(periodsResponse.data || []);
                if (periodsResponse.data && periodsResponse.data.length > 0) {
                    setSelectedPeriod(periodsResponse.data[0].period_id);
                }
            } else if (Array.isArray(periodsResponse)) {
                // Handle case where response is directly an array
                setPeriods(periodsResponse);
                if (periodsResponse.length > 0) {
                    setSelectedPeriod(periodsResponse[0].period_id);
                }
            }

            if (employeesResponse.success) {
                setEmployees(employeesResponse.data || []);
            }
        } catch (err) {
            setError('Failed to load initial data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadPayrollSummary = async (periodId) => {
        try {
            setLoading(true);
            const response = await payrollService.getPayrollSummary(periodId);
            if (response.success) {
                setPayrollData(response.data || []);
            }
        } catch (err) {
            setError('Failed to load payroll summary.');
        } finally {
            setLoading(false);
        }
    };

    const loadAdjustments = async (periodId) => {
        try {
            const response = await payrollService.getAdjustments(periodId);
            if (response.success) {
                const data = response.data;
                setAdjustments(Array.isArray(data) ? data : []);
            } else {
                setAdjustments([]);
            }
        } catch (err) {
            setAdjustments([]);
        }
    };

    const handleAddAdjustment = async () => {
        try {
            setProcessing(true);
            const response = await payrollService.addAdjustment({
                period_id: selectedPeriod,
                employee_id: adjustmentForm.employee_id,
                adjustment_type: adjustmentForm.adjustment_type,
                description: adjustmentForm.description,
                amount: parseFloat(adjustmentForm.amount),
                is_taxable: adjustmentForm.is_taxable
            });
            if (response.success) {
                setShowAdjustmentDialog(false);
                setAdjustmentForm({ employee_id: '', adjustment_type: '', description: '', amount: '', is_taxable: false });
                await loadAdjustments(selectedPeriod);
                await loadPayrollSummary(selectedPeriod);
            } else {
                setError(response.message || 'Failed to add adjustment');
            }
        } catch (err) {
            setError('Failed to add adjustment');
        } finally {
            setProcessing(false);
        }
    };

    const handleViewPayslip = async (employee) => {
        setViewEmployee(employee);
        setPayslipData(null);
        setShowPayslipDialog(true);
        setPayslipLoading(true);
        try {
            const res = await payrollService.getEmployeePayslip(employee.employee_id, selectedPeriod);
            if (res.success) setPayslipData(res.data);
        } catch (e) { /* show summary fallback */ }
        setPayslipLoading(false);
    };

    const handleDeleteAdjustment = async (adjustmentId) => {
        if (!window.confirm('Delete this adjustment?')) return;
        try {
            const response = await payrollService.deleteAdjustment(adjustmentId);
            if (response.success) {
                await loadAdjustments(selectedPeriod);
                await loadPayrollSummary(selectedPeriod);
            } else {
                setError(response.message || 'Failed to delete adjustment');
            }
        } catch (err) {
            setError('Failed to delete adjustment');
        }
    };

    const handleNextStep = () => {
        if (activeStep < steps.length - 1) {
            const nextStep = activeStep + 1;
            setActiveStep(nextStep);
            // Load adjustments when entering step 3
            if (nextStep === 3 && selectedPeriod) {
                loadAdjustments(selectedPeriod);
            }
        }
    };

    const handlePrevStep = () => {
        if (activeStep > 0) {
            setActiveStep(prev => prev - 1);
        }
    };

    const handleCalculatePayroll = async () => {
        try {
            setProcessing(true);
            setError(null);

            // Process bulk payroll
            const response = await payrollService.processBulkPayroll(selectedPeriod);
            if (response.success) {
                // Load updated payroll summary
                await loadPayrollSummary(selectedPeriod);
                
                // Reload periods to show updated status
                const periodsResponse = await payrollService.getPeriods();
                if (periodsResponse && periodsResponse.success) {
                    setPeriods(periodsResponse.data || []);
                }
                
                // Don't auto-advance - let user click Next
                alert('Payroll calculated successfully! Click Next to review adjustments.');
            } else {
                setError(response.message || 'Failed to calculate payroll');
            }
        } catch (err) {
            setError('Failed to calculate payroll. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleLockPayroll = async () => {
        try {
            setProcessing(true);
            setError(null);

            const response = await payrollService.lockPayroll(selectedPeriod);
            if (response.success) {
                setIsLocked(true);
                handleNextStep();
            } else {
                setError(response.message || 'Failed to lock payroll');
            }
        } catch (err) {
            setError('Failed to lock payroll. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleUnlockPayroll = async (reason) => {
        try {
            setProcessing(true);
            setError(null);

            const response = await payrollService.unlockPayroll(selectedPeriod, reason);
            if (response.success) {
                setIsLocked(false);
                setActiveStep(3); // Go back to adjustments step
            } else {
                setError(response.message || 'Failed to unlock payroll');
            }
        } catch (err) {
            setError('Failed to unlock payroll. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleMarkPaid = async (paymentReference) => {
        try {
            setProcessing(true);
            setError(null);

            const response = await payrollService.markSalariesPaid(selectedPeriod, paymentReference);
            if (response.success) {
                await loadPayrollSummary(selectedPeriod);
                setError(null);
            } else {
                setError(response.message || 'Failed to mark salaries as paid');
            }
        } catch (err) {
            setError('Failed to mark salaries as paid. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleRefresh = () => {
        if (selectedPeriod) {
            loadPayrollSummary(selectedPeriod);
        }
    };

    const handleCreatePeriod = async () => {
        try {
            setProcessing(true);
            setError(null);

            const { month, year, salaryDate } = newPeriod;
            
            // Calculate start and end dates
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Last day of month
            
            // Format dates as YYYY-MM-DD
            const formatDate = (date) => {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            };
            
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            const periodName = `${monthNames[month - 1]} ${year}`;
            
            const response = await payrollService.createPayrollPeriod(
                periodName,
                'MONTHLY',
                formatDate(startDate),
                formatDate(endDate),
                salaryDate
            );
            
            if (response.success) {
                setShowCreatePeriodDialog(false);
                await loadInitialData();
                setError(null);
                alert('Payroll period created successfully!');
            } else {
                setError(response.message || 'Failed to create payroll period');
            }
        } catch (err) {
            setError(err.message || 'Failed to create payroll period. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDeletePeriod = async (periodId) => {
        try {
            setProcessing(true);
            setError(null);

            const response = await payrollService.deletePeriod(periodId);

            if (response.success) {
                await loadInitialData();
                alert('Payroll period deleted successfully!');
            } else {
                alert(response.message || 'Failed to delete payroll period');
            }
        } catch (err) {
            alert('Failed to delete payroll period. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const totalGross = payrollData.reduce((sum, emp) => sum + (emp.gross_salary || 0), 0);
    const totalDeductions = payrollData.reduce((sum, emp) => sum + (emp.total_deductions || 0), 0);
    const totalNet = payrollData.reduce((sum, emp) => sum + (emp.net_salary || 0), 0);

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'PAID': return 'success';
            case 'PENDING': return 'warning';
            case 'HOLD': return 'error';
            default: return 'default';
        }
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>Select Payroll Period</Typography>
                        <FormControl sx={{ minWidth: 300 }}>
                            <InputLabel>Payroll Period</InputLabel>
                            <Select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                label="Payroll Period"
                            >
                                {Array.isArray(periods) && periods.length > 0 ? (
                                    periods.map((period) => (
                                        <MenuItem key={period.period_id} value={period.period_id}>
                                            {period.period_name} ({period.status})
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem value="" disabled>
                                        No payroll periods available
                                    </MenuItem>
                                )}
                            </Select>
                        </FormControl>
                        {Array.isArray(periods) && periods.length === 0 && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                No payroll periods found. Please create a period first.
                            </Alert>
                        )}
                    </Box>
                );

            case 1: {
                // Calculate working days (Mon-Fri) for the selected period
                const selectedPeriodData = Array.isArray(periods) ? periods.find(p => p.period_id === selectedPeriod) : null;
                let workingDays = 0;
                if (selectedPeriodData?.start_date && selectedPeriodData?.end_date) {
                    let d = new Date(selectedPeriodData.start_date);
                    const end = new Date(selectedPeriodData.end_date);
                    while (d <= end) {
                        const day = d.getDay(); // 0=Sun, 6=Sat
                        if (day !== 0 && day !== 6) workingDays++;
                        d.setDate(d.getDate() + 1);
                    }
                }
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>Data Sources Summary</Typography>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Card sx={{ flex: '1 1 200px' }}>
                                <CardContent>
                                    <Typography variant="h6" color="success.main">{workingDays || '-'}</Typography>
                                    <Typography variant="body2">Working Days</Typography>
                                </CardContent>
                            </Card>
                            <Card sx={{ flex: '1 1 200px' }}>
                                <CardContent>
                                    <Typography variant="h6" color="primary.main">{employees.length}</Typography>
                                    <Typography variant="body2">Active Employees</Typography>
                                </CardContent>
                            </Card>
                            <Card sx={{ flex: '1 1 200px' }}>
                                <CardContent>
                                    <Typography variant="h6" color="info.main">-</Typography>
                                    <Typography variant="body2">Leave Applications</Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>
                );
            }

            case 2:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>Calculate Payroll</Typography>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Click "Calculate Payroll" to process salary calculations for all employees based on:
                            <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                                <li>Salary structures and templates</li>
                                <li>Attendance data (working days, absences)</li>
                                <li>Leave deductions</li>
                                <li>Statutory deductions (PF, ESI, PT, TDS)</li>
                            </ul>
                        </Alert>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}
                        <Button
                            variant="contained"
                            onClick={handleCalculatePayroll}
                            startIcon={processing ? <CircularProgress size={20} /> : <ProcessIcon />}
                            size="large"
                            disabled={processing || !selectedPeriod}
                        >
                            {processing ? 'Calculating...' : 'Calculate Payroll'}
                        </Button>
                    </Box>
                );

            case 3:
                return (
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6">Manual Adjustments</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button variant="outlined" onClick={handleRefresh} startIcon={<RefreshIcon />}>
                                    Refresh Data
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<span>+</span>}
                                    onClick={() => { setSelectedEmployee(null); setShowAdjustmentDialog(true); }}
                                >
                                    Add Adjustment
                                </Button>
                            </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Add bonuses, incentives, penalties, or reimbursements for this payroll period.
                        </Typography>

                        {(!Array.isArray(adjustments) || adjustments.length === 0) ? (
                            <Alert severity="info">No adjustments added yet. Click "Add Adjustment" to add one.</Alert>
                        ) : (
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                                            <TableCell>Employee</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Description</TableCell>
                                            <TableCell align="right">Amount</TableCell>
                                            <TableCell>Taxable</TableCell>
                                            <TableCell align="center">Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(Array.isArray(adjustments) ? adjustments : []).map((adj) => (
                                            <TableRow key={adj.adjustment_id}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>{adj.employee_name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{adj.employee_code}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={adj.adjustment_type}
                                                        size="small"
                                                        color={adj.amount >= 0 ? 'success' : 'error'}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>{adj.description}</TableCell>
                                                <TableCell align="right">
                                                    <Typography
                                                        variant="body2"
                                                        color={adj.amount >= 0 ? 'success.main' : 'error.main'}
                                                        fontWeight={500}
                                                    >
                                                        {adj.amount >= 0 ? '+' : ''}{payrollService.formatCurrency(adj.amount)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{adj.is_taxable ? 'Yes' : 'No'}</TableCell>
                                                <TableCell align="center">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDeleteAdjustment(adj.adjustment_id)}
                                                    >
                                                        <span style={{ fontSize: 16 }}>🗑</span>
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                );

            case 4:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>Final Review</Typography>
                        <Box sx={{ display: 'flex', gap: 4, mb: 3, flexWrap: 'wrap' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Total Gross</Typography>
                                <Typography variant="h5" color="primary.main">
                                    {payrollService.formatCurrency(totalGross)}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Total Deductions</Typography>
                                <Typography variant="h5" color="error.main">
                                    {payrollService.formatCurrency(totalDeductions)}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Net Payable</Typography>
                                <Typography variant="h5" color="success.main">
                                    {payrollService.formatCurrency(totalNet)}
                                </Typography>
                            </Box>
                        </Box>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Once locked, payroll cannot be modified. Please review all calculations carefully.
                        </Alert>
                    </Box>
                );

            case 5:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>Lock & Generate Payroll</Typography>
                        {isLocked ? (
                            <Box>
                                <Alert severity="success" sx={{ mb: 3 }}>
                                    Payroll has been successfully locked and generated.
                                </Alert>
                                <Stack direction="row" spacing={2}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            const reason = prompt('Enter reason for unlocking payroll:');
                                            if (reason) handleUnlockPayroll(reason);
                                        }}
                                        startIcon={<UnlockIcon />}
                                        color="warning"
                                        disabled={processing}
                                    >
                                        Emergency Unlock
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            const ref = prompt('Enter bank payment reference number:');
                                            if (ref) handleMarkPaid(ref);
                                        }}
                                        startIcon={processing ? <CircularProgress size={20} /> : <CompleteIcon />}
                                        color="success"
                                        disabled={processing}
                                    >
                                        Mark as Paid
                                    </Button>
                                </Stack>
                            </Box>
                        ) : (
                            <Box>
                                <Alert severity="warning" sx={{ mb: 3 }}>
                                    Once locked, payroll cannot be modified without emergency unlock. Please review all calculations carefully.
                                </Alert>
                                <Button
                                    variant="contained"
                                    onClick={handleLockPayroll}
                                    startIcon={processing ? <CircularProgress size={20} /> : <LockIcon />}
                                    size="large"
                                    color="error"
                                    disabled={processing}
                                >
                                    {processing ? 'Locking...' : 'Lock Payroll'}
                                </Button>
                            </Box>
                        )}
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Payroll Processing
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Process monthly payroll with attendance integration and manual adjustments
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            size="small"
                            onClick={() => setShowCreatePeriodDialog(true)}
                        >
                            Create Period
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            size="small"
                            onClick={loadInitialData}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            size="small"
                            disabled={!isLocked}
                        >
                            Export
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {/* Existing Periods List */}
            {periods.length > 0 && (
                <Paper sx={{ mb: { xs: 2, sm: 3 } }}>
                    <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Payroll Periods
                        </Typography>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Period Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Salary Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Array.isArray(periods) && periods.length > 0 ? (
                                    periods.map((period) => (
                                        <TableRow key={period.period_id} hover>
                                            <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {period.period_name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {payrollService.formatDate(period.start_date)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {payrollService.formatDate(period.end_date)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {payrollService.formatDate(period.salary_date)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={period.status}
                                                color={
                                                    period.status === 'LOCKED' ? 'error' :
                                                    period.status === 'CALCULATED' ? 'success' :
                                                    period.status === 'DRAFT' ? 'warning' :
                                                    'default'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <IconButton 
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedPeriod(period.period_id);
                                                        setActiveStep(0);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    title="View period details"
                                                >
                                                    <ViewIcon />
                                                </IconButton>
                                                {period.status === 'DRAFT' && (
                                                    <>
                                                        <IconButton 
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => {
                                                                setSelectedPeriod(period.period_id);
                                                                setActiveStep(2);
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }}
                                                            title="Process this period"
                                                        >
                                                            <ProcessIcon />
                                                        </IconButton>
                                                        <IconButton 
                                                            size="small"
                                                            color="error"
                                                            onClick={() => {
                                                                if (window.confirm(`Are you sure you want to delete "${period.period_name}"? This action cannot be undone.`)) {
                                                                    handleDeletePeriod(period.period_id);
                                                                }
                                                            }}
                                                            title="Delete period"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <Typography color="text.secondary">
                                                No payroll periods found. Click "Create Period" to get started.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Process Stepper */}
            <Paper sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ p: 3 }}>
                    <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map((label, index) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>
            </Paper>

            {/* Step Content */}
            <Paper sx={{ mb: { xs: 2, sm: 3 } }}>
                {renderStepContent()}
                
                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 3, borderTop: 1, borderColor: 'divider' }}>
                    <Button
                        onClick={handlePrevStep}
                        disabled={activeStep === 0 || isLocked}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNextStep}
                        disabled={activeStep === steps.length - 1 && !isLocked || (activeStep === 2 && payrollData.length === 0)}
                    >
                        {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
                    </Button>
                </Box>
            </Paper>

            {/* Payroll Data Table (shown from step 3 onwards) */}
            {activeStep >= 3 && (
                <Paper>
                    <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Payroll Summary - {Array.isArray(periods) && periods.length > 0 ? periods.find(p => p.period_id === selectedPeriod)?.period_name : 'Current Period' || 'Current Period'}
                        </Typography>
                    </Box>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : payrollData.length > 0 ? (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="right">Gross Salary</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="right">Deductions</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="right">Net Salary</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Days</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {payrollData.map((employee, index) => (
                                        <TableRow key={employee.employee_id || index} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                                        {employee.employee_name?.charAt(0) || 'E'}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {employee.employee_name || 'Unknown Employee'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {employee.employee_code} • {employee.department}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={600}>
                                                    {payrollService.formatCurrency(employee.gross_salary)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" color="error.main">
                                                    {payrollService.formatCurrency(employee.total_deductions)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={600} color="success.main">
                                                    {payrollService.formatCurrency(employee.net_salary)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {employee.days_worked}W / {employee.days_absent}A
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={employee.payment_status || 'PENDING'}
                                                    color={getStatusColor(employee.payment_status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <IconButton
                                                        size="small"
                                                        title="View payslip breakdown"
                                                        onClick={() => handleViewPayslip(employee)}
                                                    >
                                                        <ViewIcon />
                                                    </IconButton>
                                                    {!isLocked && (
                                                        <IconButton 
                                                            size="small"
                                                            onClick={() => {
                                                                setSelectedEmployee(employee);
                                                                setShowAdjustmentDialog(true);
                                                            }}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                No payroll data available. Please calculate payroll first.
                            </Typography>
                        </Box>
                    )}

                    {/* Summary Footer */}
                    {payrollData.length > 0 && (
                        <Box sx={{ p: 3, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Typography variant="h6">
                                    Total Employees: {payrollData.length}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="body2" color="text.secondary">Gross Total</Typography>
                                        <Typography variant="h6" color="primary.main">
                                            {payrollService.formatCurrency(totalGross)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="body2" color="text.secondary">Deductions</Typography>
                                        <Typography variant="h6" color="error.main">
                                            {payrollService.formatCurrency(totalDeductions)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="body2" color="text.secondary">Net Payable</Typography>
                                        <Typography variant="h6" color="success.main">
                                            {payrollService.formatCurrency(totalNet)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Paper>
            )}

            {/* Manual Adjustment Dialog */}
            <Dialog open={showAdjustmentDialog} onClose={() => setShowAdjustmentDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Manual Adjustment</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Employee</InputLabel>
                            <Select
                                value={adjustmentForm.employee_id}
                                label="Employee"
                                onChange={(e) => setAdjustmentForm(f => ({ ...f, employee_id: e.target.value }))}
                            >
                                {payrollData.map(emp => (
                                    <MenuItem key={emp.employee_id} value={emp.employee_id}>
                                        {emp.employee_name} ({emp.employee_code})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth size="small">
                            <InputLabel>Adjustment Type</InputLabel>
                            <Select
                                value={adjustmentForm.adjustment_type}
                                label="Adjustment Type"
                                onChange={(e) => setAdjustmentForm(f => ({ ...f, adjustment_type: e.target.value }))}
                            >
                                <MenuItem value="BONUS">Bonus (+)</MenuItem>
                                <MenuItem value="INCENTIVE">Incentive (+)</MenuItem>
                                <MenuItem value="REIMBURSEMENT">Reimbursement (+)</MenuItem>
                                <MenuItem value="PENALTY">Penalty (-)</MenuItem>
                                <MenuItem value="LOAN">Loan Recovery (-)</MenuItem>
                                <MenuItem value="OTHER">Other</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Description"
                            size="small"
                            fullWidth
                            value={adjustmentForm.description}
                            onChange={(e) => setAdjustmentForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="e.g. Performance bonus for Q1"
                        />
                        <TextField
                            label="Amount"
                            size="small"
                            fullWidth
                            type="number"
                            value={adjustmentForm.amount}
                            onChange={(e) => setAdjustmentForm(f => ({ ...f, amount: e.target.value }))}
                            helperText="Use negative value for deductions (e.g. -500 for penalty)"
                            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Taxable</InputLabel>
                            <Select
                                value={adjustmentForm.is_taxable}
                                label="Taxable"
                                onChange={(e) => setAdjustmentForm(f => ({ ...f, is_taxable: e.target.value }))}
                            >
                                <MenuItem value={false}>No</MenuItem>
                                <MenuItem value={true}>Yes</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAdjustmentDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAddAdjustment}
                        disabled={!adjustmentForm.employee_id || !adjustmentForm.adjustment_type || !adjustmentForm.description || adjustmentForm.amount === ''}
                    >
                        Add Adjustment
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Payslip Preview Dialog */}
            <Dialog open={showPayslipDialog} onClose={() => setShowPayslipDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Payslip — {viewEmployee?.employee_name}
                </DialogTitle>
                <DialogContent>
                    {payslipLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                    ) : (
                        <Box sx={{ mt: 1 }}>
                            {/* Company Header */}
                            {payslipData?.employee_details?.company_name && (
                                <Box sx={{ textAlign: 'center', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                                    <Typography variant="h6" fontWeight={700}>
                                        {payslipData.employee_details.company_name}
                                    </Typography>
                                    {payslipData.employee_details.company_address_city && (
                                        <Typography variant="body2" color="text.secondary">
                                            {[
                                                payslipData.employee_details.company_address_street,
                                                payslipData.employee_details.company_address_city,
                                                payslipData.employee_details.company_address_state,
                                                payslipData.employee_details.company_address_country
                                            ].filter(Boolean).join(', ')}
                                        </Typography>
                                    )}
                                    {payslipData.employee_details.company_email && (
                                        <Typography variant="caption" color="text.secondary">
                                            {payslipData.employee_details.company_email}
                                            {payslipData.employee_details.company_phone ? ` • ${payslipData.employee_details.company_phone}` : ''}
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* Employee + Period */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Employee</Typography>
                                    <Typography variant="body1" fontWeight={600}>
                                        {payslipData?.employee_details?.employee_name || viewEmployee?.employee_name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {payslipData?.employee_details?.employee_code || viewEmployee?.employee_code}
                                        {' • '}
                                        {payslipData?.employee_details?.department || viewEmployee?.department}
                                    </Typography>
                                    {payslipData?.employee_details?.designation && (
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            {payslipData.employee_details.designation}
                                        </Typography>
                                    )}
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" color="text.secondary">Period</Typography>
                                    <Typography variant="body1" fontWeight={600}>
                                        {payslipData?.employee_details?.period_name || (Array.isArray(periods) ? periods.find(p => p.period_id === selectedPeriod)?.period_name : '') || ''}
                                    </Typography>
                                    <Chip
                                        label={payslipData?.employee_details?.payment_status || viewEmployee?.payment_status || 'PENDING'}
                                        size="small"
                                        color={payslipData?.employee_details?.payment_status === 'PAID' ? 'success' : 'warning'}
                                    />
                                </Box>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            {/* Attendance */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Days Worked / Absent</Typography>
                                <Typography variant="body2">
                                    {payslipData?.employee_details?.days_worked ?? viewEmployee?.days_worked}W
                                    {' / '}
                                    {payslipData?.employee_details?.days_absent ?? viewEmployee?.days_absent}A
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            {/* Earnings breakdown */}
                            {payslipData?.earnings?.length > 0 && (
                                <>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Earnings</Typography>
                                    {payslipData.earnings.map((e, i) => (
                                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2">{e.component_name}</Typography>
                                            <Typography variant="body2" color="success.main">{payrollService.formatCurrency(e.calculated_amount)}</Typography>
                                        </Box>
                                    ))}
                                    <Divider sx={{ my: 1.5 }} />
                                </>
                            )}

                            {/* Deductions breakdown */}
                            {payslipData?.deductions?.length > 0 && (
                                <>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Deductions</Typography>
                                    {payslipData.deductions.map((d, i) => (
                                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2">{d.component_name}</Typography>
                                            <Typography variant="body2" color="error.main">- {payrollService.formatCurrency(d.calculated_amount)}</Typography>
                                        </Box>
                                    ))}
                                    <Divider sx={{ my: 1.5 }} />
                                </>
                            )}

                            {/* Adjustments */}
                            {payslipData?.adjustments?.length > 0 && (
                                <>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Adjustments</Typography>
                                    {payslipData.adjustments.map((a, i) => (
                                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2">{a.adjustment_type}: {a.component_name}</Typography>
                                            <Typography variant="body2" color={a.calculated_amount >= 0 ? 'success.main' : 'error.main'}>
                                                {a.calculated_amount >= 0 ? '+' : ''}{payrollService.formatCurrency(a.calculated_amount)}
                                            </Typography>
                                        </Box>
                                    ))}
                                    <Divider sx={{ my: 1.5 }} />
                                </>
                            )}

                            {/* Fallback summary if no breakdown */}
                            {!payslipData?.earnings?.length && (
                                <>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Gross Salary</Typography>
                                        <Typography variant="body2" fontWeight={500}>{payrollService.formatCurrency(viewEmployee?.gross_salary)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="error.main">Total Deductions</Typography>
                                        <Typography variant="body2" color="error.main">- {payrollService.formatCurrency(viewEmployee?.total_deductions)}</Typography>
                                    </Box>
                                    <Divider sx={{ my: 1.5 }} />
                                </>
                            )}

                            {/* Net Salary */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                                <Typography variant="body1" fontWeight={700}>Net Salary</Typography>
                                <Typography variant="body1" fontWeight={700} color="success.main">
                                    {payrollService.formatCurrency(
                                        payslipData?.employee_details?.net_salary ?? viewEmployee?.net_salary
                                    )}
                                </Typography>
                            </Box>

                            {/* Bank details */}
                            {payslipData?.employee_details?.bank_name && (
                                <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>BANK DETAILS</Typography>
                                    <Typography variant="body2">{payslipData.employee_details.bank_name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        A/C: {payslipData.employee_details.bank_account_number}
                                        {payslipData.employee_details.bank_ifsc_code ? ` • IFSC: ${payslipData.employee_details.bank_ifsc_code}` : ''}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPayslipDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Create Payroll Period Dialog */}
            <Dialog open={showCreatePeriodDialog} onClose={() => setShowCreatePeriodDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create Payroll Period</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Create a new payroll period for monthly salary processing. The system will validate that all employees have salary assignments.
                        </Alert>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            <FormControl fullWidth>
                                <InputLabel>Month</InputLabel>
                                <Select
                                    value={newPeriod.month}
                                    onChange={(e) => setNewPeriod({ ...newPeriod, month: e.target.value })}
                                    label="Month"
                                >
                                    <MenuItem value={1}>January</MenuItem>
                                    <MenuItem value={2}>February</MenuItem>
                                    <MenuItem value={3}>March</MenuItem>
                                    <MenuItem value={4}>April</MenuItem>
                                    <MenuItem value={5}>May</MenuItem>
                                    <MenuItem value={6}>June</MenuItem>
                                    <MenuItem value={7}>July</MenuItem>
                                    <MenuItem value={8}>August</MenuItem>
                                    <MenuItem value={9}>September</MenuItem>
                                    <MenuItem value={10}>October</MenuItem>
                                    <MenuItem value={11}>November</MenuItem>
                                    <MenuItem value={12}>December</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Year</InputLabel>
                                <Select
                                    value={newPeriod.year}
                                    onChange={(e) => setNewPeriod({ ...newPeriod, year: e.target.value })}
                                    label="Year"
                                >
                                    <MenuItem value={2024}>2024</MenuItem>
                                    <MenuItem value={2025}>2025</MenuItem>
                                    <MenuItem value={2026}>2026</MenuItem>
                                    <MenuItem value={2027}>2027</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <AppDatePicker
                            label="Salary Payment Date"
                            value={newPeriod.salaryDate}
                            onChange={(v) => setNewPeriod({ ...newPeriod, salaryDate: v })}
                            sx={{ mb: 2 }}
                        />

                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Period Details:
                            </Typography>
                            <Typography variant="body2">
                                <strong>Period:</strong> {new Date(newPeriod.year, newPeriod.month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Start Date:</strong> {new Date(newPeriod.year, newPeriod.month - 1, 1).toLocaleDateString('en-IN')}
                            </Typography>
                            <Typography variant="body2">
                                <strong>End Date:</strong> {new Date(newPeriod.year, newPeriod.month, 0).toLocaleDateString('en-IN')}
                            </Typography>
                            {newPeriod.salaryDate && (
                                <Typography variant="body2">
                                    <strong>Salary Date:</strong> {new Date(newPeriod.salaryDate).toLocaleDateString('en-IN')}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCreatePeriodDialog(false)} disabled={processing}>
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleCreatePeriod}
                        disabled={processing || !newPeriod.salaryDate}
                        startIcon={processing ? <CircularProgress size={20} /> : <AddIcon />}
                    >
                        {processing ? 'Creating...' : 'Create Period'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PayrollProcessing;