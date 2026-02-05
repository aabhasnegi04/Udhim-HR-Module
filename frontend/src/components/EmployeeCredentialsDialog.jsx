import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    Paper,
    IconButton,
    Divider,
} from '@mui/material';
import {
    ContentCopy as CopyIcon,
    CheckCircle as CheckIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { useState } from 'react';

const EmployeeCredentialsDialog = ({ open, onClose, employeeData }) => {
    const [copied, setCopied] = useState({
        username: false,
        password: false,
        all: false,
    });

    const handleCopy = async (text, type) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(prev => ({ ...prev, [type]: true }));
            setTimeout(() => {
                setCopied(prev => ({ ...prev, [type]: false }));
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleCopyAll = async () => {
        const credentialsText = `Employee Login Credentials:
Username: ${employeeData?.credentials_info?.username}
Password: ${employeeData?.credentials_info?.password}

Please change your password after first login.`;

        try {
            await navigator.clipboard.writeText(credentialsText);
            setCopied(prev => ({ ...prev, all: true }));
            setTimeout(() => {
                setCopied(prev => ({ ...prev, all: false }));
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    if (!employeeData) return null;

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm" 
            fullWidth
        >
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <PersonIcon color="success" />
                    <Typography variant="h6">
                        Employee Account Created
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Alert severity="success" sx={{ mb: 3 }}>
                    Employee has been successfully created with a user account!
                </Alert>

                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        <strong>Important:</strong> Please share these login credentials with the employee. 
                        They will be required to change their password on first login.
                    </Typography>
                </Alert>

                <Paper sx={{ p: 3, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                        Login Credentials
                    </Typography>
                    
                    <Divider sx={{ mb: 2 }} />

                    {/* Username */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Username (Email):
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    fontFamily: 'monospace', 
                                    bgcolor: 'white', 
                                    p: 1, 
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'grey.300',
                                    flex: 1
                                }}
                            >
                                {employeeData.credentials_info?.username}
                            </Typography>
                            <IconButton 
                                size="small" 
                                onClick={() => handleCopy(employeeData.credentials_info?.username, 'username')}
                                color={copied.username ? 'success' : 'default'}
                            >
                                {copied.username ? <CheckIcon /> : <CopyIcon />}
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Password */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Temporary Password:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    fontFamily: 'monospace', 
                                    bgcolor: 'white', 
                                    p: 1, 
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'grey.300',
                                    flex: 1,
                                    fontWeight: 600,
                                    color: 'error.main'
                                }}
                            >
                                {employeeData.credentials_info?.password}
                            </Typography>
                            <IconButton 
                                size="small" 
                                onClick={() => handleCopy(employeeData.credentials_info?.password, 'password')}
                                color={copied.password ? 'success' : 'default'}
                            >
                                {copied.password ? <CheckIcon /> : <CopyIcon />}
                            </IconButton>
                        </Box>
                    </Box>

                    <Alert severity="warning" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            The employee must change this password on their first login for security.
                        </Typography>
                    </Alert>
                </Paper>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Button
                        variant="outlined"
                        startIcon={copied.all ? <CheckIcon /> : <CopyIcon />}
                        onClick={handleCopyAll}
                        color={copied.all ? 'success' : 'primary'}
                    >
                        {copied.all ? 'Copied!' : 'Copy All Credentials'}
                    </Button>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button 
                    onClick={onClose} 
                    variant="contained"
                    sx={{ minWidth: 120 }}
                >
                    Done
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EmployeeCredentialsDialog;