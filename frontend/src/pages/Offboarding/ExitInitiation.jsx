import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Button, TextField,
    MenuItem, FormControl, InputLabel, Select, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, Avatar,
    IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
    Divider, Alert, CircularProgress
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, ExitToApp as ExitIcon, Refresh as RefreshIcon, Delete as DeleteIcon } from '@mui/icons-material';
import offboardingService from '../../services/offboardingService';
import employeeService from '../../services/employeeService';
import AppDatePicker from '../../components/common/AppDatePicker';

const STATUS_COLOR = { INITIATED: 'default', CLEARANCE: 'warning', INTERVIEW: 'info', SETTLEMENT: 'secondary', COMPLETED: 'success', CANCELLED: 'error' };

const ExitInitiation = ({ onExitChange }) => {
    const [exits, setExits] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [viewTarget, setViewTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [form, setForm] = useState({ employee_id: '', exit_type: '', exit_reason: '', last_working_day: '', notes: '' });

    const load = async () => {
        setLoading(true);
        try {
            const [exitsRes, empRes] = await Promise.all([
                offboardingService.getAllExits(),
                employeeService.getActiveEmployees()
            ]);
            if (exitsRes.success) setExits(exitsRes.data || []);
            if (empRes.success) setEmployees(empRes.data || []);
        } catch (e) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async () => {
        if (!form.employee_id || !form.exit_type || !form.last_working_day) return;
        setSubmitting(true);
        setError('');
        try {
            const res = await offboardingService.initiateExit(form);
            console.log('initiateExit response:', res);
            if (res && res.success) {
                setSuccess('Exit process initiated successfully');
                setShowDialog(false);
                setForm({ employee_id: '', exit_type: '', exit_reason: '', last_working_day: '', notes: '' });
                load();
                if (onExitChange) onExitChange();
            } else {
                setError(res?.message || 'Failed to initiate exit');
            }
        } catch (e) {
            console.error('initiateExit error:', e);
            setError(e?.message || 'Failed to initiate exit');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setSubmitting(true);
        try {
            const res = await offboardingService.deleteExit(deleteTarget.exit_id);
            if (res && res.success) {
                setSuccess('Exit record deleted');
                setDeleteTarget(null);
                load();
            } else {
                setError(res?.message || 'Failed to delete');
            }
        } catch (e) {
            setError(e?.message || 'Failed to delete');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>Employee Exit Initiation</Typography>
                    <Typography variant="body2" color="text.secondary">Initiate and manage employee offboarding processes</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} size="small">Refresh</Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowDialog(true)}>Initiate Exit</Button>
                </Stack>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                {[
                    { label: 'Total', value: exits.length, color: 'primary.main' },
                    { label: 'In Progress', value: exits.filter(e => !['COMPLETED','CANCELLED'].includes(e.status)).length, color: 'warning.main' },
                    { label: 'Completed', value: exits.filter(e => e.status === 'COMPLETED').length, color: 'success.main' }
                ].map(c => (
                    <Card key={c.label} sx={{ flex: '1 1 180px' }}>
                        <CardContent>
                            <Typography variant="h4" color={c.color} fontWeight={700}>{c.value}</Typography>
                            <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            {['Employee', 'Exit Type', 'Last Working Day', 'Reason', 'Status', 'Initiated On', ''].map(h => (
                                <TableCell key={h} sx={{ fontWeight: 600 }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                        ) : exits.length === 0 ? (
                            <TableRow><TableCell colSpan={7} align="center">No exit records found</TableCell></TableRow>
                        ) : exits.map(exit => (
                            <TableRow key={exit.exit_id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar sx={{ width: 32, height: 32, mr: 1.5, fontSize: '0.875rem' }}>
                                            {(exit.employee_name || '?').charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{exit.employee_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{exit.employee_id} • {exit.department}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell><Chip label={exit.exit_type} size="small" color={exit.exit_type === 'Resignation' ? 'info' : 'default'} /></TableCell>
                                <TableCell>{exit.last_working_day ? new Date(exit.last_working_day).toLocaleDateString('en-IN') : '-'}</TableCell>
                                <TableCell><Typography variant="body2">{exit.exit_reason || '-'}</Typography></TableCell>
                                <TableCell><Chip label={exit.status} color={STATUS_COLOR[exit.status] || 'default'} size="small" /></TableCell>
                                <TableCell>{exit.initiated_on ? new Date(exit.initiated_on).toLocaleDateString('en-IN') : '-'}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => setViewTarget(exit)} title="View details"><ViewIcon /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(exit)} title="Delete exit record">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* View Detail Dialog */}
            <Dialog open={!!viewTarget} onClose={() => setViewTarget(null)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36 }}>{(viewTarget?.employee_name || '?').charAt(0)}</Avatar>
                        <Box>
                            <Typography fontWeight={600}>{viewTarget?.employee_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{viewTarget?.employee_id} • {viewTarget?.department}</Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
                        {[
                            { label: 'Exit Type', value: viewTarget?.exit_type },
                            { label: 'Status', value: viewTarget?.status },
                            { label: 'Last Working Day', value: viewTarget?.last_working_day ? new Date(viewTarget.last_working_day).toLocaleDateString('en-IN') : '-' },
                            { label: 'Initiated On', value: viewTarget?.initiated_on ? new Date(viewTarget.initiated_on).toLocaleDateString('en-IN') : '-' },
                            { label: 'Designation', value: viewTarget?.designation || '-' },
                            { label: 'Completed On', value: viewTarget?.completed_on ? new Date(viewTarget.completed_on).toLocaleDateString('en-IN') : 'Not yet' },
                        ].map(({ label, value }) => (
                            <Box key={label}>
                                <Typography variant="caption" color="text.secondary">{label}</Typography>
                                <Typography variant="body2" fontWeight={500}>{value}</Typography>
                            </Box>
                        ))}
                    </Box>
                    {viewTarget?.exit_reason && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary">Reason</Typography>
                            <Typography variant="body2">{viewTarget.exit_reason}</Typography>
                        </Box>
                    )}
                    {viewTarget?.notes && (
                        <Box sx={{ mt: 1.5 }}>
                            <Typography variant="caption" color="text.secondary">Notes</Typography>
                            <Typography variant="body2">{viewTarget.notes}</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewTarget(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Delete Exit Record</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mt: 1 }}>
                        This will permanently delete the exit record for <strong>{deleteTarget?.employee_name}</strong> along with all clearance, interview, and settlement data. This cannot be undone.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDelete} disabled={submitting}>
                        {submitting ? <CircularProgress size={20} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Initiate Dialog */}
            <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ExitIcon />Initiate Employee Exit</Box></DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 3, mt: 1 }}>This will start the formal offboarding process for the selected employee.</Alert>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <FormControl fullWidth required>
                            <InputLabel>Select Employee</InputLabel>
                            <Select value={form.employee_id} label="Select Employee" onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))}>
                                {employees.map(emp => (
                                    <MenuItem key={emp.employee_code} value={emp.employee_code}>
                                        {emp.employee_name} ({emp.employee_code}) — {emp.department}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Divider />
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <AppDatePicker required label="Last Working Day" value={form.last_working_day}
                                onChange={v => setForm(p => ({ ...p, last_working_day: v }))} />
                            <FormControl fullWidth required>
                                <InputLabel>Exit Type</InputLabel>
                                <Select value={form.exit_type} label="Exit Type" onChange={e => setForm(p => ({ ...p, exit_type: e.target.value }))}>
                                    {['Resignation', 'Termination', 'Absconded', 'Retirement', 'End of Contract'].map(t => (
                                        <MenuItem key={t} value={t}>{t}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <TextField fullWidth label="Exit Reason" value={form.exit_reason} onChange={e => setForm(p => ({ ...p, exit_reason: e.target.value }))} />
                        <TextField fullWidth label="Additional Notes" multiline rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting || !form.employee_id || !form.exit_type || !form.last_working_day}>
                        {submitting ? <CircularProgress size={20} /> : 'Initiate Exit Process'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ExitInitiation;
