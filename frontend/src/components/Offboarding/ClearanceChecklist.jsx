import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    Chip,
    Paper
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Pending as PendingIcon
} from '@mui/icons-material';

const ClearanceChecklist = ({ clearance, onItemToggle, readOnly = false }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <CheckIcon color="success" />;
            case 'Rejected': return <CancelIcon color="error" />;
            case 'Pending': return <PendingIcon color="warning" />;
            default: return <PendingIcon color="warning" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'success';
            case 'Rejected': return 'error';
            case 'Pending': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Clearance Checklist
                </Typography>
                <Chip
                    label={clearance.status}
                    color={getStatusColor(clearance.status)}
                    icon={getStatusIcon(clearance.status)}
                />
            </Box>

            {clearance.checklist && (
                <List>
                    {clearance.checklist.map((item, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon>
                                <Checkbox
                                    checked={clearance.status === 'Approved'}
                                    disabled={readOnly || clearance.status !== 'Pending'}
                                    onChange={() => onItemToggle && onItemToggle(index)}
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary={item}
                                primaryTypographyProps={{
                                    variant: 'body2',
                                    sx: {
                                        textDecoration: clearance.status === 'Approved' ? 'line-through' : 'none',
                                        color: clearance.status === 'Approved' ? 'text.secondary' : 'text.primary'
                                    }
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
            )}

            {clearance.comments && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Comments:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {clearance.comments}
                    </Typography>
                </Box>
            )}

            {clearance.approvedBy && clearance.approvedOn && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        {clearance.status} by {clearance.approvedBy}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(clearance.approvedOn).toLocaleDateString('en-IN')}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default ClearanceChecklist;