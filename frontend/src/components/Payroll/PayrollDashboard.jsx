import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Paper,
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
    Tooltip,
    Button,
    Grid,
    List,
    ListItem,
    ListItemText,
    Collapse
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    People as PeopleIcon,
    AccountBalance as AccountBalanceIcon,
    Receipt as ReceiptIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    PersonAdd as PersonAddIcon,
    EventAvailable as EventAvailableIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import payrollService from '../../services/payrollService';
import { useProfileSwitching } from '../../context/ProfileSwitchingContext';

const PayrollDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [readinessData, setReadinessData] = useState(null);
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [expandedSections, setExpandedSections] = useState({
        noSalary: false,
        missingAttendance: false,
        pendingLeaves: false
    });
    const { currentView, switchView, getAvailableViews } = useProfileSwitching();

    const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#0288d1', '#f57c00'];

    // Ensure user is in HR view when accessing payroll dashboard
    useEffect(() => {
        if (currentView !== 'HR' && getAvailableViews().includes('HR')) {
            switchView('HR');
        }
    }, [currentView, switchView, getAvailableViews]);

    // Load initial data only after view is set to HR
    useEffect(() => {
        if (currentView === 'HR') {
            loadInitialData();
        }
    }, [currentView]);

    // Load data when period changes
    useEffect(() => {
        if (selectedPeriod) {
            loadDashboardData(selectedPeriod);
        }
    }, [selectedPeriod]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Wait a bit for view switch to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Load periods first
            const periodsResponse = await payrollService.getPeriods();
            const periodsData = periodsResponse?.data || [];
            
            setPeriods(periodsData);
            
            // Select the first period by default
            if (periodsData.length > 0) {
                const firstPeriod = periodsData[0];
                setSelectedPeriod(firstPeriod.period_id);
                // Load readiness for the selected period's month
                try {
                    const periodDate = new Date(firstPeriod.start_date);
                    const readiness = await payrollService.getPayrollReadiness(
                        periodDate.getFullYear(),
                        periodDate.getMonth() + 1
                    );
                    setReadinessData(readiness);
                } catch (err) {
                    // Don't fail the whole dashboard if readiness check fails
                }
            } else {
                setError('No payroll periods found. Please create a payroll period first.');
            }
        } catch (err) {
            setError(`Failed to load payroll data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const loadDashboardData = async (periodId) => {
        try {
            setLoading(true);
            setError(null);

            const response = await payrollService.getDashboard(periodId);
            if (response?.success) {
                setDashboardData(response.data);
            }

            // Reload readiness for the selected period's month
            if (Array.isArray(periods) && periods.length > 0) {
                const period = periods.find(p => p.period_id === periodId);
                if (period) {
                    try {
                        const periodDate = new Date(period.start_date);
                        const readiness = await payrollService.getPayrollReadiness(
                            periodDate.getFullYear(),
                            periodDate.getMonth() + 1
                        );
                        setReadinessData(readiness);
                    } catch (err) {
                        // ignore readiness errors
                    }
                }
            }
        } catch (err) {
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodChange = (event) => {
        setSelectedPeriod(event.target.value);
    };

    const handleRefresh = () => {
        if (selectedPeriod) {
            loadDashboardData(selectedPeriod);
        }
        // Also refresh readiness
        loadInitialData();
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const getReadinessStatusColor = (status) => {
        switch (status) {
            case 'READY': return 'success';
            case 'NOT_READY': return 'error';
            case 'PENDING_APPROVALS': return 'warning';
            case 'ALREADY_PROCESSED': return 'info';
            default: return 'default';
        }
    };

    const getReadinessStatusIcon = (status) => {
        switch (status) {
            case 'READY': return <CheckCircleIcon />;
            case 'NOT_READY': return <ErrorIcon />;
            case 'PENDING_APPROVALS': return <WarningIcon />;
            case 'ALREADY_PROCESSED': return <CheckCircleIcon />;
            default: return <WarningIcon />;
        }
    };

    const getReadinessStatusText = (status) => {
        switch (status) {
            case 'READY': return 'Ready to Process';
            case 'NOT_READY': return 'Not Ready - Action Required';
            case 'PENDING_APPROVALS': return 'Pending Approvals';
            case 'ALREADY_PROCESSED': return 'Already Processed';
            case 'NO_EMPLOYEES': return 'No Active Employees';
            default: return 'Unknown Status';
        }
    };

    const StatCard = ({ title, value, icon, color = 'primary', subtitle = null }) => (
        <Card sx={{ height: '100%' }}>
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
                            bgcolor: `${color}.light`,
                            color: `${color}.main`,
                            mr: 2
                        }}
                    >
                        {icon}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: `${color}.main` }}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );

    if (loading && !dashboardData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    // Show empty state when no periods exist
    if (!Array.isArray(periods) || periods.length === 0) {
        if (!loading) {
            return (
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                        Payroll Dashboard
                    </Typography>
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: 2,
                            maxWidth: 600,
                            mx: 'auto'
                        }}>
                            <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                No Payroll Periods Found
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                Get started by creating your first payroll period. You'll need to create a period before you can process payroll.
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => navigate('/payroll?tab=1')}
                                sx={{ mt: 2 }}
                            >
                                Create Payroll Period
                            </Button>
                            <Box sx={{ mt: 3, textAlign: 'left', width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                    Quick Guide:
                                </Typography>
                                <Typography variant="body2" color="text.secondary" component="div">
                                    <ol style={{ paddingLeft: 20, margin: 0 }}>
                                        <li>Create a payroll period for the month you want to process</li>
                                        <li>Ensure all employees have salary structures assigned</li>
                                        <li>Mark attendance for all employees for the period</li>
                                        <li>Process payroll calculations and review</li>
                                        <li>Lock and generate payslips</li>
                                    </ol>
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            );
        }
        // Still loading, show spinner
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && Array.isArray(periods) && periods.length > 0) {
        return (
            <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                    Payroll Dashboard
                </Typography>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            </Box>
        );
    }

    const periodSummary = dashboardData?.period_summary || {};
    const departmentSummary = dashboardData?.department_summary || [];
    const recentActivities = dashboardData?.recent_activities || [];
    const readinessSummary = readinessData?.summary || {};
    const employeesWithoutSalary = readinessData?.employees_without_salary || [];
    const employeesWithMissingAttendance = readinessData?.employees_with_missing_attendance || [];
    const pendingLeaveRequests = readinessData?.pending_leave_requests || [];

    return (
        <Box>
            {/* Header with Period Selection */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Payroll Dashboard
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Payroll Period</InputLabel>
                        <Select
                            value={selectedPeriod}
                            onChange={handlePeriodChange}
                            label="Payroll Period"
                        >
                            {Array.isArray(periods) && periods.map((period) => (
                                <MenuItem key={period.period_id} value={period.period_id}>
                                    {period.period_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Tooltip title="Refresh Dashboard">
                        <IconButton onClick={handleRefresh} disabled={loading}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Payroll Readiness Check */}
            {readinessData && (
                <Paper sx={{ p: 3, mb: 3, border: 2, borderColor: `${getReadinessStatusColor(readinessSummary.readiness_status)}.main` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                bgcolor: `${getReadinessStatusColor(readinessSummary.readiness_status)}.light`,
                                color: `${getReadinessStatusColor(readinessSummary.readiness_status)}.main`
                            }}>
                                {getReadinessStatusIcon(readinessSummary.readiness_status)}
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Payroll Readiness Check
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {readinessSummary.start_date && payrollService.formatDate(readinessSummary.start_date)} - {readinessSummary.end_date && payrollService.formatDate(readinessSummary.end_date)}
                                </Typography>
                            </Box>
                        </Box>
                        <Chip 
                            label={getReadinessStatusText(readinessSummary.readiness_status)}
                            color={getReadinessStatusColor(readinessSummary.readiness_status)}
                            size="large"
                            sx={{ fontWeight: 600, px: 2 }}
                        />
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    {readinessSummary.total_active_employees || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Active Employees
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: readinessSummary.employees_without_salary > 0 ? 'error.main' : 'success.main' }}>
                                    {readinessSummary.employees_without_salary || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Without Salary
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: readinessSummary.employees_with_missing_attendance > 0 ? 'warning.main' : 'success.main' }}>
                                    {readinessSummary.employees_with_missing_attendance || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Missing Attendance
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: readinessSummary.pending_leave_requests > 0 ? 'warning.main' : 'success.main' }}>
                                    {readinessSummary.pending_leave_requests || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Pending Leaves
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Warning Details */}
                    {employeesWithoutSalary.length > 0 && (
                        <Alert 
                            severity="error" 
                            sx={{ mb: 2 }}
                            action={
                                <Button 
                                    color="inherit" 
                                    size="small"
                                    startIcon={<PersonAddIcon />}
                                    onClick={() => navigate('/payroll?tab=3')}
                                >
                                    Assign Salary
                                </Button>
                            }
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {employeesWithoutSalary.length} employee(s) without salary assignment
                                </Typography>
                                <IconButton size="small" onClick={() => toggleSection('noSalary')}>
                                    {expandedSections.noSalary ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                            <Collapse in={expandedSections.noSalary}>
                                <List dense>
                                    {employeesWithoutSalary.map((emp) => (
                                        <ListItem key={emp.employee_id}>
                                            <ListItemText 
                                                primary={emp.employee_name}
                                                secondary={`${emp.employee_code} - ${emp.department || 'N/A'}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Collapse>
                        </Alert>
                    )}

                    {employeesWithMissingAttendance.length > 0 && (
                        <Alert 
                            severity="warning" 
                            sx={{ mb: 2 }}
                            action={
                                <Button 
                                    color="inherit" 
                                    size="small"
                                    startIcon={<EventAvailableIcon />}
                                    onClick={() => navigate('/attendance')}
                                >
                                    Mark Attendance
                                </Button>
                            }
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {employeesWithMissingAttendance.length} employee(s) with incomplete attendance
                                </Typography>
                                <IconButton size="small" onClick={() => toggleSection('missingAttendance')}>
                                    {expandedSections.missingAttendance ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                            <Collapse in={expandedSections.missingAttendance}>
                                <List dense>
                                    {employeesWithMissingAttendance.map((emp) => (
                                        <ListItem key={emp.employee_id}>
                                            <ListItemText 
                                                primary={emp.employee_name}
                                                secondary={`${emp.days_marked}/${emp.total_days} days marked - ${emp.missing_days} days missing`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Collapse>
                        </Alert>
                    )}

                    {pendingLeaveRequests.length > 0 && (
                        <Alert 
                            severity="warning"
                            action={
                                <Button 
                                    color="inherit" 
                                    size="small"
                                    startIcon={<AssignmentIcon />}
                                    onClick={() => navigate('/leave')}
                                >
                                    Review Leaves
                                </Button>
                            }
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {pendingLeaveRequests.length} pending leave request(s)
                                </Typography>
                                <IconButton size="small" onClick={() => toggleSection('pendingLeaves')}>
                                    {expandedSections.pendingLeaves ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                            <Collapse in={expandedSections.pendingLeaves}>
                                <List dense>
                                    {pendingLeaveRequests.map((leave) => (
                                        <ListItem key={leave.leave_request_id}>
                                            <ListItemText 
                                                primary={leave.employee_name}
                                                secondary={`${leave.leave_type_name} - ${payrollService.formatDate(leave.start_date)} to ${payrollService.formatDate(leave.end_date)} (${leave.total_days} days)`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Collapse>
                        </Alert>
                    )}
                </Paper>
            )}

            {/* Period Status */}
            {periodSummary.period_name && (
                <Alert 
                    severity={periodSummary.status === 'COMPLETED' ? 'success' : 'info'} 
                    sx={{ mb: 3 }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {periodSummary.period_name} - Status: {periodSummary.status}
                    </Typography>
                    <Typography variant="body2">
                        {periodSummary.status === 'COMPLETED' 
                            ? `Processed on ${payrollService.formatDate(periodSummary.processed_at)}`
                            : 'Payroll processing is pending for this period'
                        }
                    </Typography>
                </Alert>
            )}

            {/* Summary Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
                <StatCard
                    title="Total Employees"
                    value={periodSummary.total_employees || 0}
                    icon={<PeopleIcon />}
                    color="primary"
                    subtitle="Active employees"
                />
                <StatCard
                    title="Gross Salary"
                    value={payrollService.formatCurrency(periodSummary.total_gross)}
                    icon={<TrendingUpIcon />}
                    color="success"
                    subtitle="Total earnings"
                />
                <StatCard
                    title="Total Deductions"
                    value={payrollService.formatCurrency(periodSummary.total_deductions)}
                    icon={<TrendingDownIcon />}
                    color="warning"
                    subtitle="All deductions"
                />
                <StatCard
                    title="Net Payroll"
                    value={payrollService.formatCurrency(periodSummary.total_net)}
                    icon={<AccountBalanceIcon />}
                    color="info"
                    subtitle="Final payout"
                />
            </Box>

            {/* Department Charts */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 3 }}>
                {/* Department Payroll Distribution - Pie Chart */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Department Payroll Distribution
                    </Typography>
                    {departmentSummary.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={departmentSummary.map(dept => ({
                                        name: dept.department,
                                        value: dept.total_net
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {departmentSummary.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    formatter={(value) => payrollService.formatCurrency(value)}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            No department data available
                        </Typography>
                    )}
                </Paper>

                {/* Department Employee Count - Bar Chart */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Employees by Department
                    </Typography>
                    {departmentSummary.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={departmentSummary}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="department" />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="employee_count" fill="#1976d2" name="Employees" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            No department data available
                        </Typography>
                    )}
                </Paper>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                {/* Department-wise Summary Table */}
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Department-wise Summary
                        </Typography>
                    </Box>
                    {departmentSummary.length > 0 ? (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Employees</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Gross Salary</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Net Salary</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Avg. Salary</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {departmentSummary.map((dept, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell>{dept.department}</TableCell>
                                            <TableCell align="right">{dept.employee_count}</TableCell>
                                            <TableCell align="right">
                                                {payrollService.formatCurrency(dept.total_gross)}
                                            </TableCell>
                                            <TableCell align="right">
                                                {payrollService.formatCurrency(dept.total_net)}
                                            </TableCell>
                                            <TableCell align="right">
                                                {payrollService.formatCurrency(dept.avg_net_salary)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            No department data available for this period
                        </Typography>
                    )}
                </Paper>

                {/* Recent Activities */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Recent Activities
                    </Typography>
                    {recentActivities.length > 0 ? (
                        <Box>
                            {recentActivities.map((activity, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        py: 1.5,
                                        borderBottom: index < recentActivities.length - 1 ? 1 : 0,
                                        borderColor: 'divider'
                                    }}
                                >
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {activity.employee_name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {payrollService.formatCurrency(activity.net_salary)}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={activity.payment_status}
                                        size="small"
                                        color={payrollService.getStatusColor(activity.payment_status)}
                                        variant="outlined"
                                    />
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            No recent activities
                        </Typography>
                    )}
                </Paper>
            </Box>
        </Box>
    );
};

export default PayrollDashboard;