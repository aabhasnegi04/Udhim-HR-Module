import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Button, TextField,
    FormControl, InputLabel, Select, MenuItem, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, Avatar,
    IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
    Rating, Divider, Alert, CircularProgress
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, QuestionAnswer as InterviewIcon,
    Refresh as RefreshIcon, Save as SaveIcon } from '@mui/icons-material';
import offboardingService from '../../services/offboardingService';
import AppDatePicker from '../../components/common/AppDatePicker';

const BLANK_FORM = {
    interview_date: '', reason_for_leaving: '', job_satisfaction: 0,
    work_environment: 0, management: 0, compensation: 0, work_life_balance: 0,
    feedback: '', suggestions: '', would_recommend: '', would_rejoin: '', private_notes: ''
};

const ExitInterview = ({ onInterviewSaved }) => {
    const [exits, setExits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedExit, setSelectedExit] = useState(null);
    const [form, setForm] = useState(BLANK_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const res = await offboardingService.getAllExits();
            if (res.success) {
                // Show exits that are in INTERVIEW stage or already have interview done
                setExits((res.data || []).filter(e => ['INTERVIEW', 'SETTLEMENT', 'COMPLETED'].includes(e.status)));
            }
        } catch { setError('Failed to load'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openInterview = async (exit) => {
        setSelectedExit(exit);
        setForm(BLANK_FORM);
        try {
            const res = await offboardingService.getInterview(exit.exit_id);
            if (res.success && res.data) {
                const d = res.data;
                setForm({
                    interview_date: d.interview_date || '',
                    reason_for_leaving: d.reason_for_leaving || '',
                    job_satisfaction: d.job_satisfaction || 0,
                    work_environment: d.work_environment || 0,
                    management: d.management || 0,
                    compensation: d.compensation || 0,
                    work_life_balance: d.work_life_balance || 0,
                    feedback: d.feedback || '',
                    suggestions: d.suggestions || '',
                    would_recommend: d.would_recommend || '',
                    would_rejoin: d.would_rejoin || '',
                    private_notes: d.private_notes || ''
                });
            }
        } catch { /* no interview yet */ }
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!selectedExit) return;
        setSubmitting(true);
        setError('');
        try {
            const res = await offboardingService.saveInterview(selectedExit.exit_id, form);
            if (res.success) {
                setSuccess('Interview saved successfully');
                setShowDialog(false);
                load();
                if (onInterviewSaved) onInterviewSaved();
            } else {
                setError(res.message || 'Failed to save');
            }
        } catch { setError('Failed to save interview'); }
        finally { setSubmitting(false); }
    };

    const avgRating = (f) => {
        const vals = [f.job_satisfaction, f.work_environment, f.management, f.compensation, f.work_life_balance].filter(Boolean);
        return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>Exit Interview Management</Typography>
                    <Typography variant="body2" color="text.secondary">Conduct exit interviews for employees in clearance-done stage</Typography>
                </Box>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} size="small">Refresh</Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 180px' }}>
                    <CardContent>
                        <Typography variant="h4" color="primary.main" fontWeight={700}>{exits.length}</Typography>
                        <Typography variant="body2" color="text.secondary">Pending Interviews</Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 180px' }}>
                    <CardContent>
                        <Typography variant="h4" color="success.main" fontWeight={700}>
                            {exits.filter(e => ['SETTLEMENT','COMPLETED'].includes(e.status)).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Completed</Typography>
                    </CardContent>
                </Card>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            {['Employee', 'Exit Type', 'Last Working Day', 'Status', 'Actions'].map(h => (
                                <TableCell key={h} sx={{ fontWeight: 600 }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                        ) : exits.length === 0 ? (
                            <TableRow><TableCell colSpan={5} align="center">No exits ready for interview</TableCell></TableRow>
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
                                <TableCell><Chip label={exit.exit_type} size="small" /></TableCell>
                                <TableCell>{exit.last_working_day ? new Date(exit.last_working_day).toLocaleDateString('en-IN') : '-'}</TableCell>
                                <TableCell>
                                    <Chip label={exit.status === 'INTERVIEW' ? 'Pending Interview' : 'Interview Done'}
                                        color={exit.status === 'INTERVIEW' ? 'warning' : 'success'} size="small" />
                                </TableCell>
                                <TableCell>
                                    <IconButton size="small" onClick={() => openInterview(exit)}><ViewIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Interview Dialog */}
            <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InterviewIcon />Exit Interview — {selectedExit?.employee_name}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        <AppDatePicker label="Interview Date" value={form.interview_date}
                            onChange={v => setForm(p => ({ ...p, interview_date: v }))} />
                        <Divider />
                        <TextField fullWidth label="Primary Reason for Leaving" multiline rows={2}
                            value={form.reason_for_leaving} onChange={e => setForm(p => ({ ...p, reason_for_leaving: e.target.value }))} />
                        <Divider />
                        <Typography variant="subtitle1" fontWeight={600}>Satisfaction Ratings</Typography>
                        {[
                            { key: 'job_satisfaction', label: 'Overall Job Satisfaction' },
                            { key: 'work_environment', label: 'Work Environment' },
                            { key: 'management', label: 'Management Support' },
                            { key: 'compensation', label: 'Compensation & Benefits' },
                            { key: 'work_life_balance', label: 'Work-Life Balance' }
                        ].map(item => (
                            <Box key={item.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ minWidth: 200 }}>{item.label}</Typography>
                                <Rating value={form[item.key]} onChange={(_, v) => setForm(p => ({ ...p, [item.key]: v }))} />
                            </Box>
                        ))}
                        <Divider />
                        <TextField fullWidth label="What did you like most?" multiline rows={2}
                            value={form.feedback} onChange={e => setForm(p => ({ ...p, feedback: e.target.value }))} />
                        <TextField fullWidth label="Suggestions for improvement" multiline rows={2}
                            value={form.suggestions} onChange={e => setForm(p => ({ ...p, suggestions: e.target.value }))} />
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <FormControl fullWidth>
                                <InputLabel>Would recommend company?</InputLabel>
                                <Select value={form.would_recommend} label="Would recommend company?"
                                    onChange={e => setForm(p => ({ ...p, would_recommend: e.target.value }))}>
                                    {['Yes', 'No', 'Maybe'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Would consider rejoining?</InputLabel>
                                <Select value={form.would_rejoin} label="Would consider rejoining?"
                                    onChange={e => setForm(p => ({ ...p, would_rejoin: e.target.value }))}>
                                    {['Yes', 'No', 'Maybe'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Divider />
                        <Alert severity="warning">HR Private Notes — confidential, only visible to HR.</Alert>
                        <TextField fullWidth label="Internal Notes" multiline rows={3}
                            value={form.private_notes} onChange={e => setForm(p => ({ ...p, private_notes: e.target.value }))} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDialog(false)}>Cancel</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={submitting}>
                        {submitting ? <CircularProgress size={20} /> : 'Save Interview'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ExitInterview;
