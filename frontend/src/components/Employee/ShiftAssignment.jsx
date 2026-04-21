import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, MenuItem, TextField,
    Alert, Chip, CircularProgress, Divider, Dialog,
    DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Schedule as ShiftIcon, DeleteOutline as RemoveIcon } from '@mui/icons-material';
import ApiService from '../../services/api';

const ShiftAssignment = ({ employee }) => {
    const [shifts, setShifts] = useState([]);
    const [currentAssignment, setCurrentAssignment] = useState(null);
    const [selectedShift, setSelectedShift] = useState('');
    const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => { fetchData(); }, [employee?.employee_id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [shiftsRes, assignmentRes] = await Promise.all([
                ApiService.get('/attendance/shifts'),
                ApiService.get(`/attendance/shifts/employee/${employee.employee_id}`)
            ]);
            if (shiftsRes.success) setShifts(shiftsRes.data?.shifts || []);
            if (assignmentRes.success) {
                setCurrentAssignment(assignmentRes.data?.assignment || null);
                if (assignmentRes.data?.assignment?.shift_id) {
                    setSelectedShift(assignmentRes.data.assignment.shift_id);
                }
            }
        } catch (e) {
            setError('Failed to load shift data');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedShift) { setError('Please select a shift'); return; }
        setSaving(true);
        setError('');
        try {
            const res = await ApiService.post('/attendance/shifts/assign', {
                employee_id: employee.employee_id,
                shift_id: selectedShift,
                effective_from: effectiveFrom,
            });
            if (res.success) {
                setSuccess('Shift assigned successfully');
                fetchData();
            } else {
                setError(res.error || 'Failed to assign shift');
            }
        } catch (e) {
            setError('Failed to assign shift');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async () => {
        setRemoving(true);
        setConfirmRemove(false);
        setError('');
        try {
            const res = await ApiService.post('/attendance/shifts/remove', {
                employee_id: employee.employee_id,
            });
            if (res.success) {
                setSuccess('Shift removed successfully');
                setCurrentAssignment(null);
                setSelectedShift('');
                fetchData();
            } else {
                setError(res.error || 'Failed to remove shift');
            }
        } catch (e) {
            setError('Failed to remove shift');
        } finally {
            setRemoving(false);
        }
    };

    if (loading) return <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>;

    const currentShift = shifts.find(s => s.shift_id === currentAssignment?.shift_id);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} color="primary" sx={{ mb: 3 }}>
                Shift Assignment
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>
                        Current Shift
                    </Typography>
                    {currentShift && (
                        <Button size="small" color="error" startIcon={<RemoveIcon />}
                            onClick={() => setConfirmRemove(true)} disabled={removing}>
                            Remove Shift
                        </Button>
                    )}
                </Box>
                {currentShift ? (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Shift Name</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <ShiftIcon color="primary" fontSize="small" />
                                <Typography fontWeight={600}>{currentShift.shift_name}</Typography>
                                <Chip label={currentShift.is_night_shift ? 'Night' : 'Day'} color={currentShift.is_night_shift ? 'default' : 'primary'} size="small" />
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Timing</Typography>
                            <Typography sx={{ mt: 0.5 }}>{currentShift.start_time?.slice(0, 5)} – {currentShift.end_time?.slice(0, 5)}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Grace Period</Typography>
                            <Typography sx={{ mt: 0.5 }}>{currentShift.checkin_grace_minutes} min check-in / {currentShift.checkout_grace_minutes} min check-out</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Half Day Minimum</Typography>
                            <Typography sx={{ mt: 0.5 }}>{currentShift.half_day_minimum_hours} hours</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Overtime Buffer</Typography>
                            <Typography sx={{ mt: 0.5 }}>{currentShift.overtime_buffer_minutes} min after shift end</Typography>
                        </Box>
                        {currentAssignment?.effective_from && (
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Assigned Since</Typography>
                                <Typography sx={{ mt: 0.5 }}>
                                    {new Date(currentAssignment.effective_from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary">No shift assigned yet</Typography>
                )}
            </Paper>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>
                {currentShift ? 'Change Shift' : 'Assign Shift'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <TextField select label="Select Shift" value={selectedShift}
                    onChange={e => setSelectedShift(e.target.value)} size="small" sx={{ minWidth: 220 }}>
                    {shifts.map(s => (
                        <MenuItem key={s.shift_id} value={s.shift_id}>
                            {s.shift_name} ({s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)})
                        </MenuItem>
                    ))}
                </TextField>
                <TextField label="Effective From" type="date" value={effectiveFrom}
                    onChange={e => setEffectiveFrom(e.target.value)} size="small"
                    InputLabelProps={{ shrink: true }} />
                <Button variant="contained" onClick={handleAssign} disabled={saving || !selectedShift}>
                    {saving ? 'Saving...' : 'Assign'}
                </Button>
            </Box>

            <Dialog open={confirmRemove} onClose={() => setConfirmRemove(false)}>
                <DialogTitle>Remove Shift Assignment</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to remove the shift assignment for this employee?
                        Their attendance will no longer be processed using factory shift rules.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmRemove(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={handleRemove}>Remove</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ShiftAssignment;
