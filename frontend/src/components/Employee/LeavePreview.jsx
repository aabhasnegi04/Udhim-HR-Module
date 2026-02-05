import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Avatar,
    LinearProgress,
} from '@mui/material';
import {
    BeachAccess as LeaveIcon,
    LocalHospital as SickIcon,
    Person as PersonalIcon,
    Event as EventIcon,
} from '@mui/icons-material';

const LeaveBalanceCard = ({ title, used, total, icon, color }) => {
    const remaining = total - used;
    const percentage = (used / total) * 100;

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {remaining}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            of {total} days remaining
                        </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 48, height: 48 }}>
                        {icon}
                    </Avatar>
                </Box>
                <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Used: {used} days
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {percentage.toFixed(0)}%
                        </Typography>
                    </Box>
                    <LinearProgress 
                        variant="determinate" 
                        value={percentage} 
                        sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                bgcolor: `${color}.main`
                            }
                        }} 
                    />
                </Box>
            </CardContent>
        </Card>
    );
};

const LeavePreview = ({ employee }) => {
    if (!employee) return null;

    // Mock leave balance data
    const leaveBalance = [
        { type: 'Annual Leave', used: 8, total: 20, icon: <LeaveIcon />, color: 'primary' },
        { type: 'Sick Leave', used: 3, total: 10, icon: <SickIcon />, color: 'error' },
        { type: 'Personal Leave', used: 2, total: 5, icon: <PersonalIcon />, color: 'warning' },
        { type: 'Casual Leave', used: 1, total: 7, icon: <EventIcon />, color: 'success' },
    ];

    // Mock leave history
    const leaveHistory = [
        { 
            id: 1, 
            type: 'Annual Leave', 
            from: 'Dec 20, 2025', 
            to: 'Dec 22, 2025', 
            days: 3, 
            status: 'Approved',
            reason: 'Family vacation'
        },
        { 
            id: 2, 
            type: 'Sick Leave', 
            from: 'Dec 15, 2025', 
            to: 'Dec 15, 2025', 
            days: 1, 
            status: 'Approved',
            reason: 'Medical appointment'
        },
        { 
            id: 3, 
            type: 'Personal Leave', 
            from: 'Dec 10, 2025', 
            to: 'Dec 11, 2025', 
            days: 2, 
            status: 'Approved',
            reason: 'Personal work'
        },
        { 
            id: 4, 
            type: 'Annual Leave', 
            from: 'Jan 5, 2026', 
            to: 'Jan 9, 2026', 
            days: 5, 
            status: 'Pending',
            reason: 'New Year vacation'
        },
        { 
            id: 5, 
            type: 'Sick Leave', 
            from: 'Nov 28, 2025', 
            to: 'Nov 29, 2025', 
            days: 2, 
            status: 'Rejected',
            reason: 'Flu symptoms'
        },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'success';
            case 'Pending': return 'warning';
            case 'Rejected': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ mt: 3 }}>
            {/* Leave Balance Cards */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                Leave Balance
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {leaveBalance.map((leave, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <LeaveBalanceCard
                            title={leave.type}
                            used={leave.used}
                            total={leave.total}
                            icon={leave.icon}
                            color={leave.color}
                        />
                    </Grid>
                ))}
            </Grid>

            {/* Leave History */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Leave History
                </Typography>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>From</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>To</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Days</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaveHistory.map((leave) => (
                                <TableRow key={leave.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>
                                        {leave.type}
                                    </TableCell>
                                    <TableCell>{leave.from}</TableCell>
                                    <TableCell>{leave.to}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {leave.days}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={leave.status}
                                            color={getStatusColor(leave.status)}
                                            size="small"
                                            sx={{ fontWeight: 500 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {leave.reason}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default LeavePreview;