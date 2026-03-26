import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Button, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Avatar, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, Divider, Alert, Grid, CircularProgress
} from '@mui/material';
import { Visibility as ViewIcon, Calculate as CalculateIcon, Refresh as RefreshIcon, AccountBalance as SettlementIcon } from '@mui/icons-material';
import offboardingService from '../../services/offboardingService';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const BLANK = { working_days: 0, salary_due: 0, leave_encashment: 0, bonus: 0, gratuity: 0, advance_deduction: 0, notice_period_deduction: 0, other_deductions: 0 };

const FinalSettlement = ({ onSettlementChange }) => {
    const [exits, setExits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [settlement, setSettlement] = useState(null);
    const [form, setForm] = useState(BLANK);
    const [showDialog, setShowDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const res = await offboardingService.getAllExits();
            if (res.success) setExits((res.data || []).filter(e => ['SETTLEMENT', 'COMPLETED'].includes(e.status)));
        } catch { setError('Failed to load'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openSettlement = async (exit) => {
        setSelected(exit);
        setSettlement(null);
        setForm(BLANK);
        setEditMode(false);
        try {
            const res = await offboardingService.getSettlement(exit.exit_id);
            if (res.success && res.data) {
                setSettlement(res.data);
                setForm({ working_days: res.data.working_days || 0, salary_due: res.data.salary_due || 0, leave_encashment: res.data.leave_encashment || 0, bonus: res.data.bonus || 0, gratuity: res.data.gratuity || 0, advance_deduction: res.data.advance_deduction || 0, notice_period_deduction: res.data.notice_period_deduction || 0, other_deductions: res.data.other_deductions || 0 });
            } else { setEditMode(true); }
        } catch { setEditMode(true); }
        setShowDialog(true);
    };

    const handleSave = async () => {
        setSubmitting(true);
        setError('');
        try {
            const res = await offboardingService.processSettlement(selected.exit_id, form);
            if (res.success) {
                setSuccess('Settlement calculated');
                setEditMode(false);
                const updated = await offboardingService.getSettlement(selected.exit_id);
                if (updated.success) setSettlement(updated.data);
                load();
                if (onSettlementChange) onSettlementChange();
            } else { setError(res.message || 'Failed'); }
        } catch { setError('Failed to save'); }
        finally { setSubmitting(false); }
    };

    const handleComplete = async () => {
        setSubmitting(true);
        try {
            const res = await offboardingService.completeExit(selected.exit_id);
            if (res.success) { setSuccess('Exit completed'); setShowDialog(false); load(); if (onSettlementChange) onSettlementChange(); }
        } catch { setError('Failed'); }
        finally { setSubmitting(false); }
    };

    const totalEarnings = +form.salary_due + +form.leave_encashment + +form.bonus + +form.gratuity;
    const totalDeductions = +form.advance_deduction + +form.notice_period_deduction + +form.other_deductions;

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>Final Settlement Management</Typography>
                    <Typography variant="body2" color="text.secondary">Calculate and process final settlement for exiting employees</Typography>
                </Box>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} size="small">Refresh</Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 180px' }}><CardContent><Typography variant="h4" color="primary.main" fontWeight={700}>{exits.length}</Typography><Typography variant="body2" color="text.secondary">Total</Typography></CardContent></Card>
                <Card sx={{ flex: '1 1 180px' }}><CardContent><Typography variant="h4" color="success.main" fontWeight={700}>{exits.filter(e => e.status === 'COMPLETED').length}</Typography><Typography variant="body2" color="text.secondary">Completed</Typography></CardContent></Card>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            {['Employee', 'Last Working Day', 'Status', 'Actions'].map(h => <TableCell key={h} sx={{ fontWeight: 600 }}>{h}</TableCell>)}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                        : exits.length === 0 ? <TableRow><TableCell colSpan={4} align="center">No exits ready for settlement</TableCell></TableRow>
                        : exits.map(exit => (
                            <TableRow key={exit.exit_id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar sx={{ width: 32, height: 32, mr: 1.5, fontSize: '0.875rem' }}>{(exit.employee_name || '?').charAt(0)}</Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{exit.employee_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{exit.employee_id} • {exit.department}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>{exit.last_working_day ? new Date(exit.last_working_day).toLocaleDateString('en-IN') : '-'}</TableCell>
                                <TableCell><Chip label={exit.status} size="small" color={exit.status === 'COMPLETED' ? 'success' : 'warning'} /></TableCell>
                                <TableCell><IconButton size="small" onClick={() => openSettlement(exit)}><ViewIcon /></IconButton></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><SettlementIcon />Final Settlement — {selected?.employee_name}</Box></DialogTitle>
                <DialogContent>
                    {editMode ? (
                        <Box sx={{ mt: 1 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>Enter settlement details for {selected?.employee_name}</Alert>
                            <Grid container spacing={2}>
                                <Grid item xs={12}><Typography variant="subtitle2" fontWeight={600} color="success.main">Earnings</Typography></Grid>
                                {[['working_days','Working Days'],['salary_due','Salary Due (₹)'],['leave_encashment','Leave Encashment (₹)'],['bonus','Bonus (₹)'],['gratuity','Gratuity (₹)']].map(([k,l]) => (
                                    <Grid item xs={12} sm={6} key={k}>
                                        <TextField fullWidth label={l} type="number" value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} />
                                    </Grid>
                                ))}
                                <Grid item xs={12}><Divider /><Typography variant="subtitle2" fontWeight={600} color="error.main" sx={{ mt: 1 }}>Deductions</Typography></Grid>
                                {[['advance_deduction','Advance Recovery (₹)'],['notice_period_deduction','Notice Period Shortfall (₹)'],['other_deductions','Other Deductions (₹)']].map(([k,l]) => (
                                    <Grid item xs={12} sm={6} key={k}>
                                        <TextField fullWidth label={l} type="number" value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} />
                                    </Grid>
                                ))}
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 2, border: 2, borderColor: 'primary.main' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography fontWeight={600}>Net Settlement</Typography>
                                            <Typography variant="h6" fontWeight={700} color="primary.main">{fmt(totalEarnings - totalDeductions)}</Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    ) : settlement ? (
                        <Box sx={{ mt: 1 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2, border: 1, borderColor: 'success.light' }}>
                                        <Typography variant="subtitle1" fontWeight={600} color="success.main" sx={{ mb: 1 }}>Earnings</Typography>
                                        {[['Salary Due', settlement.salary_due],['Leave Encashment', settlement.leave_encashment],['Bonus', settlement.bonus],['Gratuity', settlement.gratuity]].map(([l,v]) => (
                                            <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="body2">{l}</Typography><Typography variant="body2" fontWeight={600}>{fmt(v)}</Typography>
                                            </Box>
                                        ))}
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography fontWeight={600}>Total</Typography><Typography fontWeight={700} color="success.main">{fmt(settlement.total_earnings)}</Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2, border: 1, borderColor: 'error.light' }}>
                                        <Typography variant="subtitle1" fontWeight={600} color="error.main" sx={{ mb: 1 }}>Deductions</Typography>
                                        {[['Advance Recovery', settlement.advance_deduction],['Notice Period', settlement.notice_period_deduction],['Other', settlement.other_deductions]].map(([l,v]) => (
                                            <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="body2">{l}</Typography><Typography variant="body2" fontWeight={600}>{fmt(v)}</Typography>
                                            </Box>
                                        ))}
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography fontWeight={600}>Total</Typography><Typography fontWeight={700} color="error.main">{fmt(settlement.total_deductions)}</Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 2, border: 2, borderColor: 'primary.main' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="h6" fontWeight={600}>Net Settlement</Typography>
                                            <Typography variant="h5" fontWeight={700} color="primary.main">{fmt(settlement.net_settlement)}</Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDialog(false)}>Close</Button>
                    {!editMode && settlement && selected?.status !== 'COMPLETED' && (
                        <Button variant="outlined" startIcon={<CalculateIcon />} onClick={() => setEditMode(true)}>Recalculate</Button>
                    )}
                    {editMode && (
                        <Button variant="contained" onClick={handleSave} disabled={submitting}>
                            {submitting ? <CircularProgress size={20} /> : 'Save Settlement'}
                        </Button>
                    )}
                    {!editMode && settlement && selected?.status === 'SETTLEMENT' && (
                        <Button variant="contained" color="success" onClick={handleComplete} disabled={submitting}>Mark as Completed</Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FinalSettlement;
