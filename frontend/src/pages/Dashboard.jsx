import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Avatar,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    People as PeopleIcon,
    EventAvailable as AttendanceIcon,
    PendingActions as PendingIcon,
    AccountBalance as PayrollIcon,
    TrendingUp as TrendingUpIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    BeachAccess as LeaveIcon,
    PersonAdd as PersonAddIcon,
    Upload as UploadIcon,
    Assessment as AssessmentIcon,
    Description as DescriptionIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';
import { useNavigate } from 'react-router-dom';
import employeeService from '../services/employeeService';
import dashboardService from '../services/dashboardService';
import attendanceService from '../services/attendanceService';
import leaveService from '../services/leaveService';
import holidayService from '../services/holidayService';
import InactiveEmployeeAlert from '../components/InactiveEmployeeAlert';

const Dashboard = () => {
    const { user } = useAuth();
    const { currentView, isHRView, isManagerView, isEmployeeView, profileInfo } = useProfileSwitching();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false); // Initialize as false
    const [error, setError] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(false); // Prevent multiple simultaneous calls
    const [stats, setStats] = useState({
        totalEmployees: 0,
        presentToday: 0,
        attendancePercentage: 0,
        pendingApprovals: 0,
        payrollAmount: '0',
    });
    
    // Employee Dashboard specific state
    const [employeeStats, setEmployeeStats] = useState({
        daysPresent: 0,
        leaveBalance: 0,
        attendanceRate: 0,
        todayStatus: 'Not Checked In',
        checkInTime: null
    });
    
    const [specialLeaves, setSpecialLeaves] = useState([]);
    
    const [holidays, setHolidays] = useState([]);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [recentActivities, setRecentActivities] = useState([]);

    useEffect(() => {
        if (user?.role === 'HR' && currentView === 'HR') {
            // Reset employee dashboard loading state when switching to HR view
            setDashboardLoading(false);
            loadDashboardData();
        } else if (currentView === 'EMPLOYEE') {
            // Reset HR dashboard loading state when switching to employee view
            setLoading(false);
            loadEmployeeDashboardData();
        }
    }, [currentView, user?.role]);

    const loadDashboardData = async () => {
        if (isLoadingData) {
            return;
        }

        try {
            setIsLoadingData(true);
            setLoading(true);
            setError('');

            // Only HR users can fetch HR dashboard data when in HR view
            if (user?.role === 'HR' && currentView === 'HR') {
                // Add timeout to prevent infinite loading
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 15000) // 15 second timeout
                );
                
                try {
                    // Get HR dashboard statistics and recent activities in parallel
                    const [hrStatsResult, activitiesResult] = await Promise.race([
                        Promise.all([
                            dashboardService.getHRDashboardStats(),
                            dashboardService.getHRRecentActivities(5) // Get last 5 activities
                        ]),
                        timeoutPromise
                    ]);
                    
                    // Process HR stats
                    if (hrStatsResult.success) {
                        const data = hrStatsResult.data;
                        setStats({
                            totalEmployees: data.total_employees || 0,
                            presentToday: data.present_today || 0,
                            attendancePercentage: data.attendance_percentage || 0,
                            pendingApprovals: data.pending_approvals || 0,
                            payrollAmount: data.payroll_amount || '0',
                        });
                    } else {
                        throw new Error(hrStatsResult.error || 'Failed to fetch HR dashboard stats');
                    }
                    
                    // Process recent activities
                    if (activitiesResult.success) {
                        setRecentActivities(activitiesResult.data.activities || []);
                    } else {
                        console.warn('Failed to load recent activities:', activitiesResult.error);
                        setRecentActivities([]);
                    }
                } catch (apiError) {
                    console.warn('HR Dashboard: API failed, using fallback data:', apiError.message);
                    // Use fallback data to prevent infinite loading
                    setStats({
                        totalEmployees: 0,
                        presentToday: 0,
                        attendancePercentage: 0,
                        pendingApprovals: 0,
                        payrollAmount: '0',
                    });
                    setError('Unable to load dashboard data. Please refresh the page.');
                }
            } else {
                setStats({
                    totalEmployees: 0,
                    presentToday: 0,
                    attendancePercentage: 0,
                    pendingApprovals: 0,
                    payrollAmount: '0',
                });
            }
        } catch (error) {
            console.error('HR Dashboard: Load dashboard data error:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
            setIsLoadingData(false);
        }
    };

    const loadEmployeeDashboardData = async () => {
        if (isLoadingData) {
            return;
        }

        try {
            setIsLoadingData(true);
            setDashboardLoading(true);
            setError('');

            // Load today's attendance status (this works)
            const todayStatusResult = await attendanceService.getTodayAttendanceStatus(user.employee_id);
            
            // Load leave balances directly
            const leaveBalanceResult = await leaveService.getLeaveBalances(user.employee_id);
            
            // Try to load employee dashboard stats, but don't fail if it doesn't work
            let dashboardResult = { success: false, data: null };
            try {
                dashboardResult = await dashboardService.getEmployeeDashboardStats();
            } catch (dashboardError) {
                console.warn('Employee dashboard API failed, using fallback data:', dashboardError);
            }
            
            // Try to load holidays from public API, fallback to static data
            let holidaysResult;
            try {
                // Use public holiday endpoint that all authenticated users can access
                holidaysResult = await holidayService.getPublicHolidays();
            } catch (holidayError) {
                console.warn('Holiday API failed, using fallback data');
                holidaysResult = null;
            }
            
            // Use fallback data if API failed
            if (!holidaysResult || !holidaysResult.success) {
                const currentYear = new Date().getFullYear();
                holidaysResult = {
                    success: true,
                    data: [
                        { holiday_id: 1, holiday_name: "Holi", holiday_date: `${currentYear}-03-14` },
                        { holiday_id: 2, holiday_name: "Good Friday", holiday_date: `${currentYear}-03-29` },
                        { holiday_id: 3, holiday_name: "Independence Day", holiday_date: `${currentYear}-08-15` },
                        { holiday_id: 4, holiday_name: "Gandhi Jayanti", holiday_date: `${currentYear}-10-02` },
                        { holiday_id: 5, holiday_name: "Diwali", holiday_date: `${currentYear}-10-31` },
                        { holiday_id: 6, holiday_name: "Christmas", holiday_date: `${currentYear}-12-25` },
                        { holiday_id: 7, holiday_name: "New Year", holiday_date: `${currentYear + 1}-01-01` }
                    ]
                };
            }

            // Process leave balance (sum regular leave types only, exclude special leaves)
            let totalLeaveBalance = 0;
            let specialLeaveBalances = [];
            if (leaveBalanceResult.success && leaveBalanceResult.data) {
                // Filter out special leave types that shouldn't be included in general balance
                const specialLeaveTypes = ['Maternity Leave', 'Paternity Leave', 'Bereavement Leave', 'Sabbatical Leave'];
                
                // Regular leave types for dashboard total
                totalLeaveBalance = leaveBalanceResult.data
                    .filter(balance => !specialLeaveTypes.includes(balance.leave_name))
                    .reduce((total, balance) => {
                        return total + (parseFloat(balance.remaining) || 0);
                    }, 0);
                
                // Special leave types for separate display (only non-zero balances)
                specialLeaveBalances = leaveBalanceResult.data
                    .filter(balance => specialLeaveTypes.includes(balance.leave_name) && parseFloat(balance.remaining) > 0)
                    .map(balance => ({
                        name: balance.leave_name,
                        remaining: parseFloat(balance.remaining) || 0
                    }));
            }

            // Process dashboard stats if available
            let daysPresent = 0;
            let attendancePercentage = 0;
            
            if (dashboardResult.success && dashboardResult.data) {
                const data = dashboardResult.data;
                const attendanceData = data.attendance || {};
                
                // For employee view, the attendance data represents their personal stats
                daysPresent = attendanceData.total_present || 0;
                const totalDays = attendanceData.total_employees || 1;
                attendancePercentage = totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 0;
            } else {
                // Fallback: calculate basic stats from today's status
                if (todayStatusResult.success && todayStatusResult.data && todayStatusResult.data.has_checked_in) {
                    daysPresent = 1; // At least today
                    attendancePercentage = 100; // 100% for today
                }
            }

            // Update employee stats
            setEmployeeStats(prev => ({
                ...prev,
                daysPresent: daysPresent,
                attendanceRate: attendancePercentage,
                leaveBalance: totalLeaveBalance
            }));
            
            // Update special leaves
            setSpecialLeaves(specialLeaveBalances);

            // Process today's status
            if (todayStatusResult.success && todayStatusResult.data) {
                const todayData = todayStatusResult.data;
                setEmployeeStats(prev => ({
                    ...prev,
                    todayStatus: todayData.has_checked_in ? 'Checked In' : 'Not Checked In',
                    checkInTime: todayData.check_in_time || null
                }));
            }

            // Process holidays (get upcoming holidays only)
            if (holidaysResult.success && holidaysResult.data) {
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
                
                const upcomingHolidays = holidaysResult.data
                    .filter(holiday => {
                        const holidayDate = new Date(holiday.holiday_date);
                        return holidayDate >= today; // Include today and future dates
                    })
                    .sort((a, b) => new Date(a.holiday_date) - new Date(b.holiday_date))
                    .slice(0, 5); // Get next 5 holidays
                    
                setHolidays(upcomingHolidays);
            }

        } catch (error) {
            console.error('Load employee dashboard data error:', error);
            setError('Failed to load dashboard data');
        } finally {
            setDashboardLoading(false);
            setIsLoadingData(false);
        }
    };

    // Show loading spinner based on current view
    const shouldShowLoading = () => {
        if (currentView === 'HR') {
            return loading; // HR view uses loading state
        } else {
            return dashboardLoading; // Employee view uses dashboardLoading state
        }
    };

    if (shouldShowLoading()) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    // HR Dashboard - Show when user has HR role AND is in HR view
    if (user?.role === 'HR' && currentView === 'HR') {
        return (
            <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
                {/* Header Section - Centered */}
                <Box sx={{ mb: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ 
                        fontWeight: 700, 
                        mb: 1, 
                        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } 
                    }}>
                        HR Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Welcome back! Here's an overview of your workspace
                    </Typography>
                </Box>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Summary Cards */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 4 
                }}>
                    <Card sx={{ 
                        flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', lg: '1 1 calc(25% - 12px)' },
                        minWidth: 200
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Total Employees
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        {stats.totalEmployees}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Active employees
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
                                    <PeopleIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>

                    <Card sx={{ 
                        flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', lg: '1 1 calc(25% - 12px)' },
                        minWidth: 200
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Present Today
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        {stats.presentToday}
                                    </Typography>
                                    <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                                        <TrendingUpIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                        {stats.attendancePercentage}% attendance
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 48, height: 48 }}>
                                    <CheckCircleIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>

                    <Card sx={{ 
                        flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', lg: '1 1 calc(25% - 12px)' },
                        minWidth: 200
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Pending Approvals
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        {stats.pendingApprovals}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Requires action
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main', width: 48, height: 48 }}>
                                    <PendingIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>

                    <Card sx={{ 
                        flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', lg: '1 1 calc(25% - 12px)' },
                        minWidth: 200
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Payroll This Month
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        ₹{stats.payrollAmount}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        On track
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'info.light', color: 'info.main', width: 48, height: 48 }}>
                                    <PayrollIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Quick Actions */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                        Quick Actions
                    </Typography>
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        flexWrap: 'wrap',
                        gap: 2 
                    }}>
                        <Button
                            variant="outlined"
                            startIcon={<PersonAddIcon />}
                            onClick={() => navigate('/employees/add')}
                            sx={{
                                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' },
                                py: 1.5,
                                justifyContent: 'flex-start',
                                borderColor: 'divider',
                                color: 'text.primary',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover',
                                },
                            }}
                        >
                            Add Employee
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<UploadIcon />}
                            onClick={() => navigate('/admin')}
                            sx={{
                                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' },
                                py: 1.5,
                                justifyContent: 'flex-start',
                                borderColor: 'divider',
                                color: 'text.primary',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover',
                                },
                            }}
                        >
                            Bulk Upload
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<PayrollIcon />}
                            onClick={() => navigate('/payroll')}
                            sx={{
                                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' },
                                py: 1.5,
                                justifyContent: 'flex-start',
                                borderColor: 'divider',
                                color: 'text.primary',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover',
                                },
                            }}
                        >
                            Process Payroll
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<AssessmentIcon />}
                            onClick={() => navigate('/admin')}
                            sx={{
                                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' },
                                py: 1.5,
                                justifyContent: 'flex-start',
                                borderColor: 'divider',
                                color: 'text.primary',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover',
                                },
                            }}
                        >
                            Generate Reports
                        </Button>
                    </Box>
                </Paper>

                {/* Recent Activity */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                        Recent Activity
                    </Typography>
                    {recentActivities.length > 0 ? (
                        <List disablePadding>
                            {recentActivities.map((activity, index) => {
                                // Determine icon and color based on activity type
                                const getActivityIcon = (type) => {
                                    switch (type) {
                                        case 'LEAVE_APPROVED':
                                            return { icon: CheckCircleIcon, color: 'success' };
                                        case 'LEAVE_REJECTED':
                                            return { icon: PendingIcon, color: 'error' };
                                        case 'EMPLOYEE_ADDED':
                                            return { icon: PeopleIcon, color: 'primary' };
                                        default:
                                            return { icon: DescriptionIcon, color: 'info' };
                                    }
                                };

                                const { icon: IconComponent, color } = getActivityIcon(activity.type);
                                
                                // Format time display
                                const getTimeDisplay = (date, time) => {
                                    const activityDate = new Date(date);
                                    const today = new Date();
                                    const diffDays = Math.floor((today - activityDate) / (1000 * 60 * 60 * 24));
                                    
                                    if (diffDays === 0) {
                                        return `${time}`;
                                    } else if (diffDays === 1) {
                                        return '1 day ago';
                                    } else {
                                        return `${diffDays} days ago`;
                                    }
                                };

                                return (
                                    <Box key={index}>
                                        <ListItem sx={{ px: 0, py: 2 }}>
                                            <ListItemIcon sx={{ minWidth: 40 }}>
                                                <Avatar sx={{ 
                                                    bgcolor: `${color}.light`, 
                                                    color: `${color}.main`, 
                                                    width: 32, 
                                                    height: 32 
                                                }}>
                                                    <IconComponent sx={{ fontSize: 18 }} />
                                                </Avatar>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {activity.description}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Typography variant="caption" color="text.secondary">
                                                        {activity.employee_name}
                                                    </Typography>
                                                }
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {getTimeDisplay(activity.date, activity.time)}
                                            </Typography>
                                        </ListItem>
                                        {index < recentActivities.length - 1 && <Divider />}
                                    </Box>
                                );
                            })}
                        </List>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            No recent activities found
                        </Typography>
                    )}
                </Paper>
            </Box>
        );
    }

    // Manager Dashboard - Show when user has MANAGER role AND is in Manager view
    if (user?.role === 'MANAGER' && currentView === 'MANAGER') {
        return (
            <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
                {/* Header Section - Centered */}
                <Box sx={{ mb: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ 
                        fontWeight: 700, 
                        mb: 1, 
                        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } 
                    }}>
                        Manager Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Welcome back! Here's an overview of your team
                    </Typography>
                </Box>

                {/* Summary Cards */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 4 
                }}>
                    <Card sx={{ 
                        flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', lg: '1 1 calc(33.333% - 11px)' },
                        minWidth: 200
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Team Members
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        24
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Active members
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
                                    <PeopleIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>

                    <Card sx={{ 
                        flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', lg: '1 1 calc(33.333% - 11px)' },
                        minWidth: 200
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Present Today
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        22
                                    </Typography>
                                    <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                                        <TrendingUpIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                        91.7% attendance
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 48, height: 48 }}>
                                    <CheckCircleIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>

                    <Card sx={{ 
                        flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', lg: '1 1 calc(33.333% - 11px)' },
                        minWidth: 200
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Pending Approvals
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        5
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Requires action
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main', width: 48, height: 48 }}>
                                    <PendingIcon />
                                </Avatar>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Pending Leave Requests */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                        Pending Leave Requests
                    </Typography>
                    <List disablePadding>
                        {[
                            { name: 'Alice Johnson', type: 'Sick Leave', days: '2 days', date: 'Dec 28-29' },
                            { name: 'Bob Williams', type: 'Vacation', days: '5 days', date: 'Jan 5-9' },
                            { name: 'Carol Martinez', type: 'Personal', days: '1 day', date: 'Dec 30' },
                        ].map((request, index) => (
                            <Box key={index}>
                                <ListItem sx={{ px: 0, py: 2 }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32, fontSize: '0.875rem' }}>
                                            {request.name.charAt(0)}
                                        </Avatar>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {request.name} - {request.type}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="caption" color="text.secondary">
                                                {request.days} ({request.date})
                                            </Typography>
                                        }
                                    />
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button size="small" variant="contained" color="success">
                                            Approve
                                        </Button>
                                        <Button size="small" variant="outlined" color="error">
                                            Reject
                                        </Button>
                                    </Box>
                                </ListItem>
                                {index < 2 && <Divider />}
                            </Box>
                        ))}
                    </List>
                </Paper>
            </Box>
        );
    }

    // Employee Dashboard
    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Header Section - Centered */}
            <Box sx={{ mb: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    mb: 1, 
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } 
                }}>
                    Employee Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Welcome back, {user?.name}! Here's your overview
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Inactive Employee Alert */}
            <InactiveEmployeeAlert />

            {/* Summary Cards */}
            <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { 
                    xs: 'repeat(2, 1fr)',  // 2x2 grid on mobile
                    sm: 'repeat(2, 1fr)',  // 2x2 grid on small tablets
                    md: 'repeat(4, 1fr)'   // 1x4 grid on desktop
                },
                gap: 2,
                mb: 4 
            }}>
                <Card>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                    Days Present
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                                    {employeeStats.daysPresent}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                    This month
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: { xs: 36, sm: 48 }, height: { xs: 36, sm: 48 } }}>
                                <ScheduleIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                    Leave Balance
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                                    {employeeStats.leaveBalance}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                    Regular leave days
                                    {specialLeaves.length > 0 && (
                                        <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                                            + {specialLeaves.map(leave => `${leave.remaining} ${leave.name.replace(' Leave', '')}`).join(', ')}
                                        </Box>
                                    )}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: { xs: 36, sm: 48 }, height: { xs: 36, sm: 48 } }}>
                                <LeaveIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                    Attendance Rate
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                                    {employeeStats.attendanceRate}%
                                </Typography>
                                <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                    <TrendingUpIcon sx={{ fontSize: { xs: 12, sm: 14 }, mr: 0.5 }} />
                                    {employeeStats.attendanceRate >= 90 ? 'Excellent' : employeeStats.attendanceRate >= 75 ? 'Good' : 'Needs Improvement'}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'info.light', color: 'info.main', width: { xs: 36, sm: 48 }, height: { xs: 36, sm: 48 } }}>
                                <TrendingUpIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                    Today's Status
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1rem', sm: '1.5rem' } }}>
                                    {employeeStats.todayStatus}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                    {employeeStats.checkInTime ? `Checked in at ${employeeStats.checkInTime}` : 'Not checked in today'}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: { xs: 36, sm: 48 }, height: { xs: 36, sm: 48 } }}>
                                <CheckCircleIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Quick Actions */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Quick Actions
                </Typography>
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    flexWrap: 'wrap',
                    gap: 2 
                }}>
                    <Button
                        variant="outlined"
                        startIcon={<AttendanceIcon />}
                        onClick={() => navigate('/attendance')}
                        sx={{
                            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' },
                            py: 1.5,
                            justifyContent: 'flex-start',
                            borderColor: 'divider',
                            color: 'text.primary',
                            '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: 'action.hover',
                            },
                        }}
                    >
                        Check In/Out
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<LeaveIcon />}
                        onClick={() => navigate('/leave')}
                        sx={{
                            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' },
                            py: 1.5,
                            justifyContent: 'flex-start',
                            borderColor: 'divider',
                            color: 'text.primary',
                            '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: 'action.hover',
                            },
                        }}
                    >
                        Apply for Leave
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<PayrollIcon />}
                        onClick={() => navigate('/payroll/payslips')}
                        sx={{
                            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' },
                            py: 1.5,
                            justifyContent: 'flex-start',
                            borderColor: 'divider',
                            color: 'text.primary',
                            '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: 'action.hover',
                            },
                        }}
                    >
                        View Payslip
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<PeopleIcon />}
                        onClick={() => navigate('/employees/profile')}
                        sx={{
                            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' },
                            py: 1.5,
                            justifyContent: 'flex-start',
                            borderColor: 'divider',
                            color: 'text.primary',
                            '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: 'action.hover',
                            },
                        }}
                    >
                        Update Profile
                    </Button>
                </Box>
            </Paper>

            {/* Upcoming Holidays */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Upcoming Holidays
                </Typography>
                {dashboardLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : holidays.length > 0 ? (
                    <List disablePadding>
                        {holidays.map((holiday, index) => {
                            const holidayDate = new Date(holiday.holiday_date);
                            const today = new Date();
                            const daysUntil = Math.ceil((holidayDate - today) / (1000 * 60 * 60 * 24));
                            
                            return (
                                <Box key={holiday.holiday_id || index}>
                                    <ListItem sx={{ px: 0, py: 2 }}>
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 32, height: 32 }}>
                                                <ScheduleIcon sx={{ fontSize: 18 }} />
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {holiday.holiday_name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {holidayDate.toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </Typography>
                                                    {daysUntil >= 0 && (
                                                        <Typography variant="caption" color="primary.main" sx={{ display: 'block', fontWeight: 500 }}>
                                                            {daysUntil === 0 ? 'Today!' : 
                                                             daysUntil === 1 ? 'Tomorrow' : 
                                                             `In ${daysUntil} days`}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                            secondaryTypographyProps={{ component: 'div' }}
                                        />
                                    </ListItem>
                                    {index < holidays.length - 1 && <Divider />}
                                </Box>
                            );
                        })}
                    </List>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No upcoming holidays found
                    </Typography>
                )}
            </Paper>
        </Box>
    );
};

export default Dashboard;
