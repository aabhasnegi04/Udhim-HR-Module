import { useState } from 'react';
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Avatar,
    IconButton,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Alert,
    InputAdornment,
    Autocomplete
} from '@mui/material';
import {
    PersonAdd as AssignIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Visibility as ViewIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';

// Mock data
const mockEmployees = [
    { id: 1, name: 'John Smith', employeeId: 'EMP001', department: 'Engineering', designation: 'Software Engineer', currentSalary: null },
    { id: 2, name: 'Sarah Johnson', employeeId: 'EMP002', department: 'HR', designation: 'HR Manager', currentSalary: 75000 },
    { id: 3, name: 'Michael Chen', employeeId: 'EMP003', department: 'Engineering', designation: 'Senior Software Engineer', currentSalary: null },
    { id: 4, name: 'Emily Davis', employeeId: 'EMP004', department: 'Marketing', designation: 'Marketing Executive', currentSalary: 45000 },
    { id: 5, name: 'Robert Wilson', employeeId: 'EMP005', department: 'Engineering', designation: 'Tech Lead', currentSalary: 95000 }
];

const mockSalaryStructures = [
    { id: 1, name: 'Software Engineer - L1', monthlySalary: 60000, netPay: 50300 },
    { id: 2, name: 'Senior Software Engineer - L2', monthlySalary: 100000, netPay: 81800 },
    { id: 3, name: 'Manager - M1', monthlySalary: 150000, netPay: 120800 },
    { id: 4, name: 'HR Manager - H1', monthlySalary: 80000, netPay: 65600 },
    { id: 5, name: 'Marketing Executive - M1', monthlySalary: 50000, netPay: 42000 }
];

const mockAssignments = [
    { id: 1, employeeId: 'EMP002', employeeName: 'Sarah Johnson', structureName: 'HR Manager - H1', monthlySalary: 80000, effectiveFrom: '2025-01-01', status: 'Active' },
    { id: 2, employeeId: 'EMP004', employeeName: 'Emily Davis', structureName: 'Marketing Executive - M1', monthlySalary: 50000, effectiveFrom: '2024-06-01', status: 'Active' },
    { id: 3, employeeId: 'EMP005', employeeName: 'Robert Wilson', structureName: 'Senior Software Engineer - L2', monthlySalary: 100000, effectiveFrom: '2024-03-01', status: 'Active' }
];

const AssignSalary = () => {
    const [assignments, setAssignments] = useState(mockAssignments);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedStructure, setSelectedStructure] = useState(null);
    const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
    const [customOverrides, setCustomOverrides] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');

    const filteredEmployees = mockEmployees.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDepartment = departmentFilter === 'all' || emp.department === departmentFilter;
        return matchesSearch && matchesDepartment;
    });

    const unassignedEmployees = filteredEmployees.filter(emp => 
        !assignments.some(assignment => assignment.employeeId === emp.employeeId)
    );

    const handleAssignSalary = () => {
        if (!selectedEmployee || !selectedStructure) return;

        const newAssignment = {
            id: assignments.length + 1,
            employeeId: selectedEmployee.employeeId,
            employeeName: selectedEmployee.name,
            structureName: selectedStructure.name,
            monthlySalary: selectedStructure.monthlySalary,
            effectiveFrom: effectiveDate,
            status: 'Active'
        };

        setAssignments(prev => [...prev, newAssignment]);
        setShowAssignDialog(false);
        resetForm();
    };

    const resetForm = () => {
        setSelectedEmployee(null);
        setSelectedStructure(null);
        setEffectiveDate(new Date().toISOString().split('T')[0]);
        setCustomOverrides({});
    };

    const handleRemoveAssignment = (assignmentId) => {
        setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Assign Salary to Employees
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Assign salary structures to employees and manage salary assignments
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => setAssignments(mockAssignments)}
                            size="small"
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AssignIcon />}
                            onClick={() => setShowAssignDialog(true)}
                        >
                            Assign Salary
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                            {assignments.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Assigned Employees
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                            {unassignedEmployees.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Unassigned Employees
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                            ₹{Math.round(assignments.reduce((sum, a) => sum + a.monthlySalary, 0) / 100000)}L
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Monthly Payroll
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
                        <TextField
                            fullWidth
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="small"
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Box>
                    <Box sx={{ flex: '0 0 150px', minWidth: '150px' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Department</InputLabel>
                            <Select
                                value={departmentFilter}
                                label="Department"
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Departments</MenuItem>
                                <MenuItem value="Engineering">Engineering</MenuItem>
                                <MenuItem value="HR">HR</MenuItem>
                                <MenuItem value="Marketing">Marketing</MenuItem>
                                <MenuItem value="Sales">Sales</MenuItem>
                                <MenuItem value="Finance">Finance</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
            </Paper>

            {/* Current Assignments Table */}
            <Paper sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Current Salary Assignments
                    </Typography>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Salary Structure</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Monthly Salary</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Effective From</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {assignments.map((assignment) => (
                                <TableRow key={assignment.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                                {assignment.employeeName.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {assignment.employeeName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {assignment.employeeId}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>
                                            {assignment.structureName}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" fontWeight={600}>
                                            ₹{assignment.monthlySalary.toLocaleString('en-IN')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{assignment.effectiveFrom}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={assignment.status}
                                            color={assignment.status === 'Active' ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton size="small">
                                                <ViewIcon />
                                            </IconButton>
                                            <IconButton size="small">
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                color="error"
                                                onClick={() => handleRemoveAssignment(assignment.id)}
                                            >
                                                <CancelIcon />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Unassigned Employees */}
            {unassignedEmployees.length > 0 && (
                <Paper>
                    <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Unassigned Employees ({unassignedEmployees.length})
                        </Typography>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {unassignedEmployees.map((employee) => (
                                    <TableRow key={employee.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                                    {employee.name.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {employee.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {employee.employeeId}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{employee.department}</TableCell>
                                        <TableCell>{employee.designation}</TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<AssignIcon />}
                                                onClick={() => {
                                                    setSelectedEmployee(employee);
                                                    setShowAssignDialog(true);
                                                }}
                                            >
                                                Assign
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Assign Salary Dialog */}
            <Dialog open={showAssignDialog} onClose={() => setShowAssignDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Assign Salary Structure</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        {/* Employee Selection */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Select Employee
                            </Typography>
                            <Autocomplete
                                options={mockEmployees}
                                getOptionLabel={(option) => `${option.name} (${option.employeeId})`}
                                value={selectedEmployee}
                                onChange={(event, newValue) => setSelectedEmployee(newValue)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Employee" placeholder="Search and select employee" />
                                )}
                                renderOption={(props, option) => (
                                    <Box component="li" {...props}>
                                        <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                            {option.name.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {option.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.employeeId} • {option.department} • {option.designation}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            />
                        </Box>

                        {/* Salary Structure Selection */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Select Salary Structure
                            </Typography>
                            <Autocomplete
                                options={mockSalaryStructures}
                                getOptionLabel={(option) => option.name}
                                value={selectedStructure}
                                onChange={(event, newValue) => setSelectedStructure(newValue)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Salary Structure" placeholder="Search and select structure" />
                                )}
                                renderOption={(props, option) => (
                                    <Box component="li" {...props}>
                                        <Box sx={{ width: '100%' }}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {option.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Monthly: ₹{option.monthlySalary.toLocaleString('en-IN')} • 
                                                Net: ₹{option.netPay.toLocaleString('en-IN')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            />
                        </Box>

                        {/* Effective Date */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Effective Date
                            </Typography>
                            <TextField
                                fullWidth
                                label="Effective From"
                                type="date"
                                value={effectiveDate}
                                onChange={(e) => setEffectiveDate(e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Box>

                        {/* Preview */}
                        {selectedEmployee && selectedStructure && (
                            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                    Assignment Preview
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Employee</Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {selectedEmployee.name} ({selectedEmployee.employeeId})
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Structure</Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {selectedStructure.name}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Monthly Salary</Typography>
                                        <Typography variant="body1" fontWeight={600} color="primary.main">
                                            ₹{selectedStructure.monthlySalary.toLocaleString('en-IN')}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Net Pay</Typography>
                                        <Typography variant="body1" fontWeight={600} color="success.main">
                                            ₹{selectedStructure.netPay.toLocaleString('en-IN')}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAssignDialog(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleAssignSalary}
                        disabled={!selectedEmployee || !selectedStructure}
                        startIcon={<SaveIcon />}
                    >
                        Assign Salary
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AssignSalary;