import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Button, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, Avatar, IconButton,
    Stack, Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
    Alert, CircularProgress, TextField, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { CheckCircle as CheckIcon, Cancel as CancelIcon, Pending as PendingIcon,
    Visibility as ViewIcon, Timeline as TimelineIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import offboardingService from '../../services/offboardingService';

const STATUS_COLOR = { APPROVED: 'success', REJECTED: 'error', PENDING: 'warning' };
const DEPTS = ['IT', 'HR', 'ADMIN', 'FINANCE'];

const ClearanceTracking = ({ onClearanceChange }) => {
    const [exits, setExits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [clearances, setClearances] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [approveForm, setApproveForm] = useState({ clearance_id: null, status: '', comments: '' });
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const res = await offboardingService.getAllExits();
            if (res.success) setExits((res.data || []).filter(e => e.status !== 'INITIATED'));
        } catch { setError('Failed to load'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openClearance = async (exit) => {
        setSelected(exit);
        const res = await offboardingService.getExitClearances(exit.exit_id);
        if (res.success) setClearances(res.data || []);
        setShowDialog(true);
    };

    const openApprove = (c) => {
        setApproveForm({ clearance_id: c.clearance_id, status: c.status === 'APPROVED' ? 'APPROVED' : '', comments: c.comments || '' });
        setShowApproveDialog(true);
    };

    const handleApprove = async () => {
        setSubmitting(true);
        try {
            const res = await offboardingService.approveClearance(approveForm.clearance_id, approveForm.status, approveForm.comments);
            if (res.success) {
                setShowApproveDialog(false);
                const updated = await offboardingService.getExitClearances(selected.exit_id);
                if (updated.success) setClearances(updated.data || []);
                load();
                if (onClearanceChange) onClearanceChange();
            }
        } catch { setError('Failed to update clearance'); }
        finally { setSubmitting(false); }
    };

    const progress = (cls) => {
        if (!cls.length) return 0;
        return Math.round((cls.filter(c => c.status === 'APPROVED').length / cls.length) * 100);
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>Clearance Tracking</Typography>
                    <Typography variant="body2" color="text.secondary">Track and manage employee clearance processes</Typography>
                </Box>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} size="small">Refresh</Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                {[
                    { label: 'Active', value: exits.filter(e => e.status === 'CLEARANCE').length, color: 'primary.main' },
                    { label: 'Pending Clearance', value: exits.filter(e => e.status === 'CLEARANCE').length, color: 'warning.main' },
                    { label: 'Cleared', value: exits.filter(e => ['INTERVIEW','SETTLEMENT','COMPLETED'].includes(e.status)).length, color: 'success.main' }
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
                            {['Employee', 'Last Working Day', 'Status', 'Actions'].map(h => (
                                <TableCell key={h} sx={{ fontWeight: 600 }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                        ) : exits.length === 0 ? (
                            <TableRow><TableCell colSpan={4} align="center">No exits in clearance stage</TableCell></TableRow>
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
                                <TableCell>{exit.last_working_day ? new Date(exit.last_working_day).toLocaleDateString('en-IN') : '-'}</TableCell>
                                <TableCell><Chip label={exit.status} size="small" color={{ CLEARANCE: 'warning', INTERVIEW: 'info', SETTLEMENT: 'secondary', COMPLETED: 'success' }[exit.status] || 'default'} /></TableCell>
                                <TableCell>
                                    <IconButton size="small" onClick={() => openClearance(exit)}><ViewIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Clearance Detail Dialog */}
            <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimelineIcon />Clearance — {selected?.employee_name}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {clearances.length === 0 ? (
                        <Typography color="text.secondary">No clearance records found.</Typography>
                    ) : (
                        <Box sx={{ mt: 1 }}>
                            <LinearProgress variant="determinate" value={progress(clearances)} sx={{ mb: 2, height: 8, borderRadius: 4 }} />
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{progress(clearances)}% cleared</Typography>
                            {clearances.map(c => (
                                <Paper key={c.clearance_id} sx={{ p: 2, mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={600}>{c.department}</Typography>
                                        {c.comments && <Typography variant="caption" color="text.secondary">{c.comments}</Typography>}
                                        {c.approved_by_name && <Typography variant="caption" display="block" color="text.secondary">By: {c.approved_by_name}</Typography>}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip label={c.status} color={STATUS_COLOR[c.status] || 'default'} size="small" />
                                        {c.status === 'PENDING' && (
                                            <Button size="small" variant="outlined" onClick={() => openApprove(c)}>Update</Button>
                                        )}
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Approve/Reject Dialog */}
            <Dialog open={showApproveDialog} onClose={() => setShowApproveDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Update Clearance</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Decision</InputLabel>
                            <Select value={approveForm.status} label="Decision" onChange={e => setApproveForm(p => ({ ...p, status: e.target.value }))}>
                                <MenuItem value="APPROVED">Approve</MenuItem>
                                <MenuItem value="REJECTED">Reject</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField fullWidth label="Comments" multiline rows={2} value={approveForm.comments}
                            onChange={e => setApproveForm(p => ({ ...p, comments: e.target.value }))} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowApproveDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleApprove} disabled={submitting || !approveForm.status}>
                        {submitting ? <CircularProgress size={20} /> : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ClearanceTracking;
