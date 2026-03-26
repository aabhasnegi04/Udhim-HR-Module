import {
    Box,
    Typography,
    Paper,
    Grid,
    Chip,
    TextField,
    MenuItem,
} from '@mui/material';
import {
    Badge as BadgeIcon,
    CalendarToday as CalendarIcon,
    Business as BusinessIcon,
    Work as WorkIcon,
    SupervisorAccount as ManagerIcon,
    Category as CategoryIcon,
    LocationOn as LocationIcon,
} from '@mui/icons-material';
import AppDatePicker from '../common/AppDatePicker';

const InfoItem = ({ icon, label, value, isChip = false, chipColor = 'primary', isEditing, field, onFieldChange, type = 'text', options = [] }) => {
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
                {isEditing && field ? (
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
                            sx={{ mt: 0.5 }}
                        />
                    )
                ) : isChip ? (
                    <Box sx={{ mt: 1 }}>
                        <Chip 
                            label={value || 'Not provided'} 
                            color={chipColor}
                            size="small"
                            sx={{ fontWeight: 500 }}
                        />
                    </Box>
                ) : (
                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                        {value || 'Not provided'}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

const OfficialInfo = ({ employee, isEditing, onFieldChange, employmentTypes = [], departments = [], designations = [], locations = [] }) => {
    if (!employee) return null;

    return (
        <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                    Official Information
                </Typography>
                
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <InfoItem
                            icon={<BadgeIcon />}
                            label="Employee ID"
                            value={employee.id}
                            isEditing={false}
                        />
                        <InfoItem
                            icon={<CalendarIcon />}
                            label="Date of Joining"
                            value={isEditing ? employee.date_of_joining : employee.dateOfJoining}
                            isEditing={isEditing}
                            field="date_of_joining"
                            onFieldChange={onFieldChange}
                            type="date"
                        />
                        <InfoItem
                            icon={<BusinessIcon />}
                            label="Department"
                            value={employee.department}
                            isEditing={isEditing}
                            field="department"
                            onFieldChange={onFieldChange}
                            type={isEditing ? "select" : "text"}
                            options={departments.map(dept => dept.department_name || dept)}
                        />
                        <InfoItem
                            icon={<WorkIcon />}
                            label="Designation"
                            value={employee.designation}
                            isEditing={isEditing}
                            field="designation"
                            onFieldChange={onFieldChange}
                            type={isEditing ? "select" : "text"}
                            options={designations.map(designation => designation.designation_name || designation)}
                        />
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 6 }}>
                        <InfoItem
                            icon={<CategoryIcon />}
                            label="Employment Type"
                            value={employee.employmentType}
                            isChip={!isEditing}
                            chipColor="success"
                            isEditing={isEditing}
                            field="employmentType"
                            onFieldChange={onFieldChange}
                            type="select"
                            options={employmentTypes}
                        />
                        <InfoItem
                            icon={<LocationIcon />}
                            label="Work Location"
                            value={employee.workLocation}
                            isEditing={isEditing}
                            field="workLocation"
                            onFieldChange={onFieldChange}
                            type={isEditing ? "select" : "text"}
                            options={locations.map(location => location.location_name || location)}
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default OfficialInfo;