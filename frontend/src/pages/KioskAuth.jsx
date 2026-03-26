import { useState, useRef, useEffect } from 'react';
import {
    Box,
    Card,
    Typography,
    TextField,
    Button,
    Alert,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { LockOutlined as LockIcon, LoginOutlined as LoginIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Kiosk from './Kiosk';
import { verifyKioskPin } from '../services/attendanceService';

const KioskAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const pinInputRefs = useRef([]);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    // Kiosk ID - you can make this configurable if you have multiple kiosks
    const KIOSK_ID = 1;
    const navigate = useNavigate();

    // Check if already authenticated in this session
    useEffect(() => {
        const isAuth = sessionStorage.getItem('kioskAuthenticated') === 'true';
        if (isAuth) {
            setIsAuthenticated(true);
        }
    }, []);

    const handlePinChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newPinArray = [...pin];
        newPinArray[index] = value;
        setPin(newPinArray);
        setError('');

        // Auto-focus next input
        if (value && index < 3) {
            pinInputRefs.current[index + 1]?.focus();
        }
    };

    const handlePinKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            pinInputRefs.current[index - 1]?.focus();
        }
        // Handle Enter on last digit
        if (e.key === 'Enter' && index === 3 && pin.every(d => d)) {
            handleVerifyPin();
        }
    };

    const handleVerifyPin = async () => {
        setIsVerifying(true);
        setError('');

        const pinString = pin.join('');

        if (pinString.length !== 4) {
            setError('Please enter 4-digit PIN');
            setIsVerifying(false);
            return;
        }

        try {
            // Verify PIN using the backend API
            const response = await verifyKioskPin(KIOSK_ID, pinString);

            if (response.success) {
                setIsAuthenticated(true);
                // Store authentication in sessionStorage to persist during page refresh
                sessionStorage.setItem('kioskAuthenticated', 'true');
            } else {
                setError(response.message || 'Invalid PIN. Please try again.');
                setPin(['', '', '', '']);
                pinInputRefs.current[0]?.focus();
            }
        } catch (error) {
            console.error('PIN verification error:', error);
            setError('Failed to verify PIN. Please try again.');
            setPin(['', '', '', '']);
            pinInputRefs.current[0]?.focus();
        } finally {
            setIsVerifying(false);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        
        // Only allow 4 digits
        if (/^\d{4}$/.test(pastedData)) {
            const digits = pastedData.split('');
            setPin(digits);
            setError('');
            // Focus last input
            pinInputRefs.current[3]?.focus();
        }
    };

    // If authenticated, show the actual Kiosk component
    if (isAuthenticated) {
        return <Kiosk />;
    }

    // Otherwise, show PIN entry screen
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
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    zIndex: 1,
                },
            }}
        >
            {/* Back to Login button - top right */}
            <Button
                onClick={() => navigate('/login')}
                startIcon={<LoginIcon sx={{ fontSize: isMobile ? '1rem' : '1.125rem' }} />}
                sx={{
                    position: 'absolute',
                    top: isMobile ? 12 : 20,
                    right: isMobile ? 12 : 24,
                    zIndex: 3,
                    color: '#fff',
                    fontSize: isMobile ? '0.75rem' : '0.813rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    px: isMobile ? 1.5 : 2,
                    py: 0.75,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.25)',
                        border: '1px solid rgba(255,255,255,0.5)',
                    },
                }}
            >
                {isMobile ? 'Login' : 'Employee Login'}
            </Button>

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
                {/* Logo and Title */}
                <Box sx={{ textAlign: 'center', mb: isMobile ? 3 : 3.5 }}>
                    <Box
                        sx={{
                            width: isMobile ? 64 : 72,
                            height: isMobile ? 64 : 72,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                        }}
                    >
                        <LockIcon
                            sx={{
                                fontSize: isMobile ? 32 : 36,
                                color: '#fff',
                            }}
                        />
                    </Box>
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
                        Kiosk Access
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 400,
                            fontSize: isMobile ? '0.875rem' : '0.938rem',
                            color: '#666',
                        }}
                    >
                        Enter PIN to continue
                    </Typography>
                </Box>

                {/* Error Message */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 2.5,
                            borderRadius: 1.5,
                            fontSize: isMobile ? '0.813rem' : '0.875rem',
                            py: isMobile ? 0.5 : 0.75,
                            '& .MuiAlert-icon': {
                                fontSize: isMobile ? '1.25rem' : '1.5rem',
                            },
                        }}
                    >
                        {error}
                    </Alert>
                )}

                {/* PIN Input */}
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#666',
                            display: 'block',
                            mb: 2,
                            textAlign: 'center',
                            fontSize: isMobile ? '0.75rem' : '0.813rem',
                        }}
                    >
                        4-Digit PIN
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: isMobile ? 1.5 : 2,
                            justifyContent: 'center',
                        }}
                        onPaste={handlePaste}
                    >
                        {[0, 1, 2, 3].map((index) => (
                            <TextField
                                key={index}
                                inputRef={(el) => (pinInputRefs.current[index] = el)}
                                type="password"
                                value={pin[index]}
                                onChange={(e) => handlePinChange(index, e.target.value)}
                                onKeyDown={(e) => handlePinKeyDown(index, e)}
                                disabled={isVerifying}
                                inputProps={{
                                    maxLength: 1,
                                    style: {
                                        textAlign: 'center',
                                        fontSize: isMobile ? '1.25rem' : '1.5rem',
                                        fontWeight: 600,
                                        padding: isMobile ? '12px 0' : '14px 0',
                                    },
                                }}
                                autoFocus={index === 0}
                                sx={{
                                    width: isMobile ? 50 : 60,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                        backgroundColor: '#f8f9fa',
                                        '& fieldset': {
                                            borderColor: '#e0e0e0',
                                            borderWidth: '2px',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#bdbdbd',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: theme.palette.primary.main,
                                            borderWidth: '2px',
                                        },
                                    },
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                {/* Verify Button */}
                <Button
                    onClick={handleVerifyPin}
                    variant="contained"
                    size={isMobile ? 'medium' : 'large'}
                    fullWidth
                    disabled={isVerifying || pin.some(d => !d)}
                    sx={{
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
                            transform: 'translateY(-1px)',
                        },
                        '&:active': {
                            transform: 'translateY(0)',
                        },
                        '&:disabled': {
                            background: '#e0e0e0',
                            color: '#9e9e9e',
                            boxShadow: 'none',
                        },
                        transition: 'all 0.2s ease',
                    }}
                >
                    {isVerifying ? 'Verifying...' : 'Access Kiosk'}
                </Button>

                {/* Helper Text */}
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        textAlign: 'center',
                        color: '#999',
                        mt: 2,
                        fontSize: isMobile ? '0.75rem' : '0.813rem',
                    }}
                >
                    Contact administrator if you forgot the PIN
                </Typography>
            </Card>
        </Box>
    );
};

export default KioskAuth;
