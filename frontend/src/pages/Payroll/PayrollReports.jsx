import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Button,
    FormControl, InputLabel, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Avatar, Stack, Alert, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import {
    Download as DownloadIcon, Print as PrintIcon,
    Refresh as RefreshIcon, Assessment as ReportIcon
} from '@mui/icons-material';
import payrollService from '../../services/payrollService';

const PayrollReports = () => {
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [salaryRegister, setSalaryRegister] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadPeriods();
    }, []);

    useEffect(() => {
        if (selectedPeriod) loadSalaryRegister();
    }, [selectedPeriod]);

    const loadPeriods = async () => {
        try {
            setLoading(true);
            const res = await payrollService.getPeriods();
            const data = res?.data || [];
            const processed = data.filter(p => ['CALCULATED', 'LOCKED', 'COMPLETED'].includes(p.status));
            setPeriods(processed);
            if (processed.length > 0) setSelectedPeriod(processed[0].period_id);
        } catch {
            setError('Failed to load periods');
        } finally {
            setLoading(false);
        }
    };

    const loadSalaryRegister = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await payrollService.getSalaryRegister(selectedPeriod);
            if (res?.success) setSalaryRegister(res.data || []);
            else setError(res?.message || 'Failed to load salary register');
        } catch {
            setError('Failed to load salary register');
        } finally {
            setLoading(false);
        }
    };

    const totalGross = salaryRegister.reduce((s, e) => s + (e.gross_salary || 0), 0);
    const totalDeductions = salaryRegister.reduce((s, e) => s + (e.total_deductions || 0), 0);
    const totalNet = salaryRegister.reduce((s, e) => s + (e.net_salary || 0), 0);

    if (loading && !salaryRegister.length) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>Payroll Reports</Typography>
                    <Typography variant="body2" color="text.secondary">Salary register and payroll breakdown</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Refresh">
                        <IconButton onClick={loadSalaryRegister} disabled={loading} size="small">
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} size="small">Print</Button>
                </Stack>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

            <Paper sx={{ p: 2, mb: 3 }}>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel>Payroll Period</InputLabel>
                    <Select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} label="Payroll Period">
                        {periods.map(p => (
                            <MenuItem key={p.period_id} value={p.period_id}>{p.period_name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 180px' }}>
                    <CardContent>
                        <Typography variant="h4" color="primary.main" fontWeight={700}>{salaryRegister.length}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Employees</Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 180px' }}>
                    <CardContent>
                        <Typography variant="h5" color="success.main" fontWeight={700}>₹{(totalGross / 1000).toFixed(1)}K</Typography>
                        <Typography variant="body2" color="text.secondary">Total Gross</Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 180px' }}>
                    <CardContent>
                        <Typography variant="h5" color="error.main" fontWeight={700}>₹{(totalDeductions / 1000).toFixed(1)}K</Typography>
                        <Typography variant="body2" color="text.secondary">Total Deductions</Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 180px' }}>
                    <CardContent>
                        <Typography variant="h5" color="info.main" fontWeight={700}>₹{(totalNet / 1000).toFixed(1)}K</Typography>
                        <Typography variant="body2" color="text.secondary">Net Payable</Typography>
                    </CardContent>
                </Card>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : salaryRegister.length > 0 ? (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="center">Days Worked</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Gross</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Deductions</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Net Salary</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {salaryRegister.map((emp, i) => (
                                <TableRow key={i} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                                                {(emp.employee_name || '?').charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>{emp.employee_name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{emp.employee_code}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{emp.department_name || 'N/A'}</TableCell>
                                    <TableCell>{emp.designation_name || 'N/A'}</TableCell>
                                    <TableCell align="center">{emp.days_worked}/{emp.days_in_month}</TableCell>
                                    <TableCell align="right">₹{(emp.gross_salary || 0).toLocaleString('en-IN')}</TableCell>
                                    <TableCell align="right" sx={{ color: 'error.main' }}>₹{(emp.total_deductions || 0).toLocaleString('en-IN')}</TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" fontWeight={600} color="success.main">
                                            ₹{(emp.net_salary || 0).toLocaleString('en-IN')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={emp.payment_status}
                                            color={emp.payment_status === 'PAID' ? 'success' : emp.payment_status === 'PENDING' ? 'warning' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Alert severity="info">No salary data found for this period.</Alert>
            )}
        </Box>
    );
};

export default PayrollReports;
