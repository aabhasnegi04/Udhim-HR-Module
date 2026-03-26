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
    TextField,
    InputAdornment,
    MenuItem,
    Chip,
    Avatar,
    IconButton,
    TablePagination,
    Button,
    CircularProgress,
    Alert,
    TableSortLabel,
} from '@mui/material';
import {
    Search as SearchIcon,
    Visibility as ViewIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import employeeService from '../../services/employeeService';
import adminService from '../../services/adminService';

const statuses = ['All Status', 'ACTIVE', 'INACTIVE'];

const EmployeeList = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState(['All Departments']);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('All Departments');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Sorting state
    const [sortBy, setSortBy] = useState('employee_id'); // Default sort by employee_id (newest first)
    const [sortOrder, setSortOrder] = useState('desc'); // desc = newest first

    // Load employees on component mount
    useEffect(() => {
        loadEmployees();
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        try {
            const result = await adminService.getDepartments();
            if (result.success && result.data) {
                const departmentNames = result.data.map(dept => dept.department_name);
                setDepartments(['All Departments', ...departmentNames]);
            }
        } catch (error) {
            console.error('Error loading departments:', error);
            // Keep default departments if API fails
        }
    };

    const loadEmployees = async () => {
        try {
            setLoading(true);
            setError('');
            const result = await employeeService.getEmployees();
            
            if (result.success) {
                setEmployees(result.data);
            } else {
                setError(result.error);
            }
        } catch (error) {
            setError('Failed to load employees');
            console.error('Load employees error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort employees
    const filteredAndSortedEmployees = employees
        .filter(employee => {
            const matchesSearch = 
                employee.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.employee_code?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesDepartment = 
                departmentFilter === 'All Departments' || employee.department === departmentFilter;
            
            const matchesStatus = 
                statusFilter === 'All Status' || employee.status === statusFilter;

            return matchesSearch && matchesDepartment && matchesStatus;
        })
        .sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            // Handle different data types
            if (sortBy === 'employee_id') {
                aValue = parseInt(aValue) || 0;
                bValue = parseInt(bValue) || 0;
            } else if (typeof aValue === 'string') {
                aValue = aValue?.toLowerCase() || '';
                bValue = bValue?.toLowerCase() || '';
            }
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        }) || []; // Ensure it's always an array

    const handleSort = (column) => {
        if (sortBy === column) {
            // Toggle sort order if same column
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // New column, default to ascending (except employee_id which defaults to desc for newest first)
            setSortBy(column);
            setSortOrder(column === 'employee_id' ? 'desc' : 'asc');
        }
        setPage(0); // Reset to first page when sorting
    };

    const handleViewEmployee = (employeeId) => {
        navigate(`/employees/${employeeId}`);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ 
                mb: 3,
                textAlign: 'center'
            }}>
                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', sm: '2.125rem' }, mb: 1 }}>
                    Employee Directory
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Manage and view all employee information
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    sx={{ minWidth: { xs: '200px', sm: 'auto' } }}
                    onClick={() => navigate('/employees/add')}
                >
                    Add Employee
                </Button>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Search and Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    alignItems: 'end',
                    flexDirection: { xs: 'column', sm: 'column', md: 'row' },
                    '& > *': { width: { xs: '100%', md: 'auto' } }
                }}>
                    <Box sx={{ flex: { md: '1 1 30%' } }}>
                        <TextField
                            fullWidth
                            placeholder="Search by name or employee ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                    <Box sx={{ flex: { md: '1 1 20%' } }}>
                        <TextField
                            select
                            fullWidth
                            label="Sort By"
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [column, order] = e.target.value.split('-');
                                setSortBy(column);
                                setSortOrder(order);
                                setPage(0);
                            }}
                        >
                            <MenuItem value="employee_id-desc">Newest First</MenuItem>
                            <MenuItem value="employee_id-asc">Oldest First</MenuItem>
                            <MenuItem value="employee_name-asc">Name A-Z</MenuItem>
                            <MenuItem value="employee_name-desc">Name Z-A</MenuItem>
                            <MenuItem value="department-asc">Department A-Z</MenuItem>
                            <MenuItem value="designation-asc">Designation A-Z</MenuItem>
                        </TextField>
                    </Box>
                    <Box sx={{ flex: { md: '1 1 25%' } }}>
                        <TextField
                            select
                            fullWidth
                            label="Department"
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                        >
                            {departments.map((dept) => (
                                <MenuItem key={dept} value={dept}>
                                    {dept}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                    <Box sx={{ flex: { md: '1 1 25%' } }}>
                        <TextField
                            select
                            fullWidth
                            label="Status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            {statuses.map((status) => (
                                <MenuItem key={status} value={status}>
                                    {status === 'All Status' ? status : status.charAt(0) + status.slice(1).toLowerCase()}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </Box>
            </Paper>

            {/* Employee Table */}
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>
                                <TableSortLabel
                                    active={sortBy === 'employee_code'}
                                    direction={sortBy === 'employee_code' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('employee_code')}
                                >
                                    Employee ID
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                                <TableSortLabel
                                    active={sortBy === 'employee_name'}
                                    direction={sortBy === 'employee_name' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('employee_name')}
                                >
                                    Name
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                                <TableSortLabel
                                    active={sortBy === 'department'}
                                    direction={sortBy === 'department' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('department')}
                                >
                                    Department
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                                <TableSortLabel
                                    active={sortBy === 'designation'}
                                    direction={sortBy === 'designation' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('designation')}
                                >
                                    Designation
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                                <TableSortLabel
                                    active={sortBy === 'status'}
                                    direction={sortBy === 'status' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('status')}
                                >
                                    Status
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAndSortedEmployees
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((employee) => (
                            <TableRow 
                                key={employee.employee_id} 
                                hover 
                                sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'action.hover' },
                                    ...(employee.status === 'INACTIVE' && {
                                        bgcolor: 'grey.50',
                                        opacity: 0.7,
                                        '&:hover': { bgcolor: 'grey.100' }
                                    })
                                }}
                                onClick={() => handleViewEmployee(employee.employee_id)}
                            >
                                <TableCell sx={{ fontWeight: 500, color: 'primary.main' }}>
                                    {employee.employee_code}
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar 
                                            src={`${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}/employees/${employee.employee_id}/photo?size=80&company=${import.meta.env.VITE_COMPANY_CODE || 'udhim'}`}
                                            sx={{ 
                                                bgcolor: employee.status === 'INACTIVE' ? 'grey.400' : 'primary.main',
                                                width: 40,
                                                height: 40,
                                                fontSize: '0.875rem'
                                            }}
                                            imgProps={{
                                                loading: 'lazy',  // Lazy load images
                                                onError: (e) => {
                                                    // Fallback to initials if image fails to load
                                                    e.target.style.display = 'none';
                                                }
                                            }}
                                        >
                                            {employee.employee_name?.charAt(0) || 'E'}
                                        </Avatar>
                                        <Box>
                                            <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                    fontWeight: 500,
                                                    ...(employee.status === 'INACTIVE' && {
                                                        color: 'text.secondary',
                                                        textDecoration: 'line-through'
                                                    })
                                                }}
                                            >
                                                {employee.employee_name}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>{employee.department}</TableCell>
                                <TableCell>{employee.designation}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={employee.status}
                                        color={employee.status === 'ACTIVE' ? 'success' : 'error'}
                                        size="small"
                                        sx={{ fontWeight: 500 }}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton 
                                        size="small" 
                                        color="primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewEmployee(employee.employee_id);
                                        }}
                                    >
                                        <ViewIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                
                {/* Pagination */}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredAndSortedEmployees.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>

            {/* Empty State */}
            {!loading && filteredAndSortedEmployees.length === 0 && (
                <Paper sx={{ p: 6, textAlign: 'center', mt: 3 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No employees found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {employees.length === 0 
                            ? 'No employees have been added yet. Click "Add Employee" to get started.'
                            : 'Try adjusting your search criteria or filters'
                        }
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default EmployeeList;