import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, IconButton, Chip, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Stack, Alert, CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../services/api';

const LeaveTypes = () => {
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ leave_code: '', leave_name: '', max_days_per_year: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/leave-types');
            if (res.success) setLeaveTypes(res.data?.leave_types || []);
        } catch { setError('Failed to load leave types'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setEditItem(null);
        setForm({ leave_code: '', leave_name: '', max_days_per_year: '' });
        setShowDialog(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({ leave_code: item.leave_code, leave_name: item.leave_name, max_days_per_year: item.max_days_per_year });
        setShowDialog(true);
    };

    const openDelete = (item) => {
        setDeleteTarget(item);
        setShowDeleteDialog(true);
    };

    const handleSubmit = async () => {
        if (!form.leave_code || !form.leave_name || !form.max_days_per_year) return;
        setSubmitting(true);
        setError('');
        try {
            const res = await api.post('/admin/leave-types', {
                leave_code: form.leave_code.toUpperCase(),
                leave_name: form.leave_name,
                max_days_per_year: parseInt(form.max_days_per_year)
            });
            if (res.success) {
                setSuccess(editItem ? 'Leave type updated' : 'Leave type added');
                setShowDialog(false);
                load();
            } else {
                setError(res.message || 'Failed');
            }
        } catch (e) {
            setError(e?.message || 'Failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        setError('');
        try {
            const res = await api.delete(`/admin/leave-types/${deleteTarget.leave_type_id}`);
            if (res.success) {
                setSuccess(`"${deleteTarget.leave_name}" deactivated`);
                setShowDeleteDialog(false);
                setDeleteTarget(null);
                load();
            } else {
                setError(res.message || 'Failed to deactivate');
                setShowDeleteDialog(false);
            }
        } catch (e) {
            setError(e?.message || 'Failed');
            setShowDeleteDialog(false);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>Leave Types</Typography>
                    <Typography variant="body2" color="text.secondary">Configure leave categories available to employees</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Leave Type</Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            {['Code', 'Leave Name', 'Max Days / Year', 'Status', ''].map(h => (
                                <TableCell key={h} sx={{ fontWeight: 600 }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                        ) : leaveTypes.length === 0 ? (
                            <TableRow><TableCell colSpan={5} align="center">No leave types configured</TableCell></TableRow>
                        ) : leaveTypes.map((lt) => (
                            <TableRow key={lt.leave_type_id} hover>
                                <TableCell><Chip label={lt.leave_code} color="primary" size="small" /></TableCell>
                                <TableCell><Typography variant="body2" fontWeight={600}>{lt.leave_name}</Typography></TableCell>
                                <TableCell>{lt.max_days_per_year} days</TableCell>
                                <TableCell>
                                    <Chip label={lt.is_active ? 'Active' : 'Inactive'} color={lt.is_active ? 'success' : 'default'} size="small" />
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <IconButton size="small" onClick={() => openEdit(lt)}><EditIcon /></IconButton>
                                        {lt.is_active ? (
                                            <IconButton size="small" color="error" onClick={() => openDelete(lt)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        ) : null}
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Dialog */}
            <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{editItem ? 'Edit' : 'Add'} Leave Type</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Leave Code" fullWidth required value={form.leave_code}
                            onChange={e => setForm(p => ({ ...p, leave_code: e.target.value }))}
                            helperText="Short code e.g. CL, SL, EL"
                            inputProps={{ style: { textTransform: 'uppercase' } }}
                        />
                        <TextField
                            label="Leave Name" fullWidth required value={form.leave_name}
                            onChange={e => setForm(p => ({ ...p, leave_name: e.target.value }))}
                            helperText="e.g. Casual Leave, Sick Leave"
                        />
                        <TextField
                            label="Max Days Per Year" type="number" fullWidth required
                            value={form.max_days_per_year}
                            onChange={e => setForm(p => ({ ...p, max_days_per_year: e.target.value }))}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit}
                        disabled={submitting || !form.leave_code || !form.leave_name || !form.max_days_per_year}>
                        {submitting ? <CircularProgress size={20} /> : (editItem ? 'Update' : 'Add')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Deactivate Leave Type</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This will deactivate <strong>{deleteTarget?.leave_name}</strong>. Employees won't be able to apply for this leave going forward.
                    </Alert>
                    <Typography variant="body2" color="text.secondary">
                        All existing leave history and balances for this type are preserved — nothing is deleted from records.
                        If there are pending requests for this type, deactivation will be blocked until they are resolved.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
                        {deleting ? <CircularProgress size={20} color="inherit" /> : 'Deactivate'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeaveTypes;
