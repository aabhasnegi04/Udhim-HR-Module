import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Breadcrumbs,
    Link,
    CircularProgress,
    Avatar,
    Card,
    CardContent,
    Divider,
    IconButton,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Save as SaveIcon,
    Person as PersonIcon,
    Work as WorkIcon,
    Business as BusinessIcon,
    CameraAlt as CameraIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import employeeService from '../../services/employeeService';
import leaveService from '../../services/leaveService';
import EmployeeCredentialsDialog from '../../components/EmployeeCredentialsDialog';

const AddEmployee = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCredentials, setShowCredentials] = useState(false);
    const [createdEmployeeData, setCreatedEmployeeData] = useState(null);
    
    // Photo upload state
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoError, setPhotoError] = useState('');
    
    const [formData, setFormData] = useState({
        // Auto-generated field
        employee_code: '',
        
        // Personal Information
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        dob: '',
        gender: '',
        address: '',
        emergency_contact: '',
        
        // Official Information
        department: '',
        designation: '',
        join_date: new Date().toISOString().split('T')[0], // Changed from date_of_joining
        employment_type: '',
        work_location: '',
        salary: '',
        
        // Reporting
        manager_id: ''
    });

    const departments = [
        'Engineering',
        'Human Resources', 
        'Finance',
        'Marketing',
        'Sales',
        'Operations'
    ];

    const designations = [
        'Software Engineer',
        'Senior Software Engineer',
        'Engineering Manager',
        'HR Executive',
        'HR Manager',
        'Financial Analyst',
        'Marketing Executive',
        'Sales Executive',
        'Operations Manager'
    ];

    const genders = ['Male', 'Female', 'Other'];
    
    const employmentTypes = ['Full-Time', 'Part-Time', 'Contract', 'Intern'];

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhotoSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            setPhotoError('Please select a valid image file (JPG, JPEG, or PNG)');
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setPhotoError('File size must be less than 5MB');
            return;
        }

        setPhotoError('');
        setSelectedPhoto(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPhotoPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handlePhotoRemove = () => {
        setSelectedPhoto(null);
        setPhotoPreview(null);
        setPhotoError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Basic validation
        if (!formData.first_name || !formData.last_name || !formData.email || 
            !formData.department || !formData.designation) {
            setError('Please fill in all required fields');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            // Prepare data (remove empty strings for optional fields)
            const submitData = { ...formData };
            Object.keys(submitData).forEach(key => {
                if (submitData[key] === '') {
                    submitData[key] = null;
                }
            });

            const result = await employeeService.createEmployee(submitData);
            
            if (result.success) {
                setCreatedEmployeeData(result.data);
                setSuccess('Employee and user account created successfully!');
                
                // Automatically allocate standard leave balances
                if (result.data.employee_id) {
                    try {
                        const currentYear = new Date().getFullYear();
                        const standardAllocations = [
                            { leave_code: 'AL', days: 21 },
                            { leave_code: 'CL', days: 12 },
                            { leave_code: 'SL', days: 12 },
                            { leave_code: 'EL', days: 21 },
                            { leave_code: 'ML', days: 180 },
                            { leave_code: 'PL', days: 15 },
                            { leave_code: 'CO', days: 12 }
                        ];
                        
                        // Get leave types first
                        const leaveTypesResult = await leaveService.getLeaveTypes();
                        if (leaveTypesResult.success) {
                            const allocationPromises = standardAllocations.map(allocation => {
                                const leaveType = leaveTypesResult.data.find(lt => lt.leave_code === allocation.leave_code);
                                if (leaveType) {
                                    return leaveService.allocateLeaveBalance({
                                        employee_id: result.data.employee_id,
                                        leave_type_id: leaveType.leave_type_id,
                                        year: currentYear,
                                        total_allocated: allocation.days
                                    });
                                }
                                return Promise.resolve({ success: false });
                            });
                            
                            await Promise.all(allocationPromises);
                            console.log('Leave balances allocated automatically');
                        }
                    } catch (leaveError) {
                        console.error('Failed to allocate leave balances:', leaveError);
                        // Don't show error to user as employee creation was successful
                    }
                }
                
                // If photo was selected, upload it
                if (selectedPhoto && result.data.employee_id) {
                    try {
                        const photoResult = await employeeService.uploadEmployeePhoto(
                            result.data.employee_id, 
                            selectedPhoto
                        );
                        
                        if (photoResult.success) {
                            setSuccess('Employee created successfully with photo and face registration!');
                        } else {
                            setSuccess('Employee created successfully, but photo upload failed. You can add the photo later.');
                        }
                    } catch (photoError) {
                        console.error('Photo upload error:', photoError);
                        setSuccess('Employee created successfully, but photo upload failed. You can add the photo later.');
                    }
                }
                
                setShowCredentials(true);
            } else {
                setError(result.error || 'Failed to add employee');
            }
        } catch (error) {
            setError('Failed to add employee. Please try again.');
            console.error('Add employee error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/employees');
    };

    const handleCredentialsClose = () => {
        setShowCredentials(false);
        navigate('/employees');
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Breadcrumbs and Back Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<BackIcon />}
                    onClick={handleCancel}
                >
                    Back
                </Button>
                <Breadcrumbs>
                    <Link 
                        color="inherit" 
                        href="/employees" 
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/employees');
                        }}
                        sx={{ cursor: 'pointer' }}
                    >
                        Employees
                    </Link>
                    <Typography color="text.primary">Add Employee</Typography>
                </Breadcrumbs>
            </Box>

            {/* Success/Error Messages */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            
            {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {success}
                </Alert>
            )}

            {/* Header Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                            <PersonIcon fontSize="large" />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Add New Employee
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Employee code will be auto-generated upon creation
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Photo Upload Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <CameraIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Employee Photo (Optional)
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                    {/* Photo Preview */}
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            sx={{
                                width: 120,
                                height: 120,
                                bgcolor: photoPreview ? 'transparent' : 'grey.200',
                                border: '2px dashed',
                                borderColor: photoError ? 'error.main' : 'grey.300',
                                cursor: 'pointer',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: photoPreview ? 'transparent' : 'action.hover'
                                }
                            }}
                            onClick={handlePhotoClick}
                            src={photoPreview}
                        >
                            {!photoPreview && <CameraIcon sx={{ fontSize: 40, color: 'grey.500' }} />}
                        </Avatar>
                        
                        {photoPreview && (
                            <IconButton
                                size="small"
                                sx={{
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    bgcolor: 'error.main',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'error.dark' }
                                }}
                                onClick={handlePhotoRemove}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>

                    {/* Upload Instructions */}
                    <Box sx={{ flex: 1, minWidth: 250 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                            Upload Employee Photo
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            This photo will be used for face recognition attendance. 
                            Please ensure the face is clearly visible and well-lit.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button
                                variant="outlined"
                                startIcon={<CameraIcon />}
                                onClick={handlePhotoClick}
                                size="small"
                            >
                                {photoPreview ? 'Change Photo' : 'Select Photo'}
                            </Button>
                            {photoPreview && (
                                <Button
                                    variant="text"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={handlePhotoRemove}
                                    size="small"
                                >
                                    Remove
                                </Button>
                            )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Supported formats: JPG, JPEG, PNG (Max 5MB)
                        </Typography>
                        {photoError && (
                            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                                {photoError}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handlePhotoSelect}
                    style={{ display: 'none' }}
                />
            </Paper>

            {/* Add Employee Form */}
            <form onSubmit={handleSubmit}>
                {/* Personal Information Section */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <PersonIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Personal Information
                        </Typography>
                    </Box>
                    
                    {/* Row 1: First Name, Last Name */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <TextField
                                fullWidth
                                label="First Name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter first name"
                            />
                        </Box>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter last name"
                            />
                        </Box>
                    </Box>

                    {/* Row 2: Email, Phone */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <TextField
                                fullWidth
                                label="Email Address"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                placeholder="employee@company.com"
                            />
                        </Box>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="+1-555-0100"
                            />
                        </Box>
                    </Box>

                    {/* Row 3: DOB, Gender */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <TextField
                                fullWidth
                                label="Date of Birth"
                                name="dob"
                                type="date"
                                value={formData.dob}
                                onChange={handleInputChange}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Box>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <FormControl fullWidth>
                                <InputLabel>Gender</InputLabel>
                                <Select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    label="Gender"
                                >
                                    <MenuItem value="">
                                        <em>Select gender</em>
                                    </MenuItem>
                                    {genders.map((gender) => (
                                        <MenuItem key={gender} value={gender}>
                                            {gender}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* Row 4: Address */}
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            label="Address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            multiline
                            rows={2}
                            placeholder="Enter full address"
                        />
                    </Box>

                    {/* Row 5: Emergency Contact */}
                    <Box>
                        <TextField
                            fullWidth
                            label="Emergency Contact"
                            name="emergency_contact"
                            value={formData.emergency_contact}
                            onChange={handleInputChange}
                            placeholder="+1-555-0200"
                            sx={{ maxWidth: '400px' }}
                        />
                    </Box>
                </Paper>

                {/* Official Information Section */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <WorkIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Official Information
                        </Typography>
                    </Box>
                    
                    {/* Row 1: Department, Designation */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <FormControl fullWidth required>
                                <InputLabel>Department</InputLabel>
                                <Select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    label="Department"
                                >
                                    {departments.map((dept) => (
                                        <MenuItem key={dept} value={dept}>
                                            {dept}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <FormControl fullWidth required>
                                <InputLabel>Designation</InputLabel>
                                <Select
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleInputChange}
                                    label="Designation"
                                >
                                    {designations.map((designation) => (
                                        <MenuItem key={designation} value={designation}>
                                            {designation}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* Row 2: Date of Joining, Employment Type */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <TextField
                                fullWidth
                                label="Date of Joining"
                                name="join_date"
                                type="date"
                                value={formData.join_date}
                                onChange={handleInputChange}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Box>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <FormControl fullWidth>
                                <InputLabel>Employment Type</InputLabel>
                                <Select
                                    name="employment_type"
                                    value={formData.employment_type}
                                    onChange={handleInputChange}
                                    label="Employment Type"
                                >
                                    <MenuItem value="">
                                        <em>Select type</em>
                                    </MenuItem>
                                    {employmentTypes.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* Row 3: Work Location, Salary */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <TextField
                                fullWidth
                                label="Work Location"
                                name="work_location"
                                value={formData.work_location}
                                onChange={handleInputChange}
                                placeholder="e.g., New York Office, Remote"
                            />
                        </Box>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <TextField
                                fullWidth
                                label="Salary (Optional)"
                                name="salary"
                                type="number"
                                value={formData.salary}
                                onChange={handleInputChange}
                                placeholder="50000"
                                helperText="Annual salary in USD"
                            />
                        </Box>
                    </Box>
                </Paper>

                {/* Reporting Section */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <BusinessIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Reporting Structure
                        </Typography>
                    </Box>
                    
                    <Box sx={{ maxWidth: '400px' }}>
                        <TextField
                            fullWidth
                            label="Manager ID (Optional)"
                            name="manager_id"
                            type="number"
                            value={formData.manager_id}
                            onChange={handleInputChange}
                            placeholder="Enter manager's employee ID"
                            helperText="Leave empty if no direct manager"
                        />
                    </Box>
                </Paper>

                {/* Form Actions */}
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        justifyContent: 'flex-end'
                    }}>
                        <Button
                            variant="outlined"
                            onClick={handleCancel}
                            disabled={loading}
                            size="large"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                            disabled={loading}
                            size="large"
                        >
                            {loading ? 'Adding Employee...' : 'Add Employee'}
                        </Button>
                    </Box>
                </Paper>
            </form>

            {/* Employee Credentials Dialog */}
            <EmployeeCredentialsDialog
                open={showCredentials}
                onClose={handleCredentialsClose}
                employeeData={createdEmployeeData}
            />
        </Box>
    );
};

export default AddEmployee;
