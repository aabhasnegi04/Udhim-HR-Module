import { Chip } from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Warning as WarningIcon,
    Schedule as ScheduleIcon,
    Home as HomeIcon,
    BeachAccess as LeaveIcon
} from '@mui/icons-material';

const StatusChip = ({ status, size = 'small', variant = 'filled' }) => {
    const getStatusConfig = (status) => {
        const normalizedStatus = status?.toLowerCase().trim();
        
        switch (normalizedStatus) {
            case 'present':
                return {
                    color: 'success',
                    icon: <CheckCircleIcon />,
                    label: 'Present'
                };
            case 'absent':
                return {
                    color: 'error',
                    icon: <CancelIcon />,
                    label: 'Absent'
                };
            case 'late':
                return {
                    color: 'warning',
                    icon: <WarningIcon />,
                    label: 'Late'
                };
            case 'half day':
            case 'halfday':
                return {
                    color: 'info',
                    icon: <ScheduleIcon />,
                    label: 'Half Day'
                };
            case 'work from home':
            case 'wfh':
                return {
                    color: 'secondary',
                    icon: <HomeIcon />,
                    label: 'WFH'
                };
            case 'on leave':
            case 'leave':
                return {
                    color: 'info',
                    icon: <LeaveIcon />,
                    label: 'On Leave'
                };
            case 'pending':
                return {
                    color: 'warning',
                    icon: <ScheduleIcon />,
                    label: 'Pending'
                };
            case 'approved':
                return {
                    color: 'success',
                    icon: <CheckCircleIcon />,
                    label: 'Approved'
                };
            case 'rejected':
                return {
                    color: 'error',
                    icon: <CancelIcon />,
                    label: 'Rejected'
                };
            default:
                return {
                    color: 'default',
                    icon: <ScheduleIcon />,
                    label: status || 'Unknown'
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <Chip
            label={config.label}
            color={config.color}
            size={size}
            variant={variant}
            icon={config.icon}
            sx={{
                fontWeight: 500,
                '& .MuiChip-icon': {
                    fontSize: size === 'small' ? '0.875rem' : '1rem'
                }
            }}
        />
    );
};

export default StatusChip;