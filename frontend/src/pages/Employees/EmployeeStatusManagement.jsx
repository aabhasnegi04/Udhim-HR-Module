import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    Button,
    TextField,
    InputAdornment,
    Stack,
    Checkbox,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tooltip,
    Badge
} from '@mui/material';
import {
    Search as SearchIcon,
    MoreVert as MoreVertIcon,
    CheckCircle as ActiveIcon,
    PauseCircle as InactiveIcon,
    Cancel as ResignedIcon,
    Refresh as RefreshIcon,
    History as HistoryIcon,
    PersonAdd as RehireIcon,
    Sort as SortIcon
} from '@mui/icons-material';
import employeeService from '../../services/employeeService';

const EmployeeStatusManagement = () => {
    const [activeTab, setActiveTab] = useState(0); // 0=All, 1=Active, 2=Inactive, 3=Resigned
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(100);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [sortBy, setSortBy] = useState('employee_code'); // Default sort by employee code
    const [sortOrder, setSortOrder] = useState('asc'); // asc or desc
    
    // Dialog states
    const [statusDialog, setStatusDialog] = useState({ open: false, status: '', reason: '' });
    const [rehireDialog, setRehireDialog] = useState({ open: false, employeeId: null, reason: '' });
    const [historyDialog, setHistoryDialog] = useState({ open: false, employeeId: null, history: [] });
    
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

    // Status mapping
    const statusMap = {
        0: null,        // All
        1: 'ACTIVE',
        2: 'INACTIVE',
        3: 'RESIGNED'
    };

    // Fetch employees based on active tab
    useEffect(() => {
        fetchEmployees();
    }, [activeTab]);

    // Filter and sort employees based on search query and sort settings
    useEffect(() => {
        let filtered = employees;
        
        // Apply search filter
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = employees.filter(emp =>
                emp.full_name?.toLowerCase().includes(query) ||
                emp.employee_code?.toLowerCase().includes(query) ||
                emp.department?.toLowerCase().includes(query) ||
                emp.designation?.toLowerCase().includes(query)
            );
        }
        
        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            // Handle null/undefined values
            if (aValue === null || aValue === undefined) aValue = '';
            if (bValue === null || bValue === undefined) bValue = '';
            
            // Special handling for employee_code - sort numerically
            if (sortBy === 'employee_code') {
                // Extract numeric part from employee code
                const aNum = parseInt(String(aValue).replace(/\D/g, '')) || 0;
                const bNum = parseInt(String(bValue).replace(/\D/g, '')) || 0;
                
                if (sortOrder === 'asc') {
                    return aNum - bNum;
                } else {
                    return bNum - aNum;
                }
            }
            
            // For date fields, convert to Date objects
            if (sortBy === 'date_of_joining' || sortBy === 'last_status_change') {
                const aDate = aValue ? new Date(aValue).getTime() : 0;
                const bDate = bValue ? new Date(bValue).getTime() : 0;
                
                if (sortOrder === 'asc') {
                    return aDate - bDate;
                } else {
                    return bDate - aDate;
                }
            }
            
            // Default string comparison for other fields
            aValue = String(aValue).toLowerCase();
            bValue = String(bValue).toLowerCase();
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
        });
        
        setFilteredEmployees(sorted);
        setPage(0); // Reset to first page when searching or sorting
    }, [searchQuery, employees, sortBy, sortOrder]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const status = statusMap[activeTab];
            const result = await employeeService.getEmployeesByStatus(status, 'ALL');
            
            if (result.success) {
                setEmployees(result.data || []);
                setFilteredEmployees(result.data || []);
            } else {
                showAlert('Failed to load employees: ' + result.error, 'error');
            }
        } catch (error) {
            showAlert('Error loading employees: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message, severity = 'success') => {
        setAlert({ open: true, message, severity });
        setTimeout(() => setAlert({ open: false, message: '', severity: 'success' }), 5000);
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setSelectedEmployees([]);
        setSearchQuery('');
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const allIds = filteredEmployees.map(emp => emp.employee_id);
            setSelectedEmployees(allIds);
        } else {
            setSelectedEmployees([]);
        }
    };

    const handleSelectEmployee = (employeeId) => {
        setSelectedEmployees(prev => {
            if (prev.includes(employeeId)) {
                return prev.filter(id => id !== employeeId);
            } else {
                return [...prev, employeeId];
            }
        });
    };

    const handleMenuOpen = (event, employee) => {
        setAnchorEl(event.currentTarget);
        setCurrentEmployee(employee);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setCurrentEmployee(null);
    };

    const openStatusDialog = (status) => {
        if (selectedEmployees.length === 0 && !currentEmployee) {
            showAlert('Please select at least one employee', 'warning');
            return;
        }
        setStatusDialog({ open: true, status, reason: '' });
        handleMenuClose();
    };

    const handleStatusChange = async () => {
        if (!statusDialog.reason.trim()) {
            showAlert('Please provide a reason', 'warning');
            return;
        }

        setLoading(true);
        try {
            const employeeIds = currentEmployee 
                ? currentEmployee.employee_id 
                : selectedEmployees;

            const result = await employeeService.changeEmployeeStatus(
                employeeIds,
                statusDialog.status,
                statusDialog.reason
            );

            if (result.success) {
                showAlert(`Status changed to ${statusDialog.status} successfully`, 'success');
                setStatusDialog({ open: false, status: '', reason: '' });
                setSelectedEmployees([]);
                fetchEmployees();
            } else {
                showAlert('Failed to change status: ' + result.error, 'error');
            }
        } catch (error) {
            showAlert('Error changing status: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const openRehireDialog = (employee) => {
        setRehireDialog({ open: true, employeeId: employee.employee_id, reason: '' });
        handleMenuClose();
    };

    const handleRehire = async () => {
        if (!rehireDialog.reason.trim()) {
            showAlert('Please provide a reason for rehiring', 'warning');
            return;
        }

        setLoading(true);
        try {
            const result = await employeeService.rehireEmployee(
                rehireDialog.employeeId,
                rehireDialog.reason
            );

            if (result.success) {
                showAlert('Employee rehired successfully', 'success');
                setRehireDialog({ open: false, employeeId: null, reason: '' });
                fetchEmployees();
            } else {
                showAlert('Failed to rehire employee: ' + result.error, 'error');
            }
        } catch (error) {
            showAlert('Error rehiring employee: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const openHistoryDialog = async (employee) => {
        setLoading(true);
        try {
            const result = await employeeService.getEmployeeStatusHistory(employee.employee_id);
            
            if (result.success) {
                setHistoryDialog({ 
                    open: true, 
                    employeeId: employee.employee_id,
                    employeeName: employee.full_name,
                    history: result.data || [] 
                });
            } else {
                showAlert('Failed to load history: ' + result.error, 'error');
            }
        } catch (error) {
            showAlert('Error loading history: ' + error.message, 'error');
        } finally {
            setLoading(false);
            handleMenuClose();
        }
    };

    const getStatusChip = (status) => {
        const statusConfig = {
            'ACTIVE': { color: 'success', icon: <ActiveIcon />, label: 'Active' },
            'INACTIVE': { color: 'warning', icon: <InactiveIcon />, label: 'Inactive' },
            'RESIGNED': { color: 'error', icon: <ResignedIcon />, label: 'Resigned' }
        };

        const config = statusConfig[status] || statusConfig['ACTIVE'];
        
        return (
            <Chip
                icon={config.icon}
                label={config.label}
                color={config.color}
                size="small"
                sx={{ fontWeight: 600 }}
            />
        );
    };

    const getStatusCounts = () => {
        const counts = { ACTIVE: 0, INACTIVE: 0, RESIGNED: 0 };
        employees.forEach(emp => {
            if (counts.hasOwnProperty(emp.status)) {
                counts[emp.status]++;
            }
        });
        return counts;
    };

    const statusCounts = getStatusCounts();

    return (
        <Box>
            {/* Alert */}
            {alert.open && (
                <Alert severity={alert.severity} sx={{ mb: 2 }} onClose={() => setAlert({ ...alert, open: false })}>
                    {alert.message}
                </Alert>
            )}

            {/* Header */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" fontWeight={600}>
                        Employee Status Management
                    </Typography>
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={fetchEmployees}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Stack>

                {/* Tabs */}
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                    <Tab label={`All (${employees.length})`} />
                    <Tab 
                        label={
                            <Badge badgeContent={statusCounts.ACTIVE} color="success">
                                <span style={{ marginRight: 8 }}>Active</span>
                            </Badge>
                        } 
                    />
                    <Tab 
                        label={
                            <Badge badgeContent={statusCounts.INACTIVE} color="warning">
                                <span style={{ marginRight: 8 }}>Inactive</span>
                            </Badge>
                        } 
                    />
                    <Tab 
                        label={
                            <Badge badgeContent={statusCounts.RESIGNED} color="error">
                                <span style={{ marginRight: 8 }}>Resigned</span>
                            </Badge>
                        } 
                    />
                </Tabs>

                {/* Search, Sort and Bulk Actions */}
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <TextField
                        placeholder="Search by name, code, department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="small"
                        sx={{ flexGrow: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                    />
                    
                    <TextField
                        select
                        label="Sort By"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        size="small"
                        sx={{ minWidth: 180 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SortIcon fontSize="small" />
                                </InputAdornment>
                            )
                        }}
                    >
                        <MenuItem value="employee_code">Employee Code</MenuItem>
                        <MenuItem value="full_name">Name</MenuItem>
                        <MenuItem value="department">Department</MenuItem>
                        <MenuItem value="designation">Designation</MenuItem>
                        <MenuItem value="status">Status</MenuItem>
                        <MenuItem value="date_of_joining">Join Date</MenuItem>
                    </TextField>
                    
                    <TextField
                        select
                        label="Order"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        size="small"
                        sx={{ minWidth: 120 }}
                    >
                        <MenuItem value="asc">Ascending</MenuItem>
                        <MenuItem value="desc">Descending</MenuItem>
                    </TextField>
                </Stack>
                
                {selectedEmployees.length > 0 && (
                    <Stack direction="row" spacing={1} mb={2}>
                        <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => openStatusDialog('ACTIVE')}
                        >
                            Mark Active ({selectedEmployees.length})
                        </Button>
                        <Button
                            variant="contained"
                            color="warning"
                            size="small"
                            onClick={() => openStatusDialog('INACTIVE')}
                        >
                            Mark Inactive ({selectedEmployees.length})
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => openStatusDialog('RESIGNED')}
                        >
                            Mark Resigned ({selectedEmployees.length})
                        </Button>
                    </Stack>
                )}
            </Paper>

            {/* Table */}
            <TableContainer component={Paper}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                                            indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < filteredEmployees.length}
                                            onChange={handleSelectAll}
                                        />
                                    </TableCell>
                                    <TableCell>Employee Code</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Department</TableCell>
                                    <TableCell>Designation</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Last Change</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredEmployees
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((employee) => (
                                        <TableRow key={employee.employee_id} hover>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedEmployees.includes(employee.employee_id)}
                                                    onChange={() => handleSelectEmployee(employee.employee_id)}
                                                />
                                            </TableCell>
                                            <TableCell>{employee.employee_code}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {employee.full_name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{employee.department}</TableCell>
                                            <TableCell>{employee.designation}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={employee.worker_category} 
                                                    size="small" 
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{getStatusChip(employee.status)}</TableCell>
                                            <TableCell>
                                                <Typography variant="caption" display="block">
                                                    {employee.last_status_change 
                                                        ? new Date(employee.last_status_change).toLocaleDateString()
                                                        : 'N/A'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {employee.last_status_reason || 'No reason'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleMenuOpen(e, employee)}
                                                >
                                                    <MoreVertIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                {filteredEmployees.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">
                                                No employees found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={filteredEmployees.length}
                            page={page}
                            onPageChange={(e, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                        />
                    </>
                )}
            </TableContainer>

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {currentEmployee?.status !== 'ACTIVE' && (
                    <MenuItem onClick={() => openStatusDialog('ACTIVE')}>
                        <ActiveIcon sx={{ mr: 1 }} color="success" />
                        Mark as Active
                    </MenuItem>
                )}
                {currentEmployee?.status !== 'INACTIVE' && (
                    <MenuItem onClick={() => openStatusDialog('INACTIVE')}>
                        <InactiveIcon sx={{ mr: 1 }} color="warning" />
                        Mark as Inactive
                    </MenuItem>
                )}
                {currentEmployee?.status !== 'RESIGNED' && (
                    <MenuItem onClick={() => openStatusDialog('RESIGNED')}>
                        <ResignedIcon sx={{ mr: 1 }} color="error" />
                        Mark as Resigned
                    </MenuItem>
                )}
                {currentEmployee?.status === 'RESIGNED' && (
                    <MenuItem onClick={() => openRehireDialog(currentEmployee)}>
                        <RehireIcon sx={{ mr: 1 }} color="primary" />
                        Rehire Employee
                    </MenuItem>
                )}
                <MenuItem onClick={() => openHistoryDialog(currentEmployee)}>
                    <HistoryIcon sx={{ mr: 1 }} />
                    View History
                </MenuItem>
            </Menu>

            {/* Status Change Dialog */}
            <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ ...statusDialog, open: false })} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Change Status to {statusDialog.status}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        {currentEmployee 
                            ? `Changing status for: ${currentEmployee.full_name}`
                            : `Changing status for ${selectedEmployees.length} employee(s)`
                        }
                    </Typography>
                    <TextField
                        label="Reason *"
                        multiline
                        rows={3}
                        fullWidth
                        value={statusDialog.reason}
                        onChange={(e) => setStatusDialog({ ...statusDialog, reason: e.target.value })}
                        placeholder="e.g., Gone to hometown for festival, Resigned for better opportunity, etc."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialog({ ...statusDialog, open: false })}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleStatusChange} 
                        variant="contained"
                        disabled={loading || !statusDialog.reason.trim()}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Rehire Dialog */}
            <Dialog open={rehireDialog.open} onClose={() => setRehireDialog({ ...rehireDialog, open: false })} maxWidth="sm" fullWidth>
                <DialogTitle>Rehire Employee</DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        The employee will be marked as ACTIVE and can login again. Their employee code will remain the same for biometric compatibility.
                    </Alert>
                    <TextField
                        label="Reason for Rehiring *"
                        multiline
                        rows={3}
                        fullWidth
                        value={rehireDialog.reason}
                        onChange={(e) => setRehireDialog({ ...rehireDialog, reason: e.target.value })}
                        placeholder="e.g., Rejoined after completing personal commitments"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRehireDialog({ ...rehireDialog, open: false })}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleRehire} 
                        variant="contained"
                        color="primary"
                        disabled={loading || !rehireDialog.reason.trim()}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Rehire'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* History Dialog */}
            <Dialog open={historyDialog.open} onClose={() => setHistoryDialog({ ...historyDialog, open: false })} maxWidth="md" fullWidth>
                <DialogTitle>
                    Status History - {historyDialog.employeeName}
                </DialogTitle>
                <DialogContent>
                    {historyDialog.history.length === 0 ? (
                        <Typography color="text.secondary" align="center" py={4}>
                            No status history found
                        </Typography>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>From</TableCell>
                                    <TableCell>To</TableCell>
                                    <TableCell>Reason</TableCell>
                                    <TableCell>Changed By</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historyDialog.history.map((record) => (
                                    <TableRow key={record.history_id}>
                                        <TableCell>
                                            {new Date(record.changed_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {record.old_status ? getStatusChip(record.old_status) : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusChip(record.new_status)}
                                        </TableCell>
                                        <TableCell>{record.reason || 'No reason provided'}</TableCell>
                                        <TableCell>
                                            <Typography variant="caption">
                                                {record.changed_by_name || record.changed_by_email}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHistoryDialog({ ...historyDialog, open: false })}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmployeeStatusManagement;
