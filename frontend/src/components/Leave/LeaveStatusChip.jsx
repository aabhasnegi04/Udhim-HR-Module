import { Chip } from '@mui/material';

const LeaveStatusChip = ({ status, size = 'small', sx = {} }) => {
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'error';
            case 'cancelled': return 'default';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return '✅';
            case 'pending': return '⏳';
            case 'rejected': return '❌';
            case 'cancelled': return '🚫';
            default: return '📋';
        }
    };

    return (
        <Chip
            label={status}
            color={getStatusColor(status)}
            size={size}
            icon={<span>{getStatusIcon(status)}</span>}
            sx={{ 
                textTransform: 'capitalize',
                ...sx 
            }}
        />
    );
};

export default LeaveStatusChip;