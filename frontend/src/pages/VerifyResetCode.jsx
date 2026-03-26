import { useState, useEffect } from 'react';
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
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/api';

const VerifyResetCode = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const response = await apiService.post('/auth/verify-reset-code', {
                email,
                code: code.trim()
            });

            if (response.success) {
                setSuccess('Code verified!');
                setTimeout(() => {
                    navigate('/reset-password', { state: { email, code: code.trim() } });
                }, 1000);
            }
        } catch (err) {
            setError(err.message || 'Invalid or expired reset code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const response = await apiService.post('/auth/forgot-password', {
                email
            });

            if (response.success) {
                setSuccess('New code sent to your email!');
            }
        } catch (err) {
            setError(err.message || 'Failed to resend code');
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
                    onClick={() => navigate('/forgot-password')}
                    sx={{
                        mb: 2,
                        textTransform: 'none',
                        color: 'text.secondary',
                        fontSize: isMobile ? '0.813rem' : '0.875rem',
                    }}
                >
                    Back
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
                        Verify Code
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
                        Enter the 6-digit code sent to
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            fontSize: isMobile ? '0.875rem' : '0.938rem',
                            color: 'primary.main',
                        }}
                    >
                        {email}
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
                        label="6-Digit Code"
                        type="text"
                        fullWidth
                        required
                        value={code}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setCode(value);
                        }}
                        autoFocus
                        disabled={isLoading}
                        variant="outlined"
                        size={isMobile ? 'small' : 'medium'}
                        inputProps={{
                            maxLength: 6,
                            pattern: '[0-9]{6}',
                            style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' },
                        }}
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
                        disabled={isLoading || code.length !== 6}
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
                            'Verify Code'
                        )}
                    </Button>

                    {/* Resend Code */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                            Didn't receive the code?
                        </Typography>
                        <Button
                            onClick={handleResendCode}
                            disabled={isLoading}
                            sx={{
                                fontSize: isMobile ? '0.813rem' : '0.875rem',
                                textTransform: 'none',
                                color: 'primary.main',
                                '&:hover': {
                                    backgroundColor: 'transparent',
                                    textDecoration: 'underline',
                                },
                            }}
                        >
                            Resend Code
                        </Button>
                    </Box>
                </Box>
            </Card>
        </Box>
    );
};

export default VerifyResetCode;
