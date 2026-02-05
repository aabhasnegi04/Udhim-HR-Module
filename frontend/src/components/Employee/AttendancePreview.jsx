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
    Button,
    Chip,
    Avatar,
} from '@mui/material';
import {
    CheckCircle as PresentIcon,
    Cancel as AbsentIcon,
    Schedule as LateIcon,
    TrendingUp as TrendingUpIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';

const AttendanceCard = ({ title, value, subtitle, icon, color }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {title}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {subtitle}
                    </Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 48, height: 48 }}>
                    {icon}
                </Avatar>
            </Box>
        </CardContent>
    </Card>
);

const AttendancePreview = ({ employee }) => {
    if (!employee) return null;

    // Mock attendance data
    const attendanceStats = {
        present: 22,
        absent: 2,
        late: 3,
        totalDays: 25,
        attendanceRate: 88
    };

    const recentAttendance = [
        { date: 'Dec 29, 2025', status: 'Present', checkIn: '09:00 AM', checkOut: '06:00 PM' },
        { date: 'Dec 28, 2025', status: 'Present', checkIn: '09:15 AM', checkOut: '06:15 PM' },
        { date: 'Dec 27, 2025', status: 'Late', checkIn: '09:30 AM', checkOut: '06:30 PM' },
        { date: 'Dec 26, 2025', status: 'Present', checkIn: '08:45 AM', checkOut: '05:45 PM' },
        { date: 'Dec 25, 2025', status: 'Holiday', checkIn: '-', checkOut: '-' },
        { date: 'Dec 24, 2025', status: 'Present', checkIn: '09:00 AM', checkOut: '06:00 PM' },
        { date: 'Dec 23, 2025', status: 'Absent', checkIn: '-', checkOut: '-' },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'success';
            case 'Absent': return 'error';
            case 'Late': return 'warning';
            case 'Holiday': return 'info';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ mt: 3 }}>
            {/* Monthly Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <AttendanceCard
                        title="Days Present"
                        value={attendanceStats.present}
                        subtitle="This month"
                        icon={<PresentIcon />}
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AttendanceCard
                        title="Days Absent"
                        value={attendanceStats.absent}
                        subtitle="This month"
                        icon={<AbsentIcon />}
                        color="error"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AttendanceCard
                        title="Late Arrivals"
                        value={attendanceStats.late}
                        subtitle="This month"
                        icon={<LateIcon />}
                        color="warning"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AttendanceCard
                        title="Attendance Rate"
                        value={`${attendanceStats.attendanceRate}%`}
                        subtitle="This month"
                        icon={<TrendingUpIcon />}
                        color="primary"
                    />
                </Grid>
            </Grid>

            {/* Recent Attendance Table */}
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Recent Attendance (Last 7 Days)
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        size="small"
                    >
                        View Full Attendance
                    </Button>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Check In</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Check Out</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recentAttendance.map((record, index) => (
                                <TableRow key={index} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>
                                        {record.date}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={record.status}
                                            color={getStatusColor(record.status)}
                                            size="small"
                                            sx={{ fontWeight: 500 }}
                                        />
                                    </TableCell>
                                    <TableCell>{record.checkIn}</TableCell>
                                    <TableCell>{record.checkOut}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default AttendancePreview;