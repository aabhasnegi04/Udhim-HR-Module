import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box,
    Typography,
    Alert,
    CircularProgress
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import attendanceService from '../services/attendanceService';

const EditAttendanceDialog = ({ open, onClose, attendanceRecord, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        status: '',
        checkIn: null,
        checkOut: null
    });

    // Status options
    const statusOptions = [
        { value: 'PRESENT', label: 'Present' },
        { value: 'ABSENT', label: 'Absent' },
        { value: 'LATE', label: 'Late' },
        { value: 'HALF DAY', label: 'Half Day' },
        { value: 'WORK FROM HOME', label: 'Work From Home' },
        { value: 'HOLIDAY', label: 'Holiday' }
    ];

    // Initialize form data when dialog opens
    useEffect(() => {
        if (open && attendanceRecord) {
            // Parse the attendance date properly
            let attendanceDate = attendanceRecord.date || attendanceRecord.attendance_date || '2000-01-01';
            
            // Convert various date formats to YYYY-MM-DD
            try {
                const parsedDate = new Date(attendanceDate);
                if (!isNaN(parsedDate.getTime())) {
                    const year = parsedDate.getFullYear();
                    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(parsedDate.getDate()).padStart(2, '0');
                    attendanceDate = `${year}-${month}-${day}`;
                }
            } catch (e) {
                console.error('Date parsing error:', e);
                attendanceDate = '2000-01-01';
            }
            
            setFormData({
                status: attendanceRecord.status || '',
                checkIn: attendanceRecord.checkIn && attendanceRecord.checkIn !== '-' 
                    ? dayjs(`${attendanceDate} ${attendanceRecord.checkIn}`) 
                    : null,
                checkOut: attendanceRecord.checkOut && attendanceRecord.checkOut !== '-' 
                    ? dayjs(`${attendanceDate} ${attendanceRecord.checkOut}`) 
                    : null
            });
            setError('');
        }
    }, [open, attendanceRecord]);

    const handleSave = async () => {
        try {
            setLoading(true);
            setError('');

            // Validate required fields
            if (!formData.status) {
                setError('Status is required');
                return;
            }

            // Prepare data for API
            const updateData = {
                employee_id: attendanceRecord.employeeNumericId || attendanceRecord.employeeId,
                attendance_date: attendanceRecord.date || attendanceRecord.attendance_date || attendanceRecord.attendanceDate,
                status: formData.status,
                check_in_time: formData.checkIn ? formData.checkIn.format('HH:mm:ss') : null,
                check_out_time: formData.checkOut ? formData.checkOut.format('HH:mm:ss') : null
            };

            // Ensure date is in correct format and not empty
            if (!updateData.attendance_date) {
                // Fallback to today's date if no date is available
                const today = new Date().toISOString().split('T')[0];
                updateData.attendance_date = today;
            }

            // Convert date to YYYY-MM-DD format
            if (updateData.attendance_date) {
                try {
                    // Parse the date regardless of format and convert to YYYY-MM-DD
                    const parsedDate = new Date(updateData.attendance_date);
                    if (!isNaN(parsedDate.getTime())) {
                        // Format as YYYY-MM-DD
                        const year = parsedDate.getFullYear();
                        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                        const day = String(parsedDate.getDate()).padStart(2, '0');
                        updateData.attendance_date = `${year}-${month}-${day}`;
                    } else {
                        throw new Error('Invalid date');
                    }
                } catch (error) {
                    console.error('Date parsing error:', error);
                    // Fallback to today's date
                    const today = new Date().toISOString().split('T')[0];
                    updateData.attendance_date = today;
                }
            }

            // Call API to update attendance (attendance_id is not actually used by backend)
            const result = await attendanceService.editAttendanceRecord(
                1, // Dummy ID since backend uses employee_id + date to identify record
                updateData
            );

            if (result.success) {
                onSave();
                onClose();
            } else {
                setError(result.message || result.error || 'Failed to update attendance record');
            }
        } catch (err) {
            // Extract user-friendly error message from the error object
            let errorMessage = err.message || err.error || 'Failed to update attendance record';
            
            // Clean up technical ODBC error details
            // The error format is: Database error: ('42000', '[42000] [Microsoft][ODBC Driver 18 for SQL Server][SQL Server]Cannot modify attendance...')
            
            // Try multiple patterns to extract the clean message
            if (errorMessage.includes('SQL Server]')) {
                // Split by 'SQL Server]' and get everything after it
                const parts = errorMessage.split('SQL Server]');
                if (parts.length > 1) {
                    // Get the message part and remove trailing parentheses and error codes
                    let cleanMessage = parts[parts.length - 1];
                    // Remove error codes like (50000) and (SQLExecDirectW)
                    cleanMessage = cleanMessage.replace(/\s*\(\d+\)\s*/g, '').replace(/\s*\(SQL\w+\)\s*/g, '');
                    // Remove leading/trailing quotes and whitespace
                    cleanMessage = cleanMessage.replace(/^['"\s]+|['"\s)]+$/g, '').trim();
                    if (cleanMessage) {
                        errorMessage = cleanMessage;
                    }
                }
            }
            
            setError(errorMessage);
            console.error('Edit attendance error:', err);
            console.error('Edit attendance error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Edit Attendance Record
            </DialogTitle>
            <DialogContent>
                {attendanceRecord && (
                    <Box sx={{ mt: 2 }}>
                        {/* Employee Info */}
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Employee: {attendanceRecord.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                ID: {attendanceRecord.employeeId} • Date: {attendanceRecord.date}
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Form Fields */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Status */}
                            <TextField
                                select
                                fullWidth
                                label="Status"
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                required
                            >
                                {statusOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>

                            {/* Time Fields - Only show for relevant statuses */}
                            {formData.status && !['ABSENT', 'HOLIDAY'].includes(formData.status) && (
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TimePicker
                                            label="Check In Time"
                                            value={formData.checkIn}
                                            onChange={(newValue) => setFormData(prev => ({ ...prev, checkIn: newValue }))}
                                            slotProps={{ 
                                                textField: { 
                                                    fullWidth: true,
                                                    size: 'medium'
                                                } 
                                            }}
                                        />
                                        <TimePicker
                                            label="Check Out Time"
                                            value={formData.checkOut}
                                            onChange={(newValue) => setFormData(prev => ({ ...prev, checkOut: newValue }))}
                                            slotProps={{ 
                                                textField: { 
                                                    fullWidth: true,
                                                    size: 'medium'
                                                } 
                                            }}
                                        />
                                    </Box>
                                </LocalizationProvider>
                            )}

                            {/* Working Hours Display */}
                            {formData.checkIn && formData.checkOut && (
                                <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                                    <Typography variant="body2" color="info.dark">
                                        Working Hours: {
                                            (() => {
                                                // Extract hours and minutes from both times
                                                const checkInHour = formData.checkIn.hour();
                                                const checkInMinute = formData.checkIn.minute();
                                                const checkOutHour = formData.checkOut.hour();
                                                const checkOutMinute = formData.checkOut.minute();
                                                
                                                // Convert to total minutes
                                                const checkInTotalMinutes = (checkInHour * 60) + checkInMinute;
                                                const checkOutTotalMinutes = (checkOutHour * 60) + checkOutMinute;
                                                
                                                // Calculate difference
                                                let diffMinutes = checkOutTotalMinutes - checkInTotalMinutes;
                                                
                                                // Handle negative diff (checkout before checkin means next day)
                                                if (diffMinutes < 0) {
                                                    diffMinutes = diffMinutes + (24 * 60); // Add 24 hours in minutes
                                                }
                                                
                                                const hours = Math.floor(diffMinutes / 60);
                                                const minutes = diffMinutes % 60;
                                                return `${hours}h ${minutes}m`;
                                            })()
                                        }
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button 
                    variant="contained" 
                    onClick={handleSave}
                    disabled={loading || !formData.status}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditAttendanceDialog;