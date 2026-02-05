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
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    FilterList as FilterIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useProfileSwitching } from '../../context/ProfileSwitchingContext';
import leaveService from '../../services/leaveService';

const LeaveList = () => {
    const { user } = useAuth();
    const { currentView } = useProfileSwitching();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const itemsPerPage = 5;

    useEffect(() => {
        loadLeaves();
    }, [currentView]); // Add currentView as dependency

    // Clear error when user changes (in case of role switching)
    useEffect(() => {
        if (user) {
            setError(null);
        }
    }, [user, currentView]);

    const loadLeaves = async () => {
        try {
            setLoading(true);
            setError(null); // Clear any existing errors immediately

            let result;
            // Use currentView instead of user.role to determine which endpoint to call
            if (currentView === 'EMPLOYEE') {
                result = await leaveService.getMyLeaves();
            } else if (currentView === 'MANAGER') {
                // For manager view, we might want to show team leaves in the future
                // For now, fall back to getMyLeaves
                result = await leaveService.getMyLeaves();
            } else if (currentView === 'HR') {
                result = await leaveService.getLeaveRegister();
            } else {
                // Fallback for any other view
                result = await leaveService.getMyLeaves();
            }

            // Handle undefined result (API call failed completely)
            if (!result) {
                setError('Failed to connect to server');
                return;
            }

            if (result.success) {
                setLeaves(result.data || []);
                setError(null); // Explicitly clear any previous errors
            } else {
                setError(result.error || 'Failed to load leaves');
            }
        } catch (err) {
            console.error('Exception in loadLeaves:', err);
            setError('Failed to load leaves');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        return leaveService.getStatusColor(status);
    };

    const getStatusLabel = (status) => {
        return leaveService.getStatusLabel(status);
    };

    // Filter data based on user role and filters
    const getFilteredData = () => {
        let filteredData = leaves;

        // Search filter
        if (searchTerm) {
            filteredData = filteredData.filter(leave =>
                (leave.employee_name && leave.employee_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (leave.employee_code && leave.employee_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (leave.reason && leave.reason.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filteredData = filteredData.filter(leave => leave.status === statusFilter);
        }

        // Type filter
        if (typeFilter !== 'all') {
            filteredData = filteredData.filter(leave => leave.leave_name === typeFilter);
        }

        return filteredData;
    };

    const filteredData = getFilteredData();
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleViewDetails = (leave) => {
        setSelectedLeave(leave);
        setShowDetailsDialog(true);
    };

    const handleCancel = async (requestId) => {
        if (!window.confirm('Are you sure you want to cancel this leave request?')) {
            return;
        }

        try {
            const result = await leaveService.cancelLeave(requestId);
            if (result.success) {
                loadLeaves();
                alert('Leave request cancelled successfully!');
            } else {
                alert(result.error || 'Failed to cancel leave');
            }
        } catch (err) {
            alert('Failed to cancel leave');
            console.error(err);
        }
    };

    const canEditOrCancel = (leave) => {
        if (currentView === 'HR') return true;
        if (currentView === 'EMPLOYEE' && (leave.status === 'PENDING' || leave.status === 'MANAGER_APPROVED')) return true;
        return false;
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
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                    {currentView === 'EMPLOYEE' ? 'My Leave Requests' : 
                     currentView === 'MANAGER' ? 'Team Leave Requests' : 
                     'All Leave Requests'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    {currentView === 'EMPLOYEE' ? 'View and manage your leave applications' : 
                     currentView === 'MANAGER' ? 'Monitor your team\'s leave requests' : 
                     'Complete overview of all employee leave requests'}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            <Paper sx={{ p: { xs: 1.5, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: { xs: 2, sm: 1 } }}>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 1, sm: 2 }, 
                    flexWrap: 'wrap'
                }}>
                    <Box sx={{ flex: '1 1 200px', minWidth: { xs: '100%', sm: '200px' } }}>
                        <TextField
                            fullWidth
                            placeholder="Search by employee, ID, or reason..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="small"
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: { xs: 18, sm: 20 } }} />
                            }}
                            sx={{
                                '& .MuiInputBase-input': {
                                    fontSize: { xs: '0.875rem', sm: '1rem' },
                                    py: { xs: 1, sm: 1 }
                                }
                            }}
                        />
                    </Box>
                    <Box sx={{ flex: '0 0 120px', minWidth: { xs: '48%', sm: '120px' } }}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={{
                                    '& .MuiSelect-select': {
                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                        py: { xs: 1, sm: 1 }
                                    }
                                }}
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="PENDING">Pending</MenuItem>
                                <MenuItem value="MANAGER_APPROVED">Manager Approved</MenuItem>
                                <MenuItem value="HR_APPROVED">Approved</MenuItem>
                                <MenuItem value="REJECTED">Rejected</MenuItem>
                                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '0 0 100px', minWidth: { xs: '48%', sm: '100px' } }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setTypeFilter('all');
                                setCurrentPage(1);
                                loadLeaves();
                            }}
                            size="small"
                            fullWidth
                            sx={{
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                py: { xs: 1, sm: 1 }
                            }}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Desktop Table View */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                {currentView !== 'EMPLOYEE' && (
                                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                )}
                                <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Days</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Applied On</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                            No leave requests found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((leave) => (
                                    <TableRow key={leave.request_id} hover>
                                        {currentView !== 'EMPLOYEE' && (
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                                        {leave.employee_name ? leave.employee_name.charAt(0) : 'E'}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {leave.employee_name || 'N/A'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {leave.employee_code || 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {leave.leave_name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {leave.total_days}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusLabel(leave.status)}
                                                color={getStatusColor(leave.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {new Date(leave.applied_at).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <IconButton size="small" onClick={() => handleViewDetails(leave)}>
                                                    <ViewIcon />
                                                </IconButton>
                                                {canEditOrCancel(leave) && (
                                                    <IconButton size="small" color="error" onClick={() => handleCancel(leave.request_id)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Mobile Card View */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                    {paginatedData.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                No leave requests found
                            </Typography>
                        </Paper>
                    ) : (
                        paginatedData.map((leave) => (
                            <Card key={leave.request_id} variant="outlined" sx={{ borderRadius: 2 }}>
                                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        {currentView !== 'EMPLOYEE' && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                <Avatar sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, mr: 1.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                    {leave.employee_name ? leave.employee_name.charAt(0) : 'E'}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                                        {leave.employee_name || 'N/A'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                                        {leave.employee_code || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                        <Chip
                                            label={getStatusLabel(leave.status)}
                                            color={getStatusColor(leave.status)}
                                            size="small"
                                            sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                        />
                                    </Box>
                                    
                                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                        {leave.leave_name}
                                    </Typography>
                                    
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                                Start Date
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                                {new Date(leave.start_date).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                                End Date
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                                {new Date(leave.end_date).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                            Duration: <strong>{leave.total_days} days</strong>
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                            Applied: {new Date(leave.applied_at).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        flexDirection: { xs: canEditOrCancel(leave) ? 'column' : 'row', sm: 'row' },
                                        gap: { xs: 1, sm: 0 }
                                    }}>
                                        <Button 
                                            size="small" 
                                            onClick={() => handleViewDetails(leave)}
                                            sx={{ 
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                minWidth: { xs: '100%', sm: 'auto' }
                                            }}
                                        >
                                            View Details
                                        </Button>
                                        {canEditOrCancel(leave) && (
                                            <Button 
                                                size="small" 
                                                variant="outlined" 
                                                color="error" 
                                                onClick={() => handleCancel(leave.request_id)}
                                                sx={{ 
                                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                    minWidth: { xs: '100%', sm: 'auto' }
                                                }}
                                            >
                                                Cancel Request
                                            </Button>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </Box>
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={(event, value) => setCurrentPage(value)}
                        color="primary"
                    />
                </Box>
            )}

            {/* Leave Details Dialog */}
            <Dialog open={showDetailsDialog} onClose={() => setShowDetailsDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Leave Request Details</DialogTitle>
                <DialogContent>
                    {selectedLeave && (
                        <Box>
                            {currentView !== 'EMPLOYEE' && (
                                <>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">Employee</Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {selectedLeave.employee_name} ({selectedLeave.employee_code})
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                </>
                            )}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">Leave Type</Typography>
                                <Typography variant="body1">{selectedLeave.leave_name}</Typography>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">Duration</Typography>
                                <Typography variant="body1">
                                    {new Date(selectedLeave.start_date).toLocaleDateString()} to {new Date(selectedLeave.end_date).toLocaleDateString()} ({selectedLeave.total_days} days)
                                </Typography>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">Status</Typography>
                                <Chip
                                    label={getStatusLabel(selectedLeave.status)}
                                    color={getStatusColor(selectedLeave.status)}
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                />
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">Reason</Typography>
                                <Typography variant="body1">{selectedLeave.reason}</Typography>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">Applied On</Typography>
                                <Typography variant="body1">{new Date(selectedLeave.applied_at).toLocaleDateString()}</Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
                    {selectedLeave && canEditOrCancel(selectedLeave) && (
                        <Button variant="outlined" color="error" onClick={() => {
                            setShowDetailsDialog(false);
                            handleCancel(selectedLeave.request_id);
                        }}>
                            Cancel Leave
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeaveList;
