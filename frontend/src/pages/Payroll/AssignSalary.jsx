import { useState, useEffect, useRef } from 'react';
import AppDatePicker from '../../components/common/AppDatePicker';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Card,
    CardContent,
    Divider,
    Autocomplete,
    Grid,
    Stack,
    Avatar,
    Skeleton
} from '@mui/material';
import {
    Person as PersonIcon,
    Assignment as TemplateIcon,
    Visibility as PreviewIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Business as DepartmentIcon,
    Badge as BadgeIcon
} from '@mui/icons-material';
import payrollService from '../../services/payrollService';
import employeeService from '../../services/employeeService';

const AssignSalary = () => {
    const [employees, setEmployees] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // Form state
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [monthlyCTC, setMonthlyCTC] = useState('');
    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [preview, setPreview] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const debounceTimerRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [employeesRes, templatesRes, unassignedRes] = await Promise.all([
                employeeService.getAllEmployees(),
                payrollService.getSalaryStructures(),
                payrollService.getEmployeesWithoutSalary()
            ]);
            
            if (employeesRes?.success) {
                const allEmployees = employeesRes.data || [];
                // Filter to only show employees without an active salary assignment
                let unassignedIds = null;
                if (unassignedRes?.success && Array.isArray(unassignedRes.data)) {
                    unassignedIds = new Set(unassignedRes.data.map(e => e.employee_id));
                } else if (Array.isArray(unassignedRes)) {
                    unassignedIds = new Set(unassignedRes.map(e => e.employee_id));
                }
                setEmployees(unassignedIds !== null
                    ? allEmployees.filter(e => unassignedIds.has(e.employee_id))
                    : allEmployees
                );
            }

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
            setError('Failed to load data: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePreview = async (ctcValue = null) => {
        try {
            // Use provided value or fall back to state
            const ctcToUse = ctcValue !== null ? ctcValue : monthlyCTC;
            
            if (!selectedEmployee) {
                setError('Please select an employee');
                return;
            }
            if (!selectedTemplate) {
                setError('Please select a salary template');
                return;
            }
            if (!ctcToUse || parseFloat(ctcToUse) <= 0) {
                setError('Please enter a valid monthly CTC');
                return;
            }

            setError(null);
            setLoading(true);

            // Get template components
            const componentsRes = await payrollService.getStructureComponents(selectedTemplate.structure_id);
            
            let components = [];
            if (Array.isArray(componentsRes)) {
                components = componentsRes;
            } else if (componentsRes?.success && componentsRes?.data) {
                components = componentsRes.data;
            } else if (componentsRes?.data) {
                components = componentsRes.data;
            }

            if (components.length === 0) {
                setError('Selected template has no components');
                setLoading(false);
                return;
            }

            // Calculate salary breakdown
            const ctc = parseFloat(ctcToUse);
            let earnings = [];
            let deductions = [];
            let basicSalary = 0;

            // First pass: Calculate all components
            components.forEach(comp => {
                let amount = 0;
                
                if (comp.calculation_type === 'FIXED') {
                    amount = parseFloat(comp.amount || 0);
                } else if (comp.calculation_type === 'PERCENTAGE') {
                    const percentage = parseFloat(comp.percentage || 0);
                    const base = comp.base_component || 'CTC';
                    
                    // For CTC-based calculations
                    if (base === 'CTC') {
                        amount = (ctc * percentage) / 100;
                    }
                    // BASIC and GROSS will be calculated in second pass
                }

                const item = {
                    component_id: comp.component_id,
                    component_name: comp.component_name,
                    component_type: comp.component_type,
                    component_code: comp.component_code,
                    calculation_type: comp.calculation_type,
                    amount: amount,
                    percentage: comp.percentage,
                    base_component: comp.base_component
                };

                if (comp.component_type === 'EARNING') {
                    earnings.push(item);
                    // Identify basic salary
                    if (comp.component_code === 'BASIC' || comp.component_name.toLowerCase().includes('basic')) {
                        basicSalary = amount;
                    }
                } else if (comp.component_type === 'DEDUCTION') {
                    deductions.push(item);
                }
            });

            // Calculate gross salary (sum of all earnings)
            const grossSalary = earnings.reduce((sum, item) => sum + item.amount, 0);

            // Second pass: Calculate BASIC and GROSS-based components
            components.forEach((comp) => {
                if (comp.calculation_type === 'PERCENTAGE') {
                    const percentage = parseFloat(comp.percentage || 0);
                    const base = comp.base_component || 'CTC';
                    let amount = 0;

                    if (base === 'BASIC' && basicSalary > 0) {
                        amount = (basicSalary * percentage) / 100;
                    } else if (base === 'GROSS' && grossSalary > 0) {
                        amount = (grossSalary * percentage) / 100;
                    }

                    // Update the amount if it was calculated
                    if (amount > 0) {
                        if (comp.component_type === 'EARNING') {
                            const index = earnings.findIndex(e => e.component_id === comp.component_id);
                            if (index !== -1) {
                                earnings[index].amount = amount;
                            }
                        } else if (comp.component_type === 'DEDUCTION') {
                            const index = deductions.findIndex(d => d.component_id === comp.component_id);
                            if (index !== -1) {
                                deductions[index].amount = amount;
                            }
                        }
                    }
                }
            });

            const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0);
            const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
            const netSalary = totalEarnings - totalDeductions;

            setPreview({
                earnings,
                deductions,
                totalEarnings,
                totalDeductions,
                netSalary,
                ctc
            });
            setShowPreview(true);
        } catch (err) {
            console.error('Generate preview error:', err);
            setError('Failed to generate preview: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleAssignSalary = async () => {
        try {
            if (!selectedEmployee || !selectedTemplate || !monthlyCTC) {
                setError('Please fill all required fields');
                return;
            }

            setSaving(true);
            setError(null);
            setSuccess(null);

            const response = await payrollService.assignSalaryTemplate(
                selectedEmployee.employee_id,
                selectedTemplate.structure_id,
                parseFloat(monthlyCTC),
                effectiveFrom || null
            );

            if (response.success) {
                setSuccess(`Salary structure assigned successfully to ${selectedEmployee.employee_name}!`);
                // Reset form
                setSelectedEmployee(null);
                setSelectedTemplate(null);
                setMonthlyCTC('');
                setEffectiveFrom('');
                setPreview(null);
                setShowPreview(false);
            } else {
                setError(response.message || 'Failed to assign salary');
            }
        } catch (err) {
            console.error('Assign salary error:', err);
            setError('Failed to assign salary: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setSelectedEmployee(null);
        setSelectedTemplate(null);
        setMonthlyCTC('');
        setEffectiveFrom('');
        setPreview(null);
        setShowPreview(false);
        setError(null);
        setSuccess(null);
    };

    if (loading && employees.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1400, margin: 'auto', p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Assign Salary Structure
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Assign salary template to employees with their monthly CTC
                </Typography>
            </Box>

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

            <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
                {/* Left Panel - Input Form (4 columns) */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Step 1: Employee Selection */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>
                                Step 1: Select Employee
                            </Typography>
                            <Autocomplete
                                options={employees}
                                getOptionLabel={(option) => `${option.employee_name} (${option.employee_code})`}
                                value={selectedEmployee}
                                onChange={(event, newValue) => {
                                    setSelectedEmployee(newValue);
                                    if (newValue && selectedTemplate && monthlyCTC) {
                                        handleGeneratePreview();
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Search employee..."
                                        size="medium"
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <>
                                                    <PersonIcon sx={{ color: 'action.active', mr: 1 }} />
                                                    {params.InputProps.startAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                                renderOption={(props, option) => {
                                    const { key, ...otherProps } = props;
                                    return (
                                        <li key={key} {...otherProps}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                                                    {option.employee_name.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {option.employee_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {option.employee_code} • {option.department || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </li>
                                    );
                                }}
                            />
                        </Box>

                        {/* Step 2: Template Selection */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>
                                Step 2: Select Salary Template
                            </Typography>
                            <FormControl fullWidth size="medium">
                                <Select
                                    value={selectedTemplate?.structure_id || ''}
                                    onChange={(e) => {
                                        const template = templates.find(t => t.structure_id === e.target.value);
                                        setSelectedTemplate(template);
                                        if (template && selectedEmployee && monthlyCTC) {
                                            handleGeneratePreview();
                                        }
                                    }}
                                    displayEmpty
                                    startAdornment={<TemplateIcon sx={{ color: 'action.active', mr: 1 }} />}
                                >
                                    <MenuItem value="" disabled>
                                        <Typography color="text.secondary">Select template...</Typography>
                                    </MenuItem>
                                    {templates.map((template) => (
                                        <MenuItem key={template.structure_id} value={template.structure_id}>
                                            <Box>
                                                <Typography variant="body2">{template.structure_name}</Typography>
                                                {template.description && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {template.description}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Step 3: CTC & Date */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>
                                Step 3: Enter Salary Details
                            </Typography>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    label="Monthly CTC"
                                    type="number"
                                    value={monthlyCTC}
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        setMonthlyCTC(newValue);
                                        
                                        // Clear existing timer
                                        if (debounceTimerRef.current) {
                                            clearTimeout(debounceTimerRef.current);
                                        }
                                        
                                        // Auto-calculate on CTC change with debounce
                                        if (newValue && selectedEmployee && selectedTemplate) {
                                            debounceTimerRef.current = setTimeout(() => {
                                                handleGeneratePreview(newValue);
                                            }, 500);
                                        } else {
                                            // Clear preview if CTC is empty
                                            setPreview(null);
                                            setShowPreview(false);
                                        }
                                    }}
                                    size="medium"
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: 500 }}>₹</Typography>
                                    }}
                                    placeholder="70000"
                                />
                                <AppDatePicker
                                    label="Effective From (Optional)"
                                    value={effectiveFrom}
                                    onChange={(v) => setEffectiveFrom(v)}
                                    helperText="Leave empty for current date"
                                />
                            </Stack>
                        </Box>

                        <Box sx={{ flexGrow: 1 }} />

                        {/* Action Button */}
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleReset}
                            disabled={loading || saving}
                            fullWidth
                            size="large"
                        >
                            Reset
                        </Button>
                    </Paper>
                </Grid>

                {/* Right Panel - Preview (8 columns) */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {showPreview && preview ? (
                            <>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                    Salary Breakdown Preview
                                </Typography>

                                {/* Employee Info Card */}
                                {selectedEmployee && (
                                    <Card sx={{ mb: 3, bgcolor: 'primary.lighter', border: '1px solid', borderColor: 'primary.light' }}>
                                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                                            <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1.25rem' }}>
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
                                )}

                                {/* Earnings */}
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'success.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Earnings
                                    </Typography>
                                    <Table size="small">
                                        <TableBody>
                                            {preview.earnings.map((item, index) => (
                                                <TableRow key={index} sx={{ '&:last-child td': { border: 0 } }}>
                                                    <TableCell sx={{ py: 1, border: 0 }}>{item.component_name}</TableCell>
                                                    <TableCell align="right" sx={{ py: 1, border: 0, fontWeight: 500 }}>
                                                        {payrollService.formatCurrency(item.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow sx={{ bgcolor: 'success.lighter' }}>
                                                <TableCell sx={{ py: 1.5, fontWeight: 600, border: 0 }}>Total Earnings</TableCell>
                                                <TableCell align="right" sx={{ py: 1.5, fontWeight: 700, border: 0, color: 'success.main' }}>
                                                    {payrollService.formatCurrency(preview.totalEarnings)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                {/* Deductions */}
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'error.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Deductions
                                    </Typography>
                                    <Table size="small">
                                        <TableBody>
                                            {preview.deductions.map((item, index) => (
                                                <TableRow key={index} sx={{ '&:last-child td': { border: 0 } }}>
                                                    <TableCell sx={{ py: 1, border: 0 }}>{item.component_name}</TableCell>
                                                    <TableCell align="right" sx={{ py: 1, border: 0, fontWeight: 500 }}>
                                                        {payrollService.formatCurrency(item.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow sx={{ bgcolor: 'error.lighter' }}>
                                                <TableCell sx={{ py: 1.5, fontWeight: 600, border: 0 }}>Total Deductions</TableCell>
                                                <TableCell align="right" sx={{ py: 1.5, fontWeight: 700, border: 0, color: 'error.main' }}>
                                                    {payrollService.formatCurrency(preview.totalDeductions)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </Box>

                                <Box sx={{ flexGrow: 1 }} />

                                {/* Net Salary Card - Bottom section */}
                                <Box sx={{ pt: 2 }}>
                                    <Card sx={{ bgcolor: 'primary.main', color: 'white', mb: 2 }}>
                                        <CardContent sx={{ py: 2.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    Net Salary
                                                </Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                                    {payrollService.formatCurrency(preview.netSalary)}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>

                                    {/* Assign Button */}
                                    <Button
                                        variant="contained"
                                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                        onClick={handleAssignSalary}
                                        disabled={saving}
                                        fullWidth
                                        size="large"
                                        sx={{ py: 1.5 }}
                                    >
                                        {saving ? 'Assigning Salary Structure...' : 'Assign Salary Structure'}
                                    </Button>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                height: '100%',
                                minHeight: 400
                            }}>
                                <PreviewIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                                    No Preview Available
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
                                    Select employee, template, and enter CTC to see the salary breakdown. Preview updates automatically as you type.
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AssignSalary;
