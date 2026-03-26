import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    TextField,
    MenuItem,
    IconButton,
    Avatar,
    Card,
    CardContent,
    Tooltip,
    ToggleButton,
    ToggleButtonGroup,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Edit as EditIcon,
    Search as SearchIcon,
    ViewModule as ViewModuleIcon,
    ViewList as ViewListIcon,
} from '@mui/icons-material';
import attendanceService from '../../services/attendanceService';
import EditAttendanceDialog from '../../components/EditAttendanceDialog';
import { useAuth } from '../../context/AuthContext';
import { useProfileSwitching } from '../../context/ProfileSwitchingContext';

const AttendanceTable = () => {
    const { user } = useAuth();
    const { currentView, isEmployeeView, isHRView, isManagerView } = useProfileSwitching();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(6);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [departmentFilter, setDepartmentFilter] = useState('All');
    const [dateRange, setDateRange] = useState('today'); // 'today', 'week', 'month'
    
    // Default view: table/list for desktop (md+), cards/grid for mobile
    const getDefaultViewMode = () => {
        return window.innerWidth >= 900 ? 'table' : 'cards';
    };
    const [viewMode, setViewMode] = useState(getDefaultViewMode());
    
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    // Handle window resize to update view mode responsively
    useEffect(() => {
        const handleResize = () => {
            const newDefaultView = window.innerWidth >= 900 ? 'table' : 'cards';
            setViewMode(newDefaultView);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load attendance data
    useEffect(() => {
        loadAttendanceData();
    }, [dateRange, currentView]); // Add currentView as dependency

    const loadAttendanceData = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Calculate date range based on selection
            const endDate = new Date();
            const startDate = new Date();
            
            if (dateRange === 'today') {
                // Today only
                startDate.setHours(0, 0, 0, 0);
            } else if (dateRange === 'week') {
                // Last 7 days
                startDate.setDate(startDate.getDate() - 7);
            } else if (dateRange === 'month') {
                // Last 30 days
                startDate.setDate(startDate.getDate() - 30);
            }
            
            // For employees in Employee view, pass their employee_id to only see their own records
            // For HR/Manager views, don't pass employee_id to see all records
            let employeeId = null;
            // Load attendance data based on current view
            if (isEmployeeView()) {
                employeeId = user.employee_id;
            }
            
            const result = await attendanceService.getAttendanceByDateRange(
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0],
                employeeId
            );
            
            if (result.success && result.data) {
                // Transform backend data to match UI structure
                const transformedData = result.data.map((record, index) => ({
                    id: record.attendance_id || index,
                    employeeId: record.employee_code || record.employee_id,
                    employeeNumericId: record.employee_id, // Store numeric ID for API calls
                    name: record.employee_name || 'Unknown',
                    avatar: (record.employee_name || 'U').charAt(0),
                    department: record.department || 'N/A',
                    date: record.attendance_date,
                    checkIn: record.first_check_in || '-',
                    checkOut: record.last_check_out || '-',
                    status: record.status || 'Unknown',
                    workingHours: record.working_minutes ? `${Math.floor(record.working_minutes / 60)}h ${record.working_minutes % 60}m` : '0h',
                    notes: record.notes || ''
                }));
                
                setAttendanceData(transformedData);
                
                if (transformedData.length === 0) {
                    setError('No attendance records found. Start marking attendance to see data here.');
                }
            } else {
                setError(result.error || 'Failed to load attendance data');
            }
        } catch (err) {
            setError('Failed to connect to server');
            console.error('Load attendance error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getStatusColor = (status) => {
        const statusUpper = status?.toUpperCase();
        switch (statusUpper) {
            case 'PRESENT':
                return 'success';
            case 'LATE':
                return 'warning';
            case 'ABSENT':
                return 'error';
            case 'HALF DAY':
                return 'info';
            case 'WFH':
            case 'WORK FROM HOME':
                return 'primary';
            case 'HOLIDAY':
                return 'default';
            default:
                return 'default';
        }
    };

    const filteredData = attendanceData.filter(record => {
        const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || record.status.toUpperCase() === statusFilter.toUpperCase();
        const matchesDepartment = departmentFilter === 'All' || record.department === departmentFilter;
        
        return matchesSearch && matchesStatus && matchesDepartment;
    });

    const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Edit handlers
    const handleEditClick = (record) => {
        setSelectedRecord(record);
        setEditDialogOpen(true);
    };

    const handleEditSave = () => {
        // Reload data after successful edit
        loadAttendanceData();
    };

    const handleEditClose = () => {
        setEditDialogOpen(false);
        setSelectedRecord(null);
    };

    const renderTableView = () => (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 700, md: 'auto' } }}>
                <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Check In</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Check Out</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Working Hours</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {paginatedData.map((record) => (
                        <TableRow key={record.id} hover>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                                        {record.avatar}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {record.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {record.employeeId}
                                        </Typography>
                                    </Box>
                                </Box>
                            </TableCell>
                            <TableCell>{record.date}</TableCell>
                            <TableCell>{record.checkIn}</TableCell>
                            <TableCell>{record.checkOut}</TableCell>
                            <TableCell>{record.workingHours}</TableCell>
                            <TableCell>
                                <Chip
                                    label={record.status}
                                    color={getStatusColor(record.status)}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell>
                                {isHRView() && (
                                    <Tooltip title="Edit attendance">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleEditClick(record)}
                                            color="primary"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <TablePagination
                rowsPerPageOptions={[6, 12, 24]}
                component="div"
                count={filteredData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </TableContainer>
    );

    const renderCardView = () => (
        <Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {paginatedData.map((record) => (
                    <Box key={record.id} sx={{ flex: '1 1 300px', minWidth: '300px', maxWidth: '400px' }}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Avatar sx={{ width: 40, height: 40 }}>
                                        {record.avatar}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {record.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {record.employeeId} • {record.department}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={record.status}
                                        color={getStatusColor(record.status)}
                                        size="small"
                                    />
                                </Box>
                                
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Check In
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {record.checkIn}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Check Out
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {record.checkOut}
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Working Hours
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {record.workingHours}
                                        </Typography>
                                    </Box>
                                    {isHRView() && (
                                        <IconButton 
                                            size="small"
                                            onClick={() => handleEditClick(record)}
                                            color="primary"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                                
                                {record.notes && (
                                    <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Notes: {record.notes}
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                ))}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <TablePagination
                    rowsPerPageOptions={[6, 12, 24]}
                    component="div"
                    count={filteredData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Box>
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Filters and Search */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {isEmployeeView() ? 'My Attendance Records' : 
                         isManagerView() ? 'Team Attendance Records' : 
                         'Employee Attendance Records'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {isEmployeeView() ? 'View your daily attendance data' : 
                         'View and manage daily attendance data'}
                    </Typography>
                </Box>
                
                {/* Error Alert */}
                {error && (
                    <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
                
                {/* Loading State */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                )}
                
                {!loading && (
                    <>
                        <Box sx={{ 
                            display: 'flex', 
                            gap: { xs: 1, sm: 2 }, 
                            alignItems: 'end',
                            flexDirection: { xs: 'column', sm: 'row' },
                            mb: 2
                        }}>
                            <TextField
                                placeholder="Search by name or employee ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ flex: 1, minWidth: { xs: '100%', sm: 250 } }}
                                slotProps={{
                                    input: {
                                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                                    }
                                }}
                        size="small"
                    />
                    
                    <TextField
                        select
                        label="Date Range"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        sx={{ minWidth: { xs: '100%', sm: 120 } }}
                        size="small"
                    >
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="week">Last 7 Days</MenuItem>
                        <MenuItem value="month">Last 30 Days</MenuItem>
                    </TextField>
                    
                    <TextField
                        select
                        label="Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        sx={{ minWidth: { xs: '100%', sm: 120 } }}
                        size="small"
                    >
                        <MenuItem value="All">All Status</MenuItem>
                        <MenuItem value="Present">Present</MenuItem>
                        <MenuItem value="Absent">Absent</MenuItem>
                        <MenuItem value="Late">Late</MenuItem>
                        <MenuItem value="Half Day">Half Day</MenuItem>
                        <MenuItem value="Work From Home">Work From Home</MenuItem>
                    </TextField>
                    
                    <TextField
                        select
                        label="Department"
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        sx={{ minWidth: { xs: '100%', sm: 140 } }}
                        size="small"
                    >
                        <MenuItem value="All">All Departments</MenuItem>
                        <MenuItem value="Engineering">Engineering</MenuItem>
                        <MenuItem value="Sales">Sales</MenuItem>
                        <MenuItem value="Marketing">Marketing</MenuItem>
                        <MenuItem value="HR">HR</MenuItem>
                    </TextField>
                </Box>
                
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 }
                }}>
                    <Typography variant="body2" color="text.secondary">
                        Showing {filteredData.length} attendance records
                    </Typography>
                    
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(_, newMode) => newMode && setViewMode(newMode)}
                        size="small"
                    >
                        <ToggleButton value="table">
                            <ViewListIcon />
                        </ToggleButton>
                        <ToggleButton value="cards">
                            <ViewModuleIcon />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
                    </>
                )}
            </Paper>

            {/* Data Display */}
            {!loading && (viewMode === 'table' ? renderTableView() : renderCardView())}
            
            {/* Empty State */}
            {!loading && attendanceData.length === 0 && (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No attendance records found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Start marking attendance to see records here
                    </Typography>
                </Paper>
            )}

            {/* Edit Attendance Dialog */}
            <EditAttendanceDialog
                open={editDialogOpen}
                onClose={handleEditClose}
                attendanceRecord={selectedRecord}
                onSave={handleEditSave}
            />
        </Box>
    );
};

export default AttendanceTable;