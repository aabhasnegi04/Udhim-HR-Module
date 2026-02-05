import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Chip,
    LinearProgress,
    Divider,
    Alert,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Grid
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Pending as PendingIcon,
    Download as DownloadIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Timeline as TimelineIcon,
    ExitToApp as ExitIcon
} from '@mui/icons-material';

// Mock employee exit data (for current logged-in employee)
const mockExitData = {
    employeeId: 'EMP001',
    employeeName: 'John Smith',
    department: 'Engineering',
    lastWorkingDay: '2025-01-15',
    exitType: 'Resignation',
    exitReason: 'Better Opportunity',
    status: 'In Progress',
    initiatedOn: '2025-01-02',
    clearances: {
        it: { 
            status: 'Approved', 
            approvedBy: 'IT Admin', 
            approvedOn: '2025-01-03', 
            comments: 'All assets returned successfully',
            checklist: ['Laptop returned', 'Access card returned', 'Email access revoked', 'VPN access removed']
        },
        hr: { 
            status: 'Pending', 
            approvedBy: '', 
            approvedOn: '', 
            comments: '',
            checklist: ['Submit resignation letter', 'Complete exit interview', 'Return ID card', 'Update personal documents']
        },
        admin: { 
            status: 'Pending', 
            approvedBy: '', 
            approvedOn: '', 
            comments: '',
            checklist: ['Clear desk space', 'Return office keys', 'Submit parking pass', 'Handover responsibilities']
        },
        finance: { 
            status: 'Rejected', 
            approvedBy: 'Finance Head', 
            approvedOn: '2025-01-04', 
            comments: 'Pending advance settlement of ₹5,000',
            checklist: ['Settle advance amount', 'Submit expense reports', 'Return company credit card', 'Final salary calculation']
        }
    },
    documents: [
        { name: 'Resignation Letter', status: 'Submitted', date: '2025-01-02' },
        { name: 'Exit Interview Form', status: 'Pending', date: '' },
        { name: 'Asset Return Form', status: 'Completed', date: '2025-01-03' },
        { name: 'Final Settlement Letter', status: 'Pending', date: '' }
    ],
    hrContact: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        phone: '+91 98765 43210'
    }
};

const clearanceSteps = [
    { id: 'it', label: 'IT Clearance', description: 'Return all IT assets and revoke system access' },
    { id: 'hr', label: 'HR Clearance', description: 'Complete HR formalities and documentation' },
    { id: 'admin', label: 'Admin Clearance', description: 'Return office assets and clear workspace' },
    { id: 'finance', label: 'Finance Clearance', description: 'Settle all financial obligations' }
];

const ExitStatus = () => {
    const [exitData] = useState(mockExitData);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'success';
            case 'Completed': return 'success';
            case 'Rejected': return 'error';
            case 'Pending': return 'warning';
            case 'Submitted': return 'info';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved':
            case 'Completed':
                return <CheckIcon />;
            case 'Rejected': return <CancelIcon />;
            case 'Pending':
            case 'Submitted':
                return <PendingIcon />;
            default: return <PendingIcon />;
        }
    };

    const calculateProgress = () => {
        const total = Object.keys(exitData.clearances).length;
        const approved = Object.values(exitData.clearances).filter(c => c.status === 'Approved').length;
        return (approved / total) * 100;
    };

    const getActiveStep = () => {
        const steps = Object.values(exitData.clearances);
        return steps.findIndex(step => step.status === 'Pending');
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    My Exit Status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Track your offboarding progress and complete pending requirements
                </Typography>
            </Box>

            {/* Exit Overview */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ExitIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Exit Process - {exitData.exitType}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Initiated on {new Date(exitData.initiatedOn).toLocaleDateString('en-IN')}
                        </Typography>
                    </Box>
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                    Your last working day is scheduled for <strong>{new Date(exitData.lastWorkingDay).toLocaleDateString('en-IN')}</strong>
                </Alert>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Overall Progress
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={calculateProgress()}
                        color="primary"
                        sx={{ height: 8, borderRadius: 4, mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                        {Math.round(calculateProgress())}% Complete
                    </Typography>
                </Box>

                <Chip
                    label={exitData.status}
                    color={getStatusColor(exitData.status)}
                    size="large"
                />
            </Paper>

            <Grid container spacing={3}>
                {/* Clearance Progress */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            Clearance Progress
                        </Typography>

                        <Stepper orientation="vertical" activeStep={getActiveStep()}>
                            {clearanceSteps.map((step) => {
                                const clearance = exitData.clearances[step.id];
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
                                            </Box>
                                        </StepContent>
                                    </Step>
                                );
                            })}
                        </Stepper>
                    </Paper>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} md={4}>
                    {/* Documents */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            Documents
                        </Typography>
                        <List>
                            {exitData.documents.map((doc, index) => (
                                <ListItem key={index} sx={{ px: 0, py: 1 }}>
                                    <ListItemIcon>
                                        {getStatusIcon(doc.status)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={doc.name}
                                        secondary={
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                <Chip
                                                    label={doc.status}
                                                    color={getStatusColor(doc.status)}
                                                    size="small"
                                                />
                                                {doc.date && (
                                                    <Typography variant="caption" color="text.secondary" component="span">
                                                        {new Date(doc.date).toLocaleDateString('en-IN')}
                                                    </Typography>
                                                )}
                                            </span>
                                        }
                                    />
                                    {doc.status === 'Completed' && (
                                        <Button size="small" startIcon={<DownloadIcon />}>
                                            Download
                                        </Button>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    </Paper>

                    {/* HR Contact */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            HR Contact
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {exitData.hrContact.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                HR Manager
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Button
                                startIcon={<EmailIcon />}
                                variant="outlined"
                                size="small"
                                href={`mailto:${exitData.hrContact.email}`}
                            >
                                {exitData.hrContact.email}
                            </Button>
                            <Button
                                startIcon={<PhoneIcon />}
                                variant="outlined"
                                size="small"
                                href={`tel:${exitData.hrContact.phone}`}
                            >
                                {exitData.hrContact.phone}
                            </Button>
                        </Box>
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Contact HR for any questions about your exit process.
                        </Alert>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ExitStatus;