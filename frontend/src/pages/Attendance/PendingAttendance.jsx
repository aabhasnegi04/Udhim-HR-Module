import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Alert,
    CircularProgress, Button, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions
} from '@mui/material';
import { Warning as WarningIcon, Edit as EditIcon } from '@mui/icons-material';
import ApiService from '../../services/api';
import attendanceService from '../../services/attendanceService';

const PendingAttendance = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editRow, setEditRow] = useState(null);
    const [checkoutTime, setCheckoutTime] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await ApiService.get('/attendance/factory/pending?days_back=60');
            if (res.success) setRecords(res.data?.pending || []);
            else setError('Failed to load pending records');
        } catch { setError('Failed to load pending records'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPending(); }, []);

    const handleFix = async () => {
        if (!checkoutTime || !editRow) return;
        setSaving(true);
        try {
            const date = editRow.attendance_date?.split('T')[0] || editRow.attendance_date;
            const result = await attendanceService.editAttendanceRecord(editRow.attendance_id, {
                employee_id: editRow.employee_id,
                attendance_date: date,
                status: 'PRESENT',
                check_in_time: editRow.first_check_in
                    ? new Date(editRow.first_check_in).toTimeString().slice(0, 8)
                    : null,
                check_out_time: checkoutTime + ':00',
            });
            if (result.success) {
                setSuccess(`Fixed attendance for ${editRow.employee_name} on ${date}`);
                setEditRow(null);
                setCheckoutTime('');
                fetchPending();
            } else {
                setError(result.error || 'Failed to fix record');
            }
        } catch { setError('Failed to fix record'); }
        finally { setSaving(false); }
    };

    const fmt = (dt) => {
        if (!dt) return '—';
        return new Date(dt).toTimeString().slice(0, 5);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <WarningIcon color="warning" />
                <Typography variant="h6" fontWeight={600}>Pending Attendance Corrections</Typography>
                {records.length > 0 && (
                    <Chip label={`${records.length} pending`} color="warning" size="small" />
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
            ) : records.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No pending records. All attendance is complete.</Typography>
                </Paper>
            ) : (
                <>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        These employees have only one punch recorded (check-in only). HR needs to manually enter the check-out time.
                    </Alert>
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Employee</TableCell>
                                    <TableCell>Department</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Check-in</TableCell>
                                    <TableCell>Check-out</TableCell>
                                    <TableCell>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {records.map((row, i) => (
                                    <TableRow key={i} sx={{ bgcolor: 'warning.50' }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{row.employee_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{row.employee_code}</Typography>
                                        </TableCell>
                                        <TableCell>{row.department || '—'}</TableCell>
                                        <TableCell>{row.attendance_date?.split('T')[0] || row.attendance_date}</TableCell>
                                        <TableCell>{fmt(row.first_check_in)}</TableCell>
                                        <TableCell><Chip label="Missing" color="warning" size="small" /></TableCell>
                                        <TableCell>
                                            <Button size="small" variant="outlined" startIcon={<EditIcon />}
                                                onClick={() => { setEditRow(row); setCheckoutTime(''); }}>
                                                Fix
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {/* Fix Dialog */}
            <Dialog open={!!editRow} onClose={() => setEditRow(null)}>
                <DialogTitle>Enter Check-out Time</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {editRow?.employee_name} — {editRow?.attendance_date?.split('T')[0]}
                        <br />Check-in: {fmt(editRow?.first_check_in)}
                    </Typography>
                    <TextField
                        label="Check-out Time"
                        type="time"
                        value={checkoutTime}
                        onChange={e => setCheckoutTime(e.target.value)}
                        fullWidth size="small"
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditRow(null)}>Cancel</Button>
                    <Button variant="contained" onClick={handleFix} disabled={saving || !checkoutTime}>
                        {saving ? 'Saving...' : 'Save & Recalculate'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PendingAttendance;
