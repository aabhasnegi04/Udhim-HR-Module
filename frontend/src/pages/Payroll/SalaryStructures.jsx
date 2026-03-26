import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Stack,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Tabs,
    Tab,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Refresh as RefreshIcon,
    Close as CloseIcon,
    Assignment as TemplateIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Info as InfoIcon,
    Edit as EditIcon,
    Block as DeactivateIcon
} from '@mui/icons-material';
import payrollService from '../../services/payrollService';
import employeeService from '../../services/employeeService';
import adminService from '../../services/adminService';

const SalaryStructures = () => {
    const [employees, setEmployees] = useState([]);
    const [salaryTemplates, setSalaryTemplates] = useState([]);
    const [components, setComponents] = useState({ earnings: [], deductions: [], employer_contributions: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [salaryStructure, setSalaryStructure] = useState(null);
    const [templateComponents, setTemplateComponents] = useState([]);
    const [structureLoading, setStructureLoading] = useState(false);
    const [companySettings, setCompanySettings] = useState({});
    const [currentTab, setCurrentTab] = useState(0);
    
    // Create template form state
    const [newTemplate, setNewTemplate] = useState({
        structure_name: '',
        description: '',
        structure_type: 'STANDARD'
    });
    const [templateComponentsList, setTemplateComponentsList] = useState([]);
    const [previewCTC, setPreviewCTC] = useState(70000); // For preview calculation
    
    // Edit template form state
    const [editTemplate, setEditTemplate] = useState({
        structure_id: null,
        structure_name: '',
        description: '',
        structure_type: 'STANDARD'
    });
    const [editComponentsList, setEditComponentsList] = useState([]);

    useEffect(() => {
        loadData();
        adminService.getCompanySettings().then(res => {
            if (res.success && res.data) setCompanySettings(res.data);
        }).catch(() => {});
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [componentsRes, employeesRes, templatesRes] = await Promise.all([
                payrollService.getComponents(),
                employeeService.getAllEmployees(),
                payrollService.getSalaryStructures()
            ]);
            
            // Handle the response - it should be the data object directly
            if (componentsRes) {
                // Ensure we have the right structure with arrays
                const componentData = {
                    earnings: componentsRes.earnings || [],
                    deductions: componentsRes.deductions || [],
                    employer_contributions: componentsRes.employer_contributions || []
                };
                
                setComponents(componentData);
            } else {
                setError('Failed to load payroll components: No data received');
            }
            
            if (employeesRes?.success) {
                setEmployees(employeesRes.data || []);
            }

            // Handle templates - check if it's wrapped or direct array
            if (Array.isArray(templatesRes)) {
                // Direct array response
                setSalaryTemplates(templatesRes);
            } else if (templatesRes?.success && templatesRes?.data) {
                // Wrapped response with data
                setSalaryTemplates(Array.isArray(templatesRes.data) ? templatesRes.data : []);
            } else if (templatesRes?.data) {
                // Response with data but no success flag
                setSalaryTemplates(Array.isArray(templatesRes.data) ? templatesRes.data : []);
            } else if (Object.keys(templatesRes || {}).length === 0) {
                // Empty object response (no templates)
                setSalaryTemplates([]);
            } else {
                // Unknown format
                setSalaryTemplates([]);
            }
        } catch (err) {
            console.error('Load data error:', err);
            setError('Failed to load salary structure data: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleViewSalaryStructure = async (employeeId) => {
        try {
            setStructureLoading(true);
            const employee = employees.find(e => e.employee_id === employeeId);
            setSelectedEmployee(employee);
            setViewDialogOpen(true);
            
            // Use new P2 API
            const response = await payrollService.getEmployeeSalaryDetails(employeeId);
            if (response.success) {
                // Transform data to match old structure format
                const transformedData = {
                    earnings: response.data.components?.filter(c => c.component_type === 'EARNING') || [],
                    deductions: response.data.components?.filter(c => c.component_type === 'DEDUCTION') || []
                };
                setSalaryStructure(transformedData);
            } else {
                setSalaryStructure(null);
            }
        } catch (err) {
            console.error('View salary structure error:', err);
            setSalaryStructure(null);
        } finally {
            setStructureLoading(false);
        }
    };

    const handleViewTemplate = async (template) => {
        try {
            setStructureLoading(true);
            setSelectedTemplate(template);
            setTemplateDialogOpen(true);
            
            const response = await payrollService.getStructureComponents(template.structure_id);
            
            // Handle both wrapped {success, data} and direct array responses
            let components = [];
            if (Array.isArray(response)) {
                // Direct array response
                components = response;
            } else if (response && response.success && response.data) {
                // Wrapped response
                components = response.data;
            } else if (response && response.data) {
                // Response with data but no success flag
                components = response.data;
            }
            
            setTemplateComponents(components);
        } catch (err) {
            console.error('View template error:', err);
            setTemplateComponents([]);
        } finally {
            setStructureLoading(false);
        }
    };

    const handleCloseDialog = () => {
        setViewDialogOpen(false);
        setSelectedEmployee(null);
        setSalaryStructure(null);
    };

    const handleOpenCreateDialog = () => {
        setNewTemplate({
            structure_name: '',
            description: '',
            structure_type: 'STANDARD'
        });
        setTemplateComponentsList([]);
        setCreateDialogOpen(true);
    };

    const handleCloseCreateDialog = () => {
        setCreateDialogOpen(false);
        setNewTemplate({
            structure_name: '',
            description: '',
            structure_type: 'STANDARD'
        });
        setTemplateComponentsList([]);
    };

    const handleOpenEditDialog = (template) => {
        setEditTemplate({
            structure_id: template.structure_id,
            structure_name: template.structure_name,
            description: template.description || '',
            structure_type: template.structure_type || 'STANDARD'
        });
        setEditDialogOpen(true);
        // Load existing components
        loadEditComponents(template.structure_id);
    };

    const loadEditComponents = async (structureId) => {
        try {
            setStructureLoading(true);
            const response = await payrollService.getStructureComponents(structureId);
            let comps = [];
            if (Array.isArray(response)) comps = response;
            else if (response?.success && response?.data) comps = response.data;
            else if (response?.data) comps = response.data;

            // Map to edit form format
            setEditComponentsList(comps.map(c => ({
                component_id: c.component_id,
                calculation_type: c.calculation_type,
                amount: c.amount || '',
                percentage: c.percentage || '',
                formula: c.formula || '',
                base: c.base_component || 'CTC'
            })));
        } catch (err) {
            setEditComponentsList([]);
        } finally {
            setStructureLoading(false);
        }
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setEditTemplate({
            structure_id: null,
            structure_name: '',
            description: '',
            structure_type: 'STANDARD'
        });
        setEditComponentsList([]);
    };

    const handleUpdateTemplate = async () => {
        try {
            setStructureLoading(true);
            setError(null);
            setSuccess(null);

            if (!editTemplate.structure_name.trim()) {
                setError('Structure name is required');
                setStructureLoading(false);
                return;
            }

            if (editComponentsList.length === 0) {
                setError('Please add at least one component');
                setStructureLoading(false);
                return;
            }

            // Validate components
            for (let i = 0; i < editComponentsList.length; i++) {
                const comp = editComponentsList[i];
                if (!comp.component_id) {
                    setError(`Component ${i + 1}: Please select a component`);
                    setStructureLoading(false);
                    return;
                }
                if (comp.calculation_type === 'FIXED' && !comp.amount) {
                    setError(`Component ${i + 1}: Amount is required for Fixed type`);
                    setStructureLoading(false);
                    return;
                }
                if (comp.calculation_type === 'PERCENTAGE' && !comp.percentage) {
                    setError(`Component ${i + 1}: Percentage is required for Percentage type`);
                    setStructureLoading(false);
                    return;
                }
            }

            // Update template info
            const infoRes = await payrollService.updateSalaryStructure(
                editTemplate.structure_id,
                editTemplate.structure_name,
                editTemplate.description,
                editTemplate.structure_type
            );
            if (!infoRes?.success) {
                setError(infoRes?.message || 'Failed to update template info');
                setStructureLoading(false);
                return;
            }

            // Update components
            const compRes = await payrollService.updateSalaryStructureComponents(
                editTemplate.structure_id,
                editComponentsList
            );
            if (!compRes?.success) {
                setError(compRes?.message || 'Failed to update components');
                setStructureLoading(false);
                return;
            }

            setSuccess('Salary structure updated successfully!');
            handleCloseEditDialog();
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to update salary structure');
        } finally {
            setStructureLoading(false);
        }
    };

    const handleDeactivateTemplate = async (template) => {
        if (!window.confirm(`Are you sure you want to deactivate "${template.structure_name}"? This action cannot be undone if the template is assigned to employees.`)) {
            return;
        }

        try {
            setStructureLoading(true);
            setError(null);
            setSuccess(null);

            const response = await payrollService.deactivateSalaryStructure(template.structure_id);

            if (response && response.success) {
                setSuccess('Salary structure deactivated successfully!');
                loadData();
            } else {
                setError(response?.message || 'Failed to deactivate salary structure');
            }
        } catch (err) {
            console.error('Deactivate template error:', err);
            setError(err.message || 'Failed to deactivate salary structure');
        } finally {
            setStructureLoading(false);
        }
    };

    const handleAddComponent = () => {
        setTemplateComponentsList([...templateComponentsList, {
            component_id: '',
            calculation_type: 'PERCENTAGE',
            amount: '',
            percentage: '',
            formula: '',
            base: 'CTC' // Default base for percentage calculations
        }]);
    };

    const handleRemoveComponent = (index) => {
        const updated = templateComponentsList.filter((_, i) => i !== index);
        setTemplateComponentsList(updated);
    };

    const handleComponentChange = (index, field, value) => {
        const updated = [...templateComponentsList];
        updated[index][field] = value;

        // Auto-fill percentage from company_settings when component is selected
        if (field === 'component_id') {
            const allComponents = [
                ...components.earnings,
                ...components.deductions,
                ...(components.employer_contributions || [])
            ];
            const selected = allComponents.find(c => c.component_id === value || c.component_id === parseInt(value));
            if (selected) {
                const code = selected.component_code?.toUpperCase();
                if (code === 'PF_EMP' || code === 'PF' || code === 'PF_EMPLOYER') {
                    updated[index].percentage = companySettings.pf_rate ?? '';
                    updated[index].calculation_type = 'PERCENTAGE';
                } else if (code === 'ESI_EMP' || code === 'ESI' || code === 'ESI_EMPLOYER') {
                    updated[index].percentage = companySettings.esi_rate ?? '';
                    updated[index].calculation_type = 'PERCENTAGE';
                } else if (code === 'PT' || code === 'PROF_TAX' || code === 'PROFESSIONAL_TAX') {
                    updated[index].amount = companySettings.professional_tax ?? '';
                    updated[index].calculation_type = 'FIXED';
                }
            }
        }

        setTemplateComponentsList(updated);
    };

    const handleCreateTemplate = async () => {
        try {
            setStructureLoading(true);
            setError(null);
            setSuccess(null);

            // Validation
            if (!newTemplate.structure_name.trim()) {
                setError('Structure name is required');
                setStructureLoading(false);
                return;
            }

            if (templateComponentsList.length === 0) {
                setError('Please add at least one component to the template');
                setStructureLoading(false);
                return;
            }

            // Validate all components have required fields
            for (let i = 0; i < templateComponentsList.length; i++) {
                const comp = templateComponentsList[i];
                if (!comp.component_id) {
                    setError(`Component ${i + 1}: Please select a component`);
                    setStructureLoading(false);
                    return;
                }
                if (comp.calculation_type === 'FIXED' && !comp.amount) {
                    setError(`Component ${i + 1}: Amount is required for Fixed type`);
                    setStructureLoading(false);
                    return;
                }
                if (comp.calculation_type === 'PERCENTAGE' && !comp.percentage) {
                    setError(`Component ${i + 1}: Percentage is required for Percentage type`);
                    setStructureLoading(false);
                    return;
                }
                if (comp.calculation_type === 'FORMULA' && !comp.formula) {
                    setError(`Component ${i + 1}: Formula is required for Formula type`);
                    setStructureLoading(false);
                    return;
                }
            }

            // Step 1: Create the structure
            const createResponse = await payrollService.createSalaryStructure(
                newTemplate.structure_name,
                newTemplate.description,
                newTemplate.structure_type
            );

            if (!createResponse || !createResponse.success) {
                const errorMsg = createResponse?.message || 'Failed to create salary structure';
                setError(errorMsg);
                setStructureLoading(false);
                return;
            }

            const structureId = createResponse.data.structure_id;

            // Step 2: Add components one by one
            let componentErrors = [];
            for (let i = 0; i < templateComponentsList.length; i++) {
                const comp = templateComponentsList[i];
                if (comp.component_id) {
                    try {
                        const componentResponse = await payrollService.addStructureComponent(
                            structureId,
                            comp.component_id,
                            comp.calculation_type,
                            comp.amount || null,
                            comp.percentage || null,
                            comp.formula || null,
                            comp.base || null
                        );
                        
                        if (!componentResponse || !componentResponse.success) {
                            componentErrors.push(`Component ${i + 1}: ${componentResponse?.message || 'Failed to add'}`);
                        }
                    } catch (compErr) {
                        componentErrors.push(`Component ${i + 1}: ${compErr.message}`);
                    }
                }
            }

            if (componentErrors.length > 0) {
                setError(`Template created but some components failed: ${componentErrors.join(', ')}`);
                setStructureLoading(false);
                loadData(); // Reload to show the template
                return;
            }

            setSuccess('Salary structure created successfully with all components!');
            handleCloseCreateDialog();
            loadData(); // Reload the list
        } catch (err) {
            console.error('Create template error:', err);
            const errorMessage = err.message || err.response?.data?.message || 'Failed to create salary structure';
            setError(errorMessage);
        } finally {
            setStructureLoading(false);
        }
    };

    const calculateTotals = (structure) => {
        if (!structure) return { totalEarnings: 0, totalDeductions: 0, netPay: 0 };
        
        const totalEarnings = structure.earnings?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        const totalDeductions = structure.deductions?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        const netPay = totalEarnings - totalDeductions;
        
        return { totalEarnings, totalDeductions, netPay };
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Salary Structure Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            View salary templates and employee salary structures
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenCreateDialog}
                            size="small"
                            disabled={loading || (!components.earnings && !components.deductions)}
                        >
                            Create Template
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={loadData}
                            size="small"
                        >
                            Refresh
                        </Button>
                    </Stack>
                </Box>
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

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                            {salaryTemplates.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Salary Templates
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                            {employees.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Employees
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                            {components.earnings.length + components.deductions.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Components
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Tabs for Templates and Employees */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
                    <Tab label="Salary Templates" />
                    <Tab label="Employee Salaries" />
                </Tabs>
            </Paper>

            {/* Templates Table */}
            {currentTab === 0 && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Template Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {salaryTemplates.map((template) => (
                                <TableRow key={template.structure_id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>
                                            {template.structure_name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{template.description || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={template.structure_type || 'Standard'}
                                            color="primary"
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {template.created_at ? payrollService.formatDate(template.created_at) : 'N/A'}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleViewTemplate(template)}
                                                color="primary"
                                                title="View Details"
                                            >
                                                <TemplateIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleOpenEditDialog(template)}
                                                color="info"
                                                title="Edit Template"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleDeactivateTemplate(template)}
                                                color="error"
                                                title="Deactivate Template"
                                            >
                                                <DeactivateIcon />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Employees Table */}
            {currentTab === 1 && (
                <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {employees.map((employee) => (
                            <TableRow key={employee.employee_id} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>
                                        {employee.employee_name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {employee.employee_code}
                                    </Typography>
                                </TableCell>
                                <TableCell>{employee.department || 'N/A'}</TableCell>
                                <TableCell>{employee.designation || 'N/A'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={employee.status || 'Active'}
                                        color={employee.status === 'ACTIVE' ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleViewSalaryStructure(employee.employee_id)}
                                            color="primary"
                                        >
                                            <ViewIcon />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </TableContainer>
            )}

            {/* View Template Dialog */}
            <Dialog 
                open={templateDialogOpen} 
                onClose={() => setTemplateDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h6">Salary Template Details</Typography>
                            {selectedTemplate && (
                                <Typography variant="body2" color="text.secondary">
                                    {selectedTemplate.structure_name}
                                </Typography>
                            )}
                        </Box>
                        <IconButton onClick={() => setTemplateDialogOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {structureLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : templateComponents.length > 0 ? (
                        <Box>
                            {/* Template Description */}
                            {selectedTemplate?.description && (
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    {selectedTemplate.description}
                                </Alert>
                            )}

                            {/* Components Table */}
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Component</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Calculation</TableCell>
                                            <TableCell align="right">Amount/Percentage</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {templateComponents.map((comp, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{comp.component_name}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={comp.component_type}
                                                        color={comp.component_type === 'EARNING' ? 'success' : 'error'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={comp.calculation_type}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    {comp.calculation_type === 'FIXED' 
                                                        ? payrollService.formatCurrency(comp.amount)
                                                        : `${comp.percentage}%`
                                                    }
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    ) : (
                        <Alert severity="warning">
                            No components found for this template.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTemplateDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* View Salary Structure Dialog */}
            <Dialog 
                open={viewDialogOpen} 
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h6">Salary Structure</Typography>
                            {selectedEmployee && (
                                <Typography variant="body2" color="text.secondary">
                                    {selectedEmployee.employee_name} ({selectedEmployee.employee_code})
                                </Typography>
                            )}
                        </Box>
                        <IconButton onClick={handleCloseDialog} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {structureLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : salaryStructure ? (
                        <Box>
                            {/* Earnings Section */}
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
                                Earnings
                            </Typography>
                            {salaryStructure.earnings && salaryStructure.earnings.length > 0 ? (
                                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Component</TableCell>
                                                <TableCell align="right">Amount</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {salaryStructure.earnings.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{item.component_name}</TableCell>
                                                    <TableCell align="right">
                                                        {payrollService.formatCurrency(item.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600 }}>Total Earnings</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                    {payrollService.formatCurrency(calculateTotals(salaryStructure).totalEarnings)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Alert severity="info" sx={{ mb: 3 }}>No earnings configured</Alert>
                            )}

                            {/* Deductions Section */}
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>
                                Deductions
                            </Typography>
                            {salaryStructure.deductions && salaryStructure.deductions.length > 0 ? (
                                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Component</TableCell>
                                                <TableCell align="right">Amount</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {salaryStructure.deductions.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{item.component_name}</TableCell>
                                                    <TableCell align="right">
                                                        {payrollService.formatCurrency(item.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600 }}>Total Deductions</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                    {payrollService.formatCurrency(calculateTotals(salaryStructure).totalDeductions)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Alert severity="info" sx={{ mb: 3 }}>No deductions configured</Alert>
                            )}

                            {/* Net Pay Summary */}
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Net Pay
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    {payrollService.formatCurrency(calculateTotals(salaryStructure).netPay)}
                                </Typography>
                            </Box>
                        </Box>
                    ) : (
                        <Alert severity="warning">
                            No salary structure found for this employee. Please assign a salary structure first.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Create Template Dialog */}
            <Dialog 
                open={createDialogOpen} 
                onClose={handleCloseCreateDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        maxHeight: '90vh',
                        maxWidth: '720px'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    pb: 2
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 40,
                                    height: 40,
                                    borderRadius: 1.5,
                                    bgcolor: 'primary.light',
                                    color: 'primary.main'
                                }}
                            >
                                <TemplateIcon />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Create Salary Structure Template
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Define a reusable salary template with components
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton onClick={handleCloseCreateDialog} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 3 }}>
                    {/* Template Basic Info Section */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                            Template Information
                        </Typography>
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr 1fr', 
                            gap: 2,
                            mb: 2
                        }}>
                            <TextField
                                label="Structure Name"
                                value={newTemplate.structure_name}
                                onChange={(e) => setNewTemplate({...newTemplate, structure_name: e.target.value})}
                                required
                                placeholder="e.g., Software Engineer"
                                size="small"
                                fullWidth
                            />
                            <FormControl size="small" fullWidth>
                                <InputLabel>Structure Type</InputLabel>
                                <Select
                                    value={newTemplate.structure_type}
                                    label="Structure Type"
                                    onChange={(e) => setNewTemplate({...newTemplate, structure_type: e.target.value})}
                                >
                                    <MenuItem value="STANDARD">Standard</MenuItem>
                                    <MenuItem value="CUSTOM">Custom</MenuItem>
                                    <MenuItem value="EXECUTIVE">Executive</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Description"
                                value={newTemplate.description}
                                onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                                placeholder="Brief description"
                                size="small"
                                fullWidth
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Components Section */}
                    <Box>
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            mb: 2 
                        }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                Salary Components
                            </Typography>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={handleAddComponent}
                                sx={{ textTransform: 'none' }}
                            >
                                Add Component
                            </Button>
                        </Box>

                        {templateComponentsList.length === 0 ? (
                            <Box 
                                sx={{ 
                                    bgcolor: '#F5F7FA',
                                    border: '1px dashed #D0D5DD',
                                    borderRadius: 1,
                                    p: 3,
                                    textAlign: 'center'
                                }}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    No components added yet. Click "Add Component" to start building the salary structure.
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {templateComponentsList.map((comp, index) => (
                                    <Paper 
                                        key={index} 
                                        elevation={0}
                                        sx={{ 
                                            p: 2,
                                            border: 1,
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            bgcolor: 'background.paper'
                                        }}
                                    >
                                        <Box sx={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: '2fr 1fr 1fr 1.5fr auto', 
                                            gap: 2,
                                            alignItems: 'center'
                                        }}>
                                            {/* Component Dropdown */}
                                            <FormControl size="small" fullWidth>
                                                <InputLabel>Component</InputLabel>
                                                <Select
                                                    value={comp.component_id}
                                                    label="Component"
                                                    onChange={(e) => handleComponentChange(index, 'component_id', e.target.value)}
                                                >
                                                    <MenuItem value="" disabled>Select Component</MenuItem>
                                                    
                                                    {/* Earnings Section */}
                                                    {components.earnings && components.earnings.length > 0 && (
                                                        <MenuItem disabled sx={{ opacity: 1, bgcolor: 'success.lighter' }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>
                                                                EARNINGS
                                                            </Typography>
                                                        </MenuItem>
                                                    )}
                                                    {components.earnings && components.earnings.map(c => (
                                                        <MenuItem key={c.component_id} value={c.component_id}>
                                                            {c.component_name}
                                                        </MenuItem>
                                                    ))}
                                                    
                                                    {/* Deductions Section */}
                                                    {components.deductions && components.deductions.length > 0 && (
                                                        <MenuItem disabled sx={{ opacity: 1, bgcolor: 'error.lighter', mt: 1 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'error.main' }}>
                                                                DEDUCTIONS
                                                            </Typography>
                                                        </MenuItem>
                                                    )}
                                                    {components.deductions && components.deductions.map(c => (
                                                        <MenuItem key={c.component_id} value={c.component_id}>
                                                            {c.component_name}
                                                        </MenuItem>
                                                    ))}
                                                    
                                                    {/* No components message */}
                                                    {(!components.earnings || components.earnings.length === 0) && 
                                                     (!components.deductions || components.deductions.length === 0) && (
                                                        <MenuItem disabled>
                                                            <Typography variant="body2" color="text.secondary">
                                                                No components available
                                                            </Typography>
                                                        </MenuItem>
                                                    )}
                                                </Select>
                                            </FormControl>

                                            {/* Calculation Type */}
                                            <FormControl size="small" fullWidth>
                                                <InputLabel>Type</InputLabel>
                                                <Select
                                                    value={comp.calculation_type}
                                                    label="Type"
                                                    onChange={(e) => handleComponentChange(index, 'calculation_type', e.target.value)}
                                                >
                                                    <MenuItem value="FIXED">Fixed</MenuItem>
                                                    <MenuItem value="PERCENTAGE">Percentage</MenuItem>
                                                    <MenuItem value="FORMULA">Formula</MenuItem>
                                                </Select>
                                            </FormControl>

                                            {/* Base (for Percentage) */}
                                            {comp.calculation_type === 'PERCENTAGE' && (
                                                <FormControl size="small" fullWidth>
                                                    <InputLabel>Base</InputLabel>
                                                    <Select
                                                        value={comp.base || 'CTC'}
                                                        label="Base"
                                                        onChange={(e) => handleComponentChange(index, 'base', e.target.value)}
                                                    >
                                                        <MenuItem value="CTC">CTC</MenuItem>
                                                        <MenuItem value="BASIC">Basic</MenuItem>
                                                        <MenuItem value="GROSS">Gross</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            )}

                                            {/* Value Input */}
                                            <Box>
                                                {comp.calculation_type === 'FIXED' && (
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label="Amount"
                                                        type="number"
                                                        value={comp.amount}
                                                        onChange={(e) => handleComponentChange(index, 'amount', e.target.value)}
                                                        InputProps={{
                                                            startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}>₹</Typography>
                                                        }}
                                                        placeholder="0"
                                                    />
                                                )}
                                                {comp.calculation_type === 'PERCENTAGE' && (
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label="Percentage"
                                                        type="number"
                                                        value={comp.percentage}
                                                        onChange={(e) => handleComponentChange(index, 'percentage', e.target.value)}
                                                        InputProps={{
                                                            endAdornment: <Typography sx={{ ml: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}>%</Typography>
                                                        }}
                                                        placeholder="0"
                                                    />
                                                )}
                                                {comp.calculation_type === 'FORMULA' && (
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label="Formula"
                                                        value={comp.formula}
                                                        onChange={(e) => handleComponentChange(index, 'formula', e.target.value)}
                                                        placeholder="BASIC * 0.12"
                                                    />
                                                )}
                                            </Box>

                                            {/* Delete Button */}
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleRemoveComponent(index)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ 
                    px: 3, 
                    py: 2, 
                    borderTop: 1, 
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1.5
                }}>
                    <Button 
                        onClick={handleCloseCreateDialog}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleCreateTemplate}
                        disabled={!newTemplate.structure_name || structureLoading}
                        startIcon={structureLoading ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{ 
                            textTransform: 'none',
                            minWidth: 140
                        }}
                    >
                        {structureLoading ? 'Creating...' : 'Create Template'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Template Dialog */}
            <Dialog 
                open={editDialogOpen} 
                onClose={handleCloseEditDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2, maxHeight: '90vh', maxWidth: '720px' } }}
            >
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 1.5, bgcolor: 'info.light', color: 'info.main' }}>
                                <EditIcon />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>Edit Salary Template</Typography>
                                <Typography variant="caption" color="text.secondary">Update template info and components</Typography>
                            </Box>
                        </Box>
                        <IconButton onClick={handleCloseEditDialog} size="small"><CloseIcon /></IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 3 }}>
                    {/* Template Info */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Template Information</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                            <TextField
                                label="Structure Name"
                                value={editTemplate.structure_name}
                                onChange={(e) => setEditTemplate({...editTemplate, structure_name: e.target.value})}
                                required size="small" fullWidth
                            />
                            <FormControl size="small" fullWidth>
                                <InputLabel>Structure Type</InputLabel>
                                <Select
                                    value={editTemplate.structure_type}
                                    label="Structure Type"
                                    onChange={(e) => setEditTemplate({...editTemplate, structure_type: e.target.value})}
                                >
                                    <MenuItem value="STANDARD">Standard</MenuItem>
                                    <MenuItem value="CUSTOM">Custom</MenuItem>
                                    <MenuItem value="EXECUTIVE">Executive</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Description"
                                value={editTemplate.description}
                                onChange={(e) => setEditTemplate({...editTemplate, description: e.target.value})}
                                size="small" fullWidth
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Components */}
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Salary Components</Typography>
                            <Button variant="contained" size="small" startIcon={<AddIcon />}
                                onClick={() => setEditComponentsList([...editComponentsList, { component_id: '', calculation_type: 'PERCENTAGE', amount: '', percentage: '', formula: '', base: 'CTC' }])}
                            >
                                Add Component
                            </Button>
                        </Box>

                        {structureLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
                        ) : editComponentsList.length === 0 ? (
                            <Box sx={{ bgcolor: '#F5F7FA', border: '1px dashed #D0D5DD', borderRadius: 1, p: 3, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">No components. Click "Add Component" to add one.</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {editComponentsList.map((comp, index) => (
                                    <Paper key={index} elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr auto', gap: 2, alignItems: 'center' }}>
                                            <FormControl size="small" fullWidth>
                                                <InputLabel>Component</InputLabel>
                                                <Select
                                                    value={comp.component_id}
                                                    label="Component"
                                                    onChange={(e) => {
                                                        const updated = [...editComponentsList];
                                                        updated[index].component_id = e.target.value;
                                                        // Auto-fill rates from company settings
                                                        const allComps = [...components.earnings, ...components.deductions, ...(components.employer_contributions || [])];
                                                        const selected = allComps.find(c => c.component_id === e.target.value || c.component_id === parseInt(e.target.value));
                                                        if (selected) {
                                                            const code = selected.component_code?.toUpperCase();
                                                            if (code === 'PF_EMP' || code === 'PF' || code === 'PF_EMPLOYER') { updated[index].percentage = companySettings.pf_rate ?? ''; updated[index].calculation_type = 'PERCENTAGE'; }
                                                            else if (code === 'ESI_EMP' || code === 'ESI' || code === 'ESI_EMPLOYER') { updated[index].percentage = companySettings.esi_rate ?? ''; updated[index].calculation_type = 'PERCENTAGE'; }
                                                            else if (code === 'PT' || code === 'PROF_TAX' || code === 'PROFESSIONAL_TAX') { updated[index].amount = companySettings.professional_tax ?? ''; updated[index].calculation_type = 'FIXED'; }
                                                        }
                                                        setEditComponentsList(updated);
                                                    }}
                                                >
                                                    <MenuItem value="" disabled>Select Component</MenuItem>
                                                    {components.earnings?.length > 0 && <MenuItem disabled sx={{ opacity: 1 }}><Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>EARNINGS</Typography></MenuItem>}
                                                    {components.earnings?.map(c => <MenuItem key={c.component_id} value={c.component_id}>{c.component_name}</MenuItem>)}
                                                    {components.deductions?.length > 0 && <MenuItem disabled sx={{ opacity: 1, mt: 1 }}><Typography variant="caption" sx={{ fontWeight: 600, color: 'error.main' }}>DEDUCTIONS</Typography></MenuItem>}
                                                    {components.deductions?.map(c => <MenuItem key={c.component_id} value={c.component_id}>{c.component_name}</MenuItem>)}
                                                </Select>
                                            </FormControl>

                                            <FormControl size="small" fullWidth>
                                                <InputLabel>Type</InputLabel>
                                                <Select value={comp.calculation_type} label="Type"
                                                    onChange={(e) => { const u = [...editComponentsList]; u[index].calculation_type = e.target.value; setEditComponentsList(u); }}
                                                >
                                                    <MenuItem value="FIXED">Fixed</MenuItem>
                                                    <MenuItem value="PERCENTAGE">Percentage</MenuItem>
                                                    <MenuItem value="FORMULA">Formula</MenuItem>
                                                </Select>
                                            </FormControl>

                                            {comp.calculation_type === 'PERCENTAGE' && (
                                                <FormControl size="small" fullWidth>
                                                    <InputLabel>Base</InputLabel>
                                                    <Select value={comp.base || 'CTC'} label="Base"
                                                        onChange={(e) => { const u = [...editComponentsList]; u[index].base = e.target.value; setEditComponentsList(u); }}
                                                    >
                                                        <MenuItem value="CTC">CTC</MenuItem>
                                                        <MenuItem value="BASIC">Basic</MenuItem>
                                                        <MenuItem value="GROSS">Gross</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            )}

                                            <Box>
                                                {comp.calculation_type === 'FIXED' && (
                                                    <TextField fullWidth size="small" label="Amount" type="number" value={comp.amount}
                                                        onChange={(e) => { const u = [...editComponentsList]; u[index].amount = e.target.value; setEditComponentsList(u); }}
                                                        InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}>₹</Typography> }}
                                                    />
                                                )}
                                                {comp.calculation_type === 'PERCENTAGE' && (
                                                    <TextField fullWidth size="small" label="Percentage" type="number" value={comp.percentage}
                                                        onChange={(e) => { const u = [...editComponentsList]; u[index].percentage = e.target.value; setEditComponentsList(u); }}
                                                        InputProps={{ endAdornment: <Typography sx={{ ml: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}>%</Typography> }}
                                                    />
                                                )}
                                                {comp.calculation_type === 'FORMULA' && (
                                                    <TextField fullWidth size="small" label="Formula" value={comp.formula}
                                                        onChange={(e) => { const u = [...editComponentsList]; u[index].formula = e.target.value; setEditComponentsList(u); }}
                                                        placeholder="BASIC * 0.12"
                                                    />
                                                )}
                                            </Box>

                                            <IconButton size="small" color="error"
                                                onClick={() => setEditComponentsList(editComponentsList.filter((_, i) => i !== index))}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1.5 }}>
                    <Button onClick={handleCloseEditDialog} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateTemplate}
                        disabled={!editTemplate.structure_name || structureLoading}
                        startIcon={structureLoading ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{ textTransform: 'none', minWidth: 140 }}
                    >
                        {structureLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SalaryStructures;
