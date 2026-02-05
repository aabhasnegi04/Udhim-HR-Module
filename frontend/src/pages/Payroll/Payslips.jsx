import { useState, useContext } from 'react';
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
    Grid
} from '@mui/material';
import {
    Download as DownloadIcon,
    Visibility as ViewIcon,
    Print as PrintIcon,
    Email as EmailIcon,
    Refresh as RefreshIcon,
    Receipt as PayslipIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

// Mock payslip data
const mockPayslips = [
    {
        id: 1,
        employeeId: 'EMP001',
        employeeName: 'John Smith',
        month: '2025-01',
        basicSalary: 50000,
        hra: 20000,
        specialAllowance: 15000,
        bonus: 5000,
        grossSalary: 90000,
        pf: 6000,
        esi: 900,
        pt: 200,
        tds: 8000,
        totalDeductions: 15100,
        netSalary: 74900,
        status: 'Generated'
    },
    {
        id: 2,
        employeeId: 'EMP001',
        employeeName: 'John Smith',
        month: '2024-12',
        basicSalary: 50000,
        hra: 20000,
        specialAllowance: 15000,
        bonus: 3000,
        grossSalary: 88000,
        pf: 6000,
        esi: 880,
        pt: 200,
        tds: 7500,
        totalDeductions: 14580,
        netSalary: 73420,
        status: 'Generated'
    },
    {
        id: 3,
        employeeId: 'EMP002',
        employeeName: 'Sarah Johnson',
        month: '2025-01',
        basicSalary: 40000,
        hra: 16000,
        specialAllowance: 12000,
        bonus: 3000,
        grossSalary: 71000,
        pf: 4800,
        esi: 710,
        pt: 200,
        tds: 5000,
        totalDeductions: 10710,
        netSalary: 60290,
        status: 'Generated'
    }
];

const Payslips = () => {
    const { user } = useContext(AuthContext);
    const [payslips, setPayslips] = useState(mockPayslips);
    const [selectedMonth, setSelectedMonth] = useState('2025-01');
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [showPayslipDialog, setShowPayslipDialog] = useState(false);
    const [selectedPayslip, setSelectedPayslip] = useState(null);

    // Filter payslips based on user role
    const getFilteredPayslips = () => {
        let filtered = payslips;

        // Role-based filtering
        if (user?.role === 'Employee') {
            // Employee sees only their own payslips (mock: EMP001)
            filtered = payslips.filter(payslip => payslip.employeeId === 'EMP001');
        }

        // Month filter
        if (selectedMonth !== 'all') {
            filtered = filtered.filter(payslip => payslip.month === selectedMonth);
        }

        // Employee filter (for HR)
        if (selectedEmployee !== 'all' && user?.role === 'HR') {
            filtered = filtered.filter(payslip => payslip.employeeId === selectedEmployee);
        }

        return filtered;
    };

    const filteredPayslips = getFilteredPayslips();

    const handleViewPayslip = (payslip) => {
        setSelectedPayslip(payslip);
        setShowPayslipDialog(true);
    };

    const handleDownloadPayslip = (payslip) => {
        console.log('Downloading payslip for:', payslip.employeeName, payslip.month);
        // Download logic would go here
    };

    const handleEmailPayslip = (payslip) => {
        console.log('Emailing payslip to:', payslip.employeeName);
        // Email logic would go here
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Generated': return 'success';
            case 'Pending': return 'warning';
            case 'Sent': return 'info';
            default: return 'default';
        }
    };

    const renderPayslipPreview = () => {
        if (!selectedPayslip) return null;

        return (
            <Box sx={{ p: 2 }}>
                {/* Company Header */}
                <Box sx={{ textAlign: 'center', mb: 3, pb: 2, borderBottom: 2, borderColor: 'primary.main' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        UDHIM TECHNOLOGIES
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Salary Slip for {new Date(selectedPayslip.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Typography>
                </Box>

                {/* Employee Details */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Employee Name</Typography>
                        <Typography variant="body1" fontWeight={600}>{selectedPayslip.employeeName}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Employee ID</Typography>
                        <Typography variant="body1" fontWeight={600}>{selectedPayslip.employeeId}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Pay Period</Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {new Date(selectedPayslip.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Pay Date</Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {new Date().toLocaleDateString('en-IN')}
                        </Typography>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Earnings and Deductions */}
                <Grid container spacing={3}>
                    {/* Earnings */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
                            Earnings
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Basic Salary</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    ₹{selectedPayslip.basicSalary.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">HRA</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    ₹{selectedPayslip.hra.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Special Allowance</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    ₹{selectedPayslip.specialAllowance.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Bonus</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    ₹{selectedPayslip.bonus.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body1" fontWeight={600}>Total Earnings</Typography>
                                <Typography variant="body1" fontWeight={700} color="success.main">
                                    ₹{selectedPayslip.grossSalary.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Deductions */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>
                            Deductions
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Provident Fund</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    ₹{selectedPayslip.pf.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">ESI</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    ₹{selectedPayslip.esi.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Professional Tax</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    ₹{selectedPayslip.pt.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">TDS</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    ₹{selectedPayslip.tds.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body1" fontWeight={600}>Total Deductions</Typography>
                                <Typography variant="body1" fontWeight={700} color="error.main">
                                    ₹{selectedPayslip.totalDeductions.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Net Salary */}
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                    <Typography variant="body1" color="primary.contrastText">Net Salary</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }} color="primary.contrastText">
                        ₹{selectedPayslip.netSalary.toLocaleString('en-IN')}
                    </Typography>
                </Box>

                {/* Footer */}
                <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        This is a computer-generated payslip and does not require a signature.
                    </Typography>
                </Box>
            </Box>
        );
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {user?.role === 'Employee' ? 'My Payslips' : 'Employee Payslips'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {user?.role === 'Employee' ? 
                                'View and download your salary slips' : 
                                'Generate, view, and manage employee payslips'}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => setPayslips(mockPayslips)}
                            size="small"
                        >
                            Refresh
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                            {filteredPayslips.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Payslips
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                            {filteredPayslips.filter(p => p.status === 'Generated').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Generated
                        </Typography>
                    </CardContent>
                </Card>
                {user?.role === 'Employee' && (
                    <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                                ₹{filteredPayslips.length > 0 ? Math.round(filteredPayslips[0].netSalary / 1000) : 0}K
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Latest Net Salary
                            </Typography>
                        </CardContent>
                    </Card>
                )}
            </Box>

            {/* Filters */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '0 0 150px', minWidth: '150px' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Month</InputLabel>
                            <Select
                                value={selectedMonth}
                                label="Month"
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            >
                                <MenuItem value="all">All Months</MenuItem>
                                <MenuItem value="2025-01">January 2025</MenuItem>
                                <MenuItem value="2024-12">December 2024</MenuItem>
                                <MenuItem value="2024-11">November 2024</MenuItem>
                                <MenuItem value="2024-10">October 2024</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    {user?.role === 'HR' && (
                        <Box sx={{ flex: '0 0 200px', minWidth: '200px' }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Employee</InputLabel>
                                <Select
                                    value={selectedEmployee}
                                    label="Employee"
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                >
                                    <MenuItem value="all">All Employees</MenuItem>
                                    <MenuItem value="EMP001">John Smith</MenuItem>
                                    <MenuItem value="EMP002">Sarah Johnson</MenuItem>
                                    <MenuItem value="EMP003">Michael Chen</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Payslips Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            {user?.role !== 'Employee' && (
                                <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            )}
                            <TableCell sx={{ fontWeight: 600 }}>Month</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Gross Salary</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Deductions</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Net Salary</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredPayslips.map((payslip) => (
                            <TableRow key={payslip.id} hover>
                                {user?.role !== 'Employee' && (
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                                {payslip.employeeName.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {payslip.employeeName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {payslip.employeeId}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                )}
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>
                                        {new Date(payslip.month).toLocaleDateString('en-US', { 
                                            month: 'long', 
                                            year: 'numeric' 
                                        })}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600}>
                                        ₹{payslip.grossSalary.toLocaleString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" color="error.main">
                                        ₹{payslip.totalDeductions.toLocaleString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600} color="success.main">
                                        ₹{payslip.netSalary.toLocaleString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={payslip.status}
                                        color={getStatusColor(payslip.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton size="small" onClick={() => handleViewPayslip(payslip)}>
                                            <ViewIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDownloadPayslip(payslip)}>
                                            <DownloadIcon />
                                        </IconButton>
                                        {user?.role === 'HR' && (
                                            <IconButton size="small" onClick={() => handleEmailPayslip(payslip)}>
                                                <EmailIcon />
                                            </IconButton>
                                        )}
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Payslip Preview Dialog */}
            <Dialog open={showPayslipDialog} onClose={() => setShowPayslipDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PayslipIcon />
                        Payslip Preview
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {renderPayslipPreview()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPayslipDialog(false)}>Close</Button>
                    <Button startIcon={<PrintIcon />} onClick={() => window.print()}>
                        Print
                    </Button>
                    <Button variant="contained" startIcon={<DownloadIcon />}>
                        Download PDF
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Payslips;