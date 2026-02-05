import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    MenuItem,
    Alert,
    Container,
    CircularProgress,
    IconButton,
    InputAdornment,
    useTheme,
    useMediaQuery,
    Fade,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Business as BusinessIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PasswordChangeDialog from '../components/PasswordChangeDialog';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('HR');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [pendingUser, setPendingUser] = useState(null);
    const { login, setUserAfterPasswordChange } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(email, password, role);
            if (result.success) {
                if (result.requires_password_change) {
                    setPendingUser(result.user);
                    setShowPasswordChange(true);
                    // Note: JWT token is already set in authService, so password change API will work
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
        // Set the user in AuthContext after password change is complete
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 2,
            }}
        >
            <Container maxWidth="sm">
                <Fade in={true} timeout={800}>
                    <Card
                        elevation={24}
                        sx={{
                            borderRadius: 3,
                            background: 'rgba(255, 255, 255, 0.98)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 32px 64px rgba(0, 0, 0, 0.15)',
                            maxWidth: 400,
                            mx: 'auto',
                        }}
                    >
                        <CardContent sx={{ p: 4 }}>
                            {/* Header */}
                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <BusinessIcon
                                    sx={{
                                        fontSize: 56,
                                        color: 'primary.main',
                                        mb: 2,
                                    }}
                                />
                                <Typography
                                    variant="h4"
                                    component="h1"
                                    sx={{ 
                                        fontWeight: 700, 
                                        color: 'text.primary',
                                        mb: 0.5,
                                    }}
                                >
                                    UDHM HRMS
                                </Typography>
                                <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ fontWeight: 400 }}
                                >
                                    Sign in to your account
                                </Typography>
                            </Box>

                            {error && (
                                <Alert 
                                    severity="error" 
                                    sx={{ 
                                        mb: 3,
                                        borderRadius: 2,
                                    }}
                                >
                                    {error}
                                </Alert>
                            )}

                            <Box
                                component="form"
                                onSubmit={handleSubmit}
                                sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
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
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
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
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={handleTogglePassword}
                                                    edge="end"
                                                    disabled={isLoading}
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                        },
                                    }}
                                />

                                <TextField
                                    select
                                    label="Role"
                                    fullWidth
                                    required
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    disabled={isLoading}
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                        },
                                    }}
                                >
                                    <MenuItem value="HR">HR Administrator</MenuItem>
                                    <MenuItem value="MANAGER">Manager</MenuItem>
                                    <MenuItem value="EMPLOYEE">Employee</MenuItem>
                                </TextField>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disabled={isLoading}
                                    sx={{
                                        mt: 1,
                                        py: 1.5,
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                                            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                                            transform: 'translateY(-1px)',
                                        },
                                        '&:disabled': {
                                            background: 'rgba(0, 0, 0, 0.12)',
                                            boxShadow: 'none',
                                        },
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    {isLoading ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        'Sign In'
                                    )}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Fade>
            </Container>

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
