import {
    Card,
    CardContent,
    Typography,
    Box,
    LinearProgress,
    Chip
} from '@mui/material';
import { BeachAccess as LeaveIcon } from '@mui/icons-material';

const LeaveBalanceCard = ({ 
    title, 
    total, 
    used, 
    remaining, 
    icon, 
    color = 'primary',
    onClick,
    isSelected = false 
}) => {
    const percentage = Math.round((remaining / total) * 100);
    
    return (
        <Card 
            sx={{ 
                height: '100%',
                border: isSelected ? 2 : 1,
                borderColor: isSelected ? `${color}.main` : 'divider',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                '&:hover': onClick ? {
                    borderColor: `${color}.main`,
                    boxShadow: 2
                } : {}
            }}
            onClick={onClick}
        >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                        sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: `${color}.light`,
                            color: `${color}.contrastText`,
                            mr: 2
                        }}
                    >
                        {icon || <LeaveIcon />}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                            {remaining}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Used: {used} / {total}
                    </Typography>
                    <Chip
                        label={`${percentage}%`}
                        color={percentage > 50 ? 'success' : percentage > 25 ? 'warning' : 'error'}
                        size="small"
                    />
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={percentage}
                    color={percentage > 50 ? 'success' : percentage > 25 ? 'warning' : 'error'}
                    sx={{ height: 6, borderRadius: 3 }}
                />
            </CardContent>
        </Card>
    );
};

export default LeaveBalanceCard;