import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Card,
    CardContent,
    Avatar,
    Chip
} from '@mui/material';
import {
    ChevronLeft as PrevIcon,
    ChevronRight as NextIcon
} from '@mui/icons-material';

const leaveTypeColors = {
    'Sick Leave': '#f44336',
    'Casual Leave': '#2196f3',
    'Earned Leave': '#4caf50',
    'Maternity Leave': '#ff9800'
};

const LeaveCalendarView = ({ 
    leaveData = [], 
    onDateClick,
    currentDate = new Date(),
    onDateChange 
}) => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [showDayDetails, setShowDayDetails] = useState(false);

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatDate = (year, month, day) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const getLeavesForDate = (dateStr) => {
        return leaveData.filter(leave => leave.date === dateStr);
    };

    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        if (onDateChange) {
            onDateChange(newDate);
        }
    };

    const handleDateClick = (day) => {
        const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
        const leavesOnDate = getLeavesForDate(dateStr);
        
        if (leavesOnDate.length > 0) {
            setSelectedDate({ date: dateStr, leaves: leavesOnDate });
            setShowDayDetails(true);
        }
        
        if (onDateClick) {
            onDateClick(dateStr, leavesOnDate);
        }
    };

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Header row with day names
        weekDays.forEach(day => {
            days.push(
                <Box key={day} sx={{ 
                    p: 1, 
                    textAlign: 'center', 
                    fontWeight: 600, 
                    bgcolor: 'grey.100',
                    borderBottom: 1,
                    borderColor: 'divider'
                }}>
                    <Typography variant="caption" color="text.secondary">
                        {day}
                    </Typography>
                </Box>
            );
        });

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(
                <Box key={`empty-${i}`} sx={{ 
                    minHeight: { xs: 60, sm: 80 }, 
                    border: 1, 
                    borderColor: 'divider',
                    bgcolor: 'grey.50'
                }} />
            );
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
            const leavesOnDate = getLeavesForDate(dateStr);
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            days.push(
                <Box
                    key={day}
                    sx={{
                        minHeight: { xs: 60, sm: 80 },
                        border: 1,
                        borderColor: 'divider',
                        p: 0.5,
                        cursor: leavesOnDate.length > 0 ? 'pointer' : 'default',
                        bgcolor: isToday ? 'primary.light' : 'white',
                        '&:hover': leavesOnDate.length > 0 ? { bgcolor: 'grey.100' } : {},
                        position: 'relative'
                    }}
                    onClick={() => handleDateClick(day)}
                >
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            fontWeight: isToday ? 600 : 400,
                            color: isToday ? 'primary.contrastText' : 'text.primary',
                            mb: 0.5
                        }}
                    >
                        {day}
                    </Typography>
                    
                    {/* Leave indicators */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        {leavesOnDate.slice(0, 3).map((leave, index) => (
                            <Box
                                key={index}
                                sx={{
                                    height: 4,
                                    bgcolor: leaveTypeColors[leave.type] || 'grey.400',
                                    borderRadius: 1,
                                    opacity: leave.status === 'approved' ? 1 : 0.6,
                                    border: leave.status === 'pending' ? '1px dashed' : 'none'
                                }}
                            />
                        ))}
                        {leavesOnDate.length > 3 && (
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                                +{leavesOnDate.length - 3} more
                            </Typography>
                        )}
                    </Box>

                    {/* Leave count badge */}
                    {leavesOnDate.length > 0 && (
                        <Badge
                            badgeContent={leavesOnDate.length}
                            color="primary"
                            sx={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                '& .MuiBadge-badge': {
                                    fontSize: '0.6rem',
                                    minWidth: 16,
                                    height: 16
                                }
                            }}
                        />
                    )}
                </Box>
            );
        }

        return days;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box>
            {/* Calendar Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={() => navigateMonth(-1)}>
                        <PrevIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Typography>
                    <IconButton onClick={() => navigateMonth(1)}>
                        <NextIcon />
                    </IconButton>
                </Box>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                        const today = new Date();
                        if (onDateChange) {
                            onDateChange(today);
                        }
                    }}
                >
                    Today
                </Button>
            </Box>

            {/* Calendar Grid */}
            <Paper sx={{ overflow: 'hidden' }}>
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 0
                }}>
                    {renderCalendarGrid()}
                </Box>
            </Paper>

            {/* Legend */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Legend
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {Object.entries(leaveTypeColors).map(([type, color]) => (
                        <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 16, height: 4, bgcolor: color, borderRadius: 1 }} />
                            <Typography variant="caption">{type}</Typography>
                        </Box>
                    ))}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                        <Box sx={{ width: 16, height: 4, bgcolor: 'grey.400', borderRadius: 1, border: '1px dashed grey' }} />
                        <Typography variant="caption">Pending</Typography>
                    </Box>
                </Box>
            </Box>

            {/* Day Details Dialog */}
            <Dialog open={showDayDetails} onClose={() => setShowDayDetails(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Leave Details - {selectedDate?.date && new Date(selectedDate.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                </DialogTitle>
                <DialogContent>
                    {selectedDate?.leaves && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {selectedDate.leaves.length} employee(s) on leave
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {selectedDate.leaves.map((leave, index) => (
                                    <Card key={index} variant="outlined">
                                        <CardContent sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                                    {leave.employee?.charAt(0) || 'U'}
                                                </Avatar>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {leave.employee || 'Unknown Employee'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {leave.employeeId} • {leave.department}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={leave.status}
                                                    color={getStatusColor(leave.status)}
                                                    size="small"
                                                    sx={{ textTransform: 'capitalize' }}
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box 
                                                    sx={{ 
                                                        width: 12, 
                                                        height: 12, 
                                                        bgcolor: leaveTypeColors[leave.type] || 'grey.400',
                                                        borderRadius: 1
                                                    }} 
                                                />
                                                <Typography variant="body2">
                                                    {leave.type}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDayDetails(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeaveCalendarView;