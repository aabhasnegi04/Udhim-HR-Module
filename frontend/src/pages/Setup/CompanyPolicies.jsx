import { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Button, TextField,
    MenuItem, FormControl, InputLabel, Select, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
    Stack, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
    Alert, Switch, FormControlLabel, Checkbox, List, ListItem,
    ListItemIcon, ListItemText, CircularProgress
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Visibility as ViewIcon, Refresh as RefreshIcon,
    Policy as PolicyIcon, CheckCircle as CheckIcon,
    Description as DocumentIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { useProfileSwitching } from '../../context/ProfileSwitchingContext';
import adminService from '../../services/adminService';

const POLICY_CATEGORIES = [
    'HR Policy', 'Leave Policy', 'IT Policy',
    'Finance Policy', 'Safety Policy', 'Compliance Policy'
];
const VISIBILITY_OPTIONS = ['Employee', 'Manager', 'HR'];

const CompanyPolicies = () => {
    const { user } = useContext(AuthContext);
    const { currentView } = useProfileSwitching();
    const isHR = currentView === 'HR';

    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const [showDialog, setShowDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [isNew, setIsNew] = useState(false);
    const [formData, setFormData] = useState({
        policy_title: '', policy_category: '', policy_description: '',
        visibility_settings: [], policy_status: 'Active',
        policy_version: '1.0', effective_date: ''
    });

    const fetchPolicies = async () => {
        setLoading(true);
        setError('');
        try {
            let res;
            if (isHR) {
                // HR users can use admin endpoint to see all policies
                res = await adminService.getCompanyPolicies();
            } else {
                // Non-HR users use employee endpoint (filtered by visibility)
                const apiService = (await import('../../services/api')).default;
                res = await apiService.get('/employees/company-policies');
            }
            
            if (res.success) {
                setPolicies(res.data?.policies || res.data || []);
            } else {
                setError(res.error || 'Failed to load policies');
            }
        } catch (err) {
            setError(err.message || 'Failed to load policies');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPolicies(); }, []);

    const handleNew = () => {
        setIsNew(true);
        setSelectedPolicy(null);
        setFormData({ policy_title: '', policy_category: '', policy_description: '', visibility_settings: [], policy_status: 'Active', policy_version: '1.0', effective_date: '' });
        setShowDialog(true);
    };

    const handleEdit = (policy) => {
        setIsNew(false);
        setSelectedPolicy(policy);
        let vis = [];
        try { vis = typeof policy.visibility_settings === 'string' ? JSON.parse(policy.visibility_settings) : (policy.visibility_settings || []); } catch {}
        setFormData({
            policy_title: policy.policy_title || '',
            policy_category: policy.policy_category || '',
            policy_description: policy.policy_description || '',
            visibility_settings: vis,
            policy_status: policy.policy_status || 'Active',
            policy_version: policy.policy_version || '1.0',
            effective_date: policy.effective_date ? policy.effective_date.split('T')[0] : ''
        });
        setShowDialog(true);
    };

    const handleSave = async () => {
        setSaving(true);
        let res;
        if (isNew) {
            res = await adminService.addCompanyPolicy(formData);
        } else {
            res = await adminService.updateCompanyPolicy(selectedPolicy.policy_id, formData);
        }
        setSaving(false);
        if (res.success) {
            setShowDialog(false);
            fetchPolicies();
        } else {
            setError(res.error || 'Failed to save policy');
        }
    };

    const handleDelete = async (policy) => {
        if (!window.confirm(`Delete "${policy.policy_title}"?`)) return;
        const res = await adminService.deleteCompanyPolicy(policy.policy_id);
        if (res.success) {
            fetchPolicies();
        } else {
            setError(res.error || 'Failed to delete policy');
        }
    };

    const toggleVisibility = (role) => {
        setFormData(prev => ({
            ...prev,
            visibility_settings: prev.visibility_settings.includes(role)
                ? prev.visibility_settings.filter(r => r !== role)
                : [...prev.visibility_settings, role]
        }));
    };

    const getVisibility = (policy) => {
        try { return typeof policy.visibility_settings === 'string' ? JSON.parse(policy.visibility_settings) : (policy.visibility_settings || []); } catch { return []; }
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {isHR ? 'Company Policy Management' : 'Company Policies'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {isHR ? 'Manage and distribute company policies' : 'View company policies'}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPolicies} size="small">Refresh</Button>
                    {isHR && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNew}>Add Policy</Button>
                    )}
                </Stack>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 180px' }}>
                    <CardContent>
                        <Typography variant="h4" color="primary.main" fontWeight={700}>{policies.length}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Policies</Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 180px' }}>
                    <CardContent>
                        <Typography variant="h4" color="success.main" fontWeight={700}>
                            {policies.filter(p => p.policy_status === 'Active').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Active</Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 180px' }}>
                    <CardContent>
                        <Typography variant="h4" color="warning.main" fontWeight={700}>
                            {policies.filter(p => p.policy_status !== 'Active').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Inactive</Typography>
                    </CardContent>
                </Card>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Policy Title</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                            {isHR && <TableCell sx={{ fontWeight: 600 }}>Visibility</TableCell>}
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Version</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                        ) : policies.length === 0 ? (
                            <TableRow><TableCell colSpan={7} align="center">No policies found</TableCell></TableRow>
                        ) : policies.map((policy) => (
                            <TableRow key={policy.policy_id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <PolicyIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
                                        <Typography variant="body2" fontWeight={600}>{policy.policy_title}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell><Chip label={policy.policy_category} size="small" /></TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {policy.policy_description}
                                    </Typography>
                                </TableCell>
                                {isHR && (
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {getVisibility(policy).map(role => (
                                                <Chip key={role} label={role} size="small" variant="outlined" />
                                            ))}
                                        </Box>
                                    </TableCell>
                                )}
                                <TableCell>
                                    <Chip
                                        label={policy.policy_status || 'Active'}
                                        color={policy.policy_status === 'Active' ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{policy.policy_version || '1.0'}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <IconButton size="small" onClick={() => { setSelectedPolicy(policy); setShowViewDialog(true); }}>
                                            <ViewIcon />
                                        </IconButton>
                                        {isHR && (
                                            <>
                                                <IconButton size="small" onClick={() => handleEdit(policy)}><EditIcon /></IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleDelete(policy)}><DeleteIcon /></IconButton>
                                            </>
                                        )}
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Dialog */}
            <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PolicyIcon />
                        {isNew ? 'Add New Policy' : `Edit Policy`}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField
                                fullWidth label="Policy Title"
                                value={formData.policy_title}
                                onChange={e => setFormData(p => ({ ...p, policy_title: e.target.value }))}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select value={formData.policy_category} label="Category"
                                    onChange={e => setFormData(p => ({ ...p, policy_category: e.target.value }))}>
                                    {POLICY_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <TextField
                            fullWidth label="Description" multiline rows={2}
                            value={formData.policy_description}
                            onChange={e => setFormData(p => ({ ...p, policy_description: e.target.value }))}
                        />
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField
                                fullWidth label="Version"
                                value={formData.policy_version}
                                onChange={e => setFormData(p => ({ ...p, policy_version: e.target.value }))}
                            />
                            <TextField
                                fullWidth label="Effective Date" type="date"
                                value={formData.effective_date}
                                onChange={e => setFormData(p => ({ ...p, effective_date: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select value={formData.policy_status} label="Status"
                                    onChange={e => setFormData(p => ({ ...p, policy_status: e.target.value }))}>
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Inactive">Inactive</MenuItem>
                                    <MenuItem value="Draft">Draft</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Divider />
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Visibility (who can see this policy)</Typography>
                            <List dense>
                                {VISIBILITY_OPTIONS.map(role => (
                                    <ListItem key={role} sx={{ px: 0 }}>
                                        <ListItemIcon>
                                            <Checkbox
                                                checked={formData.visibility_settings.includes(role)}
                                                onChange={() => toggleVisibility(role)}
                                            />
                                        </ListItemIcon>
                                        <ListItemText primary={role} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained" onClick={handleSave} disabled={saving || !formData.policy_title || !formData.policy_category}
                    >
                        {saving ? <CircularProgress size={20} /> : isNew ? 'Add Policy' : 'Update Policy'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DocumentIcon /> Policy Details
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedPolicy && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>{selectedPolicy.policy_title}</Typography>
                            {[
                                ['Category', selectedPolicy.policy_category],
                                ['Description', selectedPolicy.policy_description],
                                ['Version', selectedPolicy.policy_version],
                                ['Status', selectedPolicy.policy_status],
                                ['Effective Date', selectedPolicy.effective_date ? new Date(selectedPolicy.effective_date).toLocaleDateString('en-IN') : '—'],
                            ].map(([label, val]) => (
                                <Box key={label} sx={{ mb: 1.5 }}>
                                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                                    <Typography variant="body1">{val || '—'}</Typography>
                                </Box>
                            ))}
                            {isHR && (
                                <Box sx={{ mb: 1.5 }}>
                                    <Typography variant="body2" color="text.secondary">Visibility</Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                        {getVisibility(selectedPolicy).map(r => <Chip key={r} label={r} size="small" />)}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowViewDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CompanyPolicies;
