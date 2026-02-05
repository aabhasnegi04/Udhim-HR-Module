import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Alert,
    CircularProgress,
    Snackbar
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Business as DepartmentIcon,
    Work as DesignationIcon,
    LocationOn as LocationIcon
} from '@mui/icons-material';

// Import admin service
import adminService from '../../services/adminService';

const MasterData = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogType, setDialogType] = useState('');
    const [editItem, setEditItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Data states
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [locations, setLocations] = useState([]);
    
    // Form states
    const [formData, setFormData] = useState({});

    const masterTabs = [
        { label: 'Departments', icon: <DepartmentIcon />, data: departments },
        { label: 'Designations', icon: <DesignationIcon />, data: designations },
        { label: 'Locations', icon: <LocationIcon />, data: locations }
    ];

    // Load data on component mount
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [deptResult, desigResult, locResult] = await Promise.all([
                adminService.getDepartments(),
                adminService.getDesignations(),
                adminService.getLocations()
            ]);

            if (deptResult.success) setDepartments(deptResult.data);
            if (desigResult.success) setDesignations(desigResult.data);
            if (locResult.success) setLocations(locResult.data);
        } catch (error) {
            setError('Failed to load master data');
            console.error('Load master data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleAdd = (type) => {
        setDialogType(type);
        setEditItem(null);
        setFormData({});
        setOpenDialog(true);
    };

    const handleEdit = (type, item) => {
        setDialogType(type);
        setEditItem(item);
        setFormData(item);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditItem(null);
        setDialogType('');
        setFormData({});
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            let result;

            if (dialogType === 'departments') {
                const data = {
                    department_code: formData.department_code || formData.department_name?.substring(0, 3).toUpperCase(),
                    department_name: formData.department_name
                };
                result = await adminService.addDepartment(data);
            } else if (dialogType === 'designations') {
                const data = {
                    designation_name: formData.designation_name,
                    designation_level: parseInt(formData.designation_level) || null
                };
                result = await adminService.addDesignation(data);
            } else if (dialogType === 'locations') {
                const data = {
                    location_name: formData.location_name,
                    city: formData.city,
                    country: formData.country
                };
                result = await adminService.addLocation(data);
            }

            if (result?.success) {
                setSuccess(`${dialogType.slice(0, -1)} ${editItem ? 'updated' : 'added'} successfully`);
                handleCloseDialog();
                loadAllData(); // Reload data
            } else {
                setError(result?.error || 'Operation failed');
            }
        } catch (error) {
            setError('Operation failed');
            console.error('Submit error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderDepartmentTable = () => (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Department Code</TableCell>
                        <TableCell>Department Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {departments.map((dept) => (
                        <TableRow key={dept.department_id}>
                            <TableCell>
                                <Chip 
                                    label={dept.department_code} 
                                    color="primary" 
                                    size="small" 
                                />
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {dept.department_name}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Chip 
                                    label={dept.is_active ? 'Active' : 'Inactive'} 
                                    color={dept.is_active ? 'success' : 'default'} 
                                    size="small" 
                                />
                            </TableCell>
                            <TableCell align="right">
                                <IconButton 
                                    size="small" 
                                    onClick={() => handleEdit('departments', dept)}
                                >
                                    <EditIcon />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const renderDesignationTable = () => (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Designation Name</TableCell>
                        <TableCell>Level</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {designations.map((designation) => (
                        <TableRow key={designation.designation_id}>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {designation.designation_name}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                {designation.designation_level ? (
                                    <Chip 
                                        label={`Level ${designation.designation_level}`} 
                                        color="primary" 
                                        size="small" 
                                    />
                                ) : 'Not set'}
                            </TableCell>
                            <TableCell>
                                <Chip 
                                    label={designation.is_active ? 'Active' : 'Inactive'} 
                                    color={designation.is_active ? 'success' : 'default'} 
                                    size="small" 
                                />
                            </TableCell>
                            <TableCell align="right">
                                <IconButton 
                                    size="small" 
                                    onClick={() => handleEdit('designations', designation)}
                                >
                                    <EditIcon />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const renderLocationTable = () => (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Location Name</TableCell>
                        <TableCell>City</TableCell>
                        <TableCell>Country</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {locations.map((location) => (
                        <TableRow key={location.location_id}>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {location.location_name}
                                </Typography>
                            </TableCell>
                            <TableCell>{location.city}</TableCell>
                            <TableCell>{location.country}</TableCell>
                            <TableCell>
                                <Chip 
                                    label={location.is_active ? 'Active' : 'Inactive'} 
                                    color={location.is_active ? 'success' : 'default'} 
                                    size="small" 
                                />
                            </TableCell>
                            <TableCell align="right">
                                <IconButton 
                                    size="small" 
                                    onClick={() => handleEdit('locations', location)}
                                >
                                    <EditIcon />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const renderTable = () => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            );
        }

        switch (activeTab) {
            case 0:
                return renderDepartmentTable();
            case 1:
                return renderDesignationTable();
            case 2:
                return renderLocationTable();
            default:
                return null;
        }
    };

    const getAddButtonText = () => {
        switch (activeTab) {
            case 0:
                return 'Add Department';
            case 1:
                return 'Add Designation';
            case 2:
                return 'Add Location';
            default:
                return 'Add';
        }
    };

    return (
        <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
                Master data configured here will be used across all modules. Changes affect the entire system.
            </Alert>

            {/* Error/Success Messages */}
            <Snackbar 
                open={!!error} 
                autoHideDuration={6000} 
                onClose={() => setError('')}
            >
                <Alert severity="error" onClose={() => setError('')}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar 
                open={!!success} 
                autoHideDuration={6000} 
                onClose={() => setSuccess('')}
            >
                <Alert severity="success" onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            </Snackbar>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 0 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 500
                            }
                        }}
                    >
                        {masterTabs.map((tab, index) => (
                            <Tab
                                key={index}
                                label={
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        {tab.icon}
                                        <Typography variant="body2">
                                            {tab.label} ({tab.data.length})
                                        </Typography>
                                    </Stack>
                                }
                            />
                        ))}
                    </Tabs>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleAdd(masterTabs[activeTab].label.toLowerCase())}
                        disabled={loading}
                    >
                        {getAddButtonText()}
                    </Button>
                </Box>
            </Paper>

            {/* Table */}
            <Paper>
                {renderTable()}
            </Paper>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editItem ? 'Edit' : 'Add'} {dialogType.slice(0, -1)}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {dialogType === 'departments' && (
                            <>
                                <TextField
                                    label="Department Name"
                                    fullWidth
                                    value={formData.department_name || ''}
                                    onChange={(e) => handleFormChange('department_name', e.target.value)}
                                    required
                                />
                                <TextField
                                    label="Department Code"
                                    fullWidth
                                    value={formData.department_code || ''}
                                    onChange={(e) => handleFormChange('department_code', e.target.value)}
                                    helperText="3-letter code (e.g., ENG, HR, FIN)"
                                />
                            </>
                        )}
                        {dialogType === 'designations' && (
                            <>
                                <TextField
                                    label="Designation Name"
                                    fullWidth
                                    value={formData.designation_name || ''}
                                    onChange={(e) => handleFormChange('designation_name', e.target.value)}
                                    required
                                />
                                <TextField
                                    label="Designation Level"
                                    type="number"
                                    fullWidth
                                    value={formData.designation_level || ''}
                                    onChange={(e) => handleFormChange('designation_level', e.target.value)}
                                    helperText="Numeric level (1-10)"
                                />
                            </>
                        )}
                        {dialogType === 'locations' && (
                            <>
                                <TextField
                                    label="Location Name"
                                    fullWidth
                                    value={formData.location_name || ''}
                                    onChange={(e) => handleFormChange('location_name', e.target.value)}
                                    required
                                />
                                <TextField
                                    label="City"
                                    fullWidth
                                    value={formData.city || ''}
                                    onChange={(e) => handleFormChange('city', e.target.value)}
                                    required
                                />
                                <TextField
                                    label="Country"
                                    fullWidth
                                    value={formData.country || ''}
                                    onChange={(e) => handleFormChange('country', e.target.value)}
                                    required
                                />
                            </>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={loading}>
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={20} /> : (editItem ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MasterData;