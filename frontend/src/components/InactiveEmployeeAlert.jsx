import { Alert, AlertTitle, Typography } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const InactiveEmployeeAlert = () => {
    const { user, isEmployeeActive } = useAuth();

    // Don't show for HR users or if employee is active
    if (!user || user.role === 'HR' || isEmployeeActive()) {
        return null;
    }

    return (
        <Alert 
            severity="warning" 
            icon={<WarningIcon />}
            sx={{ 
                mb: 3,
                '& .MuiAlert-message': {
                    width: '100%'
                }
            }}
        >
            <AlertTitle sx={{ fontWeight: 600 }}>
                Account Inactive
            </AlertTitle>
            <Typography variant="body2">
                Your employee account is inactive. Please contact HR for assistance.
            </Typography>
        </Alert>
    );
};

export default InactiveEmployeeAlert;