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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    CheckCircle as ActiveIcon,
    PauseCircle as InactiveIcon,
    Cancel as ResignedIcon,
    History as HistoryIcon,
    PersonAdd as RehireIcon,
} from '@mui/icons-material';
import employeeService from '../../services/employeeService';

const StatusManagement = ({ employee, onStatusChange }) => {
    const [statusDialog, setStatusDialog] = useState({ open: false, status: '', reason: '' });
    const [rehireDialog, setRehireDialog] = useState({ open: false, reason: '' });
    const [historyDialog, setHistoryDialog] = useState({ open: false, history: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const currentStatus = employee?.status || 'ACTIVE';

    const getStatusConfig = (status) => {
        const configs = {
            'ACTIVE': { 
                color: 'success', 
                icon: <ActiveIcon />, 
                label: 'Active',
                description: 'Currently working'
            },
            'INACTIVE': { 
                color: 'warning', 
                icon: <InactiveIcon />, 
                label: 'Inactive',
                description: 'Temporarily away (hometown visit, medical leave)'
            },
            'RESIGNED': { 
                color: 'error', 
                icon: <ResignedIcon />, 
                label: 'Resigned',
                description: 'Left the company'
            }
        };
        return configs[status] || configs['ACTIVE'];
    };

    const handleOpenStatusDialog = (newStatus) => {
        setStatusDialog({ open: true, status: newStatus, reason: '' });
        setError('');
    };

    const handleStatusChange = async () => {
        if (!statusDialog.reason.trim()) {
            setError('Please provide a reason');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await employeeService.changeEmployeeStatus(
                employee.employee_id,
                statusDialog.status,
                statusDialog.reason
            );
            
            if (result.success) {
                setStatusDialog({ open: false, status: '', reason: '' });
                if (onStatusChange) {
                    onStatusChange(statusDialog.status);
                }
            } else {
                setError(result.error || 'Failed to change status');
            }
        } catch (error) {
            setError('An error occurred while changing status');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenRehireDialog = () => {
        setRehireDialog({ open: true, reason: '' });
        setError('');
    };

    const handleRehire = async () => {
        if (!rehireDialog.reason.trim()) {
            setError('Please provide a reason for rehiring');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await employeeService.rehireEmployee(
                employee.employee_id,
                rehireDialog.reason
            );
            
            if (result.success) {
                setRehireDialog({ open: false, reason: '' });
                if (onStatusChange) {
                    onStatusChange('ACTIVE');
                }
            } else {
                setError(result.error || 'Failed to rehire employee');
            }
        } catch (error) {
            setError('An error occurred while rehiring employee');
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistory = async () => {
        setLoading(true);
        try {
            const result = await employeeService.getEmployeeStatusHistory(employee.employee_id);
            if (result.success) {
                setHistoryDialog({ open: true, history: result.data || [] });
            } else {
                setError(result.error || 'Failed to load status history');
            }
        } catch (error) {
            setError('An error occurred while loading status history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const config = getStatusConfig(currentStatus);

    return (
        <Box>
            {/* Status Display and Actions */}
            <Paper sx={{ p: 3, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6">Employee Status</Typography>
                    <Chip
                        icon={config.icon}
                        label={config.label}
                        color={config.color}
                        sx={{ fontWeight: 600, fontSize: '0.9rem' }}
                    />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {config.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    {currentStatus !== 'ACTIVE' && (
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<ActiveIcon />}
                            onClick={() => handleOpenStatusDialog('ACTIVE')}
                        >
                            Mark as Active
                        </Button>
                    )}
                    
                    {currentStatus !== 'INACTIVE' && (
                        <Button
                            variant="contained"
                            color="warning"
                            startIcon={<InactiveIcon />}
                            onClick={() => handleOpenStatusDialog('INACTIVE')}
                        >
                            Mark as Inactive
                        </Button>
                    )}
                    
                    {currentStatus !== 'RESIGNED' && (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<ResignedIcon />}
                            onClick={() => handleOpenStatusDialog('RESIGNED')}
                        >
                            Mark as Resigned
                        </Button>
                    )}

                    {currentStatus === 'RESIGNED' && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<RehireIcon />}
                            onClick={handleOpenRehireDialog}
                        >
                            Rehire Employee
                        </Button>
                    )}
                </Box>

                <Button
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    onClick={handleViewHistory}
                    disabled={loading}
                >
                    View Status History
                </Button>

                {currentStatus === 'INACTIVE' && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This employee is temporarily inactive. They cannot mark attendance until reactivated.
                    </Alert>
                )}

                {currentStatus === 'RESIGNED' && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        This employee has resigned. Use "Rehire Employee" to bring them back with the same employee code.
                    </Alert>
                )}
            </Paper>

            {/* Status Change Dialog */}
            <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ ...statusDialog, open: false })} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Change Status to {getStatusConfig(statusDialog.status).label}
                </DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        {statusDialog.status === 'ACTIVE' && 'Employee will be able to mark attendance and access the system.'}
                        {statusDialog.status === 'INACTIVE' && 'Employee will be temporarily inactive (e.g., hometown visit, medical leave). Can be reactivated later.'}
                        {statusDialog.status === 'RESIGNED' && 'Employee will be marked as resigned. They can be rehired later with the same employee code.'}
                    </Alert>
                    
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Reason *"
                        value={statusDialog.reason}
                        onChange={(e) => setStatusDialog({ ...statusDialog, reason: e.target.value })}
                        placeholder="e.g., Gone to hometown for festival, Resigned for better opportunity, etc."
                        sx={{ mt: 2 }}
                    />
                    
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialog({ ...statusDialog, open: false })} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleStatusChange}
                        variant="contained"
                        disabled={loading || !statusDialog.reason.trim()}
                        startIcon={loading && <CircularProgress size={20} />}
                    >
                        {loading ? 'Changing...' : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Rehire Dialog */}
            <Dialog open={rehireDialog.open} onClose={() => setRehireDialog({ ...rehireDialog, open: false })} maxWidth="sm" fullWidth>
                <DialogTitle>Rehire Employee</DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        The employee will be marked as ACTIVE and can login again. Their employee code will remain the same for biometric compatibility.
                    </Alert>
                    
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Reason for Rehiring *"
                        value={rehireDialog.reason}
                        onChange={(e) => setRehireDialog({ ...rehireDialog, reason: e.target.value })}
                        placeholder="e.g., Rejoined after completing personal commitments"
                        sx={{ mt: 2 }}
                    />
                    
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRehireDialog({ ...rehireDialog, open: false })} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRehire}
                        variant="contained"
                        color="primary"
                        disabled={loading || !rehireDialog.reason.trim()}
                        startIcon={loading && <CircularProgress size={20} />}
                    >
                        {loading ? 'Rehiring...' : 'Rehire'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Status History Dialog */}
            <Dialog open={historyDialog.open} onClose={() => setHistoryDialog({ ...historyDialog, open: false })} maxWidth="md" fullWidth>
                <DialogTitle>
                    Employee Status History
                </DialogTitle>
                <DialogContent>
                    {historyDialog.history.length === 0 ? (
                        <Alert severity="info">
                            No status history found for this employee.
                        </Alert>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>From</TableCell>
                                    <TableCell>To</TableCell>
                                    <TableCell>Reason</TableCell>
                                    <TableCell>Changed By</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historyDialog.history.map((record) => (
                                    <TableRow key={record.history_id}>
                                        <TableCell>
                                            {formatDate(record.changed_at)}
                                        </TableCell>
                                        <TableCell>
                                            {record.old_status ? (
                                                <Chip 
                                                    icon={getStatusConfig(record.old_status).icon}
                                                    label={getStatusConfig(record.old_status).label}
                                                    color={getStatusConfig(record.old_status).color}
                                                    size="small"
                                                />
                                            ) : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                icon={getStatusConfig(record.new_status).icon}
                                                label={getStatusConfig(record.new_status).label}
                                                color={getStatusConfig(record.new_status).color}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{record.reason || 'No reason provided'}</TableCell>
                                        <TableCell>
                                            <Typography variant="caption">
                                                {record.changed_by_name || record.changed_by_email}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHistoryDialog({ ...historyDialog, open: false })}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StatusManagement;
