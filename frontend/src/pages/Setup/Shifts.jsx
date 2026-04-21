import { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Switch, FormControlLabel,
    Alert, Chip, IconButton, CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import ApiService from '../../services/api';

const defaultForm = {
    shift_name: '',
    start_time: '08:00',
    end_time: '20:00',
    is_night_shift: false,
    checkin_grace_minutes: 15,
    checkout_grace_minutes: 15,
    half_day_minimum_hours: 6,
    overtime_buffer_minutes: 60,
};

const Shifts = () => {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingShift, setEditingShift] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchShifts = async () => {
        setLoading(true);
        try {
            const res = await ApiService.get('/attendance/shifts');
            if (res.success) setShifts(res.data?.shifts || []);
        } catch (e) {
            setError('Failed to load shifts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchShifts(); }, []);

    const openAdd = () => {
        setEditingShift(null);
        setForm(defaultForm);
        setError('');
        setDialogOpen(true);
    };

    const openEdit = (shift) => {
        setEditingShift(shift);
        setForm({
            shift_name: shift.shift_name,
            start_time: shift.start_time?.slice(0, 5) || '08:00',
            end_time: shift.end_time?.slice(0, 5) || '20:00',
            is_night_shift: !!shift.is_night_shift,
            checkin_grace_minutes: shift.checkin_grace_minutes,
            checkout_grace_minutes: shift.checkout_grace_minutes,
            half_day_minimum_hours: shift.half_day_minimum_hours,
            overtime_buffer_minutes: shift.overtime_buffer_minutes,
        });
        setError('');
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.shift_name.trim()) { setError('Shift name is required'); return; }
        setSaving(true);
        setError('');
        try {
            const payload = { ...form, is_night_shift: form.is_night_shift ? 1 : 0 };
            let res;
            if (editingShift) {
                res = await ApiService.put(`/attendance/shifts/${editingShift.shift_id}`, payload);
            } else {
                res = await ApiService.post('/attendance/shifts', payload);
            }
            if (res.success) {
                setSuccess(editingShift ? 'Shift updated' : 'Shift created');
                setDialogOpen(false);
                fetchShifts();
            } else {
                setError(res.error || 'Failed to save shift');
            }
        } catch (e) {
            setError('Failed to save shift');
        } finally {
            setSaving(false);
        }
    };

    const field = (key, label, type = 'text', extra = {}) => (
        <TextField
            key={key}
            label={label}
            type={type}
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            InputLabelProps={type === 'time' ? { shrink: true } : undefined}
            {...extra}
        />
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>Shift Definitions</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Configure work shifts, grace periods and overtime rules
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
                    Add Shift
                </Button>
            </Box>

            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
            {error && !dialogOpen && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Shift Name</TableCell>
                                <TableCell>Start</TableCell>
                                <TableCell>End</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Grace In</TableCell>
                                <TableCell>Grace Out</TableCell>
                                <TableCell>Half Day Min</TableCell>
                                <TableCell>OT Buffer</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {shifts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No shifts configured yet
                                    </TableCell>
                                </TableRow>
                            ) : shifts.map(s => (
                                <TableRow key={s.shift_id}>
                                    <TableCell><strong>{s.shift_name}</strong></TableCell>
                                    <TableCell>{s.start_time?.slice(0, 5)}</TableCell>
                                    <TableCell>{s.end_time?.slice(0, 5)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={s.is_night_shift ? 'Night' : 'Day'}
                                            color={s.is_night_shift ? 'default' : 'primary'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{s.checkin_grace_minutes} min</TableCell>
                                    <TableCell>{s.checkout_grace_minutes} min</TableCell>
                                    <TableCell>{s.half_day_minimum_hours} hrs</TableCell>
                                    <TableCell>{s.overtime_buffer_minutes} min</TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={() => openEdit(s)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingShift ? 'Edit Shift' : 'Add Shift'}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {field('shift_name', 'Shift Name')}
                    {field('start_time', 'Start Time', 'time')}
                    {field('end_time', 'End Time', 'time')}
                    {field('checkin_grace_minutes', 'Check-in Grace (minutes)', 'number')}
                    {field('checkout_grace_minutes', 'Check-out Grace (minutes)', 'number')}
                    {field('half_day_minimum_hours', 'Half Day Minimum Hours', 'number')}
                    {field('overtime_buffer_minutes', 'Overtime Buffer (minutes after shift end)', 'number')}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={form.is_night_shift}
                                onChange={e => setForm(f => ({ ...f, is_night_shift: e.target.checked }))}
                            />
                        }
                        label="Night Shift (crosses midnight)"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Shifts;
