import {
    Box,
    Typography,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Avatar,
    Chip,
    Paper
} from '@mui/material';
import {
    Person as PersonIcon,
    SupervisorAccount as ManagerIcon,
    AdminPanelSettings as HRIcon,
    CheckCircle as ApprovedIcon,
    Cancel as RejectedIcon,
    Schedule as PendingIcon
} from '@mui/icons-material';

const ApprovalTimeline = ({ 
    leaveRequest, 
    currentUserRole = 'Employee' 
}) => {
    const getStepIcon = (step, status) => {
        const iconProps = { sx: { fontSize: 20 } };
        
        if (status === 'approved') return <ApprovedIcon color="success" {...iconProps} />;
        if (status === 'rejected') return <RejectedIcon color="error" {...iconProps} />;
        if (status === 'pending') return <PendingIcon color="warning" {...iconProps} />;
        
        switch (step) {
            case 'employee': return <PersonIcon {...iconProps} />;
            case 'manager': return <ManagerIcon {...iconProps} />;
            case 'hr': return <HRIcon {...iconProps} />;
            default: return <PersonIcon {...iconProps} />;
        }
    };

    const getStepStatus = (stepIndex, currentStatus) => {
        if (currentStatus === 'rejected') {
            return stepIndex === 0 ? 'completed' : 'pending';
        }
        
        switch (currentStatus) {
            case 'pending':
                return stepIndex === 0 ? 'completed' : 'pending';
            case 'manager_approved':
                return stepIndex <= 1 ? 'completed' : 'pending';
            case 'approved':
                return 'completed';
            default:
                return stepIndex === 0 ? 'completed' : 'pending';
        }
    };

    const steps = [
        {
            label: 'Application Submitted',
            description: 'Leave request submitted by employee',
            actor: leaveRequest?.employee || 'Employee',
            timestamp: leaveRequest?.appliedOn || new Date().toISOString().split('T')[0],
            status: 'completed'
        },
        {
            label: 'Manager Review',
            description: 'Pending manager approval',
            actor: leaveRequest?.manager || 'Manager',
            timestamp: leaveRequest?.managerReviewDate || null,
            status: getStepStatus(1, leaveRequest?.status)
        },
        {
            label: 'HR Approval',
            description: 'Final HR approval',
            actor: 'HR Team',
            timestamp: leaveRequest?.hrApprovalDate || null,
            status: getStepStatus(2, leaveRequest?.status)
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'error';
            default: return 'default';
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Approval Timeline
            </Typography>
            
            <Stepper orientation="vertical">
                {steps.map((step, index) => (
                    <Step key={index} active={true} completed={step.status === 'completed'}>
                        <StepLabel
                            icon={getStepIcon(step.label.toLowerCase(), step.status)}
                            sx={{
                                '& .MuiStepLabel-label': {
                                    fontWeight: 600,
                                    fontSize: '1rem'
                                }
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <Typography variant="body1" fontWeight={600}>
                                    {step.label}
                                </Typography>
                                <Chip
                                    label={step.status}
                                    color={getStatusColor(step.status)}
                                    size="small"
                                    sx={{ textTransform: 'capitalize' }}
                                />
                            </Box>
                        </StepLabel>
                        <StepContent>
                            <Box sx={{ pb: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {step.description}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                        {step.actor.charAt(0)}
                                    </Avatar>
                                    <Typography variant="body2" fontWeight={500}>
                                        {step.actor}
                                    </Typography>
                                </Box>
                                {step.timestamp && (
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(step.timestamp).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Typography>
                                )}
                                {step.status === 'pending' && (
                                    <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                                        Waiting for action...
                                    </Typography>
                                )}
                            </Box>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>

            {/* Current Status Summary */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                    Current Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                        label={leaveRequest?.status || 'pending'}
                        color={getStatusColor(leaveRequest?.status)}
                        sx={{ textTransform: 'capitalize' }}
                    />
                    <Typography variant="body2" color="text.secondary">
                        {leaveRequest?.status === 'approved' && 'Your leave request has been approved'}
                        {leaveRequest?.status === 'rejected' && 'Your leave request has been rejected'}
                        {leaveRequest?.status === 'pending' && 'Your leave request is under review'}
                        {leaveRequest?.status === 'manager_approved' && 'Approved by manager, pending HR approval'}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

export default ApprovalTimeline;