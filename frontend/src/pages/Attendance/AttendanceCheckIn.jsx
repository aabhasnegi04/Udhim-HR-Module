import { useState, useRef, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Chip,
    Stack,
} from '@mui/material';
import {
    CameraAlt as CameraIcon,
    CheckCircle as CheckInIcon,
    ExitToApp as CheckOutIcon,
    Refresh as RefreshIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import attendanceService from '../../services/attendanceService';

const AttendanceCheckIn = ({ type = 'checkin' }) => {
    const { user, isEmployeeActive } = useAuth();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturing, setCapturing] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [cameraActive, setCameraActive] = useState(false);
    const [todayStatus, setTodayStatus] = useState(null);

    const isCheckIn = type === 'checkin';
    const employeeIsActive = isEmployeeActive();

    useEffect(() => {
        // Load today's attendance status
        loadTodayStatus();
        
        return () => {
            // Cleanup camera on unmount
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Auto-dismiss success message after 5 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess('');
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [success]);

    // Auto-dismiss error message after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [error]);

    const loadTodayStatus = async () => {
        try {
            // Get employee_id from user context
            const employeeId = user?.employee_id;
            if (!employeeId) {
                console.error('No employee_id found in user context');
                return;
            }

            const result = await attendanceService.getTodayAttendanceStatus(employeeId);
            if (result.success) {
                setTodayStatus({
                    hasCheckedIn: result.data.has_checked_in,
                    hasCheckedOut: result.data.has_checked_out,
                    checkInTime: result.data.check_in_time,
                    checkOutTime: result.data.check_out_time,
                });
            }
        } catch (err) {
            console.error('Failed to load today status:', err);
        }
    };

    const startCamera = async () => {
        try {
            setError('');
            console.log('Requesting camera access...');
            
            // Set camera active first so video element renders
            setCameraActive(true);
            
            // Wait a bit for the video element to render
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check if mobile device
            const isMobile = window.innerWidth < 768;
            
            // Different constraints for mobile vs desktop
            const constraints = isMobile ? {
                video: {
                    facingMode: 'user',
                    width: { ideal: 720, max: 1080 },
                    height: { ideal: 1280, max: 1920 },
                }
            } : {
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                }
            };
            
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            console.log('Camera access granted, stream:', mediaStream);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setStream(mediaStream);
                
                // Ensure video plays
                videoRef.current.onloadedmetadata = () => {
                    console.log('Video metadata loaded');
                    videoRef.current.play().then(() => {
                        console.log('Video playing');
                    }).catch(err => {
                        console.error('Video play error:', err);
                    });
                };
            } else {
                console.error('Video ref is still null after waiting');
                setError('Failed to initialize camera. Please try again.');
                setCameraActive(false);
            }
        } catch (err) {
            console.error('Camera access error:', err);
            setError(`Unable to access camera: ${err.message}`);
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setCameraActive(false);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64 image
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        setCapturing(true);
        stopCamera();
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setCapturing(false);
        setSuccess('');
        setError('');
        startCamera();
    };

    const submitAttendance = async () => {
        if (!capturedImage) {
            setError('Please capture a photo first');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Call backend API for face recognition attendance
            const result = await attendanceService.markFaceAttendance(
                capturedImage,
                isCheckIn ? 'checkin' : 'checkout'
            );

            if (result.success) {
                setSuccess(result.message || (
                    isCheckIn 
                        ? 'Check-in successful! Have a great day!' 
                        : 'Check-out successful! See you tomorrow!'
                ));
                
                setCapturedImage(null);
                setCapturing(false);
                
                // Reload status
                await loadTodayStatus();
            } else {
                setError(result.error || 'Failed to mark attendance. Please try again.');
            }
        } catch (err) {
            console.error('Submit attendance error:', err);
            setError('Failed to mark attendance. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentTime = () => {
        return new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const getCurrentDate = () => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Box sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
        }}>
            {/* Inactive Employee Alert */}
            {!employeeIsActive && (
                <Alert 
                    severity="error" 
                    icon={<WarningIcon />}
                    sx={{ mb: 2 }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Access Denied - Account Inactive
                    </Typography>
                    <Typography variant="body2">
                        Your employee account is inactive. You cannot mark attendance. Please contact HR for assistance.
                    </Typography>
                </Alert>
            )}

            {/* Header Info */}
            <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Stack spacing={1} alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {isCheckIn ? 'Check In' : 'Check Out'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {getCurrentDate()}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {getCurrentTime()}
                    </Typography>
                </Stack>
            </Paper>

            {/* Status Messages */}
            {error && (
                <Alert severity="error" onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {/* Camera/Photo Section */}
            <Paper 
                sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 2, sm: 3 },
                    bgcolor: 'grey.100',
                    position: 'relative',
                    minHeight: { xs: '50vh', sm: '60vh' },
                    mt: 0,
                }}
            >
                {!cameraActive && !capturedImage && (
                    <Box sx={{ textAlign: 'center' }}>
                        <CameraIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Ready to {isCheckIn ? 'Check In' : 'Check Out'}?
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {employeeIsActive 
                                ? "Click the button below to start your camera"
                                : "Camera access disabled for inactive employees"
                            }
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<CameraIcon />}
                            onClick={startCamera}
                            disabled={!employeeIsActive}
                            sx={{ px: 4, py: 1.5 }}
                        >
                            Start Camera
                        </Button>
                    </Box>
                )}

                {cameraActive && !capturedImage && (
                    <Box sx={{ 
                        width: '100%',
                        maxWidth: { xs: '100%', sm: 600 },
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}>
                        <Box sx={{
                            width: '100%',
                            aspectRatio: { xs: '3/4', sm: '16/9' },
                            maxHeight: { xs: '65vh', sm: 'none' },
                            position: 'relative',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#000',
                            border: '4px solid #000',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        }}>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '8px',
                                    transform: 'scaleX(-1)', // Mirror effect
                                    objectFit: 'cover',
                                }}
                            />
                            
                            {/* Face Guide Overlay */}
                            <Box sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: { xs: '70%', sm: '35%' },
                                aspectRatio: '3/4',
                                border: '3px solid rgba(255, 255, 255, 0.9)',
                                borderRadius: '50%',
                                pointerEvents: 'none',
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.05)',
                            }} />
                        </Box>
                        <Box sx={{ 
                            mt: 1, 
                            display: 'flex', 
                            gap: 2,
                            justifyContent: 'center',
                            flexDirection: { xs: 'column', sm: 'row' },
                            width: '100%',
                            px: { xs: 2, sm: 0 },
                        }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<CameraIcon />}
                                onClick={capturePhoto}
                                disabled={!employeeIsActive}
                                sx={{ px: 4, py: 1.5 }}
                                fullWidth={{ xs: true, sm: false }}
                            >
                                Capture Photo
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={stopCamera}
                                disabled={!employeeIsActive}
                                fullWidth={{ xs: true, sm: false }}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                )}

                {capturedImage && (
                    <Box sx={{ 
                        width: '100%',
                        maxWidth: { xs: '100%', sm: 600 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}>
                        <Box sx={{
                            width: '100%',
                            aspectRatio: { xs: '3/4', sm: '16/9' },
                            maxHeight: { xs: '65vh', sm: 'none' },
                            position: 'relative',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '4px solid #000',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        }}>
                            <img
                                src={capturedImage}
                                alt="Captured"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '8px',
                                    transform: 'scaleX(-1)', // Mirror effect
                                    objectFit: 'cover',
                                }}
                            />
                        </Box>
                        <Box sx={{ 
                            mt: 1, 
                            display: 'flex', 
                            gap: 2,
                            justifyContent: 'center',
                            flexDirection: { xs: 'column', sm: 'row' },
                            width: '100%',
                            px: { xs: 2, sm: 0 },
                        }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={isCheckIn ? <CheckInIcon /> : <CheckOutIcon />}
                                onClick={submitAttendance}
                                disabled={loading || !employeeIsActive}
                                sx={{ px: 4, py: 1.5 }}
                                fullWidth={{ xs: true, sm: false }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    `Confirm ${isCheckIn ? 'Check In' : 'Check Out'}`
                                )}
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<RefreshIcon />}
                                onClick={retakePhoto}
                                disabled={loading || !employeeIsActive}
                                fullWidth={{ xs: true, sm: false }}
                            >
                                Retake Photo
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* Hidden canvas for image capture */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </Paper>

            {/* Today's Status */}
            {todayStatus && (
                <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                            Today's Status
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ mt: 1, justifyContent: 'center' }}>
                            <Chip
                                icon={<CheckInIcon />}
                                label={todayStatus.hasCheckedIn ? `In: ${todayStatus.checkInTime}` : 'Not Checked In'}
                                color={todayStatus.hasCheckedIn ? 'success' : 'default'}
                                variant={todayStatus.hasCheckedIn ? 'filled' : 'outlined'}
                            />
                            <Chip
                                icon={<CheckOutIcon />}
                                label={todayStatus.hasCheckedOut ? `Out: ${todayStatus.checkOutTime}` : 'Not Checked Out'}
                                color={todayStatus.hasCheckedOut ? 'info' : 'default'}
                                variant={todayStatus.hasCheckedOut ? 'filled' : 'outlined'}
                            />
                        </Stack>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default AttendanceCheckIn;
