import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    CardActions,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Stack,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Snackbar
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as PreviewIcon,
    Upload as UploadIcon,
    Download as DownloadIcon,
    Description as TemplateIcon
} from '@mui/icons-material';

const LetterTemplates = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [openPreview, setOpenPreview] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [editTemplate, setEditTemplate] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({});

    // Load templates when component mounts
    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const result = await adminService.getLetterTemplates();
            if (result.success) {
                setTemplates(result.data || []);
            } else {
                setError(result.error || 'Failed to load templates');
            }
        } catch (error) {
            setError('Failed to load templates');
            console.error('Load templates error:', error);
        } finally {
            setLoading(false);
        }
    };

    const templateCategories = ['Onboarding', 'Payroll', 'Offboarding', 'General'];

    const placeholders = [
        '{{EmployeeName}}', '{{EmployeeID}}', '{{Designation}}', '{{Department}}',
        '{{DOJ}}', '{{LastWorkingDay}}', '{{CompanyName}}', '{{AnnualSalary}}',
        '{{MonthlySalary}}', '{{AnnualCTC}}', '{{ResponseDate}}', '{{IssueDate}}'
    ];

    const handleAddTemplate = () => {
        setEditTemplate(null);
        setFormData({
            template_name: '',
            template_category: 'General',
            template_content: '',
            description: '',
            is_active: true
        });
        setOpenDialog(true);
    };

    const handleEditTemplate = (template) => {
        setEditTemplate(template);
        setFormData({
            template_name: template.template_name,
            template_category: template.template_category,
            template_content: template.template_content,
            description: template.description,
            is_active: template.is_active
        });
        setOpenDialog(true);
    };

    const handlePreviewTemplate = (template) => {
        setSelectedTemplate(template);
        setOpenPreview(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditTemplate(null);
        setFormData({});
    };

    const handleClosePreview = () => {
        setOpenPreview(false);
        setSelectedTemplate(null);
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            let result;

            if (editTemplate) {
                result = await adminService.updateLetterTemplate(editTemplate.template_id, formData);
            } else {
                result = await adminService.addLetterTemplate(formData);
            }

            if (result.success) {
                setSuccess(`Template ${editTemplate ? 'updated' : 'added'} successfully`);
                handleCloseDialog();
                loadTemplates(); // Reload templates
            } else {
                setError(result.error || 'Operation failed');
            }
        } catch (error) {
            setError('Operation failed');
            console.error('Submit error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        if (!window.confirm('Are you sure you want to delete this template?')) {
            return;
        }

        try {
            setLoading(true);
            const result = await adminService.deleteLetterTemplate(templateId);
            
            if (result.success) {
                setSuccess('Template deleted successfully');
                loadTemplates(); // Reload templates
            } else {
                setError(result.error || 'Failed to delete template');
            }
        } catch (error) {
            setError('Failed to delete template');
            console.error('Delete error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        return status ? 'success' : 'default';
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'Onboarding':
                return 'primary';
            case 'Payroll':
                return 'success';
            case 'Offboarding':
                return 'warning';
            case 'General':
                return 'info';
            default:
                return 'default';
        }
    };

    return (
        <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
                Letter templates configured here will be used by Onboarding, Payroll, and Offboarding modules for document generation.
            </Alert>

            {/* Error/Success Messages */}
            <Snackbar 
                open={!!error} 
                autoHideDuration={6000} 
                onClose={() => setError('')}
            >
                <Alert severity="error" onClose={() => setError('')}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar 
                open={!!success} 
                autoHideDuration={6000} 
                onClose={() => setSuccess('')}
            >
                <Alert severity="success" onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            </Snackbar>

            {/* Header Actions */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Letter Templates ({templates.length})
                </Typography>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                    >
                        Import Templates
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddTemplate}
                    >
                        Add Template
                    </Button>
                </Stack>
            </Box>

            {/* Templates Grid */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                    gap: 2,
                    mb: 4
                }}>
                    {templates.map((template) => (
                        <Card key={template.template_id}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                            {template.template_name}
                                        </Typography>
                                        <Chip 
                                            label={template.template_category} 
                                            color={getCategoryColor(template.template_category)}
                                            size="small"
                                            sx={{ mb: 1 }}
                                        />
                                    </Box>
                                    <Chip 
                                        label={template.is_active ? 'Active' : 'Inactive'} 
                                        color={getStatusColor(template.is_active)}
                                        size="small"
                                    />
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {template.description}
                                </Typography>

                                <Typography variant="caption" color="text.secondary">
                                    Last modified: {new Date(template.modified_date).toLocaleDateString()}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button 
                                    size="small" 
                                    startIcon={<PreviewIcon />}
                                    onClick={() => handlePreviewTemplate(template)}
                                >
                                    Preview
                                </Button>
                                <Button 
                                    size="small" 
                                    startIcon={<EditIcon />}
                                    onClick={() => handleEditTemplate(template)}
                                    disabled={loading}
                                >
                                    Edit
                                </Button>
                                <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleDeleteTemplate(template.template_id)}
                                    disabled={loading}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </CardActions>
                        </Card>
                    ))}
                    {templates.length === 0 && !loading && (
                        <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', p: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                                No templates found. Create your first template to get started.
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* Available Placeholders */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Available Placeholders
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Use these placeholders in your templates. They will be automatically replaced with actual data when generating documents.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {placeholders.map((placeholder, index) => (
                        <Chip 
                            key={index}
                            label={placeholder}
                            variant="outlined"
                            size="small"
                        />
                    ))}
                </Box>
            </Paper>

            {/* Add/Edit Template Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editTemplate ? 'Edit Template' : 'Add New Template'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Template Name"
                            fullWidth
                            value={formData.template_name || ''}
                            onChange={(e) => handleFormChange('template_name', e.target.value)}
                            required
                        />
                        <FormControl fullWidth>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={formData.template_category || ''}
                                onChange={(e) => handleFormChange('template_category', e.target.value)}
                                label="Category"
                            >
                                {templateCategories.map((category) => (
                                    <MenuItem key={category} value={category}>
                                        {category}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Description"
                            fullWidth
                            value={formData.description || ''}
                            onChange={(e) => handleFormChange('description', e.target.value)}
                        />
                        <TextField
                            label="Template Content"
                            multiline
                            rows={10}
                            fullWidth
                            value={formData.template_content || ''}
                            onChange={(e) => handleFormChange('template_content', e.target.value)}
                            placeholder="Enter your template content here. Use placeholders like {{EmployeeName}} for dynamic data."
                            required
                        />
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={formData.is_active !== undefined ? formData.is_active : true}
                                onChange={(e) => handleFormChange('is_active', e.target.value)}
                                label="Status"
                            >
                                <MenuItem value={true}>Active</MenuItem>
                                <MenuItem value={false}>Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={20} /> : (editTemplate ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Template Preview Dialog */}
            <Dialog open={openPreview} onClose={handleClosePreview} maxWidth="md" fullWidth>
                <DialogTitle>
                    Template Preview: {selectedTemplate?.template_name}
                </DialogTitle>
                <DialogContent>
                    <Paper sx={{ p: 3, bgcolor: 'grey.50', whiteSpace: 'pre-line' }}>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                            {selectedTemplate?.template_content}
                        </Typography>
                    </Paper>
                </DialogContent>
                <DialogActions>
                    <Button startIcon={<DownloadIcon />}>
                        Download
                    </Button>
                    <Button onClick={handleClosePreview}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LetterTemplates;