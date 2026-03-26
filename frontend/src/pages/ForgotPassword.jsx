import { useState } from 'react';
import {
    Box,
    Card,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { Business as BusinessIcon, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const response = await apiService.post('/auth/forgot-password', {
                email: email.toLowerCase().trim()
            });

            if (response.success) {
                setSuccess('Reset code sent to your email!');
                setTimeout(() => {
                    navigate('/verify-reset-code', { state: { email: email.toLowerCase().trim() } });
                }, 1500);
            }
        } catch (err) {
            setError(err.message || 'No account exists with this email address');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box
            sx={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                backgroundImage: 'url(/login-background.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    zIndex: 1,
                },
            }}
        >
            <Card
                elevation={0}
                sx={{
                    position: 'relative',
                    zIndex: 2,
                    width: isMobile ? '92%' : isTablet ? '400px' : '420px',
                    maxWidth: '420px',
                    borderRadius: 3,
                    background: '#ffffff',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    p: isMobile ? 3.5 : isTablet ? 4 : 4.5,
                    mx: 2,
                }}
            >
                {/* Back Button */}
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/login')}
                    sx={{
                        mb: 2,
                        textTransform: 'none',
                        color: 'text.secondary',
                        fontSize: isMobile ? '0.813rem' : '0.875rem',
                    }}
                >
                    Back to Login
                </Button>

                {/* Logo and Title */}
                <Box sx={{ textAlign: 'center', mb: isMobile ? 3 : 3.5 }}>
                    <BusinessIcon
                        sx={{
                            fontSize: isMobile ? 44 : isTablet ? 50 : 54,
                            color: 'primary.main',
                            mb: 1.5,
                        }}
                    />
                    <Typography
                        variant={isMobile ? 'h5' : 'h4'}
                        component="h1"
                        sx={{
                            fontWeight: 700,
                            color: '#1a1a1a',
                            mb: 0.5,
                            fontSize: isMobile ? '1.5rem' : isTablet ? '1.75rem' : '2rem',
                        }}
                    >
                        Forgot Password
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 400,
                            fontSize: isMobile ? '0.875rem' : '0.938rem',
                            color: '#666',
                            mt: 1,
                        }}
                    >
                        Enter your email address and we'll send you a code to reset your password
                    </Typography>
                </Box>

                {/* Messages */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2.5, borderRadius: 1.5 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2.5, borderRadius: 1.5 }}>
                        {success}
                    </Alert>
                )}

                {/* Form */}
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 2 : 2.5 }}
                >
                    <TextField
                        label="Email Address"
                        type="email"
                        fullWidth
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        autoFocus
                        disabled={isLoading}
                        variant="outlined"
                        size={isMobile ? 'small' : 'medium'}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                                backgroundColor: '#f8f9fa',
                            },
                        }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        size={isMobile ? 'medium' : 'large'}
                        fullWidth
                        disabled={isLoading}
                        sx={{
                            mt: isMobile ? 0.5 : 1,
                            py: isMobile ? 1.1 : isTablet ? 1.3 : 1.4,
                            fontSize: isMobile ? '0.938rem' : '1rem',
                            fontWeight: 600,
                            borderRadius: 1.5,
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                            },
                        }}
                    >
                        {isLoading ? (
                            <CircularProgress size={isMobile ? 20 : 22} color="inherit" />
                        ) : (
                            'Send Reset Code'
                        )}
                    </Button>
                </Box>
            </Card>
        </Box>
    );
};

export default ForgotPassword;
