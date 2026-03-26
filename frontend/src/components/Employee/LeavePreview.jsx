import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, LinearProgress, CircularProgress, Alert, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { BeachAccess as LeaveIcon, EventBusy as UsedIcon } from '@mui/icons-material';
import leaveService from '../../services/leaveService';

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
                <Box sx={{ mt: 0.5 }}><Chip label={value} color={chipColor || 'default'} size="small" sx={{ fontWeight: 500 }} /></Box>
            ) : (
                <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>{value ?? 'N/A'}</Typography>
            )}
        </Box>
    </Box>
);

const statusColor = (s) => {
    switch ((s || '').toUpperCase()) {
        case 'HR_APPROVED':      return 'success';
        case 'MANAGER_APPROVED': return 'info';
        case 'PENDING':          return 'warning';
        case 'REJECTED':         return 'error';
        case 'CANCELLED':        return 'default';
        default:                 return 'default';
    }
};
const statusLabel = (s) => {
    const map = { HR_APPROVED: 'Approved', MANAGER_APPROVED: 'Mgr Approved', PENDING: 'Pending', REJECTED: 'Rejected', CANCELLED: 'Cancelled' };
    return map[(s || '').toUpperCase()] || s;
};
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const LeavePreview = ({ employee }) => {
    const [balances, setBalances] = useState([]);
    const [history, setHistory]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [year, setYear]         = useState(new Date().getFullYear());

    useEffect(() => {
        if (!employee?.employee_id) return;
        const load = async () => {
            setLoading(true); setError('');
            try {
                const [balRes, histRes] = await Promise.all([
                    leaveService.getLeaveBalances(employee.employee_id, year),
                    leaveService.getEmployeeLeaves(employee.employee_id, year),
                ]);
                if (balRes.success)  setBalances(Array.isArray(balRes.data)  ? balRes.data  : []);
                if (histRes.success) setHistory(Array.isArray(histRes.data) ? histRes.data : []);
                if (!balRes.success && !histRes.success) setError('Failed to load leave data');
            } catch { setError('Failed to load leave data'); }
            finally { setLoading(false); }
        };
        load();
    }, [employee, year]);

    if (!employee) return null;

    return (
        <Box sx={{ mt: 3 }}>
            {/* Year selector */}
            <Paper sx={{ p: 4, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>Select Year</Typography>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Year</InputLabel>
                    <Select value={year} label="Year" onChange={e => setYear(e.target.value)}>
                        {[new Date().getFullYear() - 1, new Date().getFullYear()].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                    </Select>
                </FormControl>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : (
                <>
                    {/* Leave Balances */}
                    <Paper sx={{ p: 4, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                            Leave Balance — {year}
                        </Typography>
                        {balances.length === 0 ? (
                            <Typography color="text.secondary">No leave balances allocated for {year}</Typography>
                        ) : (
                            <Grid container spacing={4}>
                                {balances.map((b, i) => {
                                    const used  = b.used_days ?? b.days_used ?? 0;
                                    const total = b.total_allocated ?? b.total_days ?? 0;
                                    const remaining = total - used;
                                    const pct = total > 0 ? Math.round((used / total) * 100) : 0;
                                    return (
                                        <Grid size={{ xs: 12, md: 6 }} key={b.balance_id || i}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1 }}>
                                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <LeaveIcon />
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        {b.leave_type_name || b.leave_type}
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                                                        {remaining} of {total} days remaining
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 0.5 }}>
                                                        <Typography variant="caption" color="text.secondary">Used: {used}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{pct}%</Typography>
                                                    </Box>
                                                    <LinearProgress variant="determinate" value={pct}
                                                        sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 3 } }} />
                                                </Box>
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        )}
                    </Paper>

                    {/* Leave History */}
                    <Paper sx={{ p: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                            Leave History — {year}
                        </Typography>
                        {history.length === 0 ? (
                            <Typography color="text.secondary" sx={{ py: 2 }}>No leave records found for {year}</Typography>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                                            <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>From</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>To</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Days</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {history.map((l, i) => (
                                            <TableRow key={l.request_id || i} hover>
                                                <TableCell sx={{ fontWeight: 500 }}>{l.leave_type_name || l.leave_type}</TableCell>
                                                <TableCell>{fmt(l.start_date || l.from_date)}</TableCell>
                                                <TableCell>{fmt(l.end_date || l.to_date)}</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>{l.total_days ?? l.days}</TableCell>
                                                <TableCell>
                                                    <Chip label={statusLabel(l.status)} color={statusColor(l.status)} size="small" sx={{ fontWeight: 500 }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">{l.reason || '-'}</Typography>
                                                </TableCell>
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

export default LeavePreview;
