import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
    TextField,
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
    Grid
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Calculate as CalculateIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    AccountBalance as SettlementIcon
} from '@mui/icons-material';

// Mock settlement data
const mockSettlementData = [
    {
        id: 1,
        employeeId: 'EMP001',
        employeeName: 'John Smith',
        department: 'Engineering',
        lastWorkingDay: '2025-01-15',
        joiningDate: '2023-03-01',
        basicSalary: 50000,
        settlement: {
            workingDays: 15,
            salaryDue: 25000,
            leaveEncashment: 18000,
            bonus: 5000,
            gratuity: 12000,
            totalEarnings: 60000,
            advanceDeduction: 5000,
            noticePeriodDeduction: 0,
            otherDeductions: 1000,
            totalDeductions: 6000,
            netSettlement: 54000
        },
        status: 'Calculated',
        calculatedBy: 'HR Team',
        calculatedOn: '2025-01-10'
    },
    {
        id: 2,
        employeeId: 'EMP005',
        employeeName: 'David Wilson',
        department: 'Sales',
        lastWorkingDay: '2024-12-31',
        joiningDate: '2022-06-15',
        basicSalary: 40000,
        settlement: {
            workingDays: 31,
            salaryDue: 40000,
            leaveEncashment: 15000,
            bonus: 0,
            gratuity: 20000,
            totalEarnings: 75000,
            advanceDeduction: 10000,
            noticePeriodDeduction: 20000,
            otherDeductions: 2000,
            totalDeductions: 32000,
            netSettlement: 43000
        },
        status: 'Processed',
        calculatedBy: 'HR Team',
        calculatedOn: '2024-12-25'
    }
];

const FinalSettlement = () => {
    const [settlements, setSettlements] = useState(mockSettlementData);
    const [showSettlementDialog, setShowSettlementDialog] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const handleViewSettlement = (settlement) => {
        setSelectedEmployee(settlement);
        setShowSettlementDialog(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Calculated': return 'info';
            case 'Processed': return 'success';
            case 'Pending': return 'warning';
            default: return 'default';
        }
    };

    const formatCurrency = (amount) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Final Settlement Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Calculate and process final settlement for exiting employees
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => setSettlements(mockSettlementData)}
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
                            {settlements.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Settlements
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                            {settlements.filter(s => s.status === 'Processed').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Processed
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                            ₹{Math.round(settlements.reduce((sum, s) => sum + s.settlement.netSettlement, 0) / 1000)}K
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Payout
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Settlements Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Last Working Day</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Total Earnings</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Total Deductions</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Net Settlement</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {settlements.map((settlement) => (
                            <TableRow key={settlement.id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                            {settlement.employeeName.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {settlement.employeeName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {settlement.employeeId} • {settlement.department}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>
                                        {new Date(settlement.lastWorkingDay).toLocaleDateString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600} color="success.main">
                                        {formatCurrency(settlement.settlement.totalEarnings)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" color="error.main">
                                        {formatCurrency(settlement.settlement.totalDeductions)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={700} color="primary.main">
                                        {formatCurrency(settlement.settlement.netSettlement)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={settlement.status}
                                        color={getStatusColor(settlement.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton size="small" onClick={() => handleViewSettlement(settlement)}>
                                            <ViewIcon />
                                        </IconButton>
                                        <IconButton size="small">
                                            <DownloadIcon />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Settlement Detail Dialog */}
            <Dialog open={showSettlementDialog} onClose={() => setShowSettlementDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SettlementIcon />
                        Final Settlement - {selectedEmployee?.employeeName}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedEmployee && (
                        <Box sx={{ mt: 1 }}>
                            {/* Employee Info */}
                            <Alert severity="info" sx={{ mb: 3 }}>
                                Settlement calculated for {selectedEmployee.employeeName} ({selectedEmployee.employeeId}) 
                                with last working day on {new Date(selectedEmployee.lastWorkingDay).toLocaleDateString('en-IN')}
                            </Alert>

                            <Grid container spacing={3}>
                                {/* Earnings Section */}
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 3, bgcolor: 'success.50', border: 1, borderColor: 'success.200' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
                                            Earnings
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Salary Due ({selectedEmployee.settlement.workingDays} days)</Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {formatCurrency(selectedEmployee.settlement.salaryDue)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Leave Encashment</Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {formatCurrency(selectedEmployee.settlement.leaveEncashment)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Bonus</Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {formatCurrency(selectedEmployee.settlement.bonus)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Gratuity</Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {formatCurrency(selectedEmployee.settlement.gratuity)}
                                                </Typography>
                                            </Box>
                                            <Divider />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body1" fontWeight={600}>Total Earnings</Typography>
                                                <Typography variant="body1" fontWeight={700} color="success.main">
                                                    {formatCurrency(selectedEmployee.settlement.totalEarnings)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Grid>

                                {/* Deductions Section */}
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 3, bgcolor: 'error.50', border: 1, borderColor: 'error.200' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>
                                            Deductions
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Advance Recovery</Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {formatCurrency(selectedEmployee.settlement.advanceDeduction)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Notice Period Shortfall</Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {formatCurrency(selectedEmployee.settlement.noticePeriodDeduction)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Other Deductions</Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {formatCurrency(selectedEmployee.settlement.otherDeductions)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">-</Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    -
                                                </Typography>
                                            </Box>
                                            <Divider />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body1" fontWeight={600}>Total Deductions</Typography>
                                                <Typography variant="body1" fontWeight={700} color="error.main">
                                                    {formatCurrency(selectedEmployee.settlement.totalDeductions)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Grid>
                            </Grid>

                            {/* Net Settlement */}
                            <Paper sx={{ p: 3, mt: 3, bgcolor: 'primary.50', border: 2, borderColor: 'primary.main' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                        Net Settlement Amount
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                        {formatCurrency(selectedEmployee.settlement.netSettlement)}
                                    </Typography>
                                </Box>
                            </Paper>

                            {/* Calculation Details */}
                            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                    Calculation Details
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    • Joining Date: {new Date(selectedEmployee.joiningDate).toLocaleDateString('en-IN')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    • Service Period: {Math.round((new Date(selectedEmployee.lastWorkingDay) - new Date(selectedEmployee.joiningDate)) / (1000 * 60 * 60 * 24 * 365 * 100)) / 100} years
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    • Basic Salary: {formatCurrency(selectedEmployee.basicSalary)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    • Calculated by: {selectedEmployee.calculatedBy} on {new Date(selectedEmployee.calculatedOn).toLocaleDateString('en-IN')}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSettlementDialog(false)}>Close</Button>
                    <Button startIcon={<CalculateIcon />} variant="outlined">
                        Recalculate
                    </Button>
                    <Button startIcon={<DownloadIcon />} variant="contained">
                        Download Statement
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FinalSettlement;