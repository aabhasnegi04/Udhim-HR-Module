import { useState } from 'react';
import {
    Box,
    Card,
    TextField,
    Button,
    Typography,
    MenuItem,
    Alert,
    CircularProgress,
    IconButton,
    InputAdornment,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Business as BusinessIcon,
    Videocam as VideocamIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PasswordChangeDialog from '../components/PasswordChangeDialog';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [pendingUser, setPendingUser] = useState(null);
    const { login, setUserAfterPasswordChange } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                if (result.requires_password_change) {
                    setPendingUser(result.user);
                    setShowPasswordChange(true);
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(result.error);
            }
        } catch (error) {
            setError('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChangeComplete = () => {
        setShowPasswordChange(false);
        if (pendingUser) {
            setUserAfterPasswordChange(pendingUser);
        }
        navigate('/dashboard');
    };

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
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
            {/* Kiosk Access Button - top right */}
            <Button
                onClick={() => navigate('/kiosk')}
                startIcon={<VideocamIcon sx={{ fontSize: isMobile ? '1rem' : '1.125rem' }} />}
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
                {isMobile ? 'Kiosk' : 'Attendance Kiosk'}
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
                        UDHM HRMS
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ 
                            fontWeight: 400, 
                            fontSize: isMobile ? '0.875rem' : '0.938rem',
                            color: '#666',
                        }}
                    >
                        Log in
                    </Typography>
                </Box>

                {/* Success/Error Messages */}
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

                {/* Login Form */}
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
                                fontSize: isMobile ? '0.875rem' : '0.938rem',
                                '& fieldset': {
                                    borderColor: '#e0e0e0',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#bdbdbd',
                                },
                                '&.Mui-focused fieldset': {
                                    borderWidth: '1.5px',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                fontSize: isMobile ? '0.875rem' : '0.938rem',
                            },
                        }}
                    />

                    <TextField
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        disabled={isLoading}
                        variant="outlined"
                        size={isMobile ? 'small' : 'medium'}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={handleTogglePassword}
                                        edge="end"
                                        disabled={isLoading}
                                        size={isMobile ? 'small' : 'medium'}
                                        sx={{ 
                                            mr: -0.5,
                                            '& .MuiSvgIcon-root': {
                                                fontSize: isMobile ? '1.25rem' : '1.5rem',
                                            },
                                        }}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                                backgroundColor: '#f8f9fa',
                                fontSize: isMobile ? '0.875rem' : '0.938rem',
                                '& fieldset': {
                                    borderColor: '#e0e0e0',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#bdbdbd',
                                },
                                '&.Mui-focused fieldset': {
                                    borderWidth: '1.5px',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                fontSize: isMobile ? '0.875rem' : '0.938rem',
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
                        {isLoading ? (
                            <CircularProgress size={isMobile ? 20 : 22} color="inherit" />
                        ) : (
                            'Log in'
                        )}
                    </Button>

                    {/* Forgot Password Link */}
                    <Box sx={{ textAlign: 'center', mt: 1 }}>
                        <Button
                            onClick={() => navigate('/forgot-password')}
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
                            Forgot Password?
                        </Button>
                    </Box>
                </Box>
            </Card>

            {/* Password Change Dialog */}
            <PasswordChangeDialog
                open={showPasswordChange}
                onClose={handlePasswordChangeComplete}
                required={true}
            />
        </Box>
    );
};

export default Login;
