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
    Alert,
    Chip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
    CircularProgress
} from '@mui/material';
import {
    BeachAccess as LeaveIcon,
    CloudUpload as UploadIcon,
    Send as SendIcon,
    Info as InfoIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useAuth } from '../../context/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import leaveService from '../../services/leaveService';

const ApplyLeave = () => {
    const { user, isEmployeeActive } = useAuth();
    const [balances, setBalances] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        leaveType: '',
        fromDate: dayjs(),
        toDate: dayjs(),
        reason: '',
        attachment: null
    });
    const [calculatedDays, setCalculatedDays] = useState(0);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadLeaveData();
    }, []);

    const loadLeaveData = async () => {
        try {
            setLoading(true);
            
            // Get employee ID - prefer employee_id from user object
            let empId = user.employee_id;
            
            // If no employee_id, this might be a user-only account (like HR admin)
            // Try to get employee_id from user_id, but if that fails, fall back to all leave types
            if (!empId) {
                empId = user.user_id;
            }
            
            // Load leave types and balances
            let typesResult, balancesResult;
            
            // Try to get gender-filtered leave types first
            if (user.employee_id) {
                // User has employee_id, get gender-filtered leave types
                [typesResult, balancesResult] = await Promise.all([
                    leaveService.getLeaveTypesForEmployee(empId),
                    leaveService.getLeaveBalances(empId)
                ]);
            } else {
                // User doesn't have employee_id, try with user_id but fall back to all types if it fails
                const [genderFilteredResult, balanceResult] = await Promise.all([
                    leaveService.getLeaveTypesForEmployee(empId),
                    leaveService.getLeaveBalances(empId)
                ]);
                
                if (genderFilteredResult.success) {
                    typesResult = genderFilteredResult;
                } else {
                    // Fall back to all leave types if gender filtering fails
                    typesResult = await leaveService.getLeaveTypes();
                }
                
                balancesResult = balanceResult;
            }
            
            if (typesResult.success) {
                setLeaveTypes(typesResult.data || []);
            } else {
                // Final fallback - get all leave types
                const fallbackResult = await leaveService.getLeaveTypes();
                if (fallbackResult.success) {
                    setLeaveTypes(fallbackResult.data || []);
                } else {
                    setError('Failed to load leave types');
                }
            }
            
            if (balancesResult.success) {
                // Filter out balances with 0 or null allocated days (inappropriate gender-based allocations)
                const validBalances = (balancesResult.data || []).filter(balance => {
                    const totalAllocated = parseFloat(balance.total_allocated || 0);
                    return totalAllocated > 0;
                });
                setBalances(validBalances);
            } else {
                // For balances, we can't fall back - they're user-specific
                if (!typesResult.success) {
                    setError('Failed to load leave data');
                }
            }
            
        } catch (err) {
            console.error('Load leave data error:', err);
            setError('Failed to load leave data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Calculate days when dates change
        if (field === 'fromDate' || field === 'toDate') {
            const updatedData = { ...formData, [field]: value };
            if (updatedData.fromDate && updatedData.toDate && dayjs(updatedData.fromDate).isValid() && dayjs(updatedData.toDate).isValid()) {
                const days = leaveService.calculateLeaveDays(
                    updatedData.fromDate.format('YYYY-MM-DD'),
                    updatedData.toDate.format('YYYY-MM-DD')
                );
                setCalculatedDays(days);
            }
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        setFormData(prev => ({
            ...prev,
            attachment: file
        }));
    };

    const handleSubmit = () => {
        setShowConfirmDialog(true);
    };

    const confirmSubmit = async () => {
        try {
            setSubmitting(true);
            setShowConfirmDialog(false);

            const leaveData = {
                // employee_id will be set by backend from JWT for security
                leave_type_id: formData.leaveType,
                start_date: formData.fromDate.format('YYYY-MM-DD'),
                end_date: formData.toDate.format('YYYY-MM-DD'),
                reason: formData.reason
            };

            const result = await leaveService.applyLeave(leaveData);
            
            if (result.success) {
                setSubmitSuccess(true);
                // Reset form
                setFormData({
                    leaveType: '',
                    fromDate: dayjs(),
                    toDate: dayjs(),
                    reason: '',
                    attachment: null
                });
                setCalculatedDays(0);
                
                // Reload balances
                await loadLeaveData();
                
                // Hide success message after 3 seconds
                setTimeout(() => {
                    setSubmitSuccess(false);
                }, 3000);
            } else {
                setError(result.error || 'Failed to apply leave');
            }
        } catch (err) {
            setError('Failed to apply leave');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const getLeaveBalance = (leaveTypeId) => {
        const balance = balances.find(b => b.leave_type_id === leaveTypeId);
        return balance || { remaining: 0, total_allocated: 0, used: 0 };
    };

    const isFormValid = () => {
        return formData.leaveType && formData.fromDate && formData.toDate && formData.reason.trim() && dayjs(formData.fromDate).isValid() && dayjs(formData.toDate).isValid();
    };

    const selectedLeaveBalance = formData.leaveType ? getLeaveBalance(formData.leaveType) : null;
    const hasInsufficientBalance = selectedLeaveBalance && calculatedDays > selectedLeaveBalance.remaining;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Inactive Employee Alert */}
            {!isEmployeeActive() && (
                <Alert 
                    severity="error" 
                    icon={<WarningIcon />}
                    sx={{ mb: 3 }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Access Denied - Account Inactive
                    </Typography>
                    <Typography variant="body2">
                        Your employee account is inactive. You cannot apply for leave. Please contact HR for assistance.
                    </Typography>
                </Alert>
            )}

            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                    Apply for Leave
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Submit your leave application with required details
                </Typography>
            </Box>

            {submitSuccess && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSubmitSuccess(false)}>
                    Leave application submitted successfully! You will be notified once it's reviewed.
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', lg: 'row' } }}>
                {/* Leave Balance Cards */}
                <Box sx={{ flex: '0 0 300px', minWidth: { xs: '100%', lg: '300px' } }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, fontSize: { xs: '1rem', sm: '1rem' } }}>
                        Leave Balance
                    </Typography>
                    <Box sx={{ 
                        display: { xs: 'grid', lg: 'flex' },
                        gridTemplateColumns: { xs: 'repeat(auto-fit, minmax(160px, 1fr))', sm: 'repeat(auto-fit, minmax(180px, 1fr))' },
                        flexDirection: { lg: 'column' },
                        gap: { xs: 1.5, sm: 2 },
                        overflowX: { xs: 'visible', lg: 'visible' },
                        pb: { xs: 0, lg: 0 }
                    }}>
                        {balances.map((balance) => {
                            const isSelected = formData.leaveType === balance.leave_type_id;
                            return (
                                <Card 
                                    key={balance.balance_id} 
                                    sx={{ 
                                        border: isSelected ? 2 : 1,
                                        borderColor: isSelected ? 'primary.main' : 'divider',
                                        cursor: isEmployeeActive() ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s ease',
                                        opacity: isEmployeeActive() ? 1 : 0.5,
                                        '&:hover': isEmployeeActive() ? {
                                            borderColor: 'primary.main',
                                            boxShadow: 2
                                        } : {},
                                        '&:active': isEmployeeActive() ? {
                                            transform: 'scale(0.98)'
                                        } : {}
                                    }}
                                    onClick={() => isEmployeeActive() && handleInputChange('leaveType', balance.leave_type_id)}
                                >
                                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                                {balance.leave_name}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="h6" color="primary.main" fontWeight={700} sx={{ fontSize: { xs: '1.125rem', sm: '1.5rem' } }}>
                                                {balance.remaining}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                                                of {balance.total_allocated}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(balance.remaining / balance.total_allocated) * 100}
                                            color={balance.remaining > balance.total_allocated * 0.5 ? 'success' : 'warning'}
                                            sx={{ height: { xs: 3, sm: 4 }, borderRadius: 2 }}
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                                            Used: {balance.used} days
                                        </Typography>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                </Box>

                {/* Application Form */}
                <Box sx={{ flex: 1 }}>
                    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 2, sm: 1 } }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3, fontSize: { xs: '1rem', sm: '1rem' } }}>
                            Leave Application Form
                        </Typography>

                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2.5, sm: 3 } }}>
                                {/* Leave Type Selection */}
                                <FormControl fullWidth>
                                    <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Leave Type</InputLabel>
                                    <Select
                                        value={formData.leaveType}
                                        label="Leave Type"
                                        onChange={(e) => handleInputChange('leaveType', e.target.value)}
                                        sx={{ 
                                            '& .MuiSelect-select': { 
                                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                                py: { xs: 1.5, sm: 2 }
                                            }
                                        }}
                                    >
                                        {leaveTypes.map((leaveType) => (
                                            <MenuItem key={leaveType.leave_type_id} value={leaveType.leave_type_id}>
                                                {leaveType.leave_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Date Selection */}
                                <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <DatePicker
                                        label="From Date"
                                        value={formData.fromDate}
                                        onChange={(newValue) => handleInputChange('fromDate', newValue)}
                                        disabled={!isEmployeeActive()}
                                        slotProps={{ 
                                            textField: { 
                                                fullWidth: true,
                                                sx: {
                                                    '& .MuiInputBase-input': {
                                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                                        py: { xs: 1.5, sm: 2 }
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                    <DatePicker
                                        label="To Date"
                                        value={formData.toDate}
                                        onChange={(newValue) => handleInputChange('toDate', newValue)}
                                        disabled={!isEmployeeActive()}
                                        slotProps={{ 
                                            textField: { 
                                                fullWidth: true,
                                                sx: {
                                                    '& .MuiInputBase-input': {
                                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                                        py: { xs: 1.5, sm: 2 }
                                                    }
                                                }
                                            }
                                        }}
                                        minDate={formData.fromDate}
                                    />
                                </Box>

                            {/* Calculated Days Display */}
                            {calculatedDays > 0 && (
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 2, 
                                    p: { xs: 1.5, sm: 2 }, 
                                    bgcolor: 'grey.50', 
                                    borderRadius: 2,
                                    border: hasInsufficientBalance ? '1px solid' : 'none',
                                    borderColor: hasInsufficientBalance ? 'error.main' : 'transparent'
                                }}>
                                    <InfoIcon color={hasInsufficientBalance ? "error" : "info"} sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                            Total Days: {calculatedDays}
                                        </Typography>
                                        {selectedLeaveBalance && (
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                                Available Balance: {selectedLeaveBalance.remaining} days
                                            </Typography>
                                        )}
                                    </Box>
                                    {hasInsufficientBalance && (
                                        <Chip label="Insufficient Balance" color="error" size="small" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }} />
                                    )}
                                </Box>
                            )}

                            {/* Reason */}
                            <TextField
                                fullWidth
                                label="Reason for Leave"
                                multiline
                                rows={{ xs: 3, sm: 4 }}
                                value={formData.reason}
                                onChange={(e) => handleInputChange('reason', e.target.value)}
                                disabled={!isEmployeeActive()}
                                placeholder="Please provide a detailed reason for your leave request..."
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontSize: { xs: '0.875rem', sm: '1rem' }
                                    },
                                    '& .MuiInputLabel-root': {
                                        fontSize: { xs: '0.875rem', sm: '1rem' }
                                    }
                                }}
                            />

                            {/* File Attachment */}
                            <Box>
                                <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                    Supporting Document (Optional)
                                </Typography>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<UploadIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                                    disabled={!isEmployeeActive()}
                                    sx={{ 
                                        mb: 1,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        py: { xs: 1, sm: 1.5 },
                                        px: { xs: 2, sm: 3 },
                                        width: { xs: '100%', sm: 'auto' }
                                    }}
                                >
                                    Upload File
                                    <input
                                        type="file"
                                        hidden
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={handleFileUpload}
                                        disabled={!isEmployeeActive()}
                                    />
                                </Button>
                                {formData.attachment && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                        Selected: {formData.attachment.name}
                                    </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                    Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB)
                                </Typography>
                            </Box>

                            <Divider sx={{ my: { xs: 1, sm: 2 } }} />

                                {/* Submit Button */}
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: { xs: 'column-reverse', sm: 'row' }, 
                                    justifyContent: 'flex-end', 
                                    gap: { xs: 1.5, sm: 2 },
                                    pt: { xs: 1, sm: 0 }
                                }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            setFormData({
                                                leaveType: '',
                                                fromDate: dayjs(),
                                                toDate: dayjs(),
                                                reason: '',
                                                attachment: null
                                            });
                                            setCalculatedDays(0);
                                        }}
                                        fullWidth
                                        sx={{ 
                                            maxWidth: { sm: 'auto' },
                                            minWidth: { sm: 100 },
                                            py: { xs: 1.5, sm: 1 },
                                            fontSize: { xs: '0.875rem', sm: '0.875rem' }
                                        }}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                                        onClick={handleSubmit}
                                        disabled={!isEmployeeActive() || !isFormValid() || hasInsufficientBalance || submitting}
                                        fullWidth
                                        sx={{ 
                                            maxWidth: { sm: 'auto' }, 
                                            minWidth: { sm: 180 },
                                            py: { xs: 1.5, sm: 1 },
                                            fontSize: { xs: '0.875rem', sm: '0.875rem' },
                                            fontWeight: 600
                                        }}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Application'}
                                    </Button>
                                </Box>
                            </Box>
                        </LocalizationProvider>
                    </Paper>
                </Box>
            </Box>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Confirm Leave Application</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Please review your leave application details:
                    </Typography>
                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
                        <Typography variant="body2"><strong>Leave Type:</strong> {leaveTypes.find(lt => lt.leave_type_id === formData.leaveType)?.leave_name}</Typography>
                        <Typography variant="body2"><strong>Duration:</strong> {formData.fromDate.format('YYYY-MM-DD')} to {formData.toDate.format('YYYY-MM-DD')} ({calculatedDays} days)</Typography>
                        <Typography variant="body2"><strong>Reason:</strong> {formData.reason}</Typography>
                        {formData.attachment && (
                            <Typography variant="body2"><strong>Attachment:</strong> {formData.attachment.name}</Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={confirmSubmit}
                        disabled={!isEmployeeActive()}
                    >
                        Confirm & Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ApplyLeave;