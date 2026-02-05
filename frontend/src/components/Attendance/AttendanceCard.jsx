import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Avatar,
    IconButton,
    Stack
} from '@mui/material';
import {
    Edit as EditIcon,
    Schedule as ScheduleIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Warning as WarningIcon
} from '@mui/icons-material';

const AttendanceCard = ({ 
    employee, 
    date, 
    checkIn, 
    checkOut, 
    status, 
    workingHours, 
    onEdit,
    showActions = true 
}) => {
    const getStatusConfig = (status) => {
        switch (status?.toLowerCase()) {
            case 'present':
                return { color: 'success', icon: <CheckCircleIcon />, bg: 'success.light' };
            case 'absent':
                return { color: 'error', icon: <CancelIcon />, bg: 'error.light' };
            case 'late':
                return { color: 'warning', icon: <WarningIcon />, bg: 'warning.light' };
            case 'half day':
                return { color: 'info', icon: <ScheduleIcon />, bg: 'info.light' };
            case 'work from home':
            case 'wfh':
                return { color: 'secondary', icon: <ScheduleIcon />, bg: 'secondary.light' };
            default:
                return { color: 'default', icon: <ScheduleIcon />, bg: 'grey.100' };
        }
    };

    const statusConfig = getStatusConfig(status);

    return (
        <Card sx={{ 
            mb: 2, 
            '&:hover': { 
                boxShadow: 4,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
            } 
        }}>
            <CardContent sx={{ p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: statusConfig.bg }}>
                            {employee?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {employee || 'Unknown Employee'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {date || 'No date'}
                            </Typography>
                        </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            label={status || 'Unknown'}
                            color={statusConfig.color}
                            size="small"
                            icon={statusConfig.icon}
                        />
                        {showActions && (
                            <IconButton size="small" onClick={() => onEdit && onEdit()}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                </Box>

                {/* Time Details */}
                <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Check-in
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {checkIn || '--:--'}
                        </Typography>
                    </Box>
                    
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Check-out
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {checkOut || '--:--'}
                        </Typography>
                    </Box>
                    
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Working Hours
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {workingHours || '--:--'}
                        </Typography>
                    </Box>
                </Stack>

                {/* Additional Info for Mobile */}
                <Box sx={{ 
                    display: { xs: 'block', sm: 'none' }, 
                    mt: 2, 
                    pt: 2, 
                    borderTop: 1, 
                    borderColor: 'divider' 
                }}>
                    <Typography variant="caption" color="text.secondary">
                        Status: {status || 'Unknown'} • Hours: {workingHours || '--:--'}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default AttendanceCard;