import { useState, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Chip,
    Avatar,
    IconButton,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Badge
} from '@mui/material';
import {
    ChevronLeft as PrevIcon,
    ChevronRight as NextIcon,
    CalendarToday as CalendarIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { useProfileSwitching } from '../../context/ProfileSwitchingContext';

// Mock leave data for calendar
const mockLeaveData = [
    { id: 1, employee: 'John Smith', employeeId: 'EMP001', department: 'Engineering', type: 'Sick Leave', date: '2025-12-28', status: 'approved' },
    { id: 2, employee: 'John Smith', employeeId: 'EMP001', department: 'Engineering', type: 'Sick Leave', date: '2025-12-29', status: 'approved' },
    { id: 3, employee: 'Sarah Johnson', employeeId: 'EMP002', department: 'Marketing', type: 'Casual Leave', date: '2026-01-05', status: 'approved' },
    { id: 4, employee: 'Sarah Johnson', employeeId: 'EMP002', department: 'Marketing', type: 'Casual Leave', date: '2026-01-06', status: 'approved' },
    { id: 5, employee: 'Sarah Johnson', employeeId: 'EMP002', department: 'Marketing', type: 'Casual Leave', date: '2026-01-07', status: 'approved' },
    { id: 6, employee: 'Sarah Johnson', employeeId: 'EMP002', department: 'Marketing', type: 'Casual Leave', date: '2026-01-08', status: 'approved' },
    { id: 7, employee: 'Sarah Johnson', employeeId: 'EMP002', department: 'Marketing', type: 'Casual Leave', date: '2026-01-09', status: 'approved' },
    { id: 8, employee: 'Michael Chen', employeeId: 'EMP003', department: 'Engineering', type: 'Earned Leave', date: '2025-12-30', status: 'pending' },
    { id: 9, employee: 'Michael Chen', employeeId: 'EMP003', department: 'Engineering', type: 'Earned Leave', date: '2025-12-31', status: 'pending' },
    { id: 10, employee: 'Michael Chen', employeeId: 'EMP003', department: 'Engineering', type: 'Earned Leave', date: '2026-01-01', status: 'pending' },
    { id: 11, employee: 'Michael Chen', employeeId: 'EMP003', department: 'Engineering', type: 'Earned Leave', date: '2026-01-02', status: 'pending' },
    { id: 12, employee: 'Michael Chen', employeeId: 'EMP003', department: 'Engineering', type: 'Earned Leave', date: '2026-01-03', status: 'pending' },
    { id: 13, employee: 'Emily Davis', employeeId: 'EMP004', department: 'Sales', type: 'Sick Leave', date: '2026-01-02', status: 'approved' },
    { id: 14, employee: 'Emily Davis', employeeId: 'EMP004', department: 'Sales', type: 'Sick Leave', date: '2026-01-03', status: 'approved' },
    { id: 15, employee: 'Emily Davis', employeeId: 'EMP004', department: 'Sales', type: 'Sick Leave', date: '2026-01-04', status: 'approved' }
];

const leaveTypeColors = {
    'Sick Leave': '#f44336',
    'Casual Leave': '#2196f3',
    'Earned Leave': '#4caf50',
    'Maternity Leave': '#ff9800'
};

const LeaveCalendar = () => {
    const { user } = useContext(AuthContext);
    const { currentView } = useProfileSwitching();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedDate, setSelectedDate] = useState(null);
    const [showDayDetails, setShowDayDetails] = useState(false);

    const getFilteredLeaveData = () => {
        let filteredData = mockLeaveData;

        // Role-based filtering using currentView instead of user.role
        if (currentView === 'MANAGER') {
            // Manager sees only their team's leaves (mock: Engineering department)
            filteredData = mockLeaveData.filter(leave => leave.department === 'Engineering');
        } else if (currentView === 'EMPLOYEE') {
            // Employee sees only their own leaves (mock: EMP001)
            filteredData = mockLeaveData.filter(leave => leave.employeeId === 'EMP001');
        }
        // HR view shows all leaves (no filtering needed)

        // Apply filters
        if (departmentFilter !== 'all') {
            filteredData = filteredData.filter(leave => leave.department === departmentFilter);
        }
        if (typeFilter !== 'all') {
            filteredData = filteredData.filter(leave => leave.type === typeFilter);
        }
        if (statusFilter !== 'all') {
            filteredData = filteredData.filter(leave => leave.status === statusFilter);
        }

        return filteredData;
    };

    const filteredLeaveData = getFilteredLeaveData();

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
        return filteredLeaveData.filter(leave => leave.date === dateStr);
    };

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const handleDateClick = (day) => {
        const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
        const leavesOnDate = getLeavesForDate(dateStr);
        if (leavesOnDate.length > 0) {
            setSelectedDate({ date: dateStr, leaves: leavesOnDate });
            setShowDayDetails(true);
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
                    p: { xs: 0.5, sm: 1 }, 
                    textAlign: 'center', 
                    fontWeight: 600, 
                    bgcolor: 'grey.100',
                    borderBottom: 1,
                    borderColor: 'divider'
                }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        {day}
                    </Typography>
                </Box>
            );
        });

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(
                <Box key={`empty-${i}`} sx={{ 
                    minHeight: { xs: 50, sm: 80 }, 
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
                        minHeight: { xs: 50, sm: 80 },
                        border: 1,
                        borderColor: 'divider',
                        p: { xs: 0.25, sm: 0.5 },
                        cursor: leavesOnDate.length > 0 ? 'pointer' : 'default',
                        bgcolor: isToday ? 'primary.light' : 'white',
                        '&:hover': leavesOnDate.length > 0 ? { bgcolor: 'grey.100' } : {},
                        '&:active': leavesOnDate.length > 0 ? { bgcolor: 'grey.200' } : {},
                        position: 'relative'
                    }}
                    onClick={() => handleDateClick(day)}
                >
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            fontWeight: isToday ? 600 : 400,
                            color: isToday ? 'primary.contrastText' : 'text.primary',
                            mb: { xs: 0.25, sm: 0.5 },
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                    >
                        {day}
                    </Typography>
                    
                    {/* Leave indicators */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.125, sm: 0.25 } }}>
                        {leavesOnDate.slice(0, { xs: 2, sm: 3 }[0]).map((leave, index) => (
                            <Box
                                key={index}
                                sx={{
                                    height: { xs: 2, sm: 4 },
                                    bgcolor: leaveTypeColors[leave.type] || 'grey.400',
                                    borderRadius: 1,
                                    opacity: leave.status === 'approved' ? 1 : 0.6,
                                    border: leave.status === 'pending' ? '1px dashed' : 'none'
                                }}
                            />
                        ))}
                        {leavesOnDate.length > (window.innerWidth < 600 ? 2 : 3) && (
                            <Typography variant="caption" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, color: 'text.secondary' }}>
                                +{leavesOnDate.length - (window.innerWidth < 600 ? 2 : 3)} more
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
                                top: { xs: 1, sm: 2 },
                                right: { xs: 1, sm: 2 },
                                '& .MuiBadge-badge': {
                                    fontSize: { xs: '0.5rem', sm: '0.6rem' },
                                    minWidth: { xs: 12, sm: 16 },
                                    height: { xs: 12, sm: 16 }
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
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                    Leave Calendar
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Visual calendar view of all leave requests and approvals
                </Typography>
            </Box>

            {/* Calendar Controls */}
            <Paper sx={{ p: { xs: 1.5, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: { xs: 2, sm: 1 } }}>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: { xs: 1.5, sm: 2 },
                    flexWrap: 'wrap',
                    gap: { xs: 1, sm: 0 }
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                        <IconButton onClick={() => navigateMonth(-1)} sx={{ p: { xs: 0.5, sm: 1.5 } }}>
                            <PrevIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                        </IconButton>
                        <Typography variant="h6" sx={{ 
                            minWidth: { xs: 160, sm: 200 }, 
                            textAlign: 'center',
                            fontSize: { xs: '0.9rem', sm: '1.25rem' }
                        }}>
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Typography>
                        <IconButton onClick={() => navigateMonth(1)} sx={{ p: { xs: 0.5, sm: 1.5 } }}>
                            <NextIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                        </IconButton>
                    </Box>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setCurrentDate(new Date())}
                        sx={{ 
                            fontSize: { xs: '0.7rem', sm: '0.875rem' },
                            px: { xs: 1.5, sm: 3 },
                            py: { xs: 0.5, sm: 1.5 }
                        }}
                    >
                        Today
                    </Button>
                </Box>

                {/* Filters */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 1, sm: 2 }, 
                    flexWrap: 'wrap'
                }}>
                    {currentView === 'HR' && (
                        <Box sx={{ flex: '0 0 120px', minWidth: { xs: '48%', sm: '120px' } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Department</InputLabel>
                                <Select
                                    value={departmentFilter}
                                    label="Department"
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                    sx={{
                                        '& .MuiSelect-select': {
                                            fontSize: { xs: '0.8rem', sm: '1rem' },
                                            py: { xs: 1, sm: 1 }
                                        }
                                    }}
                                >
                                    <MenuItem value="all">All Departments</MenuItem>
                                    <MenuItem value="Engineering">Engineering</MenuItem>
                                    <MenuItem value="Marketing">Marketing</MenuItem>
                                    <MenuItem value="Sales">Sales</MenuItem>
                                    <MenuItem value="HR">HR</MenuItem>
                                    <MenuItem value="Finance">Finance</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                    <Box sx={{ flex: '0 0 120px', minWidth: { xs: '48%', sm: '120px' } }}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Leave Type</InputLabel>
                            <Select
                                value={typeFilter}
                                label="Leave Type"
                                onChange={(e) => setTypeFilter(e.target.value)}
                                sx={{
                                    '& .MuiSelect-select': {
                                        fontSize: { xs: '0.8rem', sm: '1rem' },
                                        py: { xs: 1, sm: 1 }
                                    }
                                }}
                            >
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="Sick Leave">Sick Leave</MenuItem>
                                <MenuItem value="Casual Leave">Casual Leave</MenuItem>
                                <MenuItem value="Earned Leave">Earned Leave</MenuItem>
                                <MenuItem value="Maternity Leave">Maternity Leave</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '0 0 100px', minWidth: { xs: '48%', sm: '100px' } }}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={{
                                    '& .MuiSelect-select': {
                                        fontSize: { xs: '0.8rem', sm: '1rem' },
                                        py: { xs: 1, sm: 1 }
                                    }
                                }}
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="approved">Approved</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '0 0 80px', minWidth: { xs: '48%', sm: '80px' } }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                            onClick={() => {
                                setDepartmentFilter('all');
                                setTypeFilter('all');
                                setStatusFilter('all');
                            }}
                            size="small"
                            fullWidth
                            sx={{
                                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                py: { xs: 1, sm: 1 }
                            }}
                        >
                            Reset
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Legend */}
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: { xs: 2, sm: 1 } }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Legend
                </Typography>
                <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(auto-fit, minmax(120px, 1fr))' },
                    gap: { xs: 1, sm: 2 }
                }}>
                    {Object.entries(leaveTypeColors).map(([type, color]) => (
                        <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: { xs: 12, sm: 16 }, height: 4, bgcolor: color, borderRadius: 1 }} />
                            <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>{type}</Typography>
                        </Box>
                    ))}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: { xs: 12, sm: 16 }, height: 4, bgcolor: 'grey.400', borderRadius: 1, border: '1px dashed grey' }} />
                        <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Pending</Typography>
                    </Box>
                </Box>
            </Paper>

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
                                                    {leave.employee.charAt(0)}
                                                </Avatar>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {leave.employee}
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

export default LeaveCalendar;