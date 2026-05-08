import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Alert,
  CircularProgress,
  Tooltip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Search as SearchIcon,
  SwapHoriz as SwapIcon,
  History as HistoryIcon,
  FilterList as FilterIcon,
  Today as TodayIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isToday as isTodayFn } from 'date-fns';
import {
  getDailyDepartmentAssignments,
  changeEmployeeDepartment,
  getEmployeeDepartmentHistory,
  getDepartmentList,
} from '../../services/attendanceService';

const DailyDepartmentAssignment = () => {
  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [assignments, setAssignments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ACTIVE');  // Default to ACTIVE (employee status)
  const [filterAttendance, setFilterAttendance] = useState('PRESENT');  // Default to PRESENT
  const [filterShift, setFilterShift] = useState('ALL');  // Dynamic shift filter
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  
  // Dialog states
  const [changeDeptDialog, setChangeDeptDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newDepartment, setNewDepartment] = useState('');
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Alert state
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  // Load departments on mount
  useEffect(() => {
    loadDepartments();
  }, []);

  // Load assignments when date changes
  useEffect(() => {
    loadAssignments();
  }, [selectedDate]);

  const loadDepartments = async () => {
    try {
      const response = await getDepartmentList();
      if (response.success) {
        setDepartments(response.data.departments || []);
      }
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await getDailyDepartmentAssignments(
        dateStr,
        searchText || null,
        filterDepartment !== 'ALL' ? filterDepartment : null,
        filterStatus !== 'ALL' ? filterStatus : null
      );
      
      if (response.success) {
        setAssignments(response.data.assignments || []);
        setSelectedEmployees([]);
      } else {
        showAlert(response.message || 'Failed to load assignments', 'error');
      }
    } catch (error) {
      console.error('Failed to load assignments:', error);
      showAlert('Failed to load assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    loadAssignments();
  };

  const handleFilterChange = (event) => {
    setFilterDepartment(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setFilterStatus(event.target.value);
    setPage(0);
  };

  useEffect(() => {
    if (filterDepartment !== 'ALL') {
      loadAssignments();
    }
  }, [filterDepartment]);

  useEffect(() => {
    loadAssignments();
  }, [filterStatus]);

  const handleSelectEmployee = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allIds = filteredAssignments.map((a) => a.employee_id);
      setSelectedEmployees(allIds);
    } else {
      setSelectedEmployees([]);
    }
  };

  const openChangeDeptDialog = (employee = null) => {
    if (employee) {
      setSelectedEmployee(employee);
      setNewDepartment(employee.current_department);
    } else {
      setSelectedEmployee(null);
      setNewDepartment('');
    }
    setReason('');
    setChangeDeptDialog(true);
  };

  const closeChangeDeptDialog = () => {
    setChangeDeptDialog(false);
    setSelectedEmployee(null);
    setNewDepartment('');
    setReason('');
  };

  const handleChangeDepartment = async () => {
    if (!newDepartment) {
      showAlert('Please select a department', 'error');
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const isBulk = !selectedEmployee && selectedEmployees.length > 0;

    const payload = {
      change_date: dateStr,
      new_department: newDepartment,
      reason: reason || undefined,
    };

    if (isBulk) {
      payload.employee_ids = selectedEmployees;
    } else if (selectedEmployee) {
      payload.employee_id = selectedEmployee.employee_id;
    } else {
      showAlert('Please select employees', 'error');
      return;
    }

    try {
      const response = await changeEmployeeDepartment(payload);
      
      if (response.success) {
        const isMasterUpdated = response.data?.is_master_updated;
        const message = isBulk
          ? `Successfully changed ${response.data.success_count} employee(s) to ${newDepartment}`
          : `Successfully changed department to ${newDepartment}`;
        
        const fullMessage = isMasterUpdated
          ? `${message} (Master department updated)`
          : message;
        
        showAlert(fullMessage, 'success');
        closeChangeDeptDialog();
        loadAssignments();
      } else {
        showAlert(response.message || 'Failed to change department', 'error');
      }
    } catch (error) {
      console.error('Failed to change department:', error);
      showAlert('Failed to change department', 'error');
    }
  };

  const openHistoryDialog = async (employee) => {
    setSelectedEmployee(employee);
    setHistoryDialog(true);
    setHistoryLoading(true);
    
    try {
      const response = await getEmployeeDepartmentHistory(employee.employee_id, 20);
      if (response.success) {
        setHistory(response.data.history || []);
      } else {
        showAlert('Failed to load history', 'error');
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      showAlert('Failed to load history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistoryDialog = () => {
    setHistoryDialog(false);
    setSelectedEmployee(null);
    setHistory([]);
  };

  const showAlert = (message, severity = 'success') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 5000);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isDateToday = isTodayFn(selectedDate);

  // Derive unique shifts dynamically from loaded data (no hardcoding)
  const availableShifts = [...new Set(
    assignments.map((a) => a.shift_type).filter(Boolean)
  )].sort();

  const filteredAssignments = assignments.filter((a) => {
    if (filterAttendance !== 'ALL' && a.attendance_status !== filterAttendance) return false;
    if (filterShift !== 'ALL' && a.shift_type !== filterShift) return false;
    return true;
  });
  const paginatedAssignments = filteredAssignments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Typography variant="h4" gutterBottom>
          Daily Department Assignment
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Manage temporary department assignments for factory workers
        </Typography>

        {/* Alert */}
        {alert.show && (
          <Alert severity={alert.severity} sx={{ mb: 2 }} onClose={() => setAlert({ ...alert, show: false })}>
            {alert.message}
          </Alert>
        )}

        {/* Date Info Card */}
        <Card sx={{ mb: 3, bgcolor: isDateToday ? 'primary.50' : 'grey.50' }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                {isDateToday ? <TodayIcon color="primary" /> : <EventIcon />}
              </Grid>
              <Grid item xs>
                <Typography variant="h6">
                  {format(selectedDate, 'EEEE, dd/MM/yyyy')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isDateToday ? (
                    <strong>TODAY - Changes will update master department</strong>
                  ) : (
                    'PAST DATE - Changes will only affect this date (master department unchanged)'
                  )}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Row 1: Filters */}
            <Grid item xs={12} sm={6} md={2.4}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                maxDate={new Date()}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                placeholder="Employee name or code"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  endAdornment: (
                    <IconButton size="small" onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={filterDepartment}
                  onChange={handleFilterChange}
                  label="Department"
                >
                  <MenuItem value="ALL">All Departments</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.department} value={dept.department}>
                      {dept.department}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Employee Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={handleStatusFilterChange}
                  label="Employee Status"
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="RESIGNED">Resigned</MenuItem>
                  <MenuItem value="ALL">All Status</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Attendance</InputLabel>
                <Select
                  value={filterAttendance}
                  onChange={(e) => { setFilterAttendance(e.target.value); setPage(0); }}
                  label="Attendance"
                >
                  <MenuItem value="ALL">All</MenuItem>
                  <MenuItem value="PRESENT">Present</MenuItem>
                  <MenuItem value="ABSENT">Absent</MenuItem>
                  <MenuItem value="LATE">Late</MenuItem>
                  <MenuItem value="WFH">WFH</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Shift</InputLabel>
                <Select
                  value={filterShift}
                  onChange={(e) => { setFilterShift(e.target.value); setPage(0); }}
                  label="Shift"
                >
                  <MenuItem value="ALL">All Shifts</MenuItem>
                  {availableShifts.map((shift) => (
                    <MenuItem key={shift} value={shift}>{shift}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Row 2: Action */}
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<SwapIcon />}
                onClick={() => openChangeDeptDialog()}
                disabled={selectedEmployees.length === 0}
              >
                Change Department ({selectedEmployees.length} selected)
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Table */}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedEmployees.length === filteredAssignments.length && filteredAssignments.length > 0}
                    indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < filteredAssignments.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Employee Name</TableCell>
                <TableCell>Master Dept</TableCell>
                <TableCell>Current Dept</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Check In</TableCell>
                <TableCell>Check Out</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedAssignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No attendance records found for this date
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAssignments.map((assignment) => (
                  <TableRow key={assignment.employee_id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedEmployees.includes(assignment.employee_id)}
                        onChange={() => handleSelectEmployee(assignment.employee_id)}
                      />
                    </TableCell>
                    <TableCell>{assignment.employee_code}</TableCell>
                    <TableCell>{assignment.employee_name}</TableCell>
                    <TableCell>
                      <Chip label={assignment.master_department} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={assignment.current_department}
                        size="small"
                        color={assignment.current_department !== assignment.master_department ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {assignment.shift_type ? (
                        <Chip
                          label={assignment.shift_type}
                          size="small"
                          color={assignment.shift_type === 'Day Shift' ? 'warning' : 'info'}
                          variant="outlined"
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={assignment.attendance_status}
                        size="small"
                        color={assignment.attendance_status === 'PRESENT' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {assignment.first_check_in
                        ? format(parseISO(assignment.first_check_in), 'hh:mm a')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {assignment.last_check_out
                        ? format(parseISO(assignment.last_check_out), 'hh:mm a')
                        : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Change Department">
                        <IconButton
                          size="small"
                          onClick={() => openChangeDeptDialog(assignment)}
                        >
                          <SwapIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View History">
                        <IconButton
                          size="small"
                          onClick={() => openHistoryDialog(assignment)}
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredAssignments.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[25, 50, 100, 200]}
          />
        </TableContainer>

        {/* Change Department Dialog */}
        <Dialog open={changeDeptDialog} onClose={closeChangeDeptDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedEmployee
              ? `Change Department - ${selectedEmployee.employee_name}`
              : `Bulk Change Department (${selectedEmployees.length} employees)`}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Alert severity={isDateToday ? 'warning' : 'info'} sx={{ mb: 2 }}>
                {isDateToday
                  ? 'Changing for TODAY will update the master department'
                  : 'Changing for a past date will only affect that specific date'}
              </Alert>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>New Department</InputLabel>
                <Select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  label="New Department"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.department} value={dept.department}>
                      {dept.department}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason (Optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for department change"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeChangeDeptDialog}>Cancel</Button>
            <Button onClick={handleChangeDepartment} variant="contained">
              Change Department
            </Button>
          </DialogActions>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={historyDialog} onClose={closeHistoryDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            Department History - {selectedEmployee?.employee_name}
          </DialogTitle>
          <DialogContent>
            {historyLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : history.length === 0 ? (
              <Typography align="center" sx={{ p: 3 }}>
                No department change history found
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Master Updated</TableCell>
                      <TableCell>Changed By</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((record) => (
                      <TableRow key={record.history_id}>
                        <TableCell>
                          {format(parseISO(record.change_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Chip label={record.old_department} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip label={record.new_department} size="small" color="primary" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={record.is_master_updated ? 'Yes' : 'No'}
                            size="small"
                            color={record.is_master_updated ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {record.changed_by_name}
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {format(parseISO(record.changed_at), 'dd/MM/yyyy hh:mm a')}
                          </Typography>
                        </TableCell>
                        <TableCell>{record.reason || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeHistoryDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default DailyDepartmentAssignment;
