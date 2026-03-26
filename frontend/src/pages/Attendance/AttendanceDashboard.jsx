import { useState, useEffect } from 'react';
import AppDatePicker from '../../components/common/AppDatePicker';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
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
    LinearProgress,
    IconButton,
    Stack,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    People as PeopleIcon,
    PersonOff as AbsentIcon,
    Schedule as LateIcon,
    BeachAccess as LeaveIcon,
    TrendingUp as TrendingUpIcon,
    CalendarToday as CalendarIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import attendanceService from '../../services/attendanceService';

const AttendanceDashboard = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load dashboard data
    const loadDashboardData = async (date = null) => {
        try {
            setLoading(true);
            setError(null);
            const result = await attendanceService.getDashboardData(date);
            
            if (result.success && result.data) {
                // Transform backend data to match our UI structure
                const transformedData = {
                    todaySummary: {
                        // Handle both field name formats (HR dashboard uses present_today, attendance dashboard uses total_present)
                        totalPresent: result.data.total_present || result.data.present_today || 0,
                        totalAbsent: result.data.total_absent || 0,
                        totalLate: result.data.total_late || 0,
                        totalOnLeave: result.data.total_on_leave || 0,
                        totalEmployees: result.data.total_employees || 0
                    },
                    recentActivity: result.data.recent_activity || [],
                    departmentStats: result.data.department_stats || [],
                    weeklyTrend: result.data.weekly_trend || []
                };
                
                setDashboardData(transformedData);
                
                // Show info message if no attendance data exists yet
                if (transformedData.todaySummary.totalEmployees === 0) {
                    setError('No attendance data available yet. Start marking attendance to see statistics.');
                }
            } else {
                // API returned but with no success
                setError(result.error || 'No attendance data available. Please mark attendance to see statistics.');
            }
        } catch (err) {
            // API call completely failed
            setError('Unable to connect to server. Please check your connection.');
            console.error('Dashboard API connection failed:', err);
        } finally {
            setLoading(false);
        }
    };

    // Load data on component mount and date change
    useEffect(() => {
        loadDashboardData(selectedDate);
    }, [selectedDate]);

    const handleRefresh = () => {
        loadDashboardData(selectedDate);
    };

    const handleApplyFilters = () => {
        loadDashboardData(selectedDate);
    };

    // Mock data fallback for when API data is not available
    const mockDashboardData = {
        todaySummary: {
            totalPresent: 87,
            totalAbsent: 8,
            totalLate: 5,
            totalOnLeave: 12,
            totalEmployees: 112
        },
        recentActivity: [
            { employee: 'John Smith', action: 'Check-in', time: '09:15 AM', status: 'late' },
            { employee: 'Sarah Johnson', action: 'Check-out', time: '06:30 PM', status: 'present' },
            { employee: 'Michael Chen', action: 'Check-in', time: '08:45 AM', status: 'present' },
            { employee: 'Emily Davis', action: 'Leave Applied', time: '08:30 AM', status: 'leave' },
            { employee: 'Robert Wilson', action: 'Regularization', time: '10:15 AM', status: 'pending' }
        ],
        departmentStats: [
            { department: 'Engineering', present: 22, total: 25, percentage: 88 },
            { department: 'Marketing', present: 14, total: 15, percentage: 93 },
            { department: 'Sales', present: 18, total: 20, percentage: 90 },
            { department: 'HR', present: 8, total: 8, percentage: 100 },
            { department: 'Finance', present: 12, total: 14, percentage: 86 }
        ],
        weeklyTrend: [
            { day: 'Mon', present: 95, absent: 5 },
            { day: 'Tue', present: 92, absent: 8 },
            { day: 'Wed', present: 89, absent: 11 },
            { day: 'Thu', present: 94, absent: 6 },
            { day: 'Fri', present: 87, absent: 13 }
        ]
    };

    // Use API data if available, otherwise fall back to mock data
    const displayData = dashboardData || mockDashboardData;
    
    // Safely extract todaySummary with fallback
    const todaySummary = displayData?.todaySummary || mockDashboardData.todaySummary;

    const summaryCards = [
        {
            title: 'Present Today',
            value: todaySummary?.totalPresent || 0,
            total: todaySummary?.totalEmployees || 0,
            icon: <PeopleIcon />,
            color: 'success',
            percentage: todaySummary?.totalEmployees ? Math.round((todaySummary.totalPresent / todaySummary.totalEmployees) * 100) : 0
        },
        {
            title: 'Absent',
            value: todaySummary?.totalAbsent || 0,
            total: todaySummary?.totalEmployees || 0,
            icon: <AbsentIcon />,
            color: 'error',
            percentage: todaySummary?.totalEmployees ? Math.round((todaySummary.totalAbsent / todaySummary.totalEmployees) * 100) : 0
        },
        {
            title: 'Late Arrivals',
            value: todaySummary?.totalLate || 0,
            total: todaySummary?.totalEmployees || 0,
            icon: <LateIcon />,
            color: 'warning',
            percentage: todaySummary?.totalEmployees ? Math.round((todaySummary.totalLate / todaySummary.totalEmployees) * 100) : 0
        },
        {
            title: 'On Leave',
            value: todaySummary?.totalOnLeave || 0,
            total: todaySummary?.totalEmployees || 0,
            icon: <LeaveIcon />,
            color: 'info',
            percentage: todaySummary?.totalEmployees ? Math.round((todaySummary.totalOnLeave / todaySummary.totalEmployees) * 100) : 0
        }
    ];

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase();
        switch (statusLower) {
            case 'present': return 'success';
            case 'late': return 'warning';
            case 'leave':
            case 'wfh': return 'info';
            case 'absent': return 'error';
            case 'pending': return 'default';
            default: return 'default';
        }
    };

    const getStatusIcon = (action) => {
        if (action.includes('Check-in') || action.includes('Check-out')) return '🕐';
        if (action.includes('Leave')) return '🏖️';
        if (action.includes('Regularization')) return '📝';
        return '📋';
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Actions & Filters */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: { xs: 2, sm: 3 },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 }
            }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Today's Overview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {new Date().toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <IconButton onClick={handleRefresh} disabled={loading}>
                        {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                    </IconButton>
                    <Button variant="outlined" startIcon={<DownloadIcon />} size="small">
                        Export
                    </Button>
                </Stack>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2, md: 3 }, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <AppDatePicker
                            label="Date"
                            value={selectedDate}
                            onChange={(v) => setSelectedDate(v)}
                            size="small"
                        />
                    </Box>
                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Department</InputLabel>
                            <Select
                                value={selectedDepartment}
                                label="Department"
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                            >
                                <MenuItem value="all">All Departments</MenuItem>
                                <MenuItem value="engineering">Engineering</MenuItem>
                                <MenuItem value="marketing">Marketing</MenuItem>
                                <MenuItem value="sales">Sales</MenuItem>
                                <MenuItem value="hr">HR</MenuItem>
                                <MenuItem value="finance">Finance</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '0 0 150px' }}>
                        <Button
                            variant="contained"
                            startIcon={<FilterIcon />}
                            fullWidth
                            size="small"
                            onClick={handleApplyFilters}
                            disabled={loading}
                        >
                            Apply Filters
                        </Button>
                    </Box>
                    <Box sx={{ flex: '0 0 120px' }}>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            fullWidth
                            size="small"
                        >
                            Export
                        </Button>
                    </Box>
                    <Box sx={{ flex: '1 1 200px', textAlign: { xs: 'left', md: 'right' } }}>
                        <Typography variant="body2" color="text.secondary">
                            Last updated: {new Date().toLocaleTimeString()}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Error/Info Alert */}
            {error && (
                <Alert 
                    severity={dashboardData && dashboardData.todaySummary.totalEmployees > 0 ? "info" : "warning"} 
                    sx={{ mb: 3 }}
                    onClose={() => setError(null)}
                >
                    {error}
                    {(!dashboardData || dashboardData.todaySummary.totalEmployees === 0) && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            💡 Tip: Use "Mark Attendance" tab to start recording attendance data.
                        </Typography>
                    )}
                </Alert>
            )}

            {/* Loading State */}
            {loading && !dashboardData && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Don't render content if still loading and no data */}
            {(!loading || dashboardData) && (
                <>
                    {/* Summary Cards */}
                    <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3, md: 4 }, flexWrap: 'wrap' }}>
                        {summaryCards.map((card, index) => (
                            <Box key={index} sx={{ flex: '1 1 250px', minWidth: { xs: '200px', sm: '250px' } }}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Box
                                                sx={{
                                                    p: 1,
                                                    borderRadius: 2,
                                                    bgcolor: `${card.color}.light`,
                                                    color: `${card.color}.contrastText`,
                                                    mr: 2
                                                }}
                                            >
                                                {card.icon}
                                            </Box>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {card.title}
                                                </Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                                                    {card.value}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                of {card.total} employees
                                            </Typography>
                                            <Chip
                                                label={`${card.percentage}%`}
                                                color={card.color}
                                                size="small"
                                            />
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={card.percentage}
                                            color={card.color}
                                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                                        />
                                    </CardContent>
                                </Card>
                            </Box>
                        ))}
                    </Box>

                    <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                        {/* Department-wise Attendance */}
                        <Box sx={{ flex: '1 1 400px', minWidth: { xs: '300px', sm: '400px' } }}>
                            <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: { xs: 2, sm: 3 } }}>
                                    Department-wise Attendance
                                </Typography>
                                {displayData?.departmentStats && displayData.departmentStats.length > 0 ? (
                                    <Box>
                                        {displayData.departmentStats.map((dept, index) => (
                                            <Box key={index} sx={{ mb: 3 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {dept.department}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {dept.present}/{dept.total}
                                                    </Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={dept.percentage}
                                                    color={dept.percentage >= 90 ? 'success' : dept.percentage >= 80 ? 'warning' : 'error'}
                                                    sx={{ height: 8, borderRadius: 4 }}
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    {dept.percentage}% attendance
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No department data available yet
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Mark attendance for more employees to see department statistics
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Box>

                        {/* Recent Activity */}
                        <Box sx={{ flex: '1 1 400px', minWidth: { xs: '300px', sm: '400px' } }}>
                            <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: { xs: 2, sm: 3 } }}>
                                    Recent Activity
                                </Typography>
                                {displayData?.recentActivity && displayData.recentActivity.length > 0 ? (
                                    <Box>
                                        {displayData.recentActivity.map((activity, index) => (
                                            <Box key={index}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
                                                    <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                                        {(activity.employee_name || activity.employee || 'U').charAt(0)}
                                                    </Avatar>
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {activity.employee_name || activity.employee || 'Unknown'}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {getStatusIcon(activity.action)} {activity.action}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                • {activity.time}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Chip
                                                        label={activity.status?.toLowerCase() || 'unknown'}
                                                        color={getStatusColor(activity.status)}
                                                        size="small"
                                                    />
                                                </Box>
                                                {index < displayData.recentActivity.length - 1 && <Divider />}
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No recent activity
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Activity will appear here as employees check in/out
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Box>
                    </Box>

                    {/* Weekly Trend */}
                    <Paper sx={{ p: { xs: 2, sm: 3 }, mt: { xs: 2, sm: 3 } }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: { xs: 2, sm: 3 } }}>
                            Weekly Attendance Trend
                        </Typography>
                        {displayData?.weeklyTrend && displayData.weeklyTrend.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
                                {displayData.weeklyTrend.map((day, index) => (
                                    <Box key={index} sx={{ flex: '1 1 120px', minWidth: { xs: '100px', sm: '120px' } }}>
                                        <Card sx={{ textAlign: 'center', p: { xs: 1, sm: 2 } }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                {day.day}
                                            </Typography>
                                            <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                                                {day.present}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Present
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="body2" color="error.main">
                                                    {day.absent} Absent
                                                </Typography>
                                            </Box>
                                        </Card>
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No weekly trend data available yet
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Weekly trends will appear after marking attendance for multiple days
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </>
            )}
        </Box>
    );
};

export default AttendanceDashboard;