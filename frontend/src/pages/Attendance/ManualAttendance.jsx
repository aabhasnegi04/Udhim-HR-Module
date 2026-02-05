import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Avatar,
    Chip,
    Alert,
    Divider,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    Tooltip,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    Search as SearchIcon,
    Save as SaveIcon,
    Person as PersonIcon,
    AccessTime as TimeIcon,
    Edit as EditIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import attendanceService from '../../services/attendanceService';

const attendanceStatuses = [
    { value: 'PRESENT', label: 'Present', color: 'success' },
    { value: 'ABSENT', label: 'Absent', color: 'error' },
    { value: 'LATE', label: 'Late', color: 'warning' },
    { value: 'WFH', label: 'Work From Home', color: 'info' },
    { value: 'HOLIDAY', label: 'Holiday', color: 'default' },
];

const ManualAttendance = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [attendanceDate, setAttendanceDate] = useState(dayjs());
    const [status, setStatus] = useState('');
    const [checkInTime, setCheckInTime] = useState(null);
    const [checkOutTime, setCheckOutTime] = useState(null);
    const [notes, setNotes] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Load employees from backend
    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            setLoadingEmployees(true);
            const employeeService = (await import('../../services/employeeService')).default;
            // Use getActiveEmployees instead of getAllEmployees to only show active employees
            const result = await employeeService.getActiveEmployees();
            
            if (result.success && result.data) {
                // Transform employee data to match the expected format
                const transformedEmployees = result.data.map(emp => ({
                    id: emp.employee_id,
                    employee_id: emp.employee_code || `EMP${String(emp.employee_id).padStart(3, '0')}`,
                    name: emp.employee_name || emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown',
                    department: emp.department || 'N/A',
                    designation: emp.designation || 'N/A',
                    status: emp.status || 'ACTIVE'  // Should always be ACTIVE from the new endpoint
                }));
                setEmployees(transformedEmployees);
            } else {
                setErrorMessage('Failed to load active employees');
                setShowError(true);
            }
        } catch (error) {
            console.error('Failed to load employees:', error);
            setErrorMessage('Failed to load employees');
            setShowError(true);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleMarkAttendance = (employee) => {
        setSelectedEmployee(employee);
        setDialogOpen(true);
        // Reset form fields
        setStatus('');
        setCheckInTime(null);
        setCheckOutTime(null);
        setNotes('');
        setShowError(false);
        setShowSuccess(false);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedEmployee(null);
        setStatus('');
        setCheckInTime(null);
        setCheckOutTime(null);
        setNotes('');
        setShowError(false);
        setShowSuccess(false);
    };

    const handleSave = async () => {
        if (!selectedEmployee || !status || !attendanceDate) {
            setErrorMessage('Please fill all required fields');
            setShowError(true);
            return;
        }

        try {
            setLoading(true);
            setShowError(false);

            const attendanceData = {
                employee_id: selectedEmployee.id,
                attendance_date: attendanceDate.format('YYYY-MM-DD'),
                status: status,
                check_in_time: checkInTime ? checkInTime.format('HH:mm') : null,
                check_out_time: checkOutTime ? checkOutTime.format('HH:mm') : null,
                notes: notes
            };

            // Validate data before sending
            const validation = attendanceService.validateAttendanceData(attendanceData);
            if (!validation.isValid) {
                setErrorMessage(validation.errors.join(', '));
                setShowError(true);
                setLoading(false);
                return;
            }

            const result = await attendanceService.markManualAttendance(attendanceData);

            if (result.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    handleCloseDialog();
                }, 2000);
            } else {
                setErrorMessage(result.error || 'Failed to mark attendance');
                setShowError(true);
            }
        } catch (error) {
            setErrorMessage('Failed to mark attendance. Please try again.');
            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = selectedEmployee && status && attendanceDate;

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: { xs: 2, sm: 3 },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 }
            }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Mark Individual Attendance
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Select employee and update attendance record
                    </Typography>
                </Box>
            </Box>

            {/* Search Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Search by name or employee ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                    }}
                    size="small"
                />
            </Paper>

            {/* Employee Table - Desktop View */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Employee ID</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadingEmployees ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredEmployees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {searchQuery ? 'No employees found matching your search' : 'No active employees found'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredEmployees
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((employee) => (
                                            <TableRow key={employee.id} hover>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                                                            {employee.name.charAt(0)}
                                                        </Avatar>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {employee.name}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                        {employee.employee_id}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={employee.department}
                                                        size="small"
                                                        variant="outlined"
                                                        color="primary"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {employee.designation}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={employee.status}
                                                        size="small"
                                                        color="success"
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="Mark Attendance">
                                                        <IconButton
                                                            color="primary"
                                                            onClick={() => handleMarkAttendance(employee)}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={filteredEmployees.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            </Box>

            {/* Employee Cards - Mobile View */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {loadingEmployees ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : filteredEmployees.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {searchQuery ? 'No employees found matching your search' : 'No active employees found'}
                        </Typography>
                    </Paper>
                ) : (
                    <>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {filteredEmployees
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((employee) => (
                                    <Card key={employee.id} sx={{ cursor: 'pointer' }}>
                                        <CardContent sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                                    <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                                                        {employee.name.charAt(0)}
                                                    </Avatar>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                            {employee.name}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', mb: 1 }}>
                                                            {employee.employee_id}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                            <Chip
                                                                label={employee.department}
                                                                size="small"
                                                                variant="outlined"
                                                                color="primary"
                                                            />
                                                            <Chip
                                                                label={employee.status}
                                                                size="small"
                                                                color="success"
                                                            />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleMarkAttendance(employee)}
                                                    sx={{ ml: 1 }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {employee.designation}
                                            </Typography>
                                            <Box sx={{ mt: 2 }}>
                                                <Button
                                                    fullWidth
                                                    variant="outlined"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleMarkAttendance(employee)}
                                                    size="small"
                                                >
                                                    Mark Attendance
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                        </Box>
                        
                        {/* Mobile Pagination */}
                        <Paper sx={{ mt: 2 }}>
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25]}
                                component="div"
                                count={filteredEmployees.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                labelRowsPerPage="Per page:"
                                sx={{
                                    '& .MuiTablePagination-toolbar': {
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        gap: { xs: 1, sm: 0 },
                                        alignItems: { xs: 'stretch', sm: 'center' }
                                    },
                                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                        fontSize: '0.875rem'
                                    }
                                }}
                            />
                        </Paper>
                    </>
                )}
            </Box>

            {/* Attendance Dialog */}
            <Dialog 
                open={dialogOpen} 
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile} // Full screen on mobile
                PaperProps={{
                    sx: { 
                        minHeight: { xs: 'auto', sm: '500px' },
                        m: { xs: 0, sm: 2 }
                    }
                }}
            >
                <DialogTitle sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    pb: 1,
                    px: { xs: 2, sm: 3 },
                    py: { xs: 1.5, sm: 2 }
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimeIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                            Mark Attendance
                        </Typography>
                    </Box>
                    <IconButton onClick={handleCloseDialog} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
                    {selectedEmployee && (
                        <Box>
                            {/* Success/Error Alerts */}
                            {showSuccess && (
                                <Alert severity="success" sx={{ mb: { xs: 2, sm: 3 } }}>
                                    Attendance marked successfully for {selectedEmployee.name}!
                                </Alert>
                            )}

                            {showError && (
                                <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 } }}>
                                    {errorMessage}
                                </Alert>
                            )}

                            {/* Selected Employee Info */}
                            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 3, sm: 4 }, bgcolor: 'primary.50' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: 'primary.main', width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 } }}>
                                        {selectedEmployee.name.charAt(0)}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                            {selectedEmployee.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                            {selectedEmployee.employee_id} • {selectedEmployee.designation}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                            {selectedEmployee.department}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>

                            {/* Form Fields */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    gap: { xs: 2, sm: 3 }, 
                                    flexDirection: { xs: 'column', sm: 'row' }
                                }}>
                                    <Box sx={{ flex: 1 }}>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                label="Attendance Date"
                                                value={attendanceDate}
                                                onChange={(newValue) => setAttendanceDate(newValue)}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        size: 'small'
                                                    }
                                                }}
                                            />
                                        </LocalizationProvider>
                                    </Box>

                                    <Box sx={{ flex: 1 }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Status</InputLabel>
                                            <Select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                label="Status"
                                            >
                                                {attendanceStatuses.map((statusOption) => (
                                                    <MenuItem key={statusOption.value} value={statusOption.value}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Chip
                                                                label={statusOption.label}
                                                                size="small"
                                                                color={statusOption.color}
                                                            />
                                                        </Box>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Box>

                                {(status === 'PRESENT' || status === 'LATE' || status === 'WFH') && (
                                    <Box sx={{ 
                                        display: 'flex', 
                                        gap: { xs: 2, sm: 3 }, 
                                        flexDirection: { xs: 'column', sm: 'row' }
                                    }}>
                                        <Box sx={{ flex: 1 }}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <TimePicker
                                                    label="Check-in Time"
                                                    value={checkInTime}
                                                    onChange={(newValue) => setCheckInTime(newValue)}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            size: 'small',
                                                            helperText: '12-hour format with AM/PM'
                                                        }
                                                    }}
                                                />
                                            </LocalizationProvider>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <TimePicker
                                                    label="Check-out Time"
                                                    value={checkOutTime}
                                                    onChange={(newValue) => setCheckOutTime(newValue)}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            size: 'small',
                                                            helperText: '12-hour format with AM/PM'
                                                        }
                                                    }}
                                                />
                                            </LocalizationProvider>
                                        </Box>
                                    </Box>
                                )}

                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Notes (Optional)"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any additional notes..."
                                    size="small"
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    gap: { xs: 1, sm: 2 },
                    flexDirection: { xs: 'column', sm: 'row' }
                }}>
                    <Button
                        onClick={handleCloseDialog}
                        variant="outlined"
                        disabled={loading}
                        fullWidth={isMobile}
                        sx={{ order: { xs: 2, sm: 1 } }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                        disabled={!isFormValid || loading}
                        fullWidth={isMobile}
                        sx={{ order: { xs: 1, sm: 2 } }}
                    >
                        {loading ? 'Marking Attendance...' : 'Mark Attendance'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManualAttendance;