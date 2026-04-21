import {
    Box,
    Typography,
    Paper,
    Grid,
    Divider,
    TextField,
    MenuItem,
    Alert,
} from '@mui/material';
import {
    Person as PersonIcon,
    Cake as CakeIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Home as HomeIcon,
    ContactEmergency as EmergencyIcon,
} from '@mui/icons-material';
import AppDatePicker from '../common/AppDatePicker';

const InfoItem = ({ icon, label, value, isEditing, field, onFieldChange, type = 'text', options = [] }) => {
    // Helper to convert date to YYYY-MM-DD format for input
    const getDateInputValue = (dateValue) => {
        if (!dateValue || dateValue === 'Not provided') return '';
        
        // If already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
        }
        
        // Try to parse and convert
        try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        } catch (e) {
            console.error('Date parsing error:', e);
        }
        
        return '';
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
            <Box sx={{ 
                p: 1, 
                borderRadius: 2, 
                bgcolor: 'primary.light', 
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {label}
                </Typography>
                {isEditing ? (
                    type === 'select' ? (
                        <TextField
                            select
                            fullWidth
                            size="small"
                            value={value || ''}
                            onChange={(e) => onFieldChange(field, e.target.value)}
                            sx={{ mt: 0.5 }}
                        >
                            {options.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                    ) : type === 'date' ? (
                        <AppDatePicker
                            value={getDateInputValue(value)}
                            onChange={(v) => onFieldChange(field, v)}
                            size="small"
                            sx={{ mt: 0.5 }}
                        />
                    ) : (
                        <TextField
                            fullWidth
                            size="small"
                            value={value || ''}
                            onChange={(e) => onFieldChange(field, e.target.value)}
                            multiline={type === 'textarea'}
                            rows={type === 'textarea' ? 2 : 1}
                            sx={{ mt: 0.5 }}
                        />
                    )
                ) : (
                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                        {value || 'Not provided'}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

const PersonalInfo = ({ employee, isEditing, onFieldChange, genderOptions = [] }) => {
    if (!employee) return null;

    return (
        <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                    Personal Information
                </Typography>
                
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <InfoItem
                            icon={<PersonIcon />}
                            label="First Name"
                            value={employee.first_name}
                            isEditing={isEditing}
                            field="first_name"
                            onFieldChange={onFieldChange}
                        />
                        <InfoItem
                            icon={<PersonIcon />}
                            label="Last Name"
                            value={employee.last_name}
                            isEditing={isEditing}
                            field="last_name"
                            onFieldChange={onFieldChange}
                        />
                        <InfoItem
                            icon={<CakeIcon />}
                            label="Date of Birth"
                            value={isEditing ? employee.dob : employee.dateOfBirth}
                            isEditing={isEditing}
                            field="dob"
                            onFieldChange={onFieldChange}
                            type="date"
                        />
                        <InfoItem
                            icon={<PersonIcon />}
                            label="Gender"
                            value={employee.gender}
                            isEditing={isEditing}
                            field="gender"
                            onFieldChange={onFieldChange}
                            type="select"
                            options={genderOptions}
                        />
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 6 }}>
                        <InfoItem
                            icon={<PhoneIcon />}
                            label="Phone Number"
                            value={employee.phone}
                            isEditing={isEditing}
                            field="phone"
                            onFieldChange={onFieldChange}
                        />
                        <InfoItem
                            icon={<EmailIcon />}
                            label="Email Address (Optional)"
                            value={employee.email}
                            isEditing={isEditing}
                            field="email"
                            onFieldChange={onFieldChange}
                        />
                        {isEditing && !employee.email && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                Adding an email will automatically create a login account for this employee with role based on their designation.
                            </Alert>
                        )}
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                    Contact Information
                </Typography>

                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <InfoItem
                            icon={<HomeIcon />}
                            label="Address"
                            value={employee.address}
                            isEditing={isEditing}
                            field="address"
                            onFieldChange={onFieldChange}
                            type="textarea"
                        />
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 6 }}>
                        <InfoItem
                            icon={<EmergencyIcon />}
                            label="Emergency Contact"
                            value={employee.emergencyContact}
                            isEditing={isEditing}
                            field="emergencyContact"
                            onFieldChange={onFieldChange}
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default PersonalInfo;