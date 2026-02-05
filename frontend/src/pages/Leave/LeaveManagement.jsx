import { useState, useEffect } from 'react';
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
    Alert,
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
    Chip,
    IconButton,
    Tabs,
    Tab,
    Grid,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Refresh as RefreshIcon,
    AccountBalance as BalanceIcon,
    Group as GroupIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import leaveService from '../../services/leaveService';
import employeeService from '../../services/employeeService';

const LeaveManagement = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // Data states
    const [employees, setEmployees] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [leaveBalances, setLeaveBalances] = useState([]);
    
    // Dialog states
    const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
    const [bulkAllocateDialogOpen, setBulkAllocateDialogOpen] = useState(false);
    
    // Form states
    const [allocateForm, setAllocateForm] = useState({
        employee_id: '',
        leave_type_id: '',
        year: new Date().getFullYear(),
        total_allocated: ''
    });
    
    const [bulkAllocateForm, setBulkAllocateForm] = useState({
        year: new Date().getFullYear(),
        allocations: []
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (employees.length > 0) {
            loadLeaveBalances();
        }
    }, [employees, allocateForm.year]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            const [employeesResult, leaveTypesResult] = await Promise.all([
                employeeService.getAllEmployees(),
                leaveService.getLeaveTypes()
            ]);
            
            if (employeesResult.success) {
                setEmployees(employeesResult.data);
            }
            
            if (leaveTypesResult.success) {
                setLeaveTypes(leaveTypesResult.data);
            }
            
            // Note: loadLeaveBalances will be called by useEffect when employees are set
            
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadLeaveBalances = async () => {
        try {
            // For now, we'll load balances for all employees
            // In a real system, you might want pagination or filtering
            const balancePromises = employees.map(emp => 
                leaveService.getLeaveBalances(emp.employee_id, allocateForm.year)
            );
            
            const balanceResults = await Promise.all(balancePromises);
            const allBalances = [];
            
            balanceResults.forEach((result, index) => {
                if (result.success && result.data) {
                    result.data.forEach(balance => {
                        allBalances.push({
                            ...balance,
                            employee_code: employees[index]?.employee_code,
                            employee_name: employees[index]?.employee_name
                        });
                    });
                }
            });
            
            setLeaveBalances(allBalances);
        } catch (err) {
            console.error('Failed to load leave balances:', err);
        }
    };

    const handleAllocateSubmit = async () => {
        try {
            const result = await leaveService.allocateLeaveBalance(allocateForm);
            
            if (result.success) {
                setSuccess('Leave balance allocated successfully!');
                setAllocateDialogOpen(false);
                setAllocateForm({
                    employee_id: '',
                    leave_type_id: '',
                    year: new Date().getFullYear(),
                    total_allocated: ''
                });
                loadLeaveBalances();
            } else {
                setError(result.error || 'Failed to allocate leave balance');
            }
        } catch (err) {
            setError('Failed to allocate leave balance');
            console.error(err);
        }
    };

    const handleBulkAllocate = async () => {
        try {
            setLoading(true);
            
            // Allocate standard leave balances for all employees
            const standardAllocations = [
                { leave_code: 'AL', days: 21 },
                { leave_code: 'CL', days: 12 },
                { leave_code: 'SL', days: 12 },
                { leave_code: 'EL', days: 21 },
                { leave_code: 'ML', days: 180 },
                { leave_code: 'PL', days: 15 },
                { leave_code: 'CO', days: 12 }
            ];
            
            const promises = [];
            
            employees.forEach(employee => {
                standardAllocations.forEach(allocation => {
                    const leaveType = leaveTypes.find(lt => lt.leave_code === allocation.leave_code);
                    if (leaveType) {
                        promises.push(
                            leaveService.allocateLeaveBalance({
                                employee_id: employee.employee_id,
                                leave_type_id: leaveType.leave_type_id,
                                year: bulkAllocateForm.year,
                                total_allocated: allocation.days
                            })
                        );
                    }
                });
            });
            
            const results = await Promise.all(promises);
            const successCount = results.filter(r => r.success).length;
            const totalCount = results.length;
            
            if (successCount === totalCount) {
                setSuccess(`Successfully allocated leave balances for all ${employees.length} employees!`);
            } else {
                setSuccess(`Allocated ${successCount} out of ${totalCount} leave balances. Some may have already existed.`);
            }
            
            setBulkAllocateDialogOpen(false);
            loadLeaveBalances();
            
        } catch (err) {
            setError('Failed to perform bulk allocation');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getLeaveTypeColor = (leaveCode) => {
        const colors = {
            'AL': 'primary',
            'CL': 'secondary',
            'SL': 'error',
            'EL': 'success',
            'ML': 'warning',
            'PL': 'info',
            'CO': 'default'
        };
        return colors[leaveCode] || 'default';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Leave Management
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadData}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<GroupIcon />}
                        onClick={() => setBulkAllocateDialogOpen(true)}
                        color="secondary"
                    >
                        Bulk Allocate
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setAllocateDialogOpen(true)}
                    >
                        Allocate Balance
                    </Button>
                </Box>
            </Box>

            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ width: '100%' }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="Leave Balances" icon={<BalanceIcon />} />
                    <Tab label="Summary" icon={<GroupIcon />} />
                </Tabs>

                {activeTab === 0 && (
                    <Box sx={{ p: 3 }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Employee</TableCell>
                                        <TableCell>Leave Type</TableCell>
                                        <TableCell align="center">Allocated</TableCell>
                                        <TableCell align="center">Used</TableCell>
                                        <TableCell align="center">Remaining</TableCell>
                                        <TableCell align="center">Year</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {leaveBalances.map((balance, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {balance.employee_code}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {balance.employee_name}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={balance.leave_name}
                                                    color={getLeaveTypeColor(balance.leave_code)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">{balance.total_allocated}</TableCell>
                                            <TableCell align="center">{balance.used}</TableCell>
                                            <TableCell align="center">
                                                <Typography 
                                                    color={balance.remaining > 0 ? 'success.main' : 'error.main'}
                                                    fontWeight={600}
                                                >
                                                    {balance.remaining}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">{balance.year}</TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small" color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {activeTab === 1 && (
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            {leaveTypes.map((leaveType) => {
                                const typeBalances = leaveBalances.filter(b => b.leave_type_id === leaveType.leave_type_id);
                                const totalAllocated = typeBalances.reduce((sum, b) => sum + parseFloat(b.total_allocated || 0), 0);
                                const totalUsed = typeBalances.reduce((sum, b) => sum + parseFloat(b.used || 0), 0);
                                const totalRemaining = typeBalances.reduce((sum, b) => sum + parseFloat(b.remaining || 0), 0);
                                
                                return (
                                    <Grid item xs={12} sm={6} md={4} key={leaveType.leave_type_id}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    {leaveType.leave_name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    {typeBalances.length} employees allocated
                                                </Typography>
                                                <Box sx={{ mt: 2 }}>
                                                    <Typography variant="body2">
                                                        Total Allocated: <strong>{totalAllocated.toFixed(2)}</strong>
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        Total Used: <strong>{totalUsed.toFixed(2)}</strong>
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        Total Remaining: <strong>{totalRemaining.toFixed(2)}</strong>
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                )}
            </Paper>

            {/* Individual Allocate Dialog */}
            <Dialog open={allocateDialogOpen} onClose={() => setAllocateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Allocate Leave Balance</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Employee</InputLabel>
                            <Select
                                value={allocateForm.employee_id}
                                label="Employee"
                                onChange={(e) => setAllocateForm(prev => ({ ...prev, employee_id: e.target.value }))}
                            >
                                {employees.map((employee) => (
                                    <MenuItem key={employee.employee_id} value={employee.employee_id}>
                                        {employee.employee_code} - {employee.employee_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Leave Type</InputLabel>
                            <Select
                                value={allocateForm.leave_type_id}
                                label="Leave Type"
                                onChange={(e) => setAllocateForm(prev => ({ ...prev, leave_type_id: e.target.value }))}
                            >
                                {leaveTypes.map((leaveType) => (
                                    <MenuItem key={leaveType.leave_type_id} value={leaveType.leave_type_id}>
                                        {leaveType.leave_name} ({leaveType.leave_code})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Year"
                            type="number"
                            value={allocateForm.year}
                            onChange={(e) => setAllocateForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        />

                        <TextField
                            fullWidth
                            label="Total Days to Allocate"
                            type="number"
                            value={allocateForm.total_allocated}
                            onChange={(e) => setAllocateForm(prev => ({ ...prev, total_allocated: parseInt(e.target.value) }))}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAllocateDialogOpen(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleAllocateSubmit}
                        disabled={!allocateForm.employee_id || !allocateForm.leave_type_id || !allocateForm.total_allocated}
                    >
                        Allocate
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Allocate Dialog */}
            <Dialog open={bulkAllocateDialogOpen} onClose={() => setBulkAllocateDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Bulk Allocate Leave Balances</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            This will allocate standard leave balances to all active employees for the selected year.
                        </Typography>
                        
                        <TextField
                            fullWidth
                            label="Year"
                            type="number"
                            value={bulkAllocateForm.year}
                            onChange={(e) => setBulkAllocateForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                            sx={{ mt: 2, mb: 3 }}
                        />

                        <Typography variant="subtitle2" gutterBottom>
                            Standard Allocations:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            <Chip label="Annual Leave: 21 days" color="primary" size="small" />
                            <Chip label="Casual Leave: 12 days" color="secondary" size="small" />
                            <Chip label="Sick Leave: 12 days" color="error" size="small" />
                            <Chip label="Earned Leave: 21 days" color="success" size="small" />
                            <Chip label="Maternity Leave: 180 days" color="warning" size="small" />
                            <Chip label="Paternity Leave: 15 days" color="info" size="small" />
                            <Chip label="Compensatory Off: 12 days" size="small" />
                        </Box>

                        <Typography variant="body2" color="text.secondary">
                            This will be applied to {employees.length} active employees.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkAllocateDialogOpen(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleBulkAllocate}
                        color="secondary"
                    >
                        Allocate for All Employees
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeaveManagement;