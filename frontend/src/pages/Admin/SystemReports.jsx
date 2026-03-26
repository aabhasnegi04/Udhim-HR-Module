import { useState, useEffect } from 'react';
import AppDatePicker from '../../components/common/AppDatePicker';
import {
    Box, Typography, Paper, Button, Card, CardContent,
    FormControl, InputLabel, Select, MenuItem,
    Stack, Alert, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, CircularProgress,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Assessment as ReportIcon,
    People as PeopleIcon,
    Schedule as AttendanceIcon,
    BeachAccess as LeaveIcon,
} from '@mui/icons-material';
import adminService from '../../services/adminService';

const REPORT_TYPES = [
    {
        id: 'employee-master',
        title: 'Employee Master Report',
        description: 'Complete employee database with personal and official information',
        icon: <PeopleIcon />,
        category: 'Employee',
        color: 'primary',
    },
    {
        id: 'attendance-summary',
        title: 'Attendance Summary Report',
        description: 'Monthly attendance summary with present, absent, late and WFH days',
        icon: <AttendanceIcon />,
        category: 'Attendance',
        color: 'success',
    },
    {
        id: 'leave-summary',
        title: 'Leave Summary Report',
        description: 'Leave balance, taken, and pending leave requests by employee',
        icon: <LeaveIcon />,
        category: 'Leave',
        color: 'warning',
    },
];

const SystemReports = () => {
    const [selectedReport, setSelectedReport] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [department, setDepartment] = useState('');
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    // Generated report history (in-session, not persisted)
    const [reportHistory, setReportHistory] = useState([]);

    useEffect(() => {
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        try {
            const result = await adminService.getDepartments();
            if (result.success && result.data) {
                setDepartments(result.data.map(d => d.department_name));
            }
        } catch { /* non-critical */ }
    };

    const downloadCSV = (data, reportType) => {
        if (!data?.length) return;
        
        // Define explicit column order for each report type
        const columnOrders = {
            'attendance-summary': ['employee_code', 'employee_name', 'department', 'present_days', 'wfh_days', 'late_days', 'absent_days', 'total_days'],
            'employee-master': ['employee_id', 'employee_code', 'first_name', 'last_name', 'email', 'phone', 'department', 'designation', 'date_of_joining', 'status', 'work_location', 'gender', 'date_of_birth', 'created_at'],
            'leave-summary': ['employee_code', 'employee_name', 'department', 'leave_name', 'total_allocated', 'used', 'remaining', 'total_requests', 'approved_requests', 'pending_requests'],
        };
        
        // Use defined order if available, otherwise fall back to object keys
        const headers = columnOrders[reportType] || Object.keys(data[0]);
        
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(h => {
                    const v = row[h];
                    if (v === null || v === undefined) return '';
                    const s = String(v);
                    return (s.includes(',') || s.includes('"') || s.includes('\n'))
                        ? `"${s.replace(/"/g, '""')}"` : s;
                }).join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleGenerateReport = async () => {
        if (!selectedReport) { setError('Please select a report type'); return; }
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const filters = {};
            if (dateRange.from) filters.date_from = dateRange.from;
            if (dateRange.to)   filters.date_to   = dateRange.to;
            if (department && department !== 'All Departments') filters.department = department;

            const result = await adminService.generateSystemReport(selectedReport, filters);

            if (result.success) {
                const data = Array.isArray(result.data) ? result.data : [];
                setSuccess(`Report generated — ${data.length} records found.`);

                const reportMeta = REPORT_TYPES.find(r => r.id === selectedReport);
                const entry = {
                    id: Date.now(),
                    name: `${reportMeta?.title} — ${new Date().toLocaleDateString()}`,
                    type: reportMeta?.category || selectedReport,
                    generatedAt: new Date().toISOString(),
                    records: data.length,
                    filters: { ...filters },
                    data,
                };
                setReportHistory(prev => [entry, ...prev]);

                if (data.length > 0) downloadCSV(data, selectedReport);
            } else {
                setError(result.error || 'Failed to generate report');
            }
        } catch (err) {
            setError('Failed to generate report: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRedownload = (entry) => {
        downloadCSV(entry.data, entry.type.toLowerCase().replace(' ', '-'));
    };

    return (
        <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
                Generate data exports for analysis and compliance. Reports download as CSV automatically.
            </Alert>

            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
            {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            {/* Generate Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'primary.light', color: 'primary.main', mr: 2 }}>
                            <ReportIcon />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={600}>Generate New Report</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Select a report type and optional filters, then generate
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <Box sx={{ flex: '2 1 300px', minWidth: 300 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Report Type</InputLabel>
                                <Select value={selectedReport} onChange={e => setSelectedReport(e.target.value)} label="Report Type">
                                    {REPORT_TYPES.map(r => (
                                        <MenuItem key={r.id} value={r.id} sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                                <Box sx={{ color: `${r.color}.main`, display: 'flex', flexShrink: 0 }}>{r.icon}</Box>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>{r.title}</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'normal', lineHeight: 1.3 }}>
                                                        {r.description}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ flex: '1 1 160px', minWidth: 160 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Department</InputLabel>
                                <Select value={department} onChange={e => setDepartment(e.target.value)} label="Department">
                                    <MenuItem value="">All Departments</MenuItem>
                                    {departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ flex: '0 1 160px', minWidth: 160 }}>
                            <AppDatePicker label="From Date" size="small" value={dateRange.from}
                                onChange={v => setDateRange(p => ({ ...p, from: v }))} />
                        </Box>

                        <Box sx={{ flex: '0 1 160px', minWidth: 160 }}>
                            <AppDatePicker label="To Date" size="small" value={dateRange.to}
                                onChange={v => setDateRange(p => ({ ...p, to: v }))} />
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ReportIcon />}
                            onClick={handleGenerateReport}
                            disabled={!selectedReport || loading}
                            sx={{ height: 40, px: 3, whiteSpace: 'nowrap' }}
                        >
                            {loading ? 'Generating...' : 'Generate & Download'}
                        </Button>

                        {selectedReport && (
                            <Button variant="outlined" onClick={() => { setSelectedReport(''); setDateRange({ from: '', to: '' }); setDepartment(''); }}
                                sx={{ height: 40 }}>
                                Clear
                            </Button>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {/* Report Type Cards */}
            <Paper sx={{ mb: 3 }}>
                <Box sx={{ p: 3, pb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>Available Report Types</Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, p: 3, pt: 1.5 }}>
                    {REPORT_TYPES.map(r => (
                        <Card
                            key={r.id}
                            variant="outlined"
                            onClick={() => setSelectedReport(r.id)}
                            sx={{
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                '&:hover': { boxShadow: 2, borderColor: `${r.color}.main` },
                                ...(selectedReport === r.id && { borderColor: `${r.color}.main`, bgcolor: `${r.color}.50` }),
                            }}
                        >
                            <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 1, bgcolor: `${r.color}.light`, color: `${r.color}.main` }}>
                                        {r.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={600}>{r.title}</Typography>
                                        <Chip label={r.category} color={r.color} size="small" />
                                    </Box>
                                </Box>
                                <Typography variant="body2" color="text.secondary">{r.description}</Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </Paper>

            {/* Generated Reports History */}
            <Paper>
                <Box sx={{ p: 3, pb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>Generated This Session</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Reports generated during this session — re-download anytime
                    </Typography>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                {['Report Name', 'Type', 'Records', 'Generated At', 'Filters', ''].map(h => (
                                    <TableCell key={h}><Typography variant="caption" fontWeight={600}>{h}</Typography></TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reportHistory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                                            No reports generated yet. Generate your first report above.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : reportHistory.map(entry => (
                                <TableRow key={entry.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>{entry.name}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={entry.type} variant="outlined" size="small" />
                                    </TableCell>
                                    <TableCell>{entry.records}</TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(entry.generatedAt).toLocaleTimeString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {entry.filters.department || 'All depts'}
                                            {entry.filters.date_from ? ` · ${entry.filters.date_from}` : ''}
                                            {entry.filters.date_to   ? ` → ${entry.filters.date_to}` : ''}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button size="small" startIcon={<DownloadIcon />}
                                            onClick={() => handleRedownload(entry)}
                                            disabled={entry.records === 0}>
                                            Download
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default SystemReports;
