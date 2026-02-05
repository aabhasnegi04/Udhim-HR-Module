import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    LinearProgress,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const SessionTimeoutWarning = ({ open, remainingSeconds, onExtend, onLogout }) => {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (open && remainingSeconds > 0) {
            const progressValue = (remainingSeconds / 60) * 100; // 60 seconds warning
            setProgress(progressValue);
        }
    }, [open, remainingSeconds]);

    return (
        <Dialog
            open={open}
            onClose={onExtend}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" />
                Session Timeout Warning
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" gutterBottom>
                        Your session is about to expire due to inactivity.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        You will be automatically logged out in <strong>{remainingSeconds}</strong> seconds.
                    </Typography>
                </Box>
                <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    color="warning"
                    sx={{ height: 8, borderRadius: 1 }}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onLogout} color="error" variant="outlined">
                    Logout Now
                </Button>
                <Button onClick={onExtend} color="primary" variant="contained" autoFocus>
                    Stay Logged In
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SessionTimeoutWarning;
