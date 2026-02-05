import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Avatar,
    IconButton,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Badge,
    CircularProgress
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Refresh as RefreshIcon,
    Schedule as PendingIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useProfileSwitching } from '../../context/ProfileSwitchingContext';
import leaveService from '../../services/leaveService';

const LeaveApproval = () => {
    const { user } = useAuth();
    const { currentView } = useProfileSwitching();
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [approvalAction, setApprovalAction] = useState('');
    const [approvalComment, setApprovalComment] = useState('');
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadPendingLeaves();
    }, [currentView]); // Add currentView dependency

    const loadPendingLeaves = async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await leaveService.getPendingLeaves();
            
            if (result.success) {
                setPendingLeaves(result.data || []);
            } else {
                setError(result.error || 'Failed to load pending leaves');
            }
        } catch (err) {
            setError('Failed to load pending leaves');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredData = () => {
        let filteredData = pendingLeaves;

        if (departmentFilter !== 'all') {
            filteredData = filteredData.filter(request => request.department === departmentFilter);
        }

        return filteredData;
    };

    const filteredData = getFilteredData();

    const handleApprovalAction = (request, action) => {
        setSelectedRequest(request);
        setApprovalAction(action);
        setShowApprovalDialog(true);
    };

    const confirmApproval = async () => {
        try {
            setProcessing(true);
            let result;

            if (approvalAction === 'approve') {
                if (currentView === 'HR') {
                    result = await leaveService.hrApproveLeave(selectedRequest.request_id, approvalComment);
                } else if (currentView === 'MANAGER') {
                    result = await leaveService.managerApproveLeave(selectedRequest.request_id, approvalComment);
                }
            } else if (approvalAction === 'reject') {
                result = await leaveService.rejectLeave(selectedRequest.request_id, approvalComment);
            }

            if (result.success) {
                setShowApprovalDialog(false);
                setShowSuccessAlert(true);
                setApprovalComment('');
                loadPendingLeaves();
                
                setTimeout(() => {
                    setShowSuccessAlert(false);
                }, 3000);
            } else {
                alert(result.error || `Failed to ${approvalAction} leave`);
            }
        } catch (err) {
            alert(`Failed to ${approvalAction} leave`);
            console.error(err);
        } finally {
            setProcessing(false);
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
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Leave Approvals
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Review and approve pending leave requests
                        </Typography>
                    </Box>
                    <Badge badgeContent={filteredData.length} color="error">
                        <PendingIcon color="action" />
                    </Badge>
                </Box>
            </Box>

            {showSuccessAlert && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setShowSuccessAlert(false)}>
                    Leave request has been {approvalAction}d successfully!
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '0 0 150px', minWidth: '150px' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Department</InputLabel>
                            <Select
                                value={departmentFilter}
                                label="Department"
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Departments</MenuItem>
                                <MenuItem value="Engineering">Engineering</MenuItem>
                                <MenuItem value="Marketing">Marketing</MenuItem>
                                <MenuItem value="Sales">Sales</MenuItem>
                                <MenuItem value="HR">HR</MenuItem>
                                <MenuItem value="Finance">Finance</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '0 0 120px' }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => {
                                setDepartmentFilter('all');
                                loadPendingLeaves();
                            }}
                            size="small"
                            fullWidth
                        >
                            Refresh
                        </Button>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary">
                            {filteredData.length} pending requests
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Days</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Applied On</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                            No pending approvals
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((request) => (
                                    <TableRow key={request.request_id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                                    {request.employee_name ? request.employee_name.charAt(0) : 'E'}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {request.employee_name || 'N/A'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {request.employee_code || 'N/A'} • {request.department || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {request.leave_name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {new Date(request.start_date).toLocaleDateString()} to {new Date(request.end_date).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {request.total_days}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {new Date(request.applied_at).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={leaveService.getStatusLabel(request.status)}
                                                color={leaveService.getStatusColor(request.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <IconButton 
                                                    size="small" 
                                                    color="success"
                                                    onClick={() => handleApprovalAction(request, 'approve')}
                                                >
                                                    <ApproveIcon />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    color="error"
                                                    onClick={() => handleApprovalAction(request, 'reject')}
                                                >
                                                    <RejectIcon />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredData.map((request) => (
                        <Card key={request.request_id}>
                            <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                            {request.employee_name ? request.employee_name.charAt(0) : 'E'}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {request.employee_name || 'N/A'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {request.employee_code || 'N/A'} • {request.department || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Chip
                                        label={leaveService.getStatusLabel(request.status)}
                                        color={leaveService.getStatusColor(request.status)}
                                        size="small"
                                    />
                                </Box>
                                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                                    {request.leave_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {new Date(request.start_date).toLocaleDateString()} to {new Date(request.end_date).toLocaleDateString()} ({request.total_days} days)
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Applied: {new Date(request.applied_at).toLocaleDateString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                                    "{request.reason}"
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <Stack direction="row" spacing={1}>
                                        <Button 
                                            size="small" 
                                            variant="contained" 
                                            color="success"
                                            onClick={() => handleApprovalAction(request, 'approve')}
                                        >
                                            Approve
                                        </Button>
                                        <Button 
                                            size="small" 
                                            variant="outlined" 
                                            color="error"
                                            onClick={() => handleApprovalAction(request, 'reject')}
                                        >
                                            Reject
                                        </Button>
                                    </Stack>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </Box>

            {filteredData.length === 0 && !loading && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <PendingIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        No Pending Approvals
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        All leave requests have been processed or there are no requests matching your filters.
                    </Typography>
                </Paper>
            )}

            <Dialog open={showApprovalDialog} onClose={() => !processing && setShowApprovalDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {approvalAction === 'approve' ? 'Approve' : 'Reject'} Leave Request
                </DialogTitle>
                <DialogContent>
                    {selectedRequest && (
                        <Box>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                You are about to {approvalAction} the leave request for:
                            </Typography>
                            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2, mb: 3 }}>
                                <Typography variant="body2"><strong>Employee:</strong> {selectedRequest.employee_name}</Typography>
                                <Typography variant="body2"><strong>Leave Type:</strong> {selectedRequest.leave_name}</Typography>
                                <Typography variant="body2"><strong>Duration:</strong> {new Date(selectedRequest.start_date).toLocaleDateString()} to {new Date(selectedRequest.end_date).toLocaleDateString()} ({selectedRequest.total_days} days)</Typography>
                                <Typography variant="body2"><strong>Reason:</strong> {selectedRequest.reason}</Typography>
                            </Box>
                            <TextField
                                fullWidth
                                label={approvalAction === 'approve' ? 'Approval Comments (Optional)' : 'Rejection Reason (Required)'}
                                multiline
                                rows={3}
                                value={approvalComment}
                                onChange={(e) => setApprovalComment(e.target.value)}
                                placeholder={approvalAction === 'approve' ? 'Add any comments...' : 'Please provide a reason for rejection...'}
                                required={approvalAction === 'reject'}
                                disabled={processing}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowApprovalDialog(false)} disabled={processing}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        color={approvalAction === 'approve' ? 'success' : 'error'}
                        onClick={confirmApproval}
                        disabled={(approvalAction === 'reject' && !approvalComment.trim()) || processing}
                        startIcon={processing ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {processing ? 'Processing...' : (approvalAction === 'approve' ? 'Approve' : 'Reject')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeaveApproval;
