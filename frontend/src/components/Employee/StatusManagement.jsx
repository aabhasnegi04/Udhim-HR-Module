import { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Chip,
    Paper,
    CircularProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import {
    PersonOff as DeactivateIcon,
    PersonAdd as ReactivateIcon,
    History as HistoryIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import employeeService from '../../services/employeeService';

const StatusManagement = ({ employee, onStatusChange }) => {
    const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
    const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [statusHistory, setStatusHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const isActive = employee?.status === 'ACTIVE';

    const handleDeactivate = async () => {
        if (!reason.trim()) {
            setError('Please provide a reason for deactivation');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await employeeService.deactivateEmployee(employee.employee_id, reason);
            
            if (result.success) {
                setDeactivateDialogOpen(false);
                setReason('');
                if (onStatusChange) {
                    onStatusChange('INACTIVE');
                }
            } else {
                setError(result.error || 'Failed to deactivate employee');
            }
        } catch (error) {
            setError('An error occurred while deactivating employee');
        } finally {
            setLoading(false);
        }
    };

    const handleReactivate = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await employeeService.reactivateEmployee(
                employee.employee_id, 
                reason.trim() || 'Employee reactivated'
            );
            
            if (result.success) {
                setReactivateDialogOpen(false);
                setReason('');
                if (onStatusChange) {
                    onStatusChange('ACTIVE');
                }
            } else {
                setError(result.error || 'Failed to reactivate employee');
            }
        } catch (error) {
            setError('An error occurred while reactivating employee');
        } finally {
            setLoading(false);
        }
    };

    const loadStatusHistory = async () => {
        setHistoryLoading(true);
        try {
            const result = await employeeService.getEmployeeStatusHistory(employee.employee_id);
            if (result.success) {
                setStatusHistory(result.data || []);
            } else {
                setError(result.error || 'Failed to load status history');
            }
        } catch (error) {
            setError('An error occurred while loading status history');
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleViewHistory = () => {
        setHistoryDialogOpen(true);
        loadStatusHistory();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const getActionIcon = (actionType) => {
        switch (actionType) {
            case 'DEACTIVATED':
                return <DeactivateIcon color="error" />;
            case 'REACTIVATED':
            case 'ACTIVATED':
                return <ReactivateIcon color="success" />;
            default:
                return <CheckCircleIcon color="primary" />;
        }
    };

    const getActionColor = (actionType) => {
        switch (actionType) {
            case 'DEACTIVATED':
                return 'error';
            case 'REACTIVATED':
            case 'ACTIVATED':
                return 'success';
            default:
                return 'primary';
        }
    };

    return (
        <Box>
            {/* Status Display and Actions */}
            <Paper sx={{ p: 3, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Employee Status</Typography>
                    <Chip
                        label={employee?.status || 'Unknown'}
                        color={isActive ? 'success' : 'error'}
                        icon={isActive ? <CheckCircleIcon /> : <WarningIcon />}
                        sx={{ fontWeight: 600 }}
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {isActive ? (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeactivateIcon />}
                            onClick={() => setDeactivateDialogOpen(true)}
                        >
                            Deactivate Employee
                        </Button>
                    ) : (
                        <Button
                            variant="outlined"
                            color="success"
                            startIcon={<ReactivateIcon />}
                            onClick={() => setReactivateDialogOpen(true)}
                        >
                            Reactivate Employee
                        </Button>
                    )}
                    
                    <Button
                        variant="outlined"
                        startIcon={<HistoryIcon />}
                        onClick={handleViewHistory}
                    >
                        View Status History
                    </Button>
                </Box>

                {!isActive && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This employee is inactive. They cannot mark attendance or be edited until reactivated.
                    </Alert>
                )}
            </Paper>

            {/* Deactivate Dialog */}
            <Dialog open={deactivateDialogOpen} onClose={() => setDeactivateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DeactivateIcon color="error" />
                        Deactivate Employee
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Deactivating this employee will:
                        <ul>
                            <li>Prevent them from marking attendance</li>
                            <li>Disable their user account</li>
                            <li>Prevent editing their profile until reactivated</li>
                        </ul>
                    </Alert>
                    
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Reason for Deactivation *"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Please provide a reason for deactivating this employee..."
                        sx={{ mt: 2 }}
                    />
                    
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeactivateDialogOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeactivate}
                        color="error"
                        variant="contained"
                        disabled={loading || !reason.trim()}
                        startIcon={loading ? <CircularProgress size={20} /> : <DeactivateIcon />}
                    >
                        {loading ? 'Deactivating...' : 'Deactivate Employee'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reactivate Dialog */}
            <Dialog open={reactivateDialogOpen} onClose={() => setReactivateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReactivateIcon color="success" />
                        Reactivate Employee
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Reactivating this employee will:
                        <ul>
                            <li>Allow them to mark attendance again</li>
                            <li>Enable their user account</li>
                            <li>Allow editing their profile</li>
                        </ul>
                    </Alert>
                    
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Reason for Reactivation (Optional)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Optional reason for reactivating this employee..."
                        sx={{ mt: 2 }}
                    />
                    
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReactivateDialogOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleReactivate}
                        color="success"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <ReactivateIcon />}
                    >
                        {loading ? 'Reactivating...' : 'Reactivate Employee'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Status History Dialog */}
            <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon />
                        Employee Status History
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {historyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : statusHistory.length > 0 ? (
                        <List sx={{ width: '100%' }}>
                            {statusHistory.map((entry, index) => (
                                <Box key={entry.log_id || index}>
                                    <ListItem alignItems="flex-start">
                                        <ListItemIcon>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                color: getActionColor(entry.action_type) + '.main' 
                                            }}>
                                                {getActionIcon(entry.action_type)}
                                            </Box>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <Chip
                                                        label={entry.action_type}
                                                        color={getActionColor(entry.action_type)}
                                                        size="small"
                                                        sx={{ fontWeight: 600 }}
                                                    />
                                                    <Typography variant="body2" color="text.secondary" component="span">
                                                        {formatDate(entry.created_at)}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Box component="div">
                                                    {entry.action_details && (
                                                        <Typography variant="body2" sx={{ mb: 1 }} component="div">
                                                            {entry.action_details}
                                                        </Typography>
                                                    )}
                                                    {entry.created_by_email && (
                                                        <Typography variant="caption" color="text.secondary" component="div">
                                                            By: {entry.created_by_email}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < statusHistory.length - 1 && <Divider />}
                                </Box>
                            ))}
                        </List>
                    ) : (
                        <Alert severity="info">
                            No status change history found for this employee.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHistoryDialogOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StatusManagement;