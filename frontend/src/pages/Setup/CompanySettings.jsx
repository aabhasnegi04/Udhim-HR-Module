import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Grid,
    Divider,
    Alert,
    Switch,
    FormControlLabel,
    Chip,
    IconButton,
    Stack
} from '@mui/material';
import {
    Business as BusinessIcon,
    LocationOn as LocationIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Language as WebsiteIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

// Mock company settings data
const mockCompanySettings = {
    basicInfo: {
        companyName: 'Udhim Technologies',
        industry: 'Information Technology',
        companySize: '50-100',
        foundedYear: '2020',
        website: 'https://www.udhim.com',
        description: 'Leading software development company specializing in web and mobile applications.'
    },
    contactInfo: {
        email: 'contact@udhim.com',
        phone: '+91 98765 43210',
        alternatePhone: '+91 98765 43211',
        fax: ''
    },
    address: {
        street: '123 Tech Park',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560001'
    },
    hrSettings: {
        workingDaysPerWeek: 5,
        workingHoursPerDay: 8,
        weekStartDay: 'Monday',
        fiscalYearStart: 'April',
        probationPeriod: 6,
        noticePeriod: 30,
        leaveYearStart: 'January'
    },
    payrollSettings: {
        currency: 'INR',
        payrollCycle: 'Monthly',
        salaryProcessingDay: 28,
        pfRate: 12,
        esiRate: 1.75,
        professionalTax: 200,
        gratuityEligibility: 5
    },
    departments: [
        'Engineering',
        'Human Resources',
        'Sales',
        'Marketing',
        'Finance',
        'Operations'
    ],
    designations: [
        'Software Engineer',
        'Senior Software Engineer',
        'Team Lead',
        'Manager',
        'Senior Manager',
        'Director'
    ]
};

const CompanySettings = () => {
    const [settings, setSettings] = useState(mockCompanySettings);
    const [hasChanges, setHasChanges] = useState(false);
    const [newDepartment, setNewDepartment] = useState('');
    const [newDesignation, setNewDesignation] = useState('');

    const handleInputChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
        setHasChanges(true);
    };

    const handleAddDepartment = () => {
        if (newDepartment.trim() && !settings.departments.includes(newDepartment.trim())) {
            setSettings(prev => ({
                ...prev,
                departments: [...prev.departments, newDepartment.trim()]
            }));
            setNewDepartment('');
            setHasChanges(true);
        }
    };

    const handleRemoveDepartment = (department) => {
        setSettings(prev => ({
            ...prev,
            departments: prev.departments.filter(d => d !== department)
        }));
        setHasChanges(true);
    };

    const handleAddDesignation = () => {
        if (newDesignation.trim() && !settings.designations.includes(newDesignation.trim())) {
            setSettings(prev => ({
                ...prev,
                designations: [...prev.designations, newDesignation.trim()]
            }));
            setNewDesignation('');
            setHasChanges(true);
        }
    };

    const handleRemoveDesignation = (designation) => {
        setSettings(prev => ({
            ...prev,
            designations: prev.designations.filter(d => d !== designation)
        }));
        setHasChanges(true);
    };

    const handleSaveSettings = () => {
        // In real app, this would save to backend
        console.log('Saving settings:', settings);
        setHasChanges(false);
        // Show success message
    };

    const handleResetSettings = () => {
        setSettings(mockCompanySettings);
        setHasChanges(false);
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Company Settings
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Configure company information and HR policies
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleResetSettings}
                            size="small"
                        >
                            Reset
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveSettings}
                            disabled={!hasChanges}
                        >
                            Save Changes
                        </Button>
                    </Stack>
                </Box>
                {hasChanges && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        You have unsaved changes. Don't forget to save your settings.
                    </Alert>
                )}
            </Box>

            <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <BusinessIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Basic Information
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Company Name"
                                value={settings.basicInfo.companyName}
                                onChange={(e) => handleInputChange('basicInfo', 'companyName', e.target.value)}
                            />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Industry"
                                    value={settings.basicInfo.industry}
                                    onChange={(e) => handleInputChange('basicInfo', 'industry', e.target.value)}
                                />
                                <TextField
                                    fullWidth
                                    label="Founded Year"
                                    type="number"
                                    value={settings.basicInfo.foundedYear}
                                    onChange={(e) => handleInputChange('basicInfo', 'foundedYear', e.target.value)}
                                />
                            </Box>
                            <FormControl fullWidth>
                                <InputLabel>Company Size</InputLabel>
                                <Select
                                    value={settings.basicInfo.companySize}
                                    label="Company Size"
                                    onChange={(e) => handleInputChange('basicInfo', 'companySize', e.target.value)}
                                >
                                    <MenuItem value="1-10">1-10 employees</MenuItem>
                                    <MenuItem value="11-50">11-50 employees</MenuItem>
                                    <MenuItem value="50-100">50-100 employees</MenuItem>
                                    <MenuItem value="100-500">100-500 employees</MenuItem>
                                    <MenuItem value="500+">500+ employees</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth
                                label="Website"
                                value={settings.basicInfo.website}
                                onChange={(e) => handleInputChange('basicInfo', 'website', e.target.value)}
                            />
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={settings.basicInfo.description}
                                onChange={(e) => handleInputChange('basicInfo', 'description', e.target.value)}
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* Contact Information */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <EmailIcon sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Contact Information
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Primary Email"
                                type="email"
                                value={settings.contactInfo.email}
                                onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value)}
                            />
                            <TextField
                                fullWidth
                                label="Primary Phone"
                                value={settings.contactInfo.phone}
                                onChange={(e) => handleInputChange('contactInfo', 'phone', e.target.value)}
                            />
                            <TextField
                                fullWidth
                                label="Alternate Phone"
                                value={settings.contactInfo.alternatePhone}
                                onChange={(e) => handleInputChange('contactInfo', 'alternatePhone', e.target.value)}
                            />
                            <TextField
                                fullWidth
                                label="Fax"
                                value={settings.contactInfo.fax}
                                onChange={(e) => handleInputChange('contactInfo', 'fax', e.target.value)}
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* Address */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <LocationIcon sx={{ fontSize: 32, color: 'warning.main', mr: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Address
                            </Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Street Address"
                                    value={settings.address.street}
                                    onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="City"
                                    value={settings.address.city}
                                    onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="State/Province"
                                    value={settings.address.state}
                                    onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Country"
                                    value={settings.address.country}
                                    onChange={(e) => handleInputChange('address', 'country', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Postal Code"
                                    value={settings.address.postalCode}
                                    onChange={(e) => handleInputChange('address', 'postalCode', e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* HR Settings */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            HR Settings
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Working Days/Week"
                                    type="number"
                                    value={settings.hrSettings.workingDaysPerWeek}
                                    onChange={(e) => handleInputChange('hrSettings', 'workingDaysPerWeek', e.target.value)}
                                />
                                <TextField
                                    fullWidth
                                    label="Working Hours/Day"
                                    type="number"
                                    value={settings.hrSettings.workingHoursPerDay}
                                    onChange={(e) => handleInputChange('hrSettings', 'workingHoursPerDay', e.target.value)}
                                />
                            </Box>
                            <FormControl fullWidth>
                                <InputLabel>Week Start Day</InputLabel>
                                <Select
                                    value={settings.hrSettings.weekStartDay}
                                    label="Week Start Day"
                                    onChange={(e) => handleInputChange('hrSettings', 'weekStartDay', e.target.value)}
                                >
                                    <MenuItem value="Monday">Monday</MenuItem>
                                    <MenuItem value="Sunday">Sunday</MenuItem>
                                </Select>
                            </FormControl>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Fiscal Year Start</InputLabel>
                                    <Select
                                        value={settings.hrSettings.fiscalYearStart}
                                        label="Fiscal Year Start"
                                        onChange={(e) => handleInputChange('hrSettings', 'fiscalYearStart', e.target.value)}
                                    >
                                        <MenuItem value="January">January</MenuItem>
                                        <MenuItem value="April">April</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>Leave Year Start</InputLabel>
                                    <Select
                                        value={settings.hrSettings.leaveYearStart}
                                        label="Leave Year Start"
                                        onChange={(e) => handleInputChange('hrSettings', 'leaveYearStart', e.target.value)}
                                    >
                                        <MenuItem value="January">January</MenuItem>
                                        <MenuItem value="April">April</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Probation Period (months)"
                                    type="number"
                                    value={settings.hrSettings.probationPeriod}
                                    onChange={(e) => handleInputChange('hrSettings', 'probationPeriod', e.target.value)}
                                />
                                <TextField
                                    fullWidth
                                    label="Notice Period (days)"
                                    type="number"
                                    value={settings.hrSettings.noticePeriod}
                                    onChange={(e) => handleInputChange('hrSettings', 'noticePeriod', e.target.value)}
                                />
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Payroll Settings */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            Payroll Settings
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Currency</InputLabel>
                                    <Select
                                        value={settings.payrollSettings.currency}
                                        label="Currency"
                                        onChange={(e) => handleInputChange('payrollSettings', 'currency', e.target.value)}
                                    >
                                        <MenuItem value="INR">INR (₹)</MenuItem>
                                        <MenuItem value="USD">USD ($)</MenuItem>
                                        <MenuItem value="EUR">EUR (€)</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>Payroll Cycle</InputLabel>
                                    <Select
                                        value={settings.payrollSettings.payrollCycle}
                                        label="Payroll Cycle"
                                        onChange={(e) => handleInputChange('payrollSettings', 'payrollCycle', e.target.value)}
                                    >
                                        <MenuItem value="Monthly">Monthly</MenuItem>
                                        <MenuItem value="Bi-weekly">Bi-weekly</MenuItem>
                                        <MenuItem value="Weekly">Weekly</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <TextField
                                fullWidth
                                label="Salary Processing Day"
                                type="number"
                                value={settings.payrollSettings.salaryProcessingDay}
                                onChange={(e) => handleInputChange('payrollSettings', 'salaryProcessingDay', e.target.value)}
                                helperText="Day of month when salary is processed"
                            />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="PF Rate (%)"
                                    type="number"
                                    value={settings.payrollSettings.pfRate}
                                    onChange={(e) => handleInputChange('payrollSettings', 'pfRate', e.target.value)}
                                />
                                <TextField
                                    fullWidth
                                    label="ESI Rate (%)"
                                    type="number"
                                    value={settings.payrollSettings.esiRate}
                                    onChange={(e) => handleInputChange('payrollSettings', 'esiRate', e.target.value)}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Professional Tax (₹)"
                                    type="number"
                                    value={settings.payrollSettings.professionalTax}
                                    onChange={(e) => handleInputChange('payrollSettings', 'professionalTax', e.target.value)}
                                />
                                <TextField
                                    fullWidth
                                    label="Gratuity Eligibility (years)"
                                    type="number"
                                    value={settings.payrollSettings.gratuityEligibility}
                                    onChange={(e) => handleInputChange('payrollSettings', 'gratuityEligibility', e.target.value)}
                                />
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Departments */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            Departments
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                                fullWidth
                                label="Add Department"
                                value={newDepartment}
                                onChange={(e) => setNewDepartment(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddDepartment()}
                                size="small"
                            />
                            <Button
                                variant="contained"
                                onClick={handleAddDepartment}
                                startIcon={<AddIcon />}
                                disabled={!newDepartment.trim()}
                            >
                                Add
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {settings.departments.map((department) => (
                                <Chip
                                    key={department}
                                    label={department}
                                    onDelete={() => handleRemoveDepartment(department)}
                                    deleteIcon={<DeleteIcon />}
                                />
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* Designations */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            Designations
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                                fullWidth
                                label="Add Designation"
                                value={newDesignation}
                                onChange={(e) => setNewDesignation(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddDesignation()}
                                size="small"
                            />
                            <Button
                                variant="contained"
                                onClick={handleAddDesignation}
                                startIcon={<AddIcon />}
                                disabled={!newDesignation.trim()}
                            >
                                Add
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {settings.designations.map((designation) => (
                                <Chip
                                    key={designation}
                                    label={designation}
                                    onDelete={() => handleRemoveDesignation(designation)}
                                    deleteIcon={<DeleteIcon />}
                                />
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CompanySettings;