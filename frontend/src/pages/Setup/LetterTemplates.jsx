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
    IconButton,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Alert,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Upload as UploadIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    Description as TemplateIcon
} from '@mui/icons-material';

// Mock template data
const mockTemplates = [
    {
        id: 1,
        name: 'Offer Letter Template',
        type: 'Offer Letter',
        description: 'Standard offer letter template for new hires',
        placeholders: ['{{EmployeeName}}', '{{Position}}', '{{Salary}}', '{{JoiningDate}}', '{{Department}}'],
        isActive: true,
        createdBy: 'HR Admin',
        createdOn: '2024-12-01',
        lastModified: '2025-01-01'
    },
    {
        id: 2,
        name: 'Appointment Letter Template',
        type: 'Appointment Letter',
        description: 'Formal appointment letter after probation completion',
        placeholders: ['{{EmployeeName}}', '{{EmployeeId}}', '{{Position}}', '{{Department}}', '{{ConfirmationDate}}'],
        isActive: true,
        createdBy: 'HR Admin',
        createdOn: '2024-12-01',
        lastModified: '2024-12-15'
    },
    {
        id: 3,
        name: 'Relieving Letter Template',
        type: 'Relieving Letter',
        description: 'Standard relieving letter for exiting employees',
        placeholders: ['{{EmployeeName}}', '{{EmployeeId}}', '{{Position}}', '{{JoiningDate}}', '{{LastWorkingDay}}'],
        isActive: true,
        createdBy: 'HR Admin',
        createdOn: '2024-12-01',
        lastModified: '2025-01-05'
    },
    {
        id: 4,
        name: 'Experience Certificate Template',
        type: 'Experience Certificate',
        description: 'Experience certificate for former employees',
        placeholders: ['{{EmployeeName}}', '{{Position}}', '{{JoiningDate}}', '{{LastWorkingDay}}', '{{Department}}'],
        isActive: false,
        createdBy: 'HR Admin',
        createdOn: '2024-11-15',
        lastModified: '2024-11-20'
    }
];

const LetterTemplates = () => {
    const [templates, setTemplates] = useState(mockTemplates);
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isNewTemplate, setIsNewTemplate] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        description: '',
        content: '',
        isActive: true
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNewTemplate = () => {
        setIsNewTemplate(true);
        setSelectedTemplate(null);
        resetForm();
        setShowTemplateDialog(true);
    };

    const handleEditTemplate = (template) => {
        setIsNewTemplate(false);
        setSelectedTemplate(template);
        setFormData({
            name: template.name,
            type: template.type,
            description: template.description,
            content: 'Template content would be loaded here...',
            isActive: template.isActive
        });
        setShowTemplateDialog(true);
    };

    const handleSaveTemplate = () => {
        if (isNewTemplate) {
            const newTemplate = {
                id: templates.length + 1,
                ...formData,
                placeholders: extractPlaceholders(formData.content),
                createdBy: 'HR Admin',
                createdOn: new Date().toISOString().split('T')[0],
                lastModified: new Date().toISOString().split('T')[0]
            };
            setTemplates(prev => [...prev, newTemplate]);
        } else {
            setTemplates(prev => prev.map(template => 
                template.id === selectedTemplate.id 
                    ? {
                        ...template,
                        ...formData,
                        placeholders: extractPlaceholders(formData.content),
                        lastModified: new Date().toISOString().split('T')[0]
                    }
                    : template
            ));
        }
        setShowTemplateDialog(false);
        resetForm();
    };

    const extractPlaceholders = (content) => {
        // Extract placeholders from content (simplified)
        const matches = content.match(/\{\{[^}]+\}\}/g);
        return matches ? [...new Set(matches)] : [];
    };

    const handleToggleActive = (templateId) => {
        setTemplates(prev => prev.map(template => 
            template.id === templateId 
                ? { ...template, isActive: !template.isActive }
                : template
        ));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: '',
            description: '',
            content: '',
            isActive: true
        });
    };

    const templateTypes = [
        'Offer Letter',
        'Appointment Letter',
        'Relieving Letter',
        'Experience Certificate',
        'Salary Certificate',
        'Promotion Letter',
        'Transfer Letter'
    ];

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Letter Template Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create and manage letter templates for HR documentation
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => setTemplates(mockTemplates)}
                            size="small"
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<UploadIcon />}
                            size="small"
                        >
                            Import
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleNewTemplate}
                        >
                            New Template
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                            {templates.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Templates
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                            {templates.filter(t => t.isActive).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Active Templates
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                            {new Set(templates.map(t => t.type)).size}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Template Types
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Templates Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Template Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Placeholders</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Last Modified</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {templates.map((template) => (
                            <TableRow key={template.id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <TemplateIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {template.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Created by {template.createdBy}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip label={template.type} size="small" />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {template.description}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {template.placeholders.slice(0, 3).map((placeholder, index) => (
                                            <Chip
                                                key={index}
                                                label={placeholder}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: '0.75rem' }}
                                            />
                                        ))}
                                        {template.placeholders.length > 3 && (
                                            <Chip
                                                label={`+${template.placeholders.length - 3}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: '0.75rem' }}
                                            />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={template.isActive}
                                                onChange={() => handleToggleActive(template.id)}
                                                size="small"
                                            />
                                        }
                                        label={template.isActive ? 'Active' : 'Inactive'}
                                        sx={{ m: 0 }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {new Date(template.lastModified).toLocaleDateString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton size="small">
                                            <ViewIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleEditTemplate(template)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small">
                                            <DownloadIcon />
                                        </IconButton>
                                        <IconButton size="small" color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Template Dialog */}
            <Dialog open={showTemplateDialog} onClose={() => setShowTemplateDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TemplateIcon />
                        {isNewTemplate ? 'Create New Template' : `Edit Template - ${selectedTemplate?.name}`}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        {/* Basic Information */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Template Information
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <TextField
                                    fullWidth
                                    label="Template Name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="e.g., Standard Offer Letter"
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Template Type</InputLabel>
                                    <Select
                                        value={formData.type}
                                        label="Template Type"
                                        onChange={(e) => handleInputChange('type', e.target.value)}
                                    >
                                        {templateTypes.map((type) => (
                                            <MenuItem key={type} value={type}>{type}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                            <TextField
                                fullWidth
                                label="Description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Brief description of when to use this template"
                                sx={{ mb: 2 }}
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isActive}
                                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                    />
                                }
                                label="Active Template"
                            />
                        </Box>

                        <Divider />

                        {/* Template Content */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Template Content
                            </Typography>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Use placeholders like {`{{EmployeeName}}`}, {`{{Position}}`}, {`{{Salary}}`} etc. 
                                These will be automatically replaced when generating letters.
                            </Alert>
                            <TextField
                                fullWidth
                                label="Template Content"
                                value={formData.content}
                                onChange={(e) => handleInputChange('content', e.target.value)}
                                multiline
                                rows={12}
                                placeholder={`Dear {{EmployeeName}},

We are pleased to offer you the position of {{Position}} at our company.

Your starting salary will be {{Salary}} per annum, and your joining date is {{JoiningDate}}.

Please report to the {{Department}} department on your first day.

Best regards,
HR Team`}
                            />
                        </Box>

                        {/* Available Placeholders */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Common Placeholders
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {[
                                    '{{EmployeeName}}', '{{EmployeeId}}', '{{Position}}', '{{Department}}',
                                    '{{Salary}}', '{{JoiningDate}}', '{{LastWorkingDay}}', '{{CompanyName}}',
                                    '{{ManagerName}}', '{{CurrentDate}}', '{{Address}}', '{{Phone}}'
                                ].map((placeholder) => (
                                    <Chip
                                        key={placeholder}
                                        label={placeholder}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => {
                                            const newContent = formData.content + ' ' + placeholder;
                                            handleInputChange('content', newContent);
                                        }}
                                        sx={{ cursor: 'pointer' }}
                                    />
                                ))}
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Click on a placeholder to add it to your template
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
                    <Button variant="outlined" startIcon={<ViewIcon />}>
                        Preview
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSaveTemplate}
                        disabled={!formData.name || !formData.type || !formData.content}
                    >
                        {isNewTemplate ? 'Create Template' : 'Update Template'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LetterTemplates;