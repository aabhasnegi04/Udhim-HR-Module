import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Chip,
    Avatar,
    Stack,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Divider
} from '@mui/material';
import {
    Person as PersonIcon,
    SupervisorAccount as ManagerIcon,
    AdminPanelSettings as HRIcon,
    CheckCircle as ApprovedIcon,
    Cancel as RejectedIcon,
    Schedule as PendingIcon,
    Send as SubmittedIcon
} from '@mui/icons-material';

// Mock timeline data
const mockTimelineData = [
    {
        id: 1,
        stage: 'submitted',
        actor: 'John Smith',
        role: 'Employee',
        action: 'Submitted regularization request',
        timestamp: '2024-01-15 09:30 AM',
        status: 'completed',
        comments: 'Missed punch due to system issue'
    },
    {
        id: 2,
        stage: 'manager_review',
        actor: 'Sarah Johnson',
        role: 'Manager',
        action: 'Approved by Manager',
        timestamp: '2024-01-15 02:15 PM',
        status: 'completed',
        comments: 'Valid reason, approved for processing'
    },
    {
        id: 3,
        stage: 'hr_review',
        actor: 'Emily Davis',
        role: 'HR Admin',
        action: 'Under HR Review',
        timestamp: '2024-01-16 10:00 AM',
        status: 'pending',
        comments: 'Reviewing attendance records'
    },
    {
        id: 4,
        stage: 'final_approval',
        actor: 'HR System',
        role: 'System',
        action: 'Final Approval',
        timestamp: 'Pending',
        status: 'pending',
        comments: 'Awaiting final approval'
    }
];

const RegularizationTimeline = ({ requestId, timelineData = mockTimelineData }) => {
    const getStageIcon = (stage, status) => {
        if (status === 'completed') {
            return <ApprovedIcon sx={{ color: 'success.main' }} />;
        } else if (status === 'rejected') {
            return <RejectedIcon sx={{ color: 'error.main' }} />;
        } else if (status === 'pending') {
            return <PendingIcon sx={{ color: 'warning.main' }} />;
        }

        switch (stage) {
            case 'submitted':
                return <SubmittedIcon sx={{ color: 'info.main' }} />;
            case 'manager_review':
                return <ManagerIcon sx={{ color: 'primary.main' }} />;
            case 'hr_review':
                return <HRIcon sx={{ color: 'secondary.main' }} />;
            case 'final_approval':
                return <ApprovedIcon sx={{ color: 'success.main' }} />;
            default:
                return <PendingIcon sx={{ color: 'grey.500' }} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'rejected': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    const getRoleIcon = (role) => {
        switch (role.toLowerCase()) {
            case 'employee':
                return <PersonIcon />;
            case 'manager':
                return <ManagerIcon />;
            case 'hr admin':
                return <HRIcon />;
            default:
                return <PersonIcon />;
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Regularization Timeline
            </Typography>

            <Stepper orientation="vertical" activeStep={timelineData.findIndex(item => item.status === 'pending')}>
                {timelineData.map((item, index) => (
                    <Step key={item.id} completed={item.status === 'completed'}>
                        <StepLabel
                            StepIconComponent={() => (
                                <Avatar 
                                    sx={{ 
                                        width: 32, 
                                        height: 32,
                                        bgcolor: item.status === 'completed' ? 'success.main' : 
                                               item.status === 'rejected' ? 'error.main' : 
                                               item.status === 'pending' ? 'warning.main' : 'grey.400'
                                    }}
                                >
                                    {getStageIcon(item.stage, item.status)}
                                </Avatar>
                            )}
                        >
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {item.action}
                            </Typography>
                        </StepLabel>
                        <StepContent>
                            <Card sx={{ mt: 1, mb: 2 }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    {/* Header */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                                                {getRoleIcon(item.role)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {item.actor}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.role}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        
                                        <Chip
                                            label={item.status}
                                            color={getStatusColor(item.status)}
                                            size="small"
                                        />
                                    </Box>

                                    {/* Comments */}
                                    {item.comments && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            "{item.comments}"
                                        </Typography>
                                    )}

                                    {/* Timestamp */}
                                    <Typography variant="caption" color="text.secondary">
                                        {item.timestamp}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>

            {/* Summary */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Request Summary
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                    <Chip 
                        label={`${timelineData.filter(item => item.status === 'completed').length} Completed`}
                        color="success"
                        size="small"
                    />
                    <Chip 
                        label={`${timelineData.filter(item => item.status === 'pending').length} Pending`}
                        color="warning"
                        size="small"
                    />
                    <Chip 
                        label={`${timelineData.filter(item => item.status === 'rejected').length} Rejected`}
                        color="error"
                        size="small"
                    />
                </Stack>
            </Box>
        </Paper>
    );
};

export default RegularizationTimeline;