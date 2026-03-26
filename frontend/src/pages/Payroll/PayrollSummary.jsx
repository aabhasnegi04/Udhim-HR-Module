import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    People as PeopleIcon,
    AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import payrollService from '../../services/payrollService';

const PayrollSummary = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [summaryData, setSummaryData] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        loadPeriods();
    }, []);

    useEffect(() => {
        if (selectedPeriod) {
            loadSummaryData();
        }
    }, [selectedPeriod]);

    const loadPeriods = async () => {
        try {
            setLoading(true);
            const res = await payrollService.getPeriods();
            const periodsData = res?.data || [];
            setPeriods(periodsData);
            
            if (periodsData.length > 0) {
                setSelectedPeriod(periodsData[0].period_id);
            }
        } catch (err) {
            setError('Failed to load payroll periods');
        } finally {
            setLoading(false);
        }
    };

    const loadSummaryData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [summary, dashboard] = await Promise.all([
                payrollService.getPayrollSummary(selectedPeriod),
                payrollService.getDashboard(selectedPeriod)
            ]);

            if (summary?.success) {
                setSummaryData(summary.data);
            }
            
            if (dashboard?.success) {
                setDashboardData(dashboard.data);
            }
        } catch (err) {
            setError('Failed to load payroll summary');
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodChange = (event) => {
        setSelectedPeriod(event.target.value);
    };

    const handleExport = () => {
        console.log('Exporting payroll summary...');
        // Export logic would go here
    };

    if (loading && !summaryData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    const periodSummary = dashboardData?.period_summary || {};
    const departmentSummary = dashboardData?.department_summary || [];
    const employees = summaryData || [];

    // Calculate totals
    const totalGross = employees.reduce((sum, emp) => sum + (emp.gross_salary || 0), 0);
    const totalDeductions = employees.reduce((sum, emp) => sum + (emp.total_deductions || 0), 0);
    const totalNet = employees.reduce((sum, emp) => sum + (emp.net_salary || 0), 0);

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Payroll Summary
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Detailed payroll breakdown and analytics
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Payroll Period</InputLabel>
                        <Select
                            value={selectedPeriod}
                            onChange={handlePeriodChange}
                            label="Payroll Period"
                        >
                            {periods.map((period) => (
                                <MenuItem key={period.period_id} value={period.period_id}>
                                    {period.period_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Tooltip title="Refresh">
                        <IconButton onClick={loadSummaryData} disabled={loading}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        size="small"
                    >
                        Export
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Period Info */}
            {periodSummary.period_name && (
                <Alert 
                    severity={periodSummary.status === 'COMPLETED' ? 'success' : 'info'} 
                    sx={{ mb: 3 }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {periodSummary.period_name} - Status: {periodSummary.status}
                    </Typography>
                </Alert>
            )}

            {/* Summary Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2,
                                    bgcolor: 'primary.light',
                                    color: 'primary.main',
                                    mr: 2
                                }}
                            >
                                <PeopleIcon />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Total Employees
                            </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {employees.length}
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2,
                                    bgcolor: 'success.light',
                                    color: 'success.main',
                                    mr: 2
                                }}
                            >
                                <TrendingUpIcon />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Total Gross
                            </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {payrollService.formatCurrency(totalGross)}
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2,
                                    bgcolor: 'warning.light',
                                    color: 'warning.main',
                                    mr: 2
                                }}
                            >
                                <TrendingDownIcon />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Total Deductions
                            </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                            {payrollService.formatCurrency(totalDeductions)}
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2,
                                    bgcolor: 'info.light',
                                    color: 'info.main',
                                    mr: 2
                                }}
                            >
                                <AccountBalanceIcon />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Net Payable
                            </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                            {payrollService.formatCurrency(totalNet)}
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Department Charts */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 3 }}>
                {/* Department Payroll Comparison */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Department Payroll Comparison
                    </Typography>
                    {departmentSummary.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={departmentSummary}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="department" />
                                <YAxis />
                                <RechartsTooltip 
                                    formatter={(value) => payrollService.formatCurrency(value)}
                                />
                                <Legend />
                                <Bar dataKey="total_gross" fill="#2e7d32" name="Gross Salary" />
                                <Bar dataKey="total_net" fill="#1976d2" name="Net Salary" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            No department data available
                        </Typography>
                    )}
                </Paper>

                {/* Average Salary by Department */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Average Salary by Department
                    </Typography>
                    {departmentSummary.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={departmentSummary}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="department" />
                                <YAxis />
                                <RechartsTooltip 
                                    formatter={(value) => payrollService.formatCurrency(value)}
                                />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="avg_net_salary" 
                                    stroke="#ed6c02" 
                                    strokeWidth={2}
                                    name="Avg. Net Salary"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            No department data available
                        </Typography>
                    )}
                </Paper>
            </Box>

            {/* Employee-wise Summary Table */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Employee-wise Payroll Summary
                </Typography>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : employees.length > 0 ? (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Days Worked</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Gross Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Deductions</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Net Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {employees.map((employee, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {employee.employee_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {employee.employee_code}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{employee.department || 'N/A'}</TableCell>
                                        <TableCell align="right">
                                            {employee.days_worked || 0} / {employee.total_days || 0}
                                        </TableCell>
                                        <TableCell align="right">
                                            {payrollService.formatCurrency(employee.gross_salary)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {payrollService.formatCurrency(employee.total_deductions)}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600}>
                                                {payrollService.formatCurrency(employee.net_salary)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={employee.payment_status || 'PENDING'}
                                                color={payrollService.getStatusColor(employee.payment_status)}
                                                size="small"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Alert severity="info">
                        No payroll data available for this period.
                    </Alert>
                )}
            </Paper>
        </Box>
    );
};

export default PayrollSummary;
