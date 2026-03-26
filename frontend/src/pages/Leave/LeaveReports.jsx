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
    Tabs,
    Tab,
    LinearProgress,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Download as DownloadIcon,
    Print as PrintIcon,
    Refresh as RefreshIcon,
    Assessment as ReportIcon,
    TrendingUp as TrendingUpIcon,
    PieChart as PieChartIcon
} from '@mui/icons-material';
import leaveService from '../../services/leaveService';

// Mock report data
const mockReportData = {
    leaveRegister: [
        { 
            id: 1, 
            employee: 'John Smith', 
            employeeId: 'EMP001',
            department: 'Engineering',
            type: 'Sick Leave', 
            from: '2025-12-28', 
            to: '2025-12-29', 
            days: 2, 
            status: 'approved',
            appliedOn: '2025-12-25'
        },
        { 
            id: 2, 
            employee: 'Sarah Johnson', 
            employeeId: 'EMP002',
            department: 'Marketing',
            type: 'Casual Leave', 
            from: '2026-01-05', 
            to: '2026-01-09', 
            days: 5, 
            status: 'approved',
            appliedOn: '2025-12-20'
        },
        { 
            id: 3, 
            employee: 'Michael Chen', 
            employeeId: 'EMP003',
            department: 'Engineering',
            type: 'Earned Leave', 
            from: '2025-12-30', 
            to: '2026-01-03', 
            days: 5, 
            status: 'pending',
            appliedOn: '2025-12-26'
        },
        { 
            id: 4, 
            employee: 'Emily Davis', 
            employeeId: 'EMP004',
            department: 'Sales',
            type: 'Sick Leave', 
            from: '2026-01-02', 
            to: '2026-01-04', 
            days: 3, 
            status: 'approved',
            appliedOn: '2025-12-28'
        }
    ],
    leaveBalance: [
        { 
            employee: 'John Smith', 
            employeeId: 'EMP001',
            department: 'Engineering',
            casualLeave: { total: 12, used: 3, remaining: 9 },
            sickLeave: { total: 10, used: 2, remaining: 8 },
            earnedLeave: { total: 15, used: 5, remaining: 10 }
        },
        { 
            employee: 'Sarah Johnson', 
            employeeId: 'EMP002',
            department: 'Marketing',
            casualLeave: { total: 12, used: 5, remaining: 7 },
            sickLeave: { total: 10, used: 1, remaining: 9 },
            earnedLeave: { total: 15, used: 3, remaining: 12 }
        },
        { 
            employee: 'Michael Chen', 
            employeeId: 'EMP003',
            department: 'Engineering',
            casualLeave: { total: 12, used: 2, remaining: 10 },
            sickLeave: { total: 10, used: 0, remaining: 10 },
            earnedLeave: { total: 15, used: 8, remaining: 7 }
        },
        { 
            employee: 'Emily Davis', 
            employeeId: 'EMP004',
            department: 'Sales',
            casualLeave: { total: 12, used: 4, remaining: 8 },
            sickLeave: { total: 10, used: 3, remaining: 7 },
            earnedLeave: { total: 15, used: 2, remaining: 13 }
        }
    ],
    departmentStats: [
        { department: 'Engineering', totalEmployees: 25, onLeave: 3, leavePercentage: 12 },
        { department: 'Marketing', totalEmployees: 15, onLeave: 1, leavePercentage: 7 },
        { department: 'Sales', totalEmployees: 20, onLeave: 2, leavePercentage: 10 },
        { department: 'HR', totalEmployees: 8, onLeave: 0, leavePercentage: 0 },
        { department: 'Finance', totalEmployees: 14, onLeave: 1, leavePercentage: 7 }
    ],
    monthlyTrend: [
        { month: 'Aug', leaves: 15, approved: 14, rejected: 1 },
        { month: 'Sep', leaves: 18, approved: 16, rejected: 2 },
        { month: 'Oct', leaves: 12, approved: 11, rejected: 1 },
        { month: 'Nov', leaves: 20, approved: 18, rejected: 2 },
        { month: 'Dec', leaves: 25, approved: 22, rejected: 3 }
    ]
};

const LeaveReports = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [dateRange, setDateRange] = useState({
        from: '',
        to: ''
    });
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('');
    
    // Data states
    const [leaveRegisterData, setLeaveRegisterData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadLeaveRegister();
    }, []);

    const loadLeaveRegister = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await leaveService.getLeaveRegister(
                dateRange.from || null,
                dateRange.to || null,
                statusFilter || null
            );
            
            if (result.success) {
                setLeaveRegisterData(result.data || []);
            } else {
                setError(result.error || 'Failed to load leave register');
            }
        } catch (err) {
            setError('Failed to load leave register');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setDateRange({ from: '', to: '' });
        setDepartmentFilter('all');
        setTypeFilter('all');
        setStatusFilter('');
        loadLeaveRegister();
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleExport = (format) => {
        console.log(`Exporting report in ${format} format`);
        // Export logic would go here
    };

    const getStatusColor = (status) => {
        return leaveService.getStatusColor(status);
    };

    const getStatusLabel = (status) => {
        return leaveService.getStatusLabel(status);
    };

    const getFilteredLeaveRegister = () => {
        let filtered = leaveRegisterData;

        if (departmentFilter !== 'all') {
            filtered = filtered.filter(leave => leave.department === departmentFilter);
        }

        if (typeFilter !== 'all') {
            filtered = filtered.filter(leave => leave.leave_name === typeFilter);
        }

        return filtered;
    };

    const filteredLeaveRegister = getFilteredLeaveRegister();

    const renderLeaveRegister = () => (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Leave Register
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            
            {/* Filters */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                {/* Mobile Layout - Stacked */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                    {/* Date Range Row */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' }, minWidth: { xs: '100%', sm: '150px' } }}>
                            <AppDatePicker
                                label="From Date"
                                value={dateRange.from}
                                onChange={(v) => setDateRange(prev => ({ ...prev, from: v }))}
                                size="small"
                            />
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' }, minWidth: { xs: '100%', sm: '150px' } }}>
                            <AppDatePicker
                                label="To Date"
                                value={dateRange.to}
                                onChange={(v) => setDateRange(prev => ({ ...prev, to: v }))}
                                size="small"
                            />
                        </Box>
                    </Box>
                    
                    {/* Filters Row */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' }, minWidth: { xs: '100%', sm: '120px' } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="">All Status</MenuItem>
                                    <MenuItem value="PENDING">Pending</MenuItem>
                                    <MenuItem value="MANAGER_APPROVED">Manager Approved</MenuItem>
                                    <MenuItem value="HR_APPROVED">Approved</MenuItem>
                                    <MenuItem value="REJECTED">Rejected</MenuItem>
                                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' }, minWidth: { xs: '100%', sm: '120px' } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Department</InputLabel>
                                <Select
                                    value={departmentFilter}
                                    label="Department"
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All Departments</MenuItem>
                                    <MenuItem value="Engineering">Engineering</MenuItem>
                                    <MenuItem value="Marketing">Marketing</MenuItem>
                                    <MenuItem value="Sales">Sales</MenuItem>
                                    <MenuItem value="HR">HR</MenuItem>
                                    <MenuItem value="Finance">Finance</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' }, minWidth: { xs: '100%', sm: '120px' } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Leave Type</InputLabel>
                                <Select
                                    value={typeFilter}
                                    label="Leave Type"
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All Types</MenuItem>
                                    <MenuItem value="Sick Leave">Sick Leave</MenuItem>
                                    <MenuItem value="Casual Leave">Casual Leave</MenuItem>
                                    <MenuItem value="Earned Leave">Earned Leave</MenuItem>
                                    <MenuItem value="Maternity Leave">Maternity Leave</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                    
                    {/* Apply Button */}
                    <Box>
                        <Button
                            variant="contained"
                            onClick={loadLeaveRegister}
                            size="small"
                            disabled={loading}
                            fullWidth
                        >
                            Apply Filters
                        </Button>
                    </Box>
                </Box>

                {/* Desktop Layout - Single Row */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '0 0 200px', minWidth: '200px' }}>
                        <AppDatePicker
                            label="From Date"
                            value={dateRange.from}
                            onChange={(v) => setDateRange(prev => ({ ...prev, from: v }))}
                            size="small"
                        />
                    </Box>
                    <Box sx={{ flex: '0 0 200px', minWidth: '200px' }}>
                        <AppDatePicker
                            label="To Date"
                            value={dateRange.to}
                            onChange={(v) => setDateRange(prev => ({ ...prev, to: v }))}
                            size="small"
                        />
                    </Box>
                    <Box sx={{ flex: '0 0 150px', minWidth: '150px' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="">All Status</MenuItem>
                                <MenuItem value="PENDING">Pending</MenuItem>
                                <MenuItem value="MANAGER_APPROVED">Manager Approved</MenuItem>
                                <MenuItem value="HR_APPROVED">Approved</MenuItem>
                                <MenuItem value="REJECTED">Rejected</MenuItem>
                                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '0 0 150px', minWidth: '150px' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Department</InputLabel>
                            <Select
                                value={departmentFilter}
                                label="Department"
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Departments</MenuItem>
                                <MenuItem value="Engineering">Engineering</MenuItem>
                                <MenuItem value="Marketing">Marketing</MenuItem>
                                <MenuItem value="Sales">Sales</MenuItem>
                                <MenuItem value="HR">HR</MenuItem>
                                <MenuItem value="Finance">Finance</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '0 0 150px', minWidth: '150px' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Leave Type</InputLabel>
                            <Select
                                value={typeFilter}
                                label="Leave Type"
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="Sick Leave">Sick Leave</MenuItem>
                                <MenuItem value="Casual Leave">Casual Leave</MenuItem>
                                <MenuItem value="Earned Leave">Earned Leave</MenuItem>
                                <MenuItem value="Maternity Leave">Maternity Leave</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Button
                        variant="contained"
                        onClick={loadLeaveRegister}
                        size="small"
                        disabled={loading}
                    >
                        Apply Filters
                    </Button>
                </Box>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>From Date</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>To Date</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Days</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Applied On</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredLeaveRegister.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center">
                                                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                                    No leave records found
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredLeaveRegister.map((leave) => (
                                            <TableRow key={leave.request_id} hover>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                                            {leave.employee_name ? leave.employee_name.charAt(0) : 'E'}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {leave.employee_name || 'N/A'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {leave.employee_code || 'N/A'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{leave.department || 'N/A'}</TableCell>
                                                <TableCell>{leave.leave_name}</TableCell>
                                                <TableCell>{new Date(leave.start_date).toLocaleDateString()}</TableCell>
                                                <TableCell>{new Date(leave.end_date).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {leave.total_days}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getStatusLabel(leave.status)}
                                                        color={getStatusColor(leave.status)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>{new Date(leave.applied_at).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Mobile Card View */}
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                        {filteredLeaveRegister.length === 0 ? (
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    No leave records found
                                </Typography>
                            </Paper>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {filteredLeaveRegister.map((leave) => (
                                    <Card key={leave.request_id}>
                                        <CardContent sx={{ p: 2 }}>
                                            {/* Employee Info */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
                                                    {leave.employee_name ? leave.employee_name.charAt(0) : 'E'}
                                                </Avatar>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {leave.employee_name || 'N/A'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {leave.employee_code || 'N/A'} • {leave.department || 'N/A'}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={getStatusLabel(leave.status)}
                                                    color={getStatusColor(leave.status)}
                                                    size="small"
                                                />
                                            </Box>
                                            
                                            <Divider sx={{ my: 1.5 }} />
                                            
                                            {/* Leave Details */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Leave Type
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {leave.leave_name}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Duration
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Total Days
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={600} color="primary.main">
                                                        {leave.total_days} days
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Applied On
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {new Date(leave.applied_at).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}
                    </Box>
                    
                    <Box sx={{ mt: 2, textAlign: { xs: 'center', sm: 'right' } }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            Total Records: {filteredLeaveRegister.length}
                        </Typography>
                    </Box>
                </>
            )}
        </Box>
    );

    const renderLeaveBalance = () => (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Leave Balance Report
            </Typography>
            
            <Paper sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                <ReportIcon sx={{ fontSize: { xs: 48, sm: 64 }, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Coming Soon
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Leave balance report will be available soon. This will show all employees' leave balances across different leave types.
                </Typography>
            </Paper>
        </Box>
    );

    const renderDepartmentStats = () => (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Department-wise Leave Usage
            </Typography>
            
            <Paper sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                <PieChartIcon sx={{ fontSize: { xs: 48, sm: 64 }, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Coming Soon
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Department-wise statistics will be available soon. This will show leave usage patterns across different departments.
                </Typography>
            </Paper>
        </Box>
    );

    const renderMonthlyTrend = () => (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Monthly Leave Trend
            </Typography>
            
            <Paper sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: { xs: 48, sm: 64 }, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Coming Soon
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Monthly trend analysis will be available soon. This will show leave application patterns over time.
                </Typography>
            </Paper>
        </Box>
    );

    const tabs = [
        { label: 'Leave Register', component: renderLeaveRegister() },
        { label: 'Leave Balance', component: renderLeaveBalance() },
        { label: 'Department Stats', component: renderDepartmentStats() },
        { label: 'Monthly Trend', component: renderMonthlyTrend() }
    ];

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                            Leave Reports & Analytics
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            Comprehensive leave analytics and detailed reports
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleRefresh}
                            size="small"
                            disabled={loading}
                            sx={{ minWidth: { xs: 'auto', sm: 'auto' } }}
                        >
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Refresh</Box>
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            onClick={() => window.print()}
                            size="small"
                            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                        >
                            Print
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleExport('excel')}
                            size="small"
                            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                        >
                            Excel
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleExport('pdf')}
                            size="small"
                            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                        >
                            PDF
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {/* Report Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                            minWidth: { xs: 80, sm: 100, md: 120 },
                            px: { xs: 1, sm: 2, md: 3 },
                            py: { xs: 1.5, sm: 2 }
                        }
                    }}
                >
                    {tabs.map((tab, index) => (
                        <Tab key={index} label={tab.label} />
                    ))}
                </Tabs>
            </Paper>

            {/* Report Content */}
            <Box>
                {tabs[activeTab]?.component}
            </Box>
        </Box>
    );
};

export default LeaveReports;