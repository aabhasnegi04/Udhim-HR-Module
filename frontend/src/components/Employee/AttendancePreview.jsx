import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, CircularProgress, Alert, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
    CheckCircle as PresentIcon, Cancel as AbsentIcon,
    Schedule as LateIcon, TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import attendanceService from '../../services/attendanceService';

const InfoItem = ({ icon, label, value, chip, chipColor }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {label}
            </Typography>
            {chip ? (
                <Box sx={{ mt: 0.5 }}>
                    <Chip label={value} color={chipColor || 'default'} size="small" sx={{ fontWeight: 500 }} />
                </Box>
            ) : (
                <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>{value ?? 'N/A'}</Typography>
            )}
        </Box>
    </Box>
);

const statusColor = (s) => {
    switch ((s || '').toUpperCase()) {
        case 'PRESENT': return 'success';
        case 'ABSENT':  return 'error';
        case 'LATE':    return 'warning';
        case 'WFH':     return 'info';
        default:        return 'default';
    }
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const fmtTime = (t) => t ? String(t).substring(0, 5) : '-';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const AttendancePreview = ({ employee }) => {
    const now = new Date();
    const [year, setYear]     = useState(now.getFullYear());
    const [month, setMonth]   = useState(now.getMonth() + 1);
    const [summary, setSummary] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        if (!employee?.employee_id) return;
        const load = async () => {
            setLoading(true); setError('');
            try {
                const sumRes = await attendanceService.getMonthlyAttendanceSummary(year, month, employee.employee_id);
                if (sumRes.success) {
                    const d = Array.isArray(sumRes.data) ? sumRes.data[0] : sumRes.data;
                    setSummary(d || null);
                }
                const start = `${year}-${String(month).padStart(2,'0')}-01`;
                const lastDay = new Date(year, month, 0).getDate();
                const end = `${year}-${String(month).padStart(2,'0')}-${lastDay}`;
                const recRes = await attendanceService.getAttendanceByDateRange(start, end, employee.employee_id);
                if (recRes.success) setRecords(Array.isArray(recRes.data) ? recRes.data : []);
            } catch { setError('Failed to load attendance data'); }
            finally { setLoading(false); }
        };
        load();
    }, [employee, year, month]);

    if (!employee) return null;

    const present = summary?.present_days ?? summary?.total_present ?? 0;
    const absent  = summary?.absent_days  ?? summary?.total_absent  ?? 0;
    const late    = summary?.late_days    ?? summary?.total_late    ?? 0;
    const total   = summary?.total_days   ?? summary?.working_days  ?? 0;
    const rate    = total > 0 ? Math.round((present / total) * 100) : 0;

    return (
        <Box sx={{ mt: 3 }}>
            {/* Month/Year Selector */}
            <Paper sx={{ p: 4, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                    Select Period
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Month</InputLabel>
                        <Select value={month} label="Month" onChange={e => setMonth(e.target.value)}>
                            {MONTHS.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Year</InputLabel>
                        <Select value={year} label="Year" onChange={e => setYear(e.target.value)}>
                            {[now.getFullYear() - 1, now.getFullYear()].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : (
                <>
                    {/* Summary */}
                    <Paper sx={{ p: 4, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                            Monthly Summary — {MONTHS[month - 1]} {year}
                        </Typography>
                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <InfoItem icon={<PresentIcon />} label="Days Present" value={present} />
                                <InfoItem icon={<AbsentIcon />}  label="Days Absent"  value={absent} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <InfoItem icon={<LateIcon />}       label="Late Arrivals"    value={late} />
                                <InfoItem icon={<TrendingUpIcon />} label="Attendance Rate"  value={`${rate}%`} chip chipColor={rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'error'} />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Records Table */}
                    <Paper sx={{ p: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                            Attendance Records
                        </Typography>
                        {records.length === 0 ? (
                            <Typography color="text.secondary" sx={{ py: 2 }}>No attendance records found for this period</Typography>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Check In</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Check Out</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {records.map((r, i) => (
                                            <TableRow key={i} hover>
                                                <TableCell>{fmt(r.attendance_date || r.date)}</TableCell>
                                                <TableCell>
                                                    <Chip label={r.status || r.status_code} color={statusColor(r.status || r.status_code)} size="small" sx={{ fontWeight: 500 }} />
                                                </TableCell>
                                                <TableCell>{fmtTime(r.check_in || r.first_check_in)}</TableCell>
                                                <TableCell>{fmtTime(r.check_out || r.last_check_out)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </>
            )}
        </Box>
    );
};

export default AttendancePreview;
