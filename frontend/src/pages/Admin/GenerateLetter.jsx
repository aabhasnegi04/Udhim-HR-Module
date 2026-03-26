import { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Paper, Button, FormControl, InputLabel, Select,
    MenuItem, Divider, Alert, CircularProgress, Snackbar, Chip, Stack
} from '@mui/material';
import { Download as DownloadIcon, Send as GenerateIcon, Visibility as PreviewIcon } from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import documentService from '../../services/documentService';
import { generateLetterPDF } from '../../utils/generateLetterPDF';
import api from '../../services/api';

const categoryColors = { Onboarding: 'primary', Offboarding: 'warning', Payroll: 'success', General: 'info', Legal: 'error' };

const GenerateLetter = () => {
    const { user } = useContext(AuthContext);
    const [employees, setEmployees] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [employeeData, setEmployeeData] = useState(null);
    const [previewContent, setPreviewContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const companyName = (() => {
        try { return JSON.parse(sessionStorage.getItem('hrms_user') || '{}').company_name || ''; } catch { return ''; }
    })();

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        const [empRes, tplRes] = await Promise.all([
            api.get('/employees/'),
            documentService.getTemplates(true)
        ]);
        if (empRes?.success) setEmployees(Array.isArray(empRes.data?.employees) ? empRes.data.employees : []);
        if (tplRes?.success) setTemplates(Array.isArray(tplRes.data) ? tplRes.data : []);
        setLoading(false);
    };

    useEffect(() => {
        if (selectedEmployee && selectedTemplate) buildPreview();
    }, [selectedEmployee, selectedTemplate]);

    const buildPreview = async () => {
        if (!selectedEmployee || !selectedTemplate) return;
        setLoading(true);
        const empRes = await documentService.getEmployeeLetterData(selectedEmployee);
        if (empRes?.success) {
            setEmployeeData(empRes.data);
            const tpl = templates.find(t => t.template_id === selectedTemplate);
            if (tpl) {
                const filled = documentService.fillTemplate(tpl.template_content, empRes.data, companyName);
                setPreviewContent(filled);
            }
        } else {
            setError('Failed to load employee data');
        }
        setLoading(false);
    };

    const handleGenerate = async () => {
        if (!selectedEmployee || !selectedTemplate) return;
        setGenerating(true);
        const res = await documentService.generateLetter(selectedEmployee, selectedTemplate);
        if (res?.success) {
            setSuccess('Letter generated and saved successfully');
        } else {
            setError(res?.message || 'Failed to generate letter');
        }
        setGenerating(false);
    };

    const handleDownload = async () => {
        if (!previewContent) return;
        const emp = employees.find(e => e.employee_id === selectedEmployee);
        const tpl = templates.find(t => t.template_id === selectedTemplate);
        const empName = emp?.employee_name || emp?.first_name || 'Employee';
        const tplName = tpl?.template_name?.replace(/\s+/g, '_') || 'Letter';
        await generateLetterPDF(previewContent, `${tplName}_${empName}.pdf`, companyName);
    };

    const selectedTpl = templates.find(t => t.template_id === selectedTemplate);

    return (
        <Box>
            <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')}>
                <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
            </Snackbar>
            <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')}>
                <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
            </Snackbar>

            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>Generate Letter</Typography>
                <Typography variant="body2" color="text.secondary">Select an employee and template — the system fills in the variables automatically</Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '340px 1fr' }, gap: 3 }}>
                {/* Left panel — controls */}
                <Box>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>1. Select Employee</Typography>
                        <FormControl fullWidth size="small">
                            <InputLabel>Employee</InputLabel>
                            <Select value={selectedEmployee} label="Employee" onChange={e => setSelectedEmployee(e.target.value)}>
                                {employees.map(emp => (
                                    <MenuItem key={emp.employee_id} value={emp.employee_id}>
                                        {emp.employee_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()} ({emp.employee_code})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {employeeData && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary" display="block">Department: {employeeData.Department}</Typography>
                                <Typography variant="caption" color="text.secondary" display="block">Designation: {employeeData.Designation}</Typography>
                                <Typography variant="caption" color="text.secondary" display="block">DOJ: {employeeData.DOJ}</Typography>
                            </Box>
                        )}

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>2. Select Template</Typography>
                        <FormControl fullWidth size="small">
                            <InputLabel>Template</InputLabel>
                            <Select value={selectedTemplate} label="Template" onChange={e => setSelectedTemplate(e.target.value)}>
                                {templates.map(t => (
                                    <MenuItem key={t.template_id} value={t.template_id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label={t.template_category} color={categoryColors[t.template_category] || 'default'} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                                            {t.template_name}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Divider sx={{ my: 2 }} />

                        <Stack spacing={1}>
                            <Button
                                variant="contained"
                                fullWidth
                                startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <GenerateIcon />}
                                onClick={handleGenerate}
                                disabled={!previewContent || generating}                            >
                                Save Letter
                            </Button>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<DownloadIcon />}
                                onClick={handleDownload}
                                disabled={!previewContent}
                            >
                                Download PDF
                            </Button>
                        </Stack>
                    </Paper>
                </Box>

                {/* Right panel — preview */}
                <Paper sx={{ p: 3, minHeight: 500 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            {selectedTpl ? selectedTpl.template_name : 'Letter Preview'}
                        </Typography>
                        {selectedTpl && <Chip label={selectedTpl.template_category} color={categoryColors[selectedTpl.template_category] || 'default'} size="small" />}
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}><CircularProgress /></Box>
                    ) : previewContent ? (
                        <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 1, whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', fontSize: '0.9rem', lineHeight: 1.9, minHeight: 400 }}>
                            {previewContent}
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                            <Typography color="text.secondary">Select an employee and template to preview the letter</Typography>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Box>
    );
};

export default GenerateLetter;
