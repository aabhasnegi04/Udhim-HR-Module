import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
    Chip,
    Stack,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    People as PeopleIcon,
    PersonAdd as PersonAddIcon,
    Business as BusinessIcon,
    Warning as WarningIcon,
    Upload as UploadIcon,
    TrendingUp as TrendingUpIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useProfileSwitching } from '../../context/ProfileSwitchingContext';
import adminService from '../../services/adminService';

const AdminDashboard = () => {
    const [dashboardStats, setDashboardStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currentView, switchView, canSwitchViews, getAvailableViews } = useProfileSwitching();

    // Ensure user is in HR view when accessing admin dashboard
    useEffect(() => {
        if (currentView !== 'HR' && getAvailableViews().includes('HR')) {
            console.log('🔄 Switching to HR view for admin access');
            switchView('HR');
        }
    }, [currentView, switchView, getAvailableViews]);

    // Fetch dashboard stats from API
    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Wait a bit for profile switching to complete
                if (currentView !== 'HR' && getAvailableViews().includes('HR')) {
                    return; // Wait for the view switch to complete
                }
                
                const result = await adminService.getDashboardStats();
                
                if (result.success) {
                    setDashboardStats(result.data);
                } else {
                    setError(result.error || 'Failed to fetch dashboard stats');
                }
            } catch (err) {
                setError('Failed to fetch dashboard stats');
                console.error('Dashboard stats error:', err);
            } finally {
                setLoading(false);
            }
        };

        // Only fetch data when we're in HR view or if HR view is not available
        if (currentView === 'HR' || !getAvailableViews().includes('HR')) {
            fetchDashboardStats();
        }
    }, [currentView, getAvailableViews]);

    // Create overview stats from API data
    const overviewStats = dashboardStats ? [
        {
            title: 'Total Employees',
            value: dashboardStats.total_employees?.toString() || '0',
            change: '+12 this month',
            icon: <PeopleIcon />,
            color: 'primary'
        },
        {
            title: 'Active Employees',
            value: dashboardStats.active_employees?.toString() || '0',
            change: `${dashboardStats.active_rate?.toFixed(1) || '0'}% active rate`,
            icon: <CheckCircleIcon />,
            color: 'success'
        },
        {
            title: 'Departments',
            value: dashboardStats.total_departments?.toString() || '0',
            change: '2 pending setup',
            icon: <BusinessIcon />,
            color: 'info'
        },
        {
            title: 'Pending Actions',
            value: dashboardStats.pending_actions?.toString() || '0',
            change: 'Requires attention',
            icon: <WarningIcon />,
            color: 'warning'
        }
    ] : [];

    const quickActions = [
        {
            title: 'Bulk Upload Employees',
            description: 'Upload employee master data via Excel',
            icon: <UploadIcon />,
            action: 'Upload Now'
        },
        {
            title: 'Manage Master Data',
            description: 'Add or update departments and designations',
            icon: <BusinessIcon />,
            action: 'Open Master Data'
        },
        {
            title: 'View System Reports',
            description: 'Download and review system-wide reports',
            icon: <TrendingUpIcon />,
            action: 'View Reports'
        }
    ];

    const recentActivity = [
        {
            action: 'Holiday calendar updated for 2024',
            user: 'Sarah Johnson',
            time: '2 hours ago',
            type: 'success'
        },
        {
            action: 'New department "Data Science" created',
            user: 'Sarah Johnson',
            time: '1 day ago',
            type: 'info'
        },
        {
            action: 'Salary structure updated for Grade L3',
            user: 'Sarah Johnson',
            time: '2 days ago',
            type: 'warning'
        },
        {
            action: 'Bulk employee upload completed (45 records)',
            user: 'Sarah Johnson',
            time: '3 days ago',
            type: 'success'
        },
        {
            action: 'Leave policy updated for annual leave',
            user: 'Sarah Johnson',
            time: '1 week ago',
            type: 'info'
        }
    ];

    return (
        <Box>
            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Error State */}
            {error && (
                <Alert 
                    severity={error.includes('Invalid or inactive company') || error.includes('Access denied') ? 'warning' : 'error'} 
                    sx={{ mb: 3 }}
                >
                    {error.includes('Invalid or inactive company') ? 
                        'Company validation failed. Please ensure you are logged in with the correct company context.' :
                        error.includes('Access denied') ?
                        'Access denied. Admin dashboard requires HR permissions. Please contact your administrator.' :
                        error
                    }
                </Alert>
            )}

            {/* Access Control Message */}
            {currentView !== 'HR' && getAvailableViews().includes('HR') && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Switching to HR view to access admin dashboard...
                </Alert>
            )}

            {/* No HR Access Message */}
            {!getAvailableViews().includes('HR') && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    Admin dashboard requires HR permissions. Please contact your administrator to access this section.
                </Alert>
            )}

            {/* Dashboard Content */}
            {!loading && !error && dashboardStats && (
                <>
                    {/* Overview Stats */}
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        flexWrap: 'wrap',
                        gap: 2,
                        mb: 4 
                    }}>
                        {overviewStats.map((stat, index) => (
                            <Card 
                                key={index} 
                                sx={{ 
                                    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' },
                                    minWidth: 200
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box sx={{ 
                                            p: 1, 
                                            borderRadius: 1, 
                                            bgcolor: `${stat.color}.light`,
                                            color: `${stat.color}.main`,
                                            mr: 2 
                                        }}>
                                            {stat.icon}
                                        </Box>
                                        <Box>
                                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                                                {stat.value}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {stat.title}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {stat.change}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>

                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', lg: 'row' },
                        gap: 3 
                    }}>
                        {/* Quick Actions */}
                        <Paper sx={{ 
                            flex: { xs: '1', lg: '1 1 60%' },
                            p: 3 
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                Quick Actions
                            </Typography>
                            <Stack spacing={2}>
                                {quickActions.map((action, index) => (
                                    <Card key={index} variant="outlined">
                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                    <Box sx={{ 
                                                        p: 1, 
                                                        borderRadius: 1, 
                                                        bgcolor: 'primary.light',
                                                        color: 'primary.main',
                                                        mr: 2 
                                                    }}>
                                                        {action.icon}
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                            {action.title}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {action.description}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Button variant="outlined" size="small">
                                                    {action.action}
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        </Paper>

                        {/* Recent Activity */}
                        <Paper sx={{ 
                            flex: { xs: '1', lg: '1 1 40%' },
                            p: 3 
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                Recent System Activity
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Audit logs will appear here once enabled.
                            </Typography>
                            <Box sx={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', py: 4, color: 'text.disabled',
                            }}>
                                <TrendingUpIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                                <Typography variant="body2">No activity logs yet</Typography>
                            </Box>
                        </Paper>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default AdminDashboard;