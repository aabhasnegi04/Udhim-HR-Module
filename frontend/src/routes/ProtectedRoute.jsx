import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Paper, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

const ProtectedRoute = ({ children, requiredPage }) => {
    const { user, loading, hasPermission } = useAuth();

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredPage && !hasPermission(requiredPage)) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    bgcolor: 'background.default',
                }}
            >
                <Paper
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        maxWidth: 400,
                    }}
                >
                    <LockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        Access Denied
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        You don't have permission to access this page.
                    </Typography>
                    <Button variant="contained" href="/dashboard">
                        Go to Dashboard
                    </Button>
                </Paper>
            </Box>
        );
    }

    return children;
};

export default ProtectedRoute;
