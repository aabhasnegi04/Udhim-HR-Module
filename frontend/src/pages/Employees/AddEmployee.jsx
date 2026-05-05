import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppDatePicker from '../../components/common/AppDatePicker';
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
import adminService from '../../services/adminService';
import EmployeeCredentialsDialog from '../../components/EmployeeCredentialsDialog';

const AddEmployee = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCredentials, setShowCredentials] = useState(false);
    const [createdEmployeeData, setCreatedEmployeeData] = useState(null);
    
    // Data loading states
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [locations, setLocations] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    
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
        worker_category: 'OFFICE', // NEW: OFFICE or FACTORY
        work_location: '',
        salary: '',
        
        // Reporting
        manager_id: ''
    });

    const [genders, setGenders] = useState([]);
    const [employmentTypes, setEmploymentTypes] = useState([]);

    // Load departments, designations, locations, and other master data on component mount
    useEffect(() => {
        const loadMasterData = async () => {
            try {
                setDataLoading(true);
                
                const [departmentsResult, designationsResult, locationsResult, gendersResult, employmentTypesResult] = await Promise.all([
                    adminService.getDepartments(),
                    adminService.getDesignations(),
                    adminService.getLocations(),
                    adminService.getGenders(),
                    adminService.getEmploymentTypes()
                ]);
                
                if (departmentsResult.success) {
                    setDepartments(departmentsResult.data || []);
                } else {
                    console.error('Failed to load departments:', departmentsResult.error);
                }
                
                if (designationsResult.success) {
                    setDesignations(designationsResult.data || []);
                } else {
                    console.error('Failed to load designations:', designationsResult.error);
                }
                
                if (locationsResult.success) {
                    setLocations(locationsResult.data || []);
                } else {
                    console.error('Failed to load locations:', locationsResult.error);
                }

                if (gendersResult.success) {
                    setGenders(gendersResult.data.genders || []);
                } else {
                    console.error('Failed to load genders:', gendersResult.error);
                }

                if (employmentTypesResult.success) {
                    setEmploymentTypes(employmentTypesResult.data.employment_types || []);
                } else {
                    console.error('Failed to load employment types:', employmentTypesResult.error);
                }
                
            } catch (error) {
                console.error('Error loading master data:', error);
            } finally {
                setDataLoading(false);
            }
        };
        
        loadMasterData();
    }, []);

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
        
        // Check if master data is still loading
        if (dataLoading) {
            setError('Please wait for departments and designations to load');
            return;
        }
        
        // Check if departments and designations are available
        if (departments.length === 0) {
            setError('No departments available. Please contact admin to add departments first.');
            return;
        }
        
        if (designations.length === 0) {
            setError('No designations available. Please contact admin to add designations first.');
            return;
        }
        
        // Basic validation
        if (!formData.first_name || !formData.last_name || 
            !formData.department || !formData.designation) {
            setError('Please fill in all required fields');
            return;
        }

        // Email validation (only if provided)
        if (formData.email && formData.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                setError('Please enter a valid email address');
                return;
            }
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
                        
                        // Get leave types first and allocate based on system configuration
                        const leaveTypesResult = await leaveService.getLeaveTypes();
                        if (leaveTypesResult.success && leaveTypesResult.data.length > 0) {
                            // Define standard allocations - this could be moved to a configuration API later
                            const standardAllocations = {
                                'AL': 21,  // Annual Leave
                                'CL': 12,  // Casual Leave
                                'SL': 12,  // Sick Leave
                                'EL': 21,  // Earned Leave
                                'ML': 180, // Maternity Leave
                                'PL': 15,  // Paternity Leave
                                'CO': 12   // Compensatory Off
                            };
                            
                            const allocationPromises = leaveTypesResult.data.map(leaveType => {
                                const days = standardAllocations[leaveType.leave_code];
                                if (days) {
                                    return leaveService.allocateLeaveBalance({
                                        employee_id: result.data.employee_id,
                                        leave_type_id: leaveType.leave_type_id,
                                        year: currentYear,
                                        total_allocated: days
                                    });
                                }
                                return Promise.resolve({ success: false });
                            });
                            
                            await Promise.all(allocationPromises);
                            console.log('Leave balances allocated automatically based on available leave types');
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

            {/* Loading indicator for master data */}
            {dataLoading && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} />
                        Loading departments, designations, and locations...
                    </Box>
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
                                label="Email Address (Optional)"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="employee@company.com"
                                helperText="Leave empty for factory workers. Can be added later to create login account."
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
                            <AppDatePicker
                                label="Date of Birth"
                                value={formData.dob}
                                onChange={(v) => handleInputChange({ target: { name: 'dob', value: v } })}
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
                                    disabled={dataLoading}
                                >
                                    {dataLoading ? (
                                        <MenuItem disabled>
                                            <CircularProgress size={20} sx={{ mr: 1 }} />
                                            Loading departments...
                                        </MenuItem>
                                    ) : departments.length === 0 ? (
                                        <MenuItem disabled>
                                            No departments available. Please contact admin to add departments.
                                        </MenuItem>
                                    ) : (
                                        departments.map((dept) => (
                                            <MenuItem key={dept.department_id || dept.department_name} value={dept.department_name}>
                                                {dept.department_name}
                                            </MenuItem>
                                        ))
                                    )}
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
                                    disabled={dataLoading}
                                >
                                    {dataLoading ? (
                                        <MenuItem disabled>
                                            <CircularProgress size={20} sx={{ mr: 1 }} />
                                            Loading designations...
                                        </MenuItem>
                                    ) : designations.length === 0 ? (
                                        <MenuItem disabled>
                                            No designations available. Please contact admin to add designations.
                                        </MenuItem>
                                    ) : (
                                        designations.map((designation) => (
                                            <MenuItem key={designation.designation_id || designation.designation_name} value={designation.designation_name}>
                                                {designation.designation_name}
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* Row 2: Date of Joining, Employment Type */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <AppDatePicker
                                label="Date of Joining"
                                value={formData.join_date}
                                onChange={(v) => handleInputChange({ target: { name: 'join_date', value: v } })}
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

                    {/* Row 2.5: Worker Category */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <FormControl fullWidth required>
                                <InputLabel>Worker Category</InputLabel>
                                <Select
                                    name="worker_category"
                                    value={formData.worker_category}
                                    onChange={handleInputChange}
                                    label="Worker Category"
                                >
                                    <MenuItem value="OFFICE">Office Employee (Monthly Salary)</MenuItem>
                                    <MenuItem value="FACTORY">Factory Worker (Daily Wage)</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            {/* Empty box for layout balance */}
                        </Box>
                    </Box>

                    {/* Row 3: Work Location, Salary */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <FormControl fullWidth>
                                <InputLabel>Work Location</InputLabel>
                                <Select
                                    name="work_location"
                                    value={formData.work_location}
                                    onChange={handleInputChange}
                                    label="Work Location"
                                    disabled={dataLoading}
                                >
                                    <MenuItem value="">
                                        <em>Select location</em>
                                    </MenuItem>
                                    {dataLoading ? (
                                        <MenuItem disabled>
                                            <CircularProgress size={20} sx={{ mr: 1 }} />
                                            Loading locations...
                                        </MenuItem>
                                    ) : locations.length === 0 ? (
                                        <MenuItem disabled>
                                            No locations available. Please contact admin to add locations.
                                        </MenuItem>
                                    ) : (
                                        locations.map((location) => (
                                            <MenuItem key={location.location_id || location.location_name} value={location.location_name}>
                                                {location.location_name} {location.city && `- ${location.city}`}
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
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
