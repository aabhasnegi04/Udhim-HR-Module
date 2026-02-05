 import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Card,
    CardContent,
    Tooltip,
    Stack
} from '@mui/material';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Today as TodayIcon
} from '@mui/icons-material';
import StatusChip from './StatusChip';

// Mock attendance data for calendar
const mockAttendanceData = {
    '2024-01-01': { status: 'present', checkIn: '09:00', checkOut: '18:00' },
    '2024-01-02': { status: 'present', checkIn: '09:15', checkOut: '18:30' },
    '2024-01-03': { status: 'late', checkIn: '09:45', checkOut: '18:00' },
    '2024-01-04': { status: 'present', checkIn: '08:55', checkOut: '17:45' },
    '2024-01-05': { status: 'present', checkIn: '09:10', checkOut: '18:15' },
    '2024-01-08': { status: 'absent', checkIn: null, checkOut: null },
    '2024-01-09': { status: 'present', checkIn: '09:00', checkOut: '18:00' },
    '2024-01-10': { status: 'wfh', checkIn: '09:30', checkOut: '18:30' },
    '2024-01-11': { status: 'present', checkIn: '08:45', checkOut: '17:30' },
    '2024-01-12': { status: 'half day', checkIn: '09:00', checkOut: '13:00' },
    '2024-01-15': { status: 'on leave', checkIn: null, checkOut: null },
    '2024-01-16': { status: 'present', checkIn: '09:05', checkOut: '18:10' },
    '2024-01-17': { status: 'late', checkIn: '09:30', checkOut: '18:30' },
    '2024-01-18': { status: 'present', checkIn: '08:50', checkOut: '17:50' },
    '2024-01-19': { status: 'present', checkIn: '09:00', checkOut: '18:00' }
};

const AttendanceCalendar = ({ employeeId, onDateSelect }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatDateKey = (year, month, day) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const isToday = (year, month, day) => {
        const today = new Date();
        return year === today.getFullYear() && 
               month === today.getMonth() && 
               day === today.getDate();
    };

    const isWeekend = (year, month, day) => {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'present': return '#4caf50';
            case 'absent': return '#f44336';
            case 'late': return '#ff9800';
            case 'half day': return '#2196f3';
            case 'wfh': return '#9c27b0';
            case 'on leave': return '#00bcd4';
            default: return '#e0e0e0';
        }
    };

    const renderCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        
        const days = [];
        
        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(
                <Box key={`empty-${i}`} sx={{ flex: '1 1 14.28%', minWidth: '40px', height: 60 }} />
            );
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = formatDateKey(year, month, day);
            const attendanceData = mockAttendanceData[dateKey];
            const isCurrentDay = isToday(year, month, day);
            const isWeekendDay = isWeekend(year, month, day);
            
            days.push(
                <Box key={day} sx={{ flex: '1 1 14.28%', minWidth: '40px' }}>
                    <Tooltip
                        title={
                            attendanceData ? (
                                <Box>
                                    <Typography variant="body2">
                                        Status: {attendanceData.status}
                                    </Typography>
                                    {attendanceData.checkIn && (
                                        <Typography variant="caption">
                                            In: {attendanceData.checkIn} | Out: {attendanceData.checkOut || '--:--'}
                                        </Typography>
                                    )}
                                </Box>
                            ) : (
                                isWeekendDay ? 'Weekend' : 'No data'
                            )
                        }
                        arrow
                    >
                        <Card
                            sx={{
                                height: 60,
                                cursor: 'pointer',
                                border: isCurrentDay ? 2 : 1,
                                borderColor: isCurrentDay ? 'primary.main' : 'divider',
                                bgcolor: isWeekendDay ? 'grey.50' : 'background.paper',
                                '&:hover': {
                                    boxShadow: 2,
                                    transform: 'scale(1.02)'
                                },
                                transition: 'all 0.2s ease'
                            }}
                            onClick={() => onDateSelect && onDateSelect(dateKey, attendanceData)}
                        >
                            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                <Box sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            fontWeight: isCurrentDay ? 700 : 400,
                                            color: isWeekendDay ? 'text.secondary' : 'text.primary',
                                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                        }}
                                    >
                                        {day}
                                    </Typography>
                                    
                                    {attendanceData && (
                                        <Box
                                            sx={{
                                                width: { xs: 6, sm: 8 },
                                                height: { xs: 6, sm: 8 },
                                                borderRadius: '50%',
                                                bgcolor: getStatusColor(attendanceData.status),
                                                mx: 'auto',
                                                mt: 0.5
                                            }}
                                        />
                                    )}
                                    
                                    {isWeekendDay && !attendanceData && (
                                        <Typography variant="caption" color="text.secondary">
                                            •
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Tooltip>
                </Box>
            );
        }
        
        return days;
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Calendar Header */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: { xs: 2, sm: 3 },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 }
            }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </Typography>
                
                <Stack direction="row" spacing={1}>
                    <IconButton onClick={() => navigateMonth(-1)} size="small">
                        <ChevronLeftIcon />
                    </IconButton>
                    <IconButton onClick={goToToday} size="small">
                        <TodayIcon />
                    </IconButton>
                    <IconButton onClick={() => navigateMonth(1)} size="small">
                        <ChevronRightIcon />
                    </IconButton>
                </Stack>
            </Box>

            {/* Day Headers */}
            <Box sx={{ display: 'flex', mb: 1 }}>
                {dayNames.map((day) => (
                    <Box key={day} sx={{ flex: '1 1 14.28%', minWidth: '40px' }}>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                display: 'block', 
                                textAlign: 'center', 
                                fontWeight: 600,
                                color: 'text.secondary',
                                py: 1,
                                fontSize: { xs: '0.65rem', sm: '0.75rem' }
                            }}
                        >
                            {day}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Calendar Grid */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {renderCalendarDays()}
            </Box>

            {/* Legend */}
            <Box sx={{ mt: { xs: 2, sm: 3 }, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Status Legend
                </Typography>
                <Stack 
                    direction="row" 
                    spacing={{ xs: 1, sm: 2 }} 
                    flexWrap="wrap" 
                    useFlexGap
                    sx={{ gap: { xs: 1, sm: 2 } }}
                >
                    <StatusChip status="present" size="small" />
                    <StatusChip status="absent" size="small" />
                    <StatusChip status="late" size="small" />
                    <StatusChip status="half day" size="small" />
                    <StatusChip status="wfh" size="small" />
                    <StatusChip status="on leave" size="small" />
                </Stack>
            </Box>
        </Paper>
    );
};

export default AttendanceCalendar;