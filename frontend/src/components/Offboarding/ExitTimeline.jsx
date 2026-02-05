import {
    Box,
    Typography,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Button,
    Alert,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Pending as PendingIcon
} from '@mui/icons-material';

const clearanceSteps = [
    { id: 'it', label: 'IT Clearance', description: 'Return laptop, access cards, and revoke system access' },
    { id: 'hr', label: 'HR Clearance', description: 'Submit documents, complete exit formalities' },
    { id: 'admin', label: 'Admin Clearance', description: 'Return office assets, clear desk space' },
    { id: 'finance', label: 'Finance Clearance', description: 'Settle advances, final salary processing' }
];

const ExitTimeline = ({ employee, onClearanceUpdate }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <CheckIcon />;
            case 'Rejected': return <CancelIcon />;
            case 'Pending': return <PendingIcon />;
            default: return <PendingIcon />;
        }
    };

    const getActiveStep = () => {
        const steps = Object.values(employee.clearances);
        return steps.findIndex(step => step.status === 'Pending');
    };

    return (
        <Box sx={{ mt: 1 }}>
            {/* Employee Info */}
            <Alert severity="info" sx={{ mb: 3 }}>
                Last Working Day: {new Date(employee.lastWorkingDay).toLocaleDateString('en-IN')}
            </Alert>

            {/* Clearance Stepper */}
            <Stepper orientation="vertical" activeStep={getActiveStep()}>
                {clearanceSteps.map((step) => {
                    const clearance = employee.clearances[step.id];
                    const isActive = clearance.status === 'Pending';
                    const isCompleted = clearance.status === 'Approved';
                    const isError = clearance.status === 'Rejected';

                    return (
                        <Step key={step.id} active={isActive} completed={isCompleted}>
                            <StepLabel
                                error={isError}
                                icon={getStatusIcon(clearance.status)}
                            >
                                <Typography variant="subtitle1" fontWeight={600}>
                                    {step.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {step.description}
                                </Typography>
                            </StepLabel>
                            <StepContent>
                                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        <strong>Status:</strong> {clearance.status}
                                    </Typography>
                                    {clearance.approvedBy && (
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Approved By:</strong> {clearance.approvedBy}
                                        </Typography>
                                    )}
                                    {clearance.approvedOn && (
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Date:</strong> {new Date(clearance.approvedOn).toLocaleDateString('en-IN')}
                                        </Typography>
                                    )}
                                    {clearance.comments && (
                                        <Typography variant="body2" sx={{ mb: 2 }}>
                                            <strong>Comments:</strong> {clearance.comments}
                                        </Typography>
                                    )}

                                    {/* Checklist */}
                                    {clearance.checklist && (
                                        <>
                                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                                Requirements:
                                            </Typography>
                                            <List dense>
                                                {clearance.checklist.map((item, index) => (
                                                    <ListItem key={index} sx={{ py: 0 }}>
                                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                                            {clearance.status === 'Approved' ? (
                                                                <CheckIcon color="success" fontSize="small" />
                                                            ) : (
                                                                <PendingIcon color="warning" fontSize="small" />
                                                            )}
                                                        </ListItemIcon>
                                                        <ListItemText 
                                                            primary={item}
                                                            primaryTypographyProps={{ variant: 'body2' }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </>
                                    )}
                                </Box>

                                {/* Action Buttons for Pending Items */}
                                {clearance.status === 'Pending' && onClearanceUpdate && (
                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="success"
                                            onClick={() => {
                                                const comments = prompt('Enter approval comments:');
                                                if (comments !== null) {
                                                    onClearanceUpdate(employee.id, step.id, 'Approved', comments);
                                                }
                                            }}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            onClick={() => {
                                                const comments = prompt('Enter rejection reason:');
                                                if (comments !== null) {
                                                    onClearanceUpdate(employee.id, step.id, 'Rejected', comments);
                                                }
                                            }}
                                        >
                                            Reject
                                        </Button>
                                    </Box>
                                )}
                            </StepContent>
                        </Step>
                    );
                })}
            </Stepper>
        </Box>
    );
};

export default ExitTimeline;