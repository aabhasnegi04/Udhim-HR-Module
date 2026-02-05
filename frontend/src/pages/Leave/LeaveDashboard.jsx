import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    LinearProgress,
    CircularProgress,
    Alert
} from '@mui/material';
import leaveService from '../../services/leaveService';
import { useAuth } from '../../context/AuthContext';
import { useProfileSwitching } from '../../context/ProfileSwitchingContext';

const LeaveDashboard = () => {
    const { user } = useAuth();
    const { currentView } = useProfileSwitching();
    const [balances, setBalances] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, [currentView]); // Add currentView dependency

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Only show the HR message when user is actually in HR view
            // When HR users are in Employee view, they should see their own leave dashboard
            if (currentView === 'HR') {
                setError('HR users should use the "All Leaves" and "Approvals" tabs to manage leaves.');
                setLoading(false);
                return;
            }

            // Use employee_id if available, otherwise use user_id (backend will handle conversion)
            const empId = user.employee_id || user.user_id;

            // Load leave balances (this will automatically filter based on allocated leave types)
            const balanceResult = await leaveService.getLeaveBalances(empId);
            if (balanceResult.success) {
                // Filter out balances with 0 or null allocated days (inappropriate gender-based allocations)
                const validBalances = (balanceResult.data || []).filter(balance => {
                    const totalAllocated = parseFloat(balance.total_allocated || 0);
                    return totalAllocated > 0;
                });
                setBalances(validBalances);
            }

            // Load my leaves
            const leavesResult = await leaveService.getMyLeaves();
            if (leavesResult.success) {
                setLeaves(leavesResult.data || []);
            }
        } catch (err) {
            setError('Failed to load leave data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelLeave = async (requestId) => {
        if (!window.confirm('Are you sure you want to cancel this leave request?')) {
            return;
        }

        try {
            const result = await leaveService.cancelLeave(requestId);
            if (result.success) {
                loadData();
                alert('Leave request cancelled successfully!');
            } else {
                alert(result.error || 'Failed to cancel leave');
            }
        } catch (err) {
            alert('Failed to cancel leave');
            console.error(err);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Leave Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Overview of your leave balances and recent requests
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Leave Balances */}
            <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { 
                    xs: 'repeat(2, 1fr)',  // 2x2 grid on mobile
                    sm: 'repeat(2, 1fr)',  // 2x2 grid on small tablets
                    md: 'repeat(auto-fit, minmax(200px, 1fr))'   // Auto-fit grid on desktop
                },
                gap: 2,
                mb: 3 
            }}>
                {balances.map((balance) => (
                    <Card key={balance.balance_id}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {balance.leave_name}
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                                {balance.remaining}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                of {balance.total_allocated} days
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={(balance.remaining / balance.total_allocated) * 100}
                                sx={{ mt: 1, height: { xs: 4, sm: 6 }, borderRadius: 3 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                Used: {balance.used} days
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* Leave History */}
            <Paper>
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Leave History
                    </Typography>
                </Box>
                
                {/* Desktop Table View */}
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Leave Type</TableCell>
                                    <TableCell>Start Date</TableCell>
                                    <TableCell>End Date</TableCell>
                                    <TableCell align="center">Days</TableCell>
                                    <TableCell>Reason</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {leaves.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                                No leave requests found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    leaves.map((leave) => (
                                        <TableRow key={leave.request_id}>
                                            <TableCell>{leave.leave_name}</TableCell>
                                            <TableCell>{new Date(leave.start_date).toLocaleDateString()}</TableCell>
                                            <TableCell>{new Date(leave.end_date).toLocaleDateString()}</TableCell>
                                            <TableCell align="center">{leave.total_days}</TableCell>
                                            <TableCell>{leave.reason}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={leaveService.getStatusLabel(leave.status)}
                                                    color={leaveService.getStatusColor(leave.status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                {(leave.status === 'PENDING' || leave.status === 'MANAGER_APPROVED') && (
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleCancelLeave(leave.request_id)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                {/* Mobile Card View */}
                <Box sx={{ display: { xs: 'block', md: 'none' }, p: { xs: 2, sm: 3 } }}>
                    {leaves.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                                No leave requests found
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ 
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                            gap: 2
                        }}>
                            {leaves.map((leave) => (
                                <Card key={leave.request_id} variant="outlined">
                                    <CardContent sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                                {leave.leave_name}
                                            </Typography>
                                            <Chip
                                                label={leaveService.getStatusLabel(leave.status)}
                                                color={leaveService.getStatusColor(leave.status)}
                                                size="small"
                                                sx={{ fontSize: '0.7rem' }}
                                            />
                                        </Box>
                                        
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                    Start Date
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                                    {new Date(leave.start_date).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                    End Date
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                                    {new Date(leave.end_date).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                Duration: <strong>{leave.total_days} days</strong>
                                            </Typography>
                                        </Box>
                                        
                                        {leave.reason && (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                    Reason
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                                                    {leave.reason}
                                                </Typography>
                                            </Box>
                                        )}
                                        
                                        {(leave.status === 'PENDING' || leave.status === 'MANAGER_APPROVED') && (
                                            <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    variant="outlined"
                                                    fullWidth
                                                    onClick={() => handleCancelLeave(leave.request_id)}
                                                    sx={{ fontSize: '0.75rem' }}
                                                >
                                                    Cancel Request
                                                </Button>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default LeaveDashboard;
