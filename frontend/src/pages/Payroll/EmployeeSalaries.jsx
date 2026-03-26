import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppDatePicker from '../../components/common/AppDatePicker';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Card,
    CardContent,
    Divider,
    Stack,
    Avatar,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    InputAdornment,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    FileDownload as ExportIcon,
    Search as SearchIcon,
    Warning as WarningIcon,
    Person as PersonIcon,
    Business as DepartmentIcon,
    Badge as BadgeIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import payrollService from '../../services/payrollService';
import employeeService from '../../services/employeeService';

const EmployeeSalaries = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [templateFilter, setTemplateFilter] = useState('');
    
    // View/Edit dialogs
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [salaryDetails, setSalaryDetails] = useState(null);
    
    // Edit form state
    const [editTemplate, setEditTemplate] = useState(null);
    const [editCTC, setEditCTC] = useState('');
    const [editEffectiveFrom, setEditEffectiveFrom] = useState('');
    const [editPreview, setEditPreview] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [saving, setSaving] = useState(false);
    
    // Employees without salary
    const [employeesWithoutSalary, setEmployeesWithoutSalary] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, departmentFilter, templateFilter, employees]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get all employees and templates
            const [employeesRes, templatesRes] = await Promise.all([
                employeeService.getAllEmployees(),
                payrollService.getSalaryStructures()
            ]);
            
            if (employeesRes?.success && employeesRes?.data) {
                const allEmployees = employeesRes.data;
                
                // Get salary details for each employee
                const employeesWithSalary = await Promise.all(
                    allEmployees.map(async (emp) => {
                        try {
                            const salaryRes = await payrollService.getEmployeeSalaryDetails(emp.employee_id);
                            
                            if (salaryRes?.success && salaryRes?.data) {
                                const salaryData = salaryRes.data;
                                const empDetails = salaryData.employee_details || {};
                                const components = salaryData.components || [];
                                
                                // If no structure_id, employee has no salary assignment
                                if (!empDetails.structure_id) {
                                    return { ...emp, hasSalary: false };
                                }
                                
                                // Calculate earnings and deductions
                                const earnings = components.filter(c => c.component_type === 'EARNING');
                                const deductions = components.filter(c => c.component_type === 'DEDUCTION');
                                const totalEarnings = earnings.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
                                const totalDeductions = deductions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
                                const netSalary = totalEarnings - totalDeductions;
                                
                                return {
                                    ...emp,
                                    salary: {
                                        structure_id: empDetails.structure_id,
                                        structure_name: empDetails.structure_name,
                                        monthly_ctc: empDetails.monthly_ctc,
                                        annual_ctc: empDetails.annual_ctc,
                                        effective_from: empDetails.effective_from,
                                        earnings: earnings,
                                        deductions: deductions,
                                        total_earnings: totalEarnings,
                                        total_deductions: totalDeductions,
                                        net_salary: netSalary
                                    },
                                    hasSalary: true
                                };
                            }
                            return { ...emp, hasSalary: false };
                        } catch (err) {
                            return { ...emp, hasSalary: false };
                        }
                    })
                );
                
                setEmployees(employeesWithSalary);
                
                // Filter employees without salary
                const withoutSalary = employeesWithSalary.filter(emp => !emp.hasSalary);
                setEmployeesWithoutSalary(withoutSalary);
            }
            
            // Load templates
            if (Array.isArray(templatesRes)) {
                setTemplates(templatesRes);
            } else if (templatesRes?.success && templatesRes?.data) {
                setTemplates(Array.isArray(templatesRes.data) ? templatesRes.data : []);
            } else if (templatesRes?.data) {
                setTemplates(Array.isArray(templatesRes.data) ? templatesRes.data : []);
            } else {
                setTemplates([]);
            }
        } catch (err) {
            console.error('Load data error:', err);
            setError('Failed to load employee salaries');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = employees.filter(emp => emp.hasSalary);
        
        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(emp =>
                emp.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Department filter
        if (departmentFilter) {
            filtered = filtered.filter(emp => emp.department === departmentFilter);
        }
        
        // Template filter
        if (templateFilter) {
            filtered = filtered.filter(emp => emp.salary?.structure_name === templateFilter);
        }
        
        setFilteredEmployees(filtered);
    };

    const handleViewSalary = async (employee) => {
        try {
            setSelectedEmployee(employee);
            setSalaryDetails(employee.salary);
            setViewDialogOpen(true);
        } catch (err) {
            console.error('View salary error:', err);
            setError('Failed to load salary details');
        }
    };

    const handleCloseViewDialog = () => {
        setViewDialogOpen(false);
        setSelectedEmployee(null);
        setSalaryDetails(null);
    };

    const handleEditSalary = (employee) => {
        setSelectedEmployee(employee);
        setEditTemplate(templates.find(t => t.structure_id === employee.salary?.structure_id) || null);
        setEditCTC(employee.salary?.monthly_ctc || '');
        
        // Format the date properly for the input field (YYYY-MM-DD)
        let formattedDate = '';
        if (employee.salary?.effective_from) {
            const date = new Date(employee.salary.effective_from);
            formattedDate = date.toISOString().split('T')[0];
        }
        setEditEffectiveFrom(formattedDate);
        
        setEditPreview(null); // Don't set preview initially
        setEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setSelectedEmployee(null);
        setEditTemplate(null);
        setEditCTC('');
        setEditEffectiveFrom('');
        setEditPreview(null);
    };

    const handleSaveEdit = async () => {
        try {
            if (!selectedEmployee || !editTemplate || !editCTC) {
                setError('Please fill all required fields');
                return;
            }

            setSaving(true);
            setError(null);

            const response = await payrollService.assignSalaryTemplate(
                selectedEmployee.employee_id,
                editTemplate.structure_id,
                parseFloat(editCTC),
                editEffectiveFrom || null
            );

            if (response.success) {
                setSuccess(`Salary updated successfully for ${selectedEmployee.employee_name}!`);
                handleCloseEditDialog();
                loadData(); // Reload data
            } else {
                setError(response.message || 'Failed to update salary');
            }
        } catch (err) {
            console.error('Update salary error:', err);
            setError('Failed to update salary: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSalary = async (employee) => {
        if (!confirm(`Are you sure you want to remove salary assignment for ${employee.employee_name}?\n\nThis will deactivate their current salary structure.`)) {
            return;
        }
        
        try {
            setError(null);
            const response = await payrollService.deactivateSalaryAssignment(employee.employee_id);
            
            if (response.success) {
                setSuccess(`Salary assignment removed successfully for ${employee.employee_name}!`);
                loadData(); // Reload data
            } else {
                setError(response.message || 'Failed to remove salary assignment');
            }
        } catch (err) {
            console.error('Delete salary error:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Unknown error occurred';
            setError(`Failed to remove salary assignment: ${errorMsg}`);
        }
    };

    // Get unique departments and templates for filters
    const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
    const templateNames = [...new Set(employees.filter(emp => emp.hasSalary).map(emp => emp.salary?.structure_name).filter(Boolean))];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Employee Salaries
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        View and manage employee salary assignments
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadData}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ExportIcon />}
                    >
                        Export
                    </Button>
                </Stack>
            </Box>

            {/* Employees without salary warning */}
            {employeesWithoutSalary.length > 0 && (
                <Alert 
                    severity="warning" 
                    icon={<WarningIcon />}
                    sx={{ mb: 3 }}
                    action={
                        <Button 
                            color="inherit" 
                            size="small" 
                            onClick={() => navigate('/payroll?tab=3')}
                        >
                            Assign Salary
                        </Button>
                    }
                >
                    {employeesWithoutSalary.length} employee(s) do not have salary assigned: {' '}
                    {employeesWithoutSalary.slice(0, 3).map(emp => emp.employee_name).join(', ')}
                    {employeesWithoutSalary.length > 3 && ` and ${employeesWithoutSalary.length - 3} more`}
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                        placeholder="Search employee..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                        sx={{ flex: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Department</InputLabel>
                        <Select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            label="Department"
                        >
                            <MenuItem value="">All Departments</MenuItem>
                            {departments.map(dept => (
                                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Template</InputLabel>
                        <Select
                            value={templateFilter}
                            onChange={(e) => setTemplateFilter(e.target.value)}
                            label="Template"
                        >
                            <MenuItem value="">All Templates</MenuItem>
                            {templateNames.map(template => (
                                <MenuItem key={template} value={template}>{template}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {/* Employee Salaries Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Template</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>Monthly CTC</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>Net Salary</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Effective From</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredEmployees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        No employee salaries found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredEmployees.map((employee) => (
                                <TableRow key={employee.employee_id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                                                {employee.employee_name.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {employee.employee_name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {employee.employee_code}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{employee.department || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={employee.salary?.structure_name || 'N/A'} 
                                            size="small" 
                                            color="primary" 
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        {payrollService.formatCurrency(employee.salary?.monthly_ctc || 0)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                                        {payrollService.formatCurrency(employee.salary?.net_salary || 0)}
                                    </TableCell>
                                    <TableCell>
                                        {employee.salary?.effective_from 
                                            ? payrollService.formatDate(employee.salary.effective_from)
                                            : 'N/A'
                                        }
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                            <Tooltip title="View Details">
                                                <IconButton 
                                                    size="small" 
                                                    color="primary"
                                                    onClick={() => handleViewSalary(employee)}
                                                >
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit Salary">
                                                <IconButton 
                                                    size="small" 
                                                    color="info"
                                                    onClick={() => handleEditSalary(employee)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Remove Assignment">
                                                <IconButton 
                                                    size="small" 
                                                    color="error"
                                                    onClick={() => handleDeleteSalary(employee)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* View Salary Details Dialog */}
            <Dialog 
                open={viewDialogOpen} 
                onClose={handleCloseViewDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Employee Salary Details
                </DialogTitle>
                <DialogContent dividers>
                    {selectedEmployee && salaryDetails && (
                        <Box>
                            {/* Employee Info */}
                            <Card sx={{ mb: 3, bgcolor: 'primary.lighter', border: '1px solid', borderColor: 'primary.light' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                                    <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
                                        {selectedEmployee.employee_name.charAt(0)}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                            {selectedEmployee.employee_name}
                                        </Typography>
                                        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <BadgeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    {selectedEmployee.employee_code}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <DepartmentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    {selectedEmployee.department || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Salary Summary */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
                                    Salary Summary
                                </Typography>
                                <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Template:</Typography>
                                        <Chip label={salaryDetails.structure_name} size="small" color="primary" />
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Monthly CTC:</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {payrollService.formatCurrency(salaryDetails.monthly_ctc)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Effective From:</Typography>
                                        <Typography variant="body2">
                                            {payrollService.formatDate(salaryDetails.effective_from)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Earnings */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'success.main' }}>
                                    Earnings
                                </Typography>
                                <Table size="small">
                                    <TableBody>
                                        {salaryDetails.earnings?.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell sx={{ border: 0, py: 0.5 }}>{item.component_name}</TableCell>
                                                <TableCell align="right" sx={{ border: 0, py: 0.5, fontWeight: 500 }}>
                                                    {payrollService.formatCurrency(item.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow sx={{ bgcolor: 'success.lighter' }}>
                                            <TableCell sx={{ border: 0, py: 1, fontWeight: 600 }}>Total Earnings</TableCell>
                                            <TableCell align="right" sx={{ border: 0, py: 1, fontWeight: 700, color: 'success.main' }}>
                                                {payrollService.formatCurrency(salaryDetails.total_earnings)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Deductions */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'error.main' }}>
                                    Deductions
                                </Typography>
                                <Table size="small">
                                    <TableBody>
                                        {salaryDetails.deductions?.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell sx={{ border: 0, py: 0.5 }}>{item.component_name}</TableCell>
                                                <TableCell align="right" sx={{ border: 0, py: 0.5, fontWeight: 500 }}>
                                                    {payrollService.formatCurrency(item.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow sx={{ bgcolor: 'error.lighter' }}>
                                            <TableCell sx={{ border: 0, py: 1, fontWeight: 600 }}>Total Deductions</TableCell>
                                            <TableCell align="right" sx={{ border: 0, py: 1, fontWeight: 700, color: 'error.main' }}>
                                                {payrollService.formatCurrency(salaryDetails.total_deductions)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Net Salary */}
                            <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Net Salary
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                            {payrollService.formatCurrency(salaryDetails.net_salary)}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseViewDialog}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Salary Dialog */}
            <Dialog 
                open={editDialogOpen} 
                onClose={handleCloseEditDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Edit Salary Assignment
                </DialogTitle>
                <DialogContent dividers>
                    {selectedEmployee && (
                        <Box>
                            {/* Employee Info */}
                            <Card sx={{ mb: 3, bgcolor: 'primary.lighter', border: '1px solid', borderColor: 'primary.light' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                                    <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1.25rem' }}>
                                        {selectedEmployee.employee_name.charAt(0)}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            {selectedEmployee.employee_name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {selectedEmployee.employee_code} • {selectedEmployee.department}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Edit Form */}
                            <Stack spacing={2.5}>
                                <FormControl fullWidth>
                                    <InputLabel>Salary Template</InputLabel>
                                    <Select
                                        value={editTemplate?.structure_id || ''}
                                        onChange={(e) => {
                                            const template = templates.find(t => t.structure_id === e.target.value);
                                            setEditTemplate(template);
                                        }}
                                        label="Salary Template"
                                    >
                                        {templates.map((template) => (
                                            <MenuItem key={template.structure_id} value={template.structure_id}>
                                                {template.structure_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    fullWidth
                                    label="Monthly CTC"
                                    type="number"
                                    value={editCTC}
                                    onChange={(e) => setEditCTC(e.target.value)}
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>
                                    }}
                                />

                                <AppDatePicker
                                    label="Effective From"
                                    value={editEffectiveFrom}
                                    onChange={(v) => setEditEffectiveFrom(v)}
                                    helperText="Leave empty to keep current date"
                                />
                            </Stack>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditDialog} disabled={saving}>Cancel</Button>
                    <Button 
                        onClick={handleSaveEdit} 
                        variant="contained" 
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmployeeSalaries;
