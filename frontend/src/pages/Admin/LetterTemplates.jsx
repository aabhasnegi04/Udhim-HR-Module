import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Card, CardContent, CardActions,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    FormControl, InputLabel, Select, MenuItem, Chip, IconButton,
    Stack, Alert, Divider, CircularProgress, Snackbar, Tooltip
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Visibility as PreviewIcon, ContentCopy as CopyIcon
} from '@mui/icons-material';
import documentService from '../../services/documentService';

const categoryColors = {
    Onboarding: 'primary', Offboarding: 'warning',
    Payroll: 'success', General: 'info', Legal: 'error'
};

const LetterTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [form, setForm] = useState({ template_name: '', template_category: 'General', template_content: '', description: '', is_active: true });

    useEffect(() => { loadTemplates(); }, []);

    const loadTemplates = async () => {
        setLoading(true);
        const res = await documentService.getTemplates();
        if (res?.success) setTemplates(Array.isArray(res.data) ? res.data : []);
        else setError('Failed to load templates');
        setLoading(false);
    };

    const openCreate = () => {
        setEditingTemplate(null);
        setForm({ template_name: '', template_category: 'General', template_content: '', description: '', is_active: true });
        setDialogOpen(true);
    };

    const openEdit = (t) => {
        setEditingTemplate(t);
        setForm({ template_name: t.template_name, template_category: t.template_category, template_content: t.template_content, description: t.description || '', is_active: t.is_active });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.template_name.trim() || !form.template_content.trim()) {
            setError('Template name and content are required');
            return;
        }
        setSaving(true);
        const res = editingTemplate
            ? await documentService.updateTemplate(editingTemplate.template_id, form)
            : await documentService.createTemplate(form);
        if (res?.success) {
            setSuccess(editingTemplate ? 'Template updated' : 'Template created');
            document.activeElement?.blur();
            setDialogOpen(false);
            loadTemplates();
        } else {
            setError(res?.message || 'Failed to save template');
        }
        setSaving(false);
    };

    const handleDelete = async (templateId) => {
        if (!window.confirm('Deactivate this template?')) return;
        const res = await documentService.deleteTemplate(templateId);
        if (res?.success) { setSuccess('Template deactivated'); loadTemplates(); }
        else setError('Failed to deactivate template');
    };

    const insertPlaceholder = (key) => {
        setForm(prev => ({ ...prev, template_content: prev.template_content + key }));
    };

    return (
        <Box>
            <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')}>
                <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
            </Snackbar>
            <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')}>
                <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
            </Snackbar>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>Letter Templates</Typography>
                    <Typography variant="body2" color="text.secondary">Create reusable templates with dynamic placeholders</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>New Template</Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }, gap: 2, mb: 4 }}>
                    {templates.map(t => (
                        <Card key={t.template_id} sx={{ display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Chip label={t.template_category} color={categoryColors[t.template_category] || 'default'} size="small" />
                                    <Chip label={t.is_active ? 'Active' : 'Inactive'} color={t.is_active ? 'success' : 'default'} size="small" variant="outlined" />
                                </Box>
                                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>{t.template_name}</Typography>
                                {t.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{t.description}</Typography>}
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Modified: {t.modified_date ? new Date(t.modified_date).toLocaleDateString('en-IN') : '—'}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button size="small" startIcon={<PreviewIcon />} onClick={() => { setPreviewTemplate(t); setPreviewOpen(true); }}>Preview</Button>
                                <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(t)}>Edit</Button>
                                <IconButton size="small" color="error" onClick={() => handleDelete(t.template_id)}><DeleteIcon fontSize="small" /></IconButton>
                            </CardActions>
                        </Card>
                    ))}
                    {templates.length === 0 && (
                        <Box sx={{ gridColumn: '1/-1', textAlign: 'center', py: 6 }}>
                            <Typography color="text.secondary">No templates yet. Create your first one.</Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* Placeholders reference */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Available Placeholders</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Click to copy. Use these in template content — they are replaced with real data when generating a letter.</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {documentService.PLACEHOLDERS.map(p => (
                        <Tooltip key={p.key} title={p.desc}>
                            <Chip label={p.key} variant="outlined" size="small" onClick={() => navigator.clipboard.writeText(p.key)} icon={<CopyIcon sx={{ fontSize: '12px !important' }} />} sx={{ cursor: 'pointer' }} />
                        </Tooltip>
                    ))}
                </Box>
            </Paper>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField label="Template Name" value={form.template_name} onChange={e => setForm(p => ({ ...p, template_name: e.target.value }))} required fullWidth />
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select value={form.template_category} label="Category" onChange={e => setForm(p => ({ ...p, template_category: e.target.value }))}>
                                    {documentService.CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <TextField label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} fullWidth />
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Click a placeholder to insert at cursor:</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                {documentService.PLACEHOLDERS.map(p => (
                                    <Chip key={p.key} label={p.key} size="small" variant="outlined" onClick={() => insertPlaceholder(p.key)} sx={{ cursor: 'pointer', fontSize: '0.7rem' }} />
                                ))}
                            </Box>
                        </Box>
                        <TextField
                            label="Template Content"
                            multiline rows={14}
                            value={form.template_content}
                            onChange={e => setForm(p => ({ ...p, template_content: e.target.value }))}
                            placeholder={`Dear {{EmployeeName}},\n\nWe are pleased to offer you the position of {{Designation}} at {{CompanyName}}.\n\nYour CTC will be {{AnnualCTC}} per annum.\n\nDate of Joining: {{DOJ}}\n\nRegards,\nHR Team`}
                            required fullWidth
                            sx={{ fontFamily: 'monospace' }}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select value={form.is_active} label="Status" onChange={e => setForm(p => ({ ...p, is_active: e.target.value }))}>
                                <MenuItem value={true}>Active</MenuItem>
                                <MenuItem value={false}>Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving}>
                        {saving ? <CircularProgress size={20} /> : (editingTemplate ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{previewTemplate?.template_name}</DialogTitle>
                <DialogContent>
                    <Chip label={previewTemplate?.template_category} color={categoryColors[previewTemplate?.template_category] || 'default'} size="small" sx={{ mb: 2 }} />
                    <Paper sx={{ p: 3, bgcolor: 'grey.50', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.8 }}>
                        {previewTemplate?.template_content}
                    </Paper>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LetterTemplates;
