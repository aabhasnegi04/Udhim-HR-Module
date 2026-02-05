import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    LinearProgress,
    IconButton,
    Stack
} from '@mui/material';
import {
    Download as DownloadIcon,
    Visibility as ViewIcon,
    CheckCircle as CompliantIcon,
    Warning as WarningIcon
} from '@mui/icons-material';

const ComplianceCard = ({ 
    title, 
    icon, 
    totalAmount, 
    employeeCount, 
    status = 'compliant',
    dueDate,
    onDownload,
    onView,
    color = 'primary'
}) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'compliant': return 'success';
            case 'pending': return 'warning';
            case 'overdue': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'compliant': return <CompliantIcon />;
            case 'pending': return <WarningIcon />;
            case 'overdue': return <WarningIcon />;
            default: return null;
        }
    };

    const isOverdue = dueDate && new Date(dueDate) < new Date();
    const daysUntilDue = dueDate ? Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <Card sx={{ height: '100%', position: 'relative' }}>
            <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                        sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: `${color}.light`,
                            color: `${color}.contrastText`,
                            mr: 2
                        }}
                    >
                        {icon}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                            {title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {employeeCount} employees
                        </Typography>
                    </Box>
                    <Chip
                        label={status}
                        color={getStatusColor(status)}
                        size="small"
                        icon={getStatusIcon(status)}
                        sx={{ textTransform: 'capitalize' }}
                    />
                </Box>

                {/* Amount */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: `${color}.main` }}>
                        ₹{totalAmount.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Total Amount
                    </Typography>
                </Box>

                {/* Due Date Progress */}
                {dueDate && (
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Due Date
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color={isOverdue ? 'error.main' : 'text.primary'}>
                                {new Date(dueDate).toLocaleDateString('en-IN')}
                            </Typography>
                        </Box>
                        {daysUntilDue !== null && (
                            <>
                                <LinearProgress
                                    variant="determinate"
                                    value={isOverdue ? 100 : Math.max(0, 100 - (daysUntilDue / 30) * 100)}
                                    color={isOverdue ? 'error' : daysUntilDue <= 7 ? 'warning' : 'success'}
                                    sx={{ height: 6, borderRadius: 3, mb: 1 }}
                                />
                                <Typography variant="caption" color={isOverdue ? 'error.main' : 'text.secondary'}>
                                    {isOverdue ? `Overdue by ${Math.abs(daysUntilDue)} days` : `${daysUntilDue} days remaining`}
                                </Typography>
                            </>
                        )}
                    </Box>
                )}

                {/* Actions */}
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton size="small" onClick={onView}>
                        <ViewIcon />
                    </IconButton>
                    <IconButton size="small" onClick={onDownload}>
                        <DownloadIcon />
                    </IconButton>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default ComplianceCard;