import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Alert,
    Box,
    Typography,
    IconButton,
    InputAdornment,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const PasswordChangeDialog = ({ open, onClose, required = false }) => {
    const { changePassword } = useAuth();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
        // Clear messages when user starts typing
        if (error) setError('');
        if (success) setSuccess('');
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validateForm = () => {
        if (!formData.currentPassword) {
            setError('Current password is required');
            return false;
        }
        if (!formData.newPassword) {
            setError('New password is required');
            return false;
        }
        if (formData.newPassword.length < 6) {
            setError('New password must be at least 6 characters long');
            return false;
        }
        if (!formData.confirmPassword) {
            setError('Please confirm your new password');
            return false;
        }
        if (formData.newPassword !== formData.confirmPassword) {
            setError('New password and confirmation do not match');
            return false;
        }
        if (formData.currentPassword === formData.newPassword) {
            setError('New password must be different from current password');
            return false;
        }
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!validateForm()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await changePassword(
                formData.currentPassword,
                formData.newPassword,
                formData.confirmPassword
            );

            if (result.success) {
                setSuccess('Password changed successfully!');
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                
                // Close dialog after a short delay
                setTimeout(() => {
                    onClose();
                    setSuccess('');
                }, 1500);
            } else {
                setError(result.error || 'Failed to change password');
            }
        } catch (error) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!required && !loading) {
            onClose();
            // Reset form
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setError('');
            setSuccess('');
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm" 
            fullWidth
            disableEscapeKeyDown={required}
        >
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <LockIcon color="primary" />
                    <Typography variant="h6">
                        {required ? 'Password Change Required' : 'Change Password'}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                {required && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        You must change your password before continuing. This is required for new accounts.
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                        fullWidth
                        label="Current Password"
                        type={showPasswords.current ? 'text' : 'password'}
                        value={formData.currentPassword}
                        onChange={handleChange('currentPassword')}
                        margin="normal"
                        required
                        disabled={loading}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => togglePasswordVisibility('current')}
                                        edge="end"
                                        disabled={loading}
                                    >
                                        {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        fullWidth
                        label="New Password"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={handleChange('newPassword')}
                        margin="normal"
                        required
                        disabled={loading}
                        helperText="Must be at least 6 characters long"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => togglePasswordVisibility('new')}
                                        edge="end"
                                        disabled={loading}
                                    >
                                        {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Confirm New Password"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange('confirmPassword')}
                        margin="normal"
                        required
                        disabled={loading}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => togglePasswordVisibility('confirm')}
                                        edge="end"
                                        disabled={loading}
                                    >
                                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                {!required && (
                    <Button 
                        onClick={handleClose} 
                        disabled={loading}
                        color="inherit"
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                >
                    {loading ? 'Changing...' : 'Change Password'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PasswordChangeDialog;