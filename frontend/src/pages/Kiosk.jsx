import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import {
  verifyKioskPin,
  markKioskAttendance,
  getKioskTodayLogs,
  getKioskSettings,
  listKiosks,
  updateKiosk,
} from '../services/attendanceService';

const Kiosk = () => {
  // Kiosk state
  const [kioskId] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Camera state
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Attendance state
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready');
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  // Settings dialog
  const [showSettings, setShowSettings] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']); // Array for 4 digits
  const [pinError, setPinError] = useState('');
  const pinInputRefs = useRef([]);
  
  // Today's logs
  const [todayLogs, setTodayLogs] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTab, setAdminTab] = useState(0);
  
  // Kiosk management
  const [allKiosks, setAllKiosks] = useState([]);
  const [currentKioskSettings, setCurrentKioskSettings] = useState(null);
  const [editingKiosk, setEditingKiosk] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showChangePinDialog, setShowChangePinDialog] = useState(false);
  const [newPin, setNewPin] = useState(['', '', '', '']); // Array for 4 digits
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']); // Array for 4 digits
  const [pinChangeError, setPinChangeError] = useState('');
  const newPinInputRefs = useRef([]);
  const confirmPinInputRefs = useRef([]);
  
  // Live time
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();
    
    return () => {
      stopCamera();
    };
  }, []);
  
  // Load kiosk settings
  useEffect(() => {
    if (isAuthenticated) {
      loadKioskSettings();
    }
  }, [isAuthenticated]);
  
  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      setStream(mediaStream);
      setCameraError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError(
        'Camera failed to load. Please ensure camera permissions are granted and try refreshing the page.'
      );
    }
  };
  
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };
  
  const handleVerifyPin = async () => {
    try {
      setPinError('');
      
      const pinString = pin.join('');
      
      if (pinString.length !== 4) {
        setPinError('Please enter 4-digit PIN');
        return;
      }
      
      const response = await verifyKioskPin(kioskId, pinString);
      
      if (response.success) {
        setIsAuthenticated(true);
        setShowSettings(false);
        setPin(['', '', '', '']);
        // Load all admin data
        await Promise.all([
          loadTodayLogs(),
          loadKioskSettings(),
          loadAllKiosks()
        ]);
        setShowAdminPanel(true);
      } else {
        setPinError(response.message || 'Invalid PIN');
      }
    } catch (error) {
      setPinError('Failed to verify PIN');
    }
  };
  
  const handlePinChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newPinArray = [...pin];
    newPinArray[index] = value;
    setPin(newPinArray);
    
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
  
  const loadKioskSettings = async () => {
    try {
      const response = await getKioskSettings(kioskId);
      if (response.success) {
        setCurrentKioskSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load kiosk settings:', error);
    }
  };
  
  const loadAllKiosks = async () => {
    try {
      const response = await listKiosks();
      if (response.success) {
        setAllKiosks(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load kiosks:', error);
      setAllKiosks([]);
    }
  };
  
  const handleCloseAdminPanel = () => {
    setShowAdminPanel(false);
    setIsAuthenticated(false);
    setAdminTab(0);
  };
  
  const handleChangePin = async () => {
    try {
      setPinChangeError('');
      
      const newPinString = newPin.join('');
      const confirmPinString = confirmPin.join('');
      
      if (newPinString.length !== 4) {
        setPinChangeError('Please enter 4-digit PIN');
        return;
      }
      
      if (confirmPinString.length !== 4) {
        setPinChangeError('Please confirm 4-digit PIN');
        return;
      }
      
      if (newPinString !== confirmPinString) {
        setPinChangeError('PINs do not match');
        return;
      }
      
      const response = await updateKiosk(
        kioskId,
        currentKioskSettings.kiosk_name,
        currentKioskSettings.kiosk_location,
        newPinString
      );
      
      if (response.success) {
        alert('PIN changed successfully!');
        setShowChangePinDialog(false);
        setNewPin(['', '', '', '']);
        setConfirmPin(['', '', '', '']);
        await loadKioskSettings();
      } else {
        setPinChangeError(response.message || 'Failed to change PIN');
      }
    } catch (error) {
      setPinChangeError('Failed to change PIN');
    }
  };
  
  const handleNewPinChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newPinArray = [...newPin];
    newPinArray[index] = value;
    setNewPin(newPinArray);
    
    if (value && index < 3) {
      newPinInputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleNewPinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !newPin[index] && index > 0) {
      newPinInputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleConfirmPinChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    
    const confirmPinArray = [...confirmPin];
    confirmPinArray[index] = value;
    setConfirmPin(confirmPinArray);
    
    if (value && index < 3) {
      confirmPinInputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleConfirmPinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !confirmPin[index] && index > 0) {
      confirmPinInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && index === 3 && confirmPin.every(d => d)) {
      handleChangePin();
    }
  };
  
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.8);
  };
  
  const handleMarkAttendance = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setStatusMessage('Scanning face...');
    setResult(null);
    setShowResult(false);
    
    try {
      // Capture image from video
      const imageData = captureImage();
      
      if (!imageData) {
        throw new Error('Failed to capture image');
      }
      
      setStatusMessage('Recognizing...');
      
      // Mark attendance
      const response = await markKioskAttendance(kioskId, imageData);
      
      if (response.success) {
        setStatusMessage('Face recognized');
        
        setTimeout(() => {
          setResult({
            success: true,
            employeeName: response.data.employee_name,
            logType: response.data.log_type,
            logTime: response.data.log_time,
            confidence: response.data.confidence
          });
          setShowResult(true);
          setStatusMessage('Attendance marked');
          
          // Auto-hide result after 4 seconds
          setTimeout(() => {
            setShowResult(false);
            setResult(null);
            setStatusMessage('Ready');
          }, 4000);
        }, 500);
      } else {
        // Handle specific error messages (e.g., already checked in)
        const errorMessage = response.message || 'PLEASE TRY AGAIN';
        
        // If there's employee data (already checked in case), show it
        if (response.data && response.data.employee_name) {
          setStatusMessage('Face recognized');
          
          setTimeout(() => {
            setResult({
              success: false,
              employeeName: response.data.employee_name,
              message: errorMessage,
              checkInTime: response.data.check_in_time
            });
            setShowResult(true);
            setStatusMessage(errorMessage);
            
            // Keep error message visible for 6 seconds
            setTimeout(() => {
              setShowResult(false);
              setResult(null);
              setStatusMessage('Ready');
            }, 6000);
          }, 500);
        } else {
          // Generic error - just show message
          setStatusMessage(errorMessage);
          setTimeout(() => {
            setStatusMessage('Ready');
          }, 5000);
        }
      }
      
    } catch (error) {
      console.error('Attendance marking error:', error);
      const errorMessage = error.message || 'PLEASE TRY AGAIN';
      setStatusMessage(errorMessage);
      
      setTimeout(() => {
        setStatusMessage('Ready');
      }, 5000);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const loadTodayLogs = async () => {
    try {
      const response = await getKioskTodayLogs(kioskId);
      if (response.success) {
        setTodayLogs(response.data.logs || []);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };
  
  const handleSettingsClick = () => {
    // Always require PIN authentication
    setShowSettings(true);
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };
  
  // Listen for fullscreen changes (e.g., user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        bgcolor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Main Content Area - Responsive Layout */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden'
        }}
      >
        {/* Camera Section */}
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#000',
            // Mobile: 70% height, single column
            height: { xs: '70%', md: '100%' },
            // Tablet/Desktop: 60% width
            width: { xs: '100%', md: '60%' }
          }}
        >
        {cameraError ? (
          // Camera Error
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                margin: '0 auto 16px',
                border: '3px solid #dc2626',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Error sx={{ fontSize: 32, color: '#dc2626' }} />
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#171717', 
                mb: 1,
                fontWeight: 500,
                letterSpacing: 0.5
              }}
            >
              CAMERA ERROR
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#525252', 
                mb: 3, 
                maxWidth: 400,
                lineHeight: 1.6
              }}
            >
              {cameraError}
            </Typography>
            <Button
              variant="outlined"
              onClick={initializeCamera}
              sx={{
                borderColor: '#d4d4d4',
                color: '#171717',
                px: 4,
                py: 1.5,
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 1,
                '&:hover': { 
                  borderColor: '#a3a3a3',
                  bgcolor: '#fafafa'
                }
              }}
            >
              RETRY
            </Button>
          </Box>
        ) : (
          <>
            {/* Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)' // Mirror the display
              }}
            />
            
            {/* Face Frame Guide - Neutral */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: { xs: '85%', sm: '65%', md: '55%', lg: '45%' },
                height: { xs: '55%', sm: '65%', md: '70%' },
                border: '2px solid rgba(23, 23, 23, 0.4)',
                pointerEvents: 'none'
              }}
            >
              {/* Corner brackets - flat, industrial */}
              <Box sx={{ position: 'absolute', top: -2, left: -2, width: 32, height: 32, borderTop: '3px solid #171717', borderLeft: '3px solid #171717' }} />
              <Box sx={{ position: 'absolute', top: -2, right: -2, width: 32, height: 32, borderTop: '3px solid #171717', borderRight: '3px solid #171717' }} />
              <Box sx={{ position: 'absolute', bottom: -2, left: -2, width: 32, height: 32, borderBottom: '3px solid #171717', borderLeft: '3px solid #171717' }} />
              <Box sx={{ position: 'absolute', bottom: -2, right: -2, width: 32, height: 32, borderBottom: '3px solid #171717', borderRight: '3px solid #171717' }} />
            </Box>
            
            {/* Status Feedback - Top Center */}
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 16, md: 32 },
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e5e5',
                px: { xs: 2, md: 4 },
                py: { xs: 1.5, md: 2 },
                minWidth: { xs: 160, md: 200 },
                textAlign: 'center',
                zIndex: 10
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: statusMessage === 'Try again' ? '#dc2626' : '#171717',
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  textTransform: 'uppercase',
                  letterSpacing: { xs: 1.5, md: 2 }
                }}
              >
                {statusMessage}
              </Typography>
            </Box>
            
          </>
        )}
        
        {/* Settings Icon - Minimal */}
        <IconButton
          onClick={handleSettingsClick}
          sx={{
            position: 'absolute',
            top: { xs: 12, md: 16 },
            right: { xs: 12, md: 16 },
            color: 'rgba(23, 23, 23, 0.6)',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            width: { xs: 36, md: 40 },
            height: { xs: 36, md: 40 },
            zIndex: 10,
            '&:hover': {
              color: '#171717',
              bgcolor: 'rgba(255, 255, 255, 0.95)'
            }
          }}
        >
          <SettingsIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
        </IconButton>
        
        {/* Fullscreen Toggle - Minimal */}
        <IconButton
          onClick={toggleFullscreen}
          sx={{
            position: 'absolute',
            top: { xs: 12, md: 16 },
            right: { xs: 56, md: 64 },
            color: 'rgba(23, 23, 23, 0.6)',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            width: { xs: 36, md: 40 },
            height: { xs: 36, md: 40 },
            zIndex: 10,
            '&:hover': {
              color: '#171717',
              bgcolor: 'rgba(255, 255, 255, 0.95)'
            }
          }}
        >
          {isFullscreen ? (
            <FullscreenExitIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
          ) : (
            <FullscreenIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
          )}
        </IconButton>
      </Box>
      
      {/* Info Panel - Right side on tablet/desktop, bottom on mobile */}
      <Box
        sx={{
          // Mobile: 30% height minus footer
          height: { xs: 'calc(30% - 72px)', md: '100%' },
          // Tablet/Desktop: 40% width
          width: { xs: '100%', md: '40%' },
          bgcolor: '#ffffff',
          borderLeft: { xs: 'none', md: '1px solid #e5e5e5' },
          borderTop: { xs: '1px solid #e5e5e5', md: 'none' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Company Logo / Branding Area */}
        <Box
          sx={{
            p: { xs: 2, md: 3 },
            borderBottom: '1px solid #e5e5e5',
            textAlign: 'center',
            bgcolor: '#fafafa'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: '#171717',
              fontWeight: 700,
              fontSize: { xs: '1.125rem', md: '1.375rem' },
              textTransform: 'uppercase',
              letterSpacing: 2.5
            }}
          >
            ATTENDANCE SYSTEM
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#737373',
              fontSize: { xs: '0.8125rem', md: '0.9375rem' },
              textTransform: 'uppercase',
              letterSpacing: 1.5
            }}
          >
            Face Recognition Kiosk
          </Typography>
        </Box>
        
        {/* Instructions / Status Info */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: { xs: 2, md: 3 },
            textAlign: 'center'
          }}
        >
          {showResult && result ? (
            /* Show Result Card */
            <Box sx={{ width: '100%', maxWidth: 400 }}>
              <Box
                sx={{
                  bgcolor: '#ffffff',
                  border: `2px solid ${result.success ? '#16a34a' : '#dc2626'}`,
                  p: { xs: 2, md: 3 },
                  display: 'flex',
                  gap: { xs: 2, md: 2.5 },
                  alignItems: 'center',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              >
                {/* Icon */}
                <Box
                  sx={{
                    width: { xs: 56, md: 72 },
                    height: { xs: 56, md: 72 },
                    bgcolor: result.success ? '#f0fdf4' : '#fef2f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: `2px solid ${result.success ? '#16a34a' : '#dc2626'}`
                  }}
                >
                  {result.success ? (
                    <CheckCircle sx={{ fontSize: { xs: 32, md: 40 }, color: '#16a34a' }} />
                  ) : (
                    <Error sx={{ fontSize: { xs: 32, md: 40 }, color: '#dc2626' }} />
                  )}
                </Box>
                
                {/* Info */}
                <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#171717', 
                      fontWeight: 600,
                      mb: 0.5,
                      fontSize: { xs: '1.125rem', md: '1.25rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {result.employeeName}
                  </Typography>
                  {result.success ? (
                    <>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: '#16a34a', 
                          fontWeight: 600,
                          mb: 0.5,
                          fontSize: { xs: '0.9375rem', md: '1rem' },
                          textTransform: 'uppercase',
                          letterSpacing: 0.5
                        }}
                      >
                        {result.logType === 'CHECK_IN' ? 'CHECKED IN' : 'CHECKED OUT'}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#737373',
                          fontSize: { xs: '0.8125rem', md: '0.875rem' },
                          fontFamily: 'monospace'
                        }}
                      >
                        {result.logTime}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#dc2626', 
                          fontWeight: 600,
                          mb: 0.5,
                          fontSize: { xs: '0.9375rem', md: '1rem' },
                          letterSpacing: 0.5
                        }}
                      >
                        {result.message}
                      </Typography>
                      {result.checkInTime && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#737373',
                            fontSize: { xs: '0.75rem', md: '0.8125rem' }
                          }}
                        >
                          Check-in time: {result.checkInTime}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            </Box>
          ) : cameraError ? (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: '#dc2626',
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  fontWeight: 600,
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}
              >
                CAMERA ERROR
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#737373',
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  lineHeight: 1.6
                }}
              >
                Check permissions and retry
              </Typography>
            </Box>
          ) : isProcessing ? (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: '#171717',
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  fontWeight: 600,
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}
              >
                PROCESSING
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#737373',
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
              >
                Please wait...
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: '#16a34a',
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  fontWeight: 600,
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}
              >
                READY
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#737373',
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  lineHeight: 1.6
                }}
              >
                Position your face in the frame
                <br />
                Tap screen to mark attendance
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* System Status Indicators - Tablet/Desktop only */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            gap: 3,
            p: 3,
            borderTop: '1px solid #e5e5e5',
            justifyContent: 'center',
            bgcolor: '#fafafa'
          }}
        >
          {/* Camera Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                bgcolor: stream ? '#16a34a' : '#dc2626',
                border: `2px solid ${stream ? '#166534' : '#991b1b'}`
              }}
            />
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#737373',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: 500
              }}
            >
              CAM
            </Typography>
          </Box>
          
          {/* Network Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                bgcolor: '#16a34a',
                border: '2px solid #166534'
              }}
            />
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#737373',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: 500
              }}
            >
              NET
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
      
      {/* Footer System Bar */}
      <Box
        sx={{
          height: 72,
          bgcolor: '#ffffff',
          borderTop: '1px solid #e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 4 },
          flexShrink: 0
        }}
      >
        {/* Date & Time */}
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#737373', 
              fontSize: { xs: '0.625rem', md: '0.6875rem' },
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              display: 'block',
              mb: 0.25
            }}
          >
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#171717', 
              fontWeight: 500,
              fontFamily: 'monospace',
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              lineHeight: 1,
              letterSpacing: 1
            }}
          >
            {currentTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            })}
          </Typography>
        </Box>
        
        {/* System Status Indicators - Mobile only */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 3 }}>
          {/* Camera Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                bgcolor: stream ? '#16a34a' : '#dc2626',
                border: `2px solid ${stream ? '#166534' : '#991b1b'}`
              }}
            />
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#737373',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: 500
              }}
            >
              CAM
            </Typography>
          </Box>
          
          {/* Network Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                bgcolor: '#16a34a',
                border: '2px solid #166534'
              }}
            />
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#737373',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: 500
              }}
            >
              NET
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Tap to Scan - Full Screen Touch Target */}
      {!cameraError && !isProcessing && (
        <Box
          onClick={handleMarkAttendance}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            // Mobile: only camera section, Tablet/Desktop: only left 60%
            right: { xs: 0, md: '40%' },
            bottom: { xs: 'calc(30% + 72px)', md: 0 },
            cursor: 'pointer',
            zIndex: 5,
            '&:active': {
              bgcolor: 'rgba(255, 255, 255, 0.05)'
            }
          }}
        />
      )}
      
      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Settings Dialog */}
      <Dialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: 1
            }
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#fafafa', color: '#171717', borderBottom: '1px solid #e5e5e5' }}>
          ADMIN ACCESS
          <IconButton
            onClick={() => setShowSettings(false)}
            sx={{ 
              position: 'absolute', 
              right: 8, 
              top: 8,
              color: '#737373',
              '&:hover': { color: '#171717', bgcolor: '#f5f5f5' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#ffffff', pt: 3 }}>
          <Typography variant="body2" sx={{ color: '#737373', mb: 3 }}>
            Enter PIN to access kiosk settings
          </Typography>
          
          {/* OTP-style PIN Input */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
            {[0, 1, 2, 3].map((index) => (
              <TextField
                key={index}
                inputRef={(el) => (pinInputRefs.current[index] = el)}
                type="password"
                value={pin[index]}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(index, e)}
                inputProps={{
                  maxLength: 1,
                  style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }
                }}
                autoFocus={index === 0}
                sx={{
                  width: 60,
                  '& .MuiOutlinedInput-root': {
                    color: '#171717',
                    bgcolor: '#fafafa',
                    '& fieldset': { borderColor: '#e5e5e5', borderWidth: 2 },
                    '&:hover fieldset': { borderColor: '#a3a3a3' },
                    '&.Mui-focused fieldset': { borderColor: '#16a34a', borderWidth: 2 }
                  }
                }}
              />
            ))}
          </Box>
          
          {pinError && (
            <Typography variant="caption" sx={{ color: '#dc2626', display: 'block', textAlign: 'center' }}>
              {pinError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#ffffff', borderTop: '1px solid #e5e5e5', p: 2 }}>
          <Button 
            onClick={() => setShowSettings(false)}
            sx={{ color: '#737373', textTransform: 'uppercase', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleVerifyPin} 
            variant="contained"
            sx={{
              bgcolor: '#16a34a',
              color: '#fff',
              textTransform: 'uppercase',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#15803d', boxShadow: 'none' }
            }}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Admin Panel Dialog */}
      <Dialog
        open={showAdminPanel}
        onClose={handleCloseAdminPanel}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: 1,
              maxHeight: '85vh'
            }
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#fafafa', color: '#171717', borderBottom: '1px solid #e5e5e5', pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              KIOSK ADMIN PANEL
            </Typography>
            <IconButton
              onClick={handleCloseAdminPanel}
              sx={{ 
                color: '#737373',
                '&:hover': { color: '#171717', bgcolor: '#f5f5f5' }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Tabs 
            value={adminTab} 
            onChange={(e, newValue) => setAdminTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'uppercase',
                fontWeight: 600,
                fontSize: '0.8125rem',
                letterSpacing: 0.5
              }
            }}
          >
            <Tab label="Today's Logs" />
            <Tab label="Current Kiosk" />
            <Tab label="All Kiosks" />
          </Tabs>
        </DialogTitle>
        
        <DialogContent sx={{ bgcolor: '#ffffff', p: 0 }}>
          {/* Tab 0: Today's Logs */}
          {adminTab === 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#fafafa' }}>
                    <TableCell sx={{ color: '#737373', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid #e5e5e5' }}>Time</TableCell>
                    <TableCell sx={{ color: '#737373', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid #e5e5e5' }}>Employee</TableCell>
                    <TableCell sx={{ color: '#737373', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid #e5e5e5' }}>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todayLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ color: '#a3a3a3', py: 4, borderBottom: 'none' }}>
                        No logs for today
                      </TableCell>
                    </TableRow>
                  ) : (
                    todayLogs
                      .filter(log => log.status === 'SUCCESS')
                      .map((log) => (
                      <TableRow key={log.log_id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                        <TableCell sx={{ color: '#171717', borderBottom: '1px solid #e5e5e5' }}>
                          {(() => {
                            // SQL Server datetime is in local timezone (IST)
                            // Parse it without timezone conversion
                            const timeStr = log.log_time.replace(' ', 'T');
                            // Extract time components manually to avoid timezone conversion
                            const match = log.log_time.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
                            if (match) {
                              const [, year, month, day, hour, minute, second] = match;
                              // Create date in local timezone
                              const date = new Date(year, month - 1, day, hour, minute, second);
                              return date.toLocaleTimeString('en-IN', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                              });
                            }
                            return log.log_time;
                          })()}
                        </TableCell>
                        <TableCell sx={{ color: '#171717', borderBottom: '1px solid #e5e5e5' }}>{log.employee_name}</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid #e5e5e5' }}>
                          <Box
                            sx={{
                              display: 'inline-block',
                              px: 1,
                              py: 0.25,
                              bgcolor: log.log_type === 'CHECK_IN' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                              color: log.log_type === 'CHECK_IN' ? '#16a34a' : '#3b82f6',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              borderRadius: 0.5,
                              textTransform: 'uppercase',
                              border: `1px solid ${log.log_type === 'CHECK_IN' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                            }}
                          >
                            {log.log_type}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {/* Tab 1: Current Kiosk Settings */}
          {adminTab === 1 && currentKioskSettings && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ mb: 3, pb: 3, borderBottom: '1px solid #e5e5e5' }}>
                <Typography variant="overline" sx={{ color: '#737373', fontSize: '0.75rem', fontWeight: 600 }}>
                  Kiosk Information
                </Typography>
                <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#737373', fontSize: '0.75rem' }}>
                      Kiosk ID
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#171717', fontWeight: 500 }}>
                      {currentKioskSettings.kiosk_id}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#737373', fontSize: '0.75rem' }}>
                      Name
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#171717', fontWeight: 500 }}>
                      {currentKioskSettings.kiosk_name}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#737373', fontSize: '0.75rem' }}>
                      Location
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#171717', fontWeight: 500 }}>
                      {currentKioskSettings.kiosk_location}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#737373', fontSize: '0.75rem' }}>
                      Status
                    </Typography>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.25,
                        bgcolor: currentKioskSettings.is_active ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                        color: currentKioskSettings.is_active ? '#16a34a' : '#dc2626',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: 0.5,
                        textTransform: 'uppercase',
                        border: `1px solid ${currentKioskSettings.is_active ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`
                      }}
                    >
                      {currentKioskSettings.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </Box>
                  </Box>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="overline" sx={{ color: '#737373', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 2 }}>
                  Security
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setShowChangePinDialog(true)}
                  sx={{
                    borderColor: '#e5e5e5',
                    color: '#171717',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    '&:hover': { borderColor: '#a3a3a3', bgcolor: '#fafafa' }
                  }}
                >
                  Change PIN
                </Button>
              </Box>
            </Box>
          )}
          
          {/* Tab 2: All Kiosks */}
          {adminTab === 2 && (
            <Box>
              {allKiosks.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ color: '#737373', mb: 1 }}>
                    Kiosk Management Not Available
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#a3a3a3', fontSize: '0.8125rem' }}>
                    This feature requires HR administrator access.
                    <br />
                    Please contact your system administrator.
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ p: 2, borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa' }}>
                    <Typography variant="body2" sx={{ color: '#737373', fontSize: '0.875rem' }}>
                      {allKiosks.length} kiosk{allKiosks.length !== 1 ? 's' : ''} registered
                    </Typography>
                    <Button
                      startIcon={<AddIcon />}
                      variant="contained"
                      size="small"
                      sx={{
                        bgcolor: '#16a34a',
                        color: '#fff',
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#15803d', boxShadow: 'none' }
                      }}
                      onClick={() => alert('Create kiosk feature coming soon')}
                    >
                      New Kiosk
                    </Button>
                  </Box>
                  
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                          <TableCell sx={{ color: '#737373', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid #e5e5e5' }}>ID</TableCell>
                          <TableCell sx={{ color: '#737373', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid #e5e5e5' }}>Name</TableCell>
                          <TableCell sx={{ color: '#737373', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid #e5e5e5' }}>Location</TableCell>
                          <TableCell sx={{ color: '#737373', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid #e5e5e5' }}>Status</TableCell>
                          <TableCell sx={{ color: '#737373', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid #e5e5e5' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allKiosks.map((kiosk) => (
                          <TableRow key={kiosk.kiosk_id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                            <TableCell sx={{ color: '#171717', borderBottom: '1px solid #e5e5e5', fontFamily: 'monospace' }}>
                              {kiosk.kiosk_id}
                            </TableCell>
                            <TableCell sx={{ color: '#171717', borderBottom: '1px solid #e5e5e5', fontWeight: 500 }}>
                              {kiosk.kiosk_name}
                            </TableCell>
                            <TableCell sx={{ color: '#737373', borderBottom: '1px solid #e5e5e5' }}>
                              {kiosk.kiosk_location}
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #e5e5e5' }}>
                              <Box
                                sx={{
                                  display: 'inline-block',
                                  px: 1,
                                  py: 0.25,
                                  bgcolor: kiosk.is_active ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                                  color: kiosk.is_active ? '#16a34a' : '#dc2626',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  borderRadius: 0.5,
                                  textTransform: 'uppercase',
                                  border: `1px solid ${kiosk.is_active ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`
                                }}
                              >
                                {kiosk.is_active ? 'ACTIVE' : 'INACTIVE'}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #e5e5e5' }}>
                              <IconButton
                                size="small"
                                onClick={() => alert('Edit kiosk feature coming soon')}
                                sx={{ color: '#737373', '&:hover': { color: '#171717', bgcolor: '#f5f5f5' } }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ bgcolor: '#ffffff', borderTop: '1px solid #e5e5e5', p: 2 }}>
          <Button 
            onClick={handleCloseAdminPanel}
            sx={{ color: '#737373', textTransform: 'uppercase', fontWeight: 600 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Change PIN Dialog */}
      <Dialog
        open={showChangePinDialog}
        onClose={() => {
          setShowChangePinDialog(false);
          setNewPin(['', '', '', '']);
          setConfirmPin(['', '', '', '']);
          setPinChangeError('');
        }}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: 1
            }
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#fafafa', color: '#171717', borderBottom: '1px solid #e5e5e5' }}>
          CHANGE KIOSK PIN
          <IconButton
            onClick={() => {
              setShowChangePinDialog(false);
              setNewPin(['', '', '', '']);
              setConfirmPin(['', '', '', '']);
              setPinChangeError('');
            }}
            sx={{ 
              position: 'absolute', 
              right: 8, 
              top: 8,
              color: '#737373',
              '&:hover': { color: '#171717', bgcolor: '#f5f5f5' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#ffffff', pt: 3 }}>
          <Typography variant="body2" sx={{ color: '#737373', mb: 3 }}>
            Enter a new 4-digit PIN for {currentKioskSettings?.kiosk_name}
          </Typography>
          
          {/* New PIN */}
          <Typography variant="caption" sx={{ color: '#737373', display: 'block', mb: 1, fontWeight: 600 }}>
            New PIN
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
            {[0, 1, 2, 3].map((index) => (
              <TextField
                key={index}
                inputRef={(el) => (newPinInputRefs.current[index] = el)}
                type="password"
                value={newPin[index]}
                onChange={(e) => handleNewPinChange(index, e.target.value)}
                onKeyDown={(e) => handleNewPinKeyDown(index, e)}
                inputProps={{
                  maxLength: 1,
                  style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }
                }}
                autoFocus={index === 0}
                sx={{
                  width: 60,
                  '& .MuiOutlinedInput-root': {
                    color: '#171717',
                    bgcolor: '#fafafa',
                    '& fieldset': { borderColor: '#e5e5e5', borderWidth: 2 },
                    '&:hover fieldset': { borderColor: '#a3a3a3' },
                    '&.Mui-focused fieldset': { borderColor: '#16a34a', borderWidth: 2 }
                  }
                }}
              />
            ))}
          </Box>
          
          {/* Confirm PIN */}
          <Typography variant="caption" sx={{ color: '#737373', display: 'block', mb: 1, fontWeight: 600 }}>
            Confirm PIN
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
            {[0, 1, 2, 3].map((index) => (
              <TextField
                key={index}
                inputRef={(el) => (confirmPinInputRefs.current[index] = el)}
                type="password"
                value={confirmPin[index]}
                onChange={(e) => handleConfirmPinChange(index, e.target.value)}
                onKeyDown={(e) => handleConfirmPinKeyDown(index, e)}
                inputProps={{
                  maxLength: 1,
                  style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }
                }}
                sx={{
                  width: 60,
                  '& .MuiOutlinedInput-root': {
                    color: '#171717',
                    bgcolor: '#fafafa',
                    '& fieldset': { borderColor: '#e5e5e5', borderWidth: 2 },
                    '&:hover fieldset': { borderColor: '#a3a3a3' },
                    '&.Mui-focused fieldset': { borderColor: '#16a34a', borderWidth: 2 }
                  }
                }}
              />
            ))}
          </Box>
          
          {pinChangeError && (
            <Typography variant="caption" sx={{ color: '#dc2626', display: 'block', textAlign: 'center' }}>
              {pinChangeError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#ffffff', borderTop: '1px solid #e5e5e5', p: 2 }}>
          <Button 
            onClick={() => {
              setShowChangePinDialog(false);
              setNewPin(['', '', '', '']);
              setConfirmPin(['', '', '', '']);
              setPinChangeError('');
            }}
            sx={{ color: '#737373', textTransform: 'uppercase', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleChangePin} 
            variant="contained"
            sx={{
              bgcolor: '#16a34a',
              color: '#fff',
              textTransform: 'uppercase',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#15803d', boxShadow: 'none' }
            }}
          >
            Change PIN
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Kiosk;
