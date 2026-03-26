import { useState } from 'react';
import AppDatePicker from '../common/AppDatePicker';
import {
    Box,
    Typography,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Button,
    Alert,
    Divider
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Send as SendIcon,
    Info as InfoIcon
} from '@mui/icons-material';

const leaveTypes = [
    { value: 'casualLeave', label: 'Casual Leave', icon: '🏖️' },
    { value: 'sickLeave', label: 'Sick Leave', icon: '🏥' },
    { value: 'earnedLeave', label: 'Earned Leave', icon: '✈️' },
    { value: 'maternityLeave', label: 'Maternity Leave', icon: '👶' }
];

const LeaveForm = ({ 
    onSubmit, 
    initialData = {}, 
    leaveBalances = {},
    isEditing = false 
}) => {
    const [formData, setFormData] = useState({
        leaveType: '',
        fromDate: '',
        toDate: '',
        reason: '',
        attachment: null,
        ...initialData
    });
    const [calculatedDays, setCalculatedDays] = useState(0);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Calculate days when dates change
        if (field === 'fromDate' || field === 'toDate') {
            const updatedData = { ...formData, [field]: value };
            if (updatedData.fromDate && updatedData.toDate) {
                const from = new Date(updatedData.fromDate);
                const to = new Date(updatedData.toDate);
                const diffTime = Math.abs(to - from);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setCalculatedDays(diffDays);
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
        if (onSubmit) {
            onSubmit({ ...formData, calculatedDays });
        }
    };

    const isFormValid = () => {
        return formData.leaveType && formData.fromDate && formData.toDate && formData.reason.trim();
    };

    const selectedLeaveBalance = formData.leaveType ? leaveBalances[formData.leaveType] : null;
    const hasInsufficientBalance = selectedLeaveBalance && calculatedDays > selectedLeaveBalance.remaining;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Leave Type Selection */}
            <FormControl fullWidth>
                <InputLabel>Leave Type</InputLabel>
                <Select
                    value={formData.leaveType}
                    label="Leave Type"
                    onChange={(e) => handleInputChange('leaveType', e.target.value)}
                >
                    {leaveTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography>{type.icon}</Typography>
                                <Typography>{type.label}</Typography>
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Date Selection */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <AppDatePicker
                    label="From Date"
                    value={formData.fromDate}
                    onChange={(v) => handleInputChange('fromDate', v)}
                />
                <AppDatePicker
                    label="To Date"
                    value={formData.toDate}
                    onChange={(v) => handleInputChange('toDate', v)}
                />
            </Box>

            {/* Calculated Days Display */}
            {calculatedDays > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <InfoIcon color="info" />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                            Total Days: {calculatedDays}
                        </Typography>
                        {selectedLeaveBalance && (
                            <Typography variant="caption" color="text.secondary">
                                Available Balance: {selectedLeaveBalance.remaining} days
                            </Typography>
                        )}
                    </Box>
                    {hasInsufficientBalance && (
                        <Alert severity="error" sx={{ py: 0 }}>
                            Insufficient Balance
                        </Alert>
                    )}
                </Box>
            )}

            {/* Reason */}
            <TextField
                fullWidth
                label="Reason for Leave"
                multiline
                rows={4}
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                placeholder="Please provide a detailed reason for your leave request..."
            />

            {/* File Attachment */}
            <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Supporting Document (Optional)
                </Typography>
                <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    sx={{ mb: 1 }}
                >
                    Upload File
                    <input
                        type="file"
                        hidden
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                    />
                </Button>
                {formData.attachment && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Selected: {formData.attachment.name}
                    </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB)
                </Typography>
            </Box>

            <Divider />

            {/* Submit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                    variant="outlined"
                    onClick={() => {
                        setFormData({
                            leaveType: '',
                            fromDate: '',
                            toDate: '',
                            reason: '',
                            attachment: null
                        });
                        setCalculatedDays(0);
                    }}
                >
                    Reset
                </Button>
                <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleSubmit}
                    disabled={!isFormValid() || hasInsufficientBalance}
                    sx={{ minWidth: 150 }}
                >
                    {isEditing ? 'Update Application' : 'Submit Application'}
                </Button>
            </Box>
        </Box>
    );
};

export default LeaveForm;