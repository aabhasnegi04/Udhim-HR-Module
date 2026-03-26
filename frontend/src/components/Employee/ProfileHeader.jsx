import {
    Box,
    Typography,
    Avatar,
    Chip,
    Button,
    Paper,
    IconButton,
    Badge,
    CircularProgress,
} from '@mui/material';
import {
    Edit as EditIcon,
    Download as DownloadIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Business as BusinessIcon,
    CameraAlt as CameraIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import employeeService from '../../services/employeeService';

// tabs 0=Personal, 1=Official are editable; rest are read-only
const EDITABLE_TABS = [0, 1];
const TAB_MANAGED_IN = {
    2: null,                          // Status Management — has its own controls
    3: 'Attendance module',
    4: 'Leave module',
    5: 'Payroll module',
    6: null,                          // Documents — has inline upload/delete
    7: 'Documents → Generate Letter',
};

const ProfileHeader = ({ employee, onEditClick, isEditing, onPhotoUpdate, activeTab = 0 }) => {
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoError, setPhotoError] = useState('');
    const [photoUrl, setPhotoUrl] = useState(null);

    // Load photo when employee changes
    useEffect(() => {
        if (employee?.photo_path && employee?.employee_id) {
            loadEmployeePhoto();
        } else {
            setPhotoUrl(null);
        }
    }, [employee?.photo_path, employee?.employee_id]);

    const loadEmployeePhoto = async () => {
        try {
            const result = await employeeService.getEmployeePhoto(employee.employee_id);
            if (result.success) {
                setPhotoUrl(result.data);
            } else {
                setPhotoUrl(null);
            }
        } catch (error) {
            console.error('Failed to load photo:', error);
            setPhotoUrl(null);
        }
    };

    if (!employee) return null;

    const handlePhotoUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setPhotoError('Please select an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setPhotoError('Image size must be less than 5MB');
            return;
        }

        setUploadingPhoto(true);
        setPhotoError('');

        try {
            const result = await employeeService.uploadEmployeePhoto(employee.employee_id, file);
            
            if (result.success) {
                // Notify parent component to reload employee data
                if (onPhotoUpdate) {
                    onPhotoUpdate();
                }
                // Reload the photo
                loadEmployeePhoto();
            } else {
                setPhotoError(result.error || 'Failed to upload photo');
            }
        } catch (error) {
            setPhotoError('An error occurred while uploading photo');
            console.error('Photo upload error:', error);
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleDeletePhoto = async () => {
        if (!window.confirm('Are you sure you want to delete this photo? This will also remove face recognition data.')) {
            return;
        }

        setUploadingPhoto(true);
        setPhotoError('');

        try {
            const result = await employeeService.deleteEmployeePhoto(employee.employee_id);
            
            if (result.success) {
                // Notify parent component to reload employee data
                if (onPhotoUpdate) {
                    onPhotoUpdate();
                }
                // Clear the photo
                setPhotoUrl(null);
            } else {
                setPhotoError(result.error || 'Failed to delete photo');
            }
        } catch (error) {
            setPhotoError('An error occurred while deleting photo');
            console.error('Photo delete error:', error);
        } finally {
            setUploadingPhoto(false);
        }
    };

    return (
        <Paper sx={{ p: 4, mb: 3 }}>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'center', md: 'flex-start' },
                gap: 3,
                textAlign: { xs: 'center', md: 'left' }
            }}>
                {/* Avatar Section with Upload */}
                <Box sx={{ position: 'relative' }}>
                    <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                            isEditing && !uploadingPhoto ? (
                                <>
                                    <IconButton
                                        component="label"
                                        sx={{
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'primary.dark' },
                                            width: 40,
                                            height: 40,
                                        }}
                                    >
                                        <CameraIcon fontSize="small" />
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                        />
                                    </IconButton>
                                    {employee.photo_path && (
                                        <IconButton
                                            onClick={handleDeletePhoto}
                                            sx={{
                                                bgcolor: 'error.main',
                                                color: 'white',
                                                '&:hover': { bgcolor: 'error.dark' },
                                                width: 40,
                                                height: 40,
                                                ml: 1,
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </>
                            ) : uploadingPhoto ? (
                                <CircularProgress size={40} />
                            ) : null
                        }
                    >
                        <Avatar
                            src={photoUrl}
                            sx={{
                                width: { xs: 120, md: 150 },
                                height: { xs: 120, md: 150 },
                                fontSize: { xs: '2rem', md: '2.5rem' },
                                bgcolor: 'primary.main',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            }}
                        >
                            {employee.name?.charAt(0)}
                        </Avatar>
                    </Badge>
                    {photoError && (
                        <Typography 
                            variant="caption" 
                            color="error" 
                            sx={{ 
                                display: 'block', 
                                mt: 1,
                                textAlign: 'center' 
                            }}
                        >
                            {photoError}
                        </Typography>
                    )}
                </Box>

                {/* Employee Info */}
                <Box sx={{ flex: 1 }}>
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { xs: 'center', md: 'flex-start' },
                        justifyContent: 'space-between',
                        mb: 2
                    }}>
                        <Box>
                            <Typography 
                                variant="h4" 
                                sx={{ 
                                    fontWeight: 700, 
                                    mb: 0.5,
                                    fontSize: { xs: '1.75rem', md: '2.125rem' }
                                }}
                            >
                                {employee.name}
                            </Typography>
                            <Typography 
                                variant="h6" 
                                color="text.secondary" 
                                sx={{ mb: 1, fontWeight: 500 }}
                            >
                                {employee.designation}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <BusinessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                    {employee.department}
                                </Typography>
                            </Box>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    color: 'primary.main', 
                                    fontWeight: 600,
                                    fontSize: '0.875rem'
                                }}
                            >
                                ID: {employee.employee_code || employee.id}
                            </Typography>
                        </Box>

                        {/* Status and Actions */}
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: { xs: 'center', md: 'flex-end' },
                            gap: 2,
                            mt: { xs: 2, md: 0 }
                        }}>
                            <Chip
                                label={employee.status}
                                color={employee.status === 'ACTIVE' ? 'success' : 'default'}
                                sx={{ 
                                    fontWeight: 600,
                                    px: 2,
                                    py: 0.5
                                }}
                            />
                            {!isEditing && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-end' }, gap: 1 }}>
                                    {EDITABLE_TABS.includes(activeTab) ? (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button variant="outlined" startIcon={<EditIcon />} size="small" onClick={onEditClick}>
                                                Edit
                                            </Button>
                                            <Button variant="outlined" startIcon={<DownloadIcon />} size="small">
                                                Download
                                            </Button>
                                        </Box>
                                    ) : TAB_MANAGED_IN[activeTab] ? (
                                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'right' }}>
                                            Managed in {TAB_MANAGED_IN[activeTab]}
                                        </Typography>
                                    ) : null}
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* Contact Info */}
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 3,
                        pt: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                                {employee.email}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                                {employee.phone || 'Not provided'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
};

export default ProfileHeader;