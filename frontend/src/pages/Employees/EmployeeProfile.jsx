import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Button,
    Paper,
    Breadcrumbs,
    Link,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    EventAvailable as AttendanceIcon,
    BeachAccess as LeaveIcon,
    AccountBalance as SalaryIcon,
    Description as DocumentsIcon,
    Mail as LettersIcon,
    Security as StatusIcon,
} from '@mui/icons-material';

// Import tab components
import ProfileHeader from '../../components/Employee/ProfileHeader';
import PersonalInfo from '../../components/Employee/PersonalInfo';
import OfficialInfo from '../../components/Employee/OfficialInfo';
import AttendancePreview from '../../components/Employee/AttendancePreview';
import LeavePreview from '../../components/Employee/LeavePreview';
import SalaryPreview from '../../components/Employee/SalaryPreview';
import DocumentsTab from '../../components/Employee/DocumentsTab';
import LettersTab from '../../components/Employee/LettersTab';
import StatusManagement from '../../components/Employee/StatusManagement';

// Import employee service
import employeeService from '../../services/employeeService';
import adminService from '../../services/adminService';

const TabPanel = ({ children, value, index, ...other }) => {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`employee-tabpanel-${index}`}
            aria-labelledby={`employee-tab-${index}`}
            {...other}
        >
            {value === index && children}
        </div>
    );
};

const EmployeeProfile = () => {
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [saving, setSaving] = useState(false);

    // Master data states
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [locations, setLocations] = useState([]);
    const [genders, setGenders] = useState([]);
    const [employmentTypes, setEmploymentTypes] = useState([]);
    const [masterDataLoading, setMasterDataLoading] = useState(false);

    // Load employee data on component mount
    useEffect(() => {
        loadEmployee();
    }, [employeeId]);

    const loadMasterData = async () => {
        try {
            setMasterDataLoading(true);
            
            const [departmentsResult, designationsResult, locationsResult, gendersResult, employmentTypesResult] = await Promise.all([
                adminService.getDepartments(),
                adminService.getDesignations(),
                adminService.getLocations(),
                adminService.getGenders(),
                adminService.getEmploymentTypes()
            ]);
            
            if (departmentsResult.success) {
                setDepartments(departmentsResult.data || []);
            }
            
            if (designationsResult.success) {
                setDesignations(designationsResult.data || []);
            }

            if (locationsResult.success) {
                setLocations(locationsResult.data || []);
            }

            if (gendersResult.success) {
                // Extract just the gender values from the objects
                const genderValues = (gendersResult.data.genders || []).map(g => g.gender_name || g);
                setGenders(genderValues);
            }

            if (employmentTypesResult.success) {
                // Extract just the employment type values from the objects
                const employmentTypeValues = (employmentTypesResult.data.employment_types || []).map(et => et.employment_type_name || et);
                setEmploymentTypes(employmentTypeValues);
            }
            
            if (locationsResult.success) {
                setLocations(locationsResult.data || []);
            }
            
        } catch (error) {
            console.error('Error loading master data:', error);
        } finally {
            setMasterDataLoading(false);
        }
    };

    const loadEmployee = async () => {
        try {
            setLoading(true);
            setError('');
            
            const result = await employeeService.getEmployeeById(employeeId);
            
            if (result.success) {
                // Transform backend data to match frontend expectations
                const transformedEmployee = {
                    id: result.data.employee_code,
                    employee_id: result.data.employee_id,
                    employee_code: result.data.employee_code,
                    name: `${result.data.first_name} ${result.data.last_name}`,
                    first_name: result.data.first_name,
                    last_name: result.data.last_name,
                    email: result.data.email,
                    phone: result.data.phone || '',
                    department: result.data.department,
                    designation: result.data.designation,
                    status: result.data.status,
                    dob: result.data.dob,
                    date_of_joining: result.data.date_of_joining,
                    dateOfJoining: result.data.date_of_joining ? new Date(result.data.date_of_joining).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    }) : 'Not provided',
                    dateOfBirth: result.data.dob ? new Date(result.data.dob).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    }) : 'Not provided',
                    gender: result.data.gender || '',
                    address: result.data.address || '',
                    emergencyContact: result.data.emergency_contact || '',
                    employmentType: result.data.employment_type || '',
                    workLocation: result.data.work_location || '',
                    manager_id: result.data.manager_id,
                    reportingManager: result.data.manager_id ? `Manager ID: ${result.data.manager_id}` : 'Not assigned',
                    photo_path: result.data.photo_path || null,
                    face_registered_at: result.data.face_registered_at || null
                };
                
                setEmployee(transformedEmployee);
                setEditedData(transformedEmployee);
            } else {
                setError(result.error);
            }
        } catch (error) {
            setError('Failed to load employee data');
            console.error('Load employee error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        // In edit mode, only allow switching between editable tabs (0=Personal, 1=Official)
        if (isEditing && newValue > 1) {
            return;
        }
        setActiveTab(newValue);
    };

    const handleEditClick = async () => {
        // Load master data FIRST before entering edit mode
        if (departments.length === 0 || designations.length === 0 || locations.length === 0 || genders.length === 0 || employmentTypes.length === 0) {
            await loadMasterData();
        }
        
        // Then enter edit mode
        setIsEditing(true);
        setEditedData({ ...employee });
    };

    const handleCancelEdit = () => {
        if (hasUnsavedChanges) {
            setShowCancelDialog(true);
        } else {
            setIsEditing(false);
            setEditedData({ ...employee });
        }
    };

    const handleConfirmCancel = () => {
        setIsEditing(false);
        setEditedData({ ...employee });
        setHasUnsavedChanges(false);
        setShowCancelDialog(false);
    };

    const handleFieldChange = (field, value) => {
        setEditedData(prev => ({
            ...prev,
            [field]: value
        }));
        setHasUnsavedChanges(true);
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        setError('');

        try {
            // Helper function to convert date to YYYY-MM-DD format
            const formatDateForBackend = (dateValue) => {
                if (!dateValue || dateValue === 'Not provided') return null;
                
                // If it's already in YYYY-MM-DD format, return as is
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                    return dateValue;
                }
                
                // If it's a Date object or parseable date string, convert it
                try {
                    const date = new Date(dateValue);
                    if (!isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    }
                } catch (e) {
                    console.error('Date conversion error:', e);
                }
                
                return null;
            };

            const updateData = {
                first_name: editedData.first_name,
                last_name: editedData.last_name,
                email: editedData.email,
                phone: editedData.phone || null,
                dob: formatDateForBackend(editedData.dob),
                gender: editedData.gender || null,
                address: editedData.address || null,
                emergency_contact: editedData.emergencyContact || null,
                department: editedData.department,
                designation: editedData.designation,
                date_of_joining: formatDateForBackend(editedData.date_of_joining),
                employment_type: editedData.employmentType || null,
                work_location: editedData.workLocation || null,
                manager_id: editedData.manager_id || null
            };

            const result = await employeeService.updateEmployee(employee.employee_id, updateData);
            
            if (result.success) {
                setIsEditing(false);
                setHasUnsavedChanges(false);
                await loadEmployee(); // Reload to get fresh data
            } else {
                setError(result.error || 'Failed to update employee');
            }
        } catch (err) {
            setError('An error occurred while updating employee');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = (newStatus) => {
        // Update the employee status in the current state
        setEmployee(prev => ({
            ...prev,
            status: newStatus
        }));
        
        // Also update editedData if in editing mode
        if (isEditing) {
            setEditedData(prev => ({
                ...prev,
                status: newStatus
            }));
        }
    };

    const handleBackClick = () => {
        if (isEditing && hasUnsavedChanges) {
            setShowCancelDialog(true);
        } else {
            navigate('/employees');
        }
    };

    const tabs = [
        { label: 'Personal Info', icon: <PersonIcon /> },
        { label: 'Official Info', icon: <BusinessIcon /> },
        { label: 'Status Management', icon: <StatusIcon /> },
        { label: 'Attendance', icon: <AttendanceIcon /> },
        { label: 'Leave', icon: <LeaveIcon /> },
        { label: 'Salary', icon: <SalaryIcon /> },
        { label: 'Documents', icon: <DocumentsIcon /> },
        { label: 'Letters', icon: <LettersIcon /> },
    ];

    // Loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Error state
    if (error) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="error" gutterBottom>
                        Employee Not Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        The employee with ID "{employeeId}" could not be found.
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/employees')}>
                        Back to Employee List
                    </Button>
                </Box>
            </Box>
        );
    }

    // No employee data
    if (!employee) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                <Typography variant="h5" color="error" gutterBottom>
                    Employee Not Found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    The employee with ID "{employeeId}" could not be found.
                </Typography>
                <Button variant="contained" onClick={() => navigate('/employees')}>
                    Back to Employee List
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Breadcrumbs and Back Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<BackIcon />}
                    onClick={handleBackClick}
                    sx={{ minWidth: 'auto' }}
                >
                    Back
                </Button>
                <Breadcrumbs>
                    <Link 
                        color="inherit" 
                        href="/employees" 
                        onClick={(e) => {
                            e.preventDefault();
                            handleBackClick();
                        }}
                        sx={{ cursor: 'pointer' }}
                    >
                        Employees
                    </Link>
                    <Typography color="text.primary">{employee.name}</Typography>
                </Breadcrumbs>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Edit Mode Actions */}
            {isEditing && (
                <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={handleCancelEdit}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveChanges}
                        disabled={saving || !hasUnsavedChanges}
                        startIcon={saving && <CircularProgress size={20} />}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </Paper>
            )}

            {/* Profile Header */}
            <ProfileHeader 
                employee={isEditing ? editedData : employee} 
                onEditClick={handleEditClick}
                isEditing={isEditing}
                onPhotoUpdate={loadEmployee}
                activeTab={activeTab}
            />

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            minHeight: 64,
                            textTransform: 'none',
                            fontWeight: 500,
                        },
                        ...(isEditing && {
                            '& .MuiTab-root:nth-of-type(n+3)': {
                                opacity: 0.4,
                                pointerEvents: 'none',
                                color: 'text.disabled',
                            }
                        })
                    }}
                >
                    {tabs.map((tab, index) => (
                        <Tab
                            key={index}
                            label={tab.label}
                            icon={tab.icon}
                            iconPosition="start"
                            sx={{
                                '& .MuiTab-iconWrapper': {
                                    mr: 1,
                                }
                            }}
                        />
                    ))}
                </Tabs>

                {/* Tab Panels */}
                <TabPanel value={activeTab} index={0}>
                    <PersonalInfo 
                        employee={isEditing ? editedData : employee}
                        isEditing={isEditing}
                        onFieldChange={handleFieldChange}
                        genderOptions={genders}
                    />
                </TabPanel>
                <TabPanel value={activeTab} index={1}>
                    <OfficialInfo 
                        employee={isEditing ? editedData : employee}
                        isEditing={isEditing}
                        onFieldChange={handleFieldChange}
                        departments={departments}
                        designations={designations}
                        locations={locations}
                        employmentTypes={employmentTypes}
                    />
                </TabPanel>
                <TabPanel value={activeTab} index={2}>
                    <StatusManagement 
                        employee={employee}
                        onStatusChange={handleStatusChange}
                    />
                </TabPanel>
                <TabPanel value={activeTab} index={3}>
                    <AttendancePreview employee={employee} />
                </TabPanel>
                <TabPanel value={activeTab} index={4}>
                    <LeavePreview employee={employee} />
                </TabPanel>
                <TabPanel value={activeTab} index={5}>
                    <SalaryPreview employee={employee} />
                </TabPanel>
                <TabPanel value={activeTab} index={6}>
                    <DocumentsTab employee={employee} />
                </TabPanel>
                <TabPanel value={activeTab} index={7}>
                    <LettersTab employee={employee} />
                </TabPanel>
            </Paper>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
                <DialogTitle>Unsaved Changes</DialogTitle>
                <DialogContent>
                    <Typography>
                        You have unsaved changes. Are you sure you want to cancel? All changes will be lost.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCancelDialog(false)}>
                        Continue Editing
                    </Button>
                    <Button onClick={handleConfirmCancel} color="error" variant="contained">
                        Discard Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmployeeProfile;