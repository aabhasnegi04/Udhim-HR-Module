import { useState } from 'react';
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
    LinearProgress
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
    Warning as WarningIcon
} from '@mui/icons-material';

// Mock payroll data
const mockPayrollData = [
    {
        id: 1,
        employeeId: 'EMP001',
        employeeName: 'John Smith',
        department: 'Engineering',
        basicSalary: 50000,
        hra: 20000,
        allowances: 15000,
        bonus: 5000,
        grossSalary: 90000,
        pf: 6000,
        esi: 900,
        pt: 200,
        tds: 8000,
        totalDeductions: 15100,
        netSalary: 74900,
        attendanceDays: 22,
        leaveDays: 0,
        lopDays: 0,
        status: 'Calculated'
    },
    {
        id: 2,
        employeeId: 'EMP002',
        employeeName: 'Sarah Johnson',
        department: 'HR',
        basicSalary: 40000,
        hra: 16000,
        allowances: 12000,
        bonus: 3000,
        grossSalary: 71000,
        pf: 4800,
        esi: 710,
        pt: 200,
        tds: 5000,
        totalDeductions: 10710,
        netSalary: 60290,
        attendanceDays: 20,
        leaveDays: 2,
        lopDays: 0,
        status: 'Calculated'
    },
    {
        id: 3,
        employeeId: 'EMP003',
        employeeName: 'Michael Chen',
        department: 'Engineering',
        basicSalary: 60000,
        hra: 24000,
        allowances: 18000,
        bonus: 8000,
        grossSalary: 110000,
        pf: 7200,
        esi: 0,
        pt: 200,
        tds: 12000,
        totalDeductions: 19400,
        netSalary: 90600,
        attendanceDays: 21,
        leaveDays: 1,
        lopDays: 0,
        status: 'Needs Review'
    }
];

const PayrollProcessing = () => {
    const [payrollMonth, setPayrollMonth] = useState('2025-01');
    const [payrollData, setPayrollData] = useState(mockPayrollData);
    const [isLocked, setIsLocked] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [adjustmentData, setAdjustmentData] = useState({
        bonus: 0,
        incentive: 0,
        lopDeduction: 0,
        otherDeduction: 0,
        reason: ''
    });

    const steps = [
        'Select Payroll Month',
        'Review Data Sources',
        'Calculate Payroll',
        'Manual Adjustments',
        'Final Review',
        'Lock & Generate'
    ];

    const handleNextStep = () => {
        if (activeStep < steps.length - 1) {
            setActiveStep(prev => prev + 1);
        }
    };

    const handlePrevStep = () => {
        if (activeStep > 0) {
            setActiveStep(prev => prev - 1);
        }
    };

    const handleCalculatePayroll = () => {
        // Simulate payroll calculation
        setPayrollData(prev => prev.map(emp => ({
            ...emp,
            status: 'Calculated'
        })));
        handleNextStep();
    };

    const handleLockPayroll = () => {
        setIsLocked(true);
        setPayrollData(prev => prev.map(emp => ({
            ...emp,
            status: 'Locked'
        })));
        handleNextStep();
    };

    const handleAdjustment = () => {
        if (!selectedEmployee) return;

        const updatedData = payrollData.map(emp => {
            if (emp.id === selectedEmployee.id) {
                const newBonus = emp.bonus + Number(adjustmentData.bonus);
                const newDeductions = emp.totalDeductions + Number(adjustmentData.lopDeduction) + Number(adjustmentData.otherDeduction);
                const newGross = emp.grossSalary + Number(adjustmentData.bonus) + Number(adjustmentData.incentive);
                const newNet = newGross - newDeductions;

                return {
                    ...emp,
                    bonus: newBonus,
                    grossSalary: newGross,
                    totalDeductions: newDeductions,
                    netSalary: newNet,
                    status: 'Adjusted'
                };
            }
            return emp;
        });

        setPayrollData(updatedData);
        setShowAdjustmentDialog(false);
        setSelectedEmployee(null);
        setAdjustmentData({
            bonus: 0,
            incentive: 0,
            lopDeduction: 0,
            otherDeduction: 0,
            reason: ''
        });
    };

    const totalGross = payrollData.reduce((sum, emp) => sum + emp.grossSalary, 0);
    const totalDeductions = payrollData.reduce((sum, emp) => sum + emp.totalDeductions, 0);
    const totalNet = payrollData.reduce((sum, emp) => sum + emp.netSalary, 0);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Calculated': return 'success';
            case 'Needs Review': return 'warning';
            case 'Adjusted': return 'info';
            case 'Locked': return 'default';
            default: return 'default';
        }
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>Select Payroll Month</Typography>
                        <TextField
                            label="Payroll Month"
                            type="month"
                            value={payrollMonth}
                            onChange={(e) => setPayrollMonth(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ minWidth: 200 }}
                        />
                    </Box>
                );

            case 1:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>Data Sources Summary</Typography>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Card sx={{ flex: '1 1 200px' }}>
                                <CardContent>
                                    <Typography variant="h6" color="success.main">22</Typography>
                                    <Typography variant="body2">Working Days</Typography>
                                </CardContent>
                            </Card>
                            <Card sx={{ flex: '1 1 200px' }}>
                                <CardContent>
                                    <Typography variant="h6" color="primary.main">{payrollData.length}</Typography>
                                    <Typography variant="body2">Active Employees</Typography>
                                </CardContent>
                            </Card>
                            <Card sx={{ flex: '1 1 200px' }}>
                                <CardContent>
                                    <Typography variant="h6" color="info.main">5</Typography>
                                    <Typography variant="body2">Leave Applications</Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>
                );

            case 2:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>Calculate Payroll</Typography>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Click "Calculate Payroll" to process salary calculations based on attendance, leave, and salary structures.
                        </Alert>
                        <Button
                            variant="contained"
                            onClick={handleCalculatePayroll}
                            startIcon={<ProcessIcon />}
                            size="large"
                        >
                            Calculate Payroll
                        </Button>
                    </Box>
                );

            case 3:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>Manual Adjustments</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Review calculated payroll and make manual adjustments if needed.
                        </Typography>
                        {/* Payroll table will be rendered below */}
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
                                    ₹{totalGross.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Total Deductions</Typography>
                                <Typography variant="h5" color="error.main">
                                    ₹{totalDeductions.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Net Payable</Typography>
                                <Typography variant="h5" color="success.main">
                                    ₹{totalNet.toLocaleString('en-IN')}
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
                            <Alert severity="success" sx={{ mb: 3 }}>
                                Payroll has been successfully locked and generated for {payrollMonth}.
                            </Alert>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleLockPayroll}
                                startIcon={<LockIcon />}
                                size="large"
                                color="error"
                            >
                                Lock Payroll
                            </Button>
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
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            size="small"
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
                        disabled={activeStep === steps.length - 1 || (activeStep === 2 && payrollData.some(emp => emp.status !== 'Calculated'))}
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
                            Payroll Summary - {new Date(payrollMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Typography>
                    </Box>
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
                                {payrollData.map((employee) => (
                                    <TableRow key={employee.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                                    {employee.employeeName.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {employee.employeeName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {employee.employeeId} • {employee.department}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600}>
                                                ₹{employee.grossSalary.toLocaleString('en-IN')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" color="error.main">
                                                ₹{employee.totalDeductions.toLocaleString('en-IN')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600} color="success.main">
                                                ₹{employee.netSalary.toLocaleString('en-IN')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {employee.attendanceDays}W / {employee.leaveDays}L
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={employee.status}
                                                color={getStatusColor(employee.status)}
                                                size="small"
                                                icon={employee.status === 'Needs Review' ? <WarningIcon /> : <CompleteIcon />}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <IconButton size="small">
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

                    {/* Summary Footer */}
                    <Box sx={{ p: 3, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                            <Typography variant="h6">
                                Total Employees: {payrollData.length}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" color="text.secondary">Gross Total</Typography>
                                    <Typography variant="h6" color="primary.main">
                                        ₹{totalGross.toLocaleString('en-IN')}
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" color="text.secondary">Deductions</Typography>
                                    <Typography variant="h6" color="error.main">
                                        ₹{totalDeductions.toLocaleString('en-IN')}
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" color="text.secondary">Net Payable</Typography>
                                    <Typography variant="h6" color="success.main">
                                        ₹{totalNet.toLocaleString('en-IN')}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* Manual Adjustment Dialog */}
            <Dialog open={showAdjustmentDialog} onClose={() => setShowAdjustmentDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Manual Adjustment</DialogTitle>
                <DialogContent>
                    {selectedEmployee && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                {selectedEmployee.employeeName} ({selectedEmployee.employeeId})
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Additional Bonus"
                                    type="number"
                                    value={adjustmentData.bonus}
                                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, bonus: e.target.value }))}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                                    }}
                                />
                                <TextField
                                    label="Incentive"
                                    type="number"
                                    value={adjustmentData.incentive}
                                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, incentive: e.target.value }))}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                                    }}
                                />
                                <TextField
                                    label="LOP Deduction"
                                    type="number"
                                    value={adjustmentData.lopDeduction}
                                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, lopDeduction: e.target.value }))}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                                    }}
                                />
                                <TextField
                                    label="Other Deduction"
                                    type="number"
                                    value={adjustmentData.otherDeduction}
                                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, otherDeduction: e.target.value }))}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                                    }}
                                />
                                <TextField
                                    label="Reason for Adjustment"
                                    multiline
                                    rows={3}
                                    value={adjustmentData.reason}
                                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAdjustmentDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAdjustment}>
                        Apply Adjustment
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PayrollProcessing;