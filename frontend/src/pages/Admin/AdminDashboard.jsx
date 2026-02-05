import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Divider,
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
    Event as EventIcon,
    Description as TemplateIcon,
    TrendingUp as TrendingUpIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import adminService from '../../services/adminService';

const AdminDashboard = () => {
    const [dashboardStats, setDashboardStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch dashboard stats from API
    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                setLoading(true);
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

        fetchDashboardStats();
    }, []);

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
            title: 'Upload Holiday Calendar',
            description: 'Set holidays for the current year',
            icon: <EventIcon />,
            action: 'Manage Holidays'
        },
        {
            title: 'Manage Templates',
            description: 'Update letter and document templates',
            icon: <TemplateIcon />,
            action: 'Edit Templates'
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
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
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
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                Recent Admin Activity
                            </Typography>
                            <List sx={{ p: 0 }}>
                                {recentActivity.map((activity, index) => (
                                    <Box key={index}>
                                        <ListItem sx={{ px: 0, py: 1.5 }}>
                                            <ListItemIcon sx={{ minWidth: 40 }}>
                                                <Box sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    bgcolor: activity.type === 'success' ? 'success.main' :
                                                            activity.type === 'warning' ? 'warning.main' : 'info.main'
                                                }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {activity.action}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            by {activity.user}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            • {activity.time}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                        {index < recentActivity.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </List>
                        </Paper>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default AdminDashboard;