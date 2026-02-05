import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProfileSwitching } from '../../context/ProfileSwitchingContext';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    Stack,
    Avatar,
    IconButton,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    Visibility as ViewIcon,
    Check as ApproveIcon,
    Close as RejectIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import RegularizationTimeline from '../../components/Attendance/RegularizationTimeline';
import attendanceService from '../../services/attendanceService';

const Regularization = () => {
    const { user, isEmployeeActive } = useAuth();
    const [activeTab, setActiveTab] = useState(0);
    const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [newRequest, setNewRequest] = useState({
        employee_id: user?.employee_id || 1,
        attendance_date: '',
        requested_status: '',
        reason: ''
    });
    const [regularizationRequests, setRegularizationRequests] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const issueTypes = [
        'PRESENT',
        'ABSENT', 
        'LATE',
        'WFH'
    ];

    const { currentView } = useProfileSwitching();

    // Load regularization data
    const loadRegularizationData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load pending regularizations only for HR/Manager view
            if (currentView === 'HR' || currentView === 'MANAGER') {
                try {
                    const pendingResult = await attendanceService.getPendingRegularizations();
                    if (pendingResult.success) {
                        setPendingRequests(pendingResult.data || []);
                    }
                } catch (err) {
                    console.error('Failed to load pending regularizations:', err);
                    // Don't set error for this, as it might be a permission issue
                }
            } else {
                // Clear pending requests when not in HR/Manager view
                setPendingRequests([]);
            }

            // Load employee's own requests (always available)
            if (user?.employee_id) {
                try {
                    const myRequestsResult = await attendanceService.getMyRegularizations(user.employee_id);
                    if (myRequestsResult.success) {
                        setRegularizationRequests(myRequestsResult.data || []);
                    }
                } catch (err) {
                    console.error('Failed to load my regularizations:', err);
                    setError('Failed to load your regularization requests');
                }
            }

        } catch (err) {
            setError('Failed to load regularization data');
            console.error('Regularization load error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRegularizationData();
        // Reset to first tab when view changes
        setActiveTab(0);
    }, [user, currentView]);

    const handleSubmitRequest = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validate data
            const validation = attendanceService.validateRegularizationData(newRequest);
            if (!validation.isValid) {
                setError(validation.errors.join(', '));
                return;
            }

            const result = await attendanceService.applyRegularization(newRequest);
            
            if (result.success) {
                setSuccess('Regularization request submitted successfully');
                setShowNewRequestDialog(false);
                setNewRequest({ 
                    employee_id: user?.employee_id || 1, 
                    attendance_date: '', 
                    requested_status: '', 
                    reason: '' 
                });
                loadRegularizationData(); // Refresh data
            } else {
                setError(result.error || 'Failed to submit regularization request');
            }
        } catch (err) {
            setError('Failed to submit regularization request');
            console.error('Submit regularization error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setShowDetailsDialog(true);
    };

    const handleApproveReject = async (requestId, action, request = null, comment = '') => {
        try {
            setLoading(true);
            setError(null);

            let result;
            if (action === 'approve') {
                // For approval, we need approved_status and approver_comment
                const approvalData = {
                    approved_status: (request || selectedRequest)?.requested_status || 'PRESENT',
                    approver_comment: comment || 'Approved'
                };
                result = await attendanceService.approveRegularization(requestId, approvalData);
            } else {
                // For rejection, we need comment
                const rejectionData = {
                    comment: comment || 'Rejected'
                };
                result = await attendanceService.rejectRegularization(requestId, rejectionData);
            }

            if (result.success) {
                setSuccess(`Regularization request ${action}d successfully`);
                setShowDetailsDialog(false);
                loadRegularizationData(); // Refresh data
            } else {
                setError(result.error || `Failed to ${action} regularization request`);
            }
        } catch (err) {
            setError(`Failed to ${action} regularization request`);
            console.error(`${action} regularization error:`, err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const statusUpper = status?.toUpperCase();
        switch (statusUpper) {
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'error';
            case 'PENDING': return 'warning';
            default: return 'default';
        }
    };

    const renderEmployeeView = () => (
        <Box>
            {/* Apply New Request Button */}
            <Box sx={{ mb: 3 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowNewRequestDialog(true)}
                    disabled={loading || !isEmployeeActive()}
                >
                    Apply for Regularization
                </Button>
            </Box>

            {/* My Requests Table */}
            <Paper>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        My Regularization Requests
                    </Typography>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Requested Status</TableCell>
                                <TableCell>Reason</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Submitted</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : regularizationRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        No regularization requests found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                regularizationRequests.map((request) => (
                                    <TableRow key={request.request_id || request.id} hover>
                                        <TableCell>{request.attendance_date}</TableCell>
                                        <TableCell>{request.requested_status}</TableCell>
                                        <TableCell sx={{ maxWidth: 200 }}>
                                            <Typography variant="body2" noWrap>
                                                {request.reason}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={request.status}
                                                color={getStatusColor(request.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{request.created_at || request.submittedDate}</TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewDetails(request)}
                                            >
                                                <ViewIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );

    const renderManagerHRView = () => (
        <Box>
            {/* Pending Approvals */}
            <Paper>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Pending Approvals
                    </Typography>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Employee</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Requested Status</TableCell>
                                <TableCell>Reason</TableCell>
                                <TableCell>Submitted</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : pendingRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        No pending regularization requests
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pendingRequests.map((request) => (
                                    <TableRow key={request.request_id || request.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar sx={{ width: 32, height: 32 }}>
                                                    {request.employee_name?.charAt(0) || 'U'}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {request.employee_name || 'Unknown'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {request.employee_code || request.employee_id || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{request.attendance_date}</TableCell>
                                        <TableCell>{request.requested_status}</TableCell>
                                        <TableCell sx={{ maxWidth: 200 }}>
                                            <Typography variant="body2" noWrap>
                                                {request.reason}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{request.created_at || request.submittedDate}</TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1}>
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={() => handleApproveReject(request.request_id || request.id, 'approve', request)}
                                                    disabled={loading}
                                                >
                                                    <ApproveIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleApproveReject(request.request_id || request.id, 'reject', request)}
                                                    disabled={loading}
                                                >
                                                    <RejectIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleViewDetails(request)}
                                                >
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Inactive Employee Alert */}
            {!isEmployeeActive() && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 3 }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Access Denied - Account Inactive
                    </Typography>
                    <Typography variant="body2">
                        Your employee account is inactive. You cannot submit attendance correction requests. Please contact HR for assistance.
                    </Typography>
                </Alert>
            )}

            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Attendance Correction Requests
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Submit and manage attendance regularization requests
                </Typography>
            </Box>

            {/* Success/Error Messages */}
            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Tabs for different views */}
            <Paper sx={{ mb: { xs: 2, sm: 3 } }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                >
                    <Tab 
                        label="My Requests" 
                        icon={<AssignmentIcon />} 
                        sx={{ minWidth: { xs: 120, sm: 160 } }}
                    />
                    {(currentView === 'HR' || currentView === 'MANAGER') && (
                        <Tab 
                            label="Pending Approvals" 
                            icon={<ApproveIcon />} 
                            sx={{ minWidth: { xs: 120, sm: 160 } }}
                        />
                    )}
                </Tabs>
            </Paper>

            {/* Content based on active tab */}
            {activeTab === 0 ? renderEmployeeView() : (
                (currentView === 'HR' || currentView === 'MANAGER') ? renderManagerHRView() : renderEmployeeView()
            )}

            {/* New Request Dialog */}
            <Dialog
                open={showNewRequestDialog}
                onClose={() => setShowNewRequestDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { m: { xs: 1, sm: 2 } }
                }}
            >
                <DialogTitle>New Regularization Request</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Attendance Date"
                            type="date"
                            value={newRequest.attendance_date}
                            onChange={(e) => setNewRequest({ ...newRequest, attendance_date: e.target.value })}
                            disabled={!isEmployeeActive()}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <FormControl fullWidth disabled={!isEmployeeActive()}>
                            <InputLabel>Requested Status</InputLabel>
                            <Select
                                value={newRequest.requested_status}
                                onChange={(e) => setNewRequest({ ...newRequest, requested_status: e.target.value })}
                                label="Requested Status"
                            >
                                {issueTypes.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Reason"
                            multiline
                            rows={3}
                            value={newRequest.reason}
                            onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                            disabled={!isEmployeeActive()}
                            placeholder="Please explain the reason for regularization..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowNewRequestDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmitRequest}
                        disabled={!isEmployeeActive() || !newRequest.attendance_date || !newRequest.requested_status || !newRequest.reason || loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Request Details Dialog */}
            <Dialog
                open={showDetailsDialog}
                onClose={() => setShowDetailsDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { m: { xs: 1, sm: 2 } }
                }}
            >
                <DialogTitle>Regularization Request Details</DialogTitle>
                <DialogContent>
                    {selectedRequest && (
                        <Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                    <Box sx={{ flex: '1 1 200px' }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Employee
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedRequest.employee_name || selectedRequest.employeeName} ({selectedRequest.employee_code || selectedRequest.employee_id || selectedRequest.employeeId})
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: '1 1 200px' }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Date
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedRequest.attendance_date}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                    <Box sx={{ flex: '1 1 200px' }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Requested Status
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedRequest.requested_status}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: '1 1 200px' }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Status
                                        </Typography>
                                        <Chip
                                            label={selectedRequest.status}
                                            color={getStatusColor(selectedRequest.status)}
                                            size="small"
                                        />
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Reason
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedRequest.reason}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Timeline */}
                            <RegularizationTimeline requestId={selectedRequest.id} />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDetailsDialog(false)}>
                        Close
                    </Button>
                    {selectedRequest?.status === 'Pending' || selectedRequest?.status === 'PENDING' && (
                        <>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<ApproveIcon />}
                                onClick={() => handleApproveReject(selectedRequest.request_id || selectedRequest.id, 'approve')}
                            >
                                Approve
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<RejectIcon />}
                                onClick={() => handleApproveReject(selectedRequest.request_id || selectedRequest.id, 'reject')}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Regularization;