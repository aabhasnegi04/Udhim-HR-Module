import { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Button, MenuItem,
    FormControl, InputLabel, Select, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Avatar, IconButton,
    Stack, Dialog, DialogTitle, DialogContent, DialogActions,
    Divider, Grid, CircularProgress, Alert
} from '@mui/material';
import {
    Download as DownloadIcon, Visibility as ViewIcon,
    Print as PrintIcon, Refresh as RefreshIcon, Receipt as PayslipIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { useProfileSwitching } from '../../context/ProfileSwitchingContext';
import payrollService from '../../services/payrollService';
import api from '../../services/api';
import { generatePayslipPDF } from '../../utils/generatePayslipPDF';

// ── shared payslip body renderer ──────────────────────────────────────────
const PayslipBody = ({ payslipData }) => {
    if (!payslipData) return null;
    const { employee_details, earnings = [], deductions = [], adjustments = [] } = payslipData;
    const totalEarnings = earnings.reduce((s, i) => s + (parseFloat(i.calculated_amount) || 0), 0);
    const totalDeductions = deductions.reduce((s, i) => s + (parseFloat(i.calculated_amount) || 0), 0);
    const adjEarn = adjustments.filter(a => a.calculated_amount > 0).reduce((s, a) => s + parseFloat(a.calculated_amount), 0);
    const adjDed  = adjustments.filter(a => a.calculated_amount < 0).reduce((s, a) => s + Math.abs(parseFloat(a.calculated_amount)), 0);
    const netPay  = totalEarnings + adjEarn - totalDeductions - adjDed;

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 3, pb: 2, borderBottom: 2, borderColor: 'primary.main' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>UDHIM TECHNOLOGIES</Typography>
                <Typography variant="body2" color="text.secondary">Salary Slip for {employee_details?.period_name}</Typography>
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    ['Employee Name', employee_details?.employee_name],
                    ['Employee Code', employee_details?.employee_code],
                    ['Department',    employee_details?.department],
                    ['Designation',   employee_details?.designation],
                ].map(([label, val]) => (
                    <Grid key={label} size={6}>
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                        <Typography variant="body1" fontWeight={600}>{val}</Typography>
                    </Grid>
                ))}
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
                {/* Earnings */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>Earnings</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {earnings.map((item, i) => (
                            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">{item.component_name}</Typography>
                                <Typography variant="body2" fontWeight={600}>₹{(parseFloat(item.calculated_amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                            </Box>
                        ))}
                        {adjustments.filter(a => a.calculated_amount > 0).map((item, i) => (
                            <Box key={`ae-${i}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="body2" color="success.dark">{item.component_name}</Typography>
                                    <Chip label={item.adjustment_type} size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />
                                </Box>
                                <Typography variant="body2" fontWeight={600} color="success.dark">₹{parseFloat(item.calculated_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                            </Box>
                        ))}
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body1" fontWeight={600}>Total Earnings</Typography>
                            <Typography variant="body1" fontWeight={700} color="success.main">₹{(totalEarnings + adjEarn).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                        </Box>
                    </Box>
                </Grid>
                {/* Deductions */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>Deductions</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {deductions.map((item, i) => (
                            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">{item.component_name}</Typography>
                                <Typography variant="body2" fontWeight={600}>₹{(parseFloat(item.calculated_amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                            </Box>
                        ))}
                        {adjustments.filter(a => a.calculated_amount < 0).map((item, i) => (
                            <Box key={`ad-${i}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="body2" color="error.dark">{item.component_name}</Typography>
                                    <Chip label={item.adjustment_type} size="small" color="error" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />
                                </Box>
                                <Typography variant="body2" fontWeight={600} color="error.dark">₹{Math.abs(parseFloat(item.calculated_amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                            </Box>
                        ))}
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body1" fontWeight={600}>Total Deductions</Typography>
                            <Typography variant="body1" fontWeight={700} color="error.main">₹{(totalDeductions + adjDed).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                <Typography variant="body1" color="primary.contrastText">Net Salary</Typography>
                <Typography variant="h4" fontWeight={700} color="primary.contrastText">₹{netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
            </Box>
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">This is a computer-generated payslip and does not require a signature.</Typography>
            </Box>
        </Box>
    );
};

// ── Employee self-service view ────────────────────────────────────────────
const EmployeePayslips = ({ periods, getCompanyInfo }) => {
    const [selectedPeriod, setSelectedPeriod] = useState(periods[0]?.period_id || '');
    const [payslipData, setPayslipData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (selectedPeriod) fetchPayslip(selectedPeriod);
    }, [selectedPeriod]);

    const fetchPayslip = async (periodId) => {
        setLoading(true);
        setError('');
        setPayslipData(null);
        const res = await api.get(`/payroll/my-payslip?period_id=${periodId}`);
        if (res?.success) setPayslipData(res.data);
        else setError(res?.message || 'No payslip found for this period');
        setLoading(false);
    };

    const handleDownload = async () => {
        if (!payslipData) return;
        setDownloading(true);
        try { await generatePayslipPDF(payslipData, getCompanyInfo()); }
        catch { setError('Failed to generate PDF'); }
        finally { setDownloading(false); }
    };

    return (
        <Box>
            {/* Period selector + download */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Pay Period</InputLabel>
                    <Select value={selectedPeriod} label="Pay Period" onChange={e => setSelectedPeriod(e.target.value)}>
                        {periods.map(p => <MenuItem key={p.period_id} value={p.period_id}>{p.period_name}</MenuItem>)}
                    </Select>
                </FormControl>
                <Button
                    variant="contained"
                    startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                    onClick={handleDownload}
                    disabled={!payslipData || downloading}
                >
                    Download PDF
                </Button>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} disabled={!payslipData}>
                    Print
                </Button>
            </Paper>

            {error && <Alert severity="info" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}><CircularProgress /></Box>
            ) : payslipData ? (
                <Paper sx={{ p: 1 }}>
                    <PayslipBody payslipData={payslipData} />
                </Paper>
            ) : !error ? (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <PayslipIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography color="text.secondary">Select a pay period to view your payslip</Typography>
                </Paper>
            ) : null}
        </Box>
    );
};

// ── Main Payslips component ───────────────────────────────────────────────
const Payslips = () => {
    const { user } = useContext(AuthContext);
    const { currentView } = useProfileSwitching();
    // Treat as employee whenever in EMPLOYEE view — even if actual role is HR
    const isEmployee = currentView === 'EMPLOYEE';

    const [periods, setPeriods] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [payslipData, setPayslipData] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => { loadData(); }, []);

    const getCompanyInfo = () => {
        try {
            const u = JSON.parse(sessionStorage.getItem('hrms_user') || '{}');
            return { name: u.company_name || u.company_code || 'Your Company Pvt. Ltd.' };
        } catch { return { name: 'Your Company Pvt. Ltd.' }; }
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await payrollService.getPeriods();
            if (res.success && res.data.length > 0) {
                const processed = res.data.filter(p => ['CALCULATED', 'LOCKED', 'COMPLETED'].includes(p.status));
                setPeriods(processed);
                if (processed.length > 0 && !isEmployee) {
                    setSelectedPeriod(processed[0].period_id);
                    await loadEmployeesForPeriod(processed[0].period_id);
                }
            }
        } catch { setError('Failed to load data'); }
        finally { setLoading(false); }
    };

    const loadEmployeesForPeriod = async (periodId) => {
        try {
            const res = await payrollService.getPayrollSummary(periodId);
            if (res.success) setEmployees(res.data || []);
        } catch {}
    };

    const handlePeriodChange = async (periodId) => {
        setSelectedPeriod(periodId);
        setSelectedEmployee('all');
        await loadEmployeesForPeriod(periodId);
    };

    const handleViewPayslip = async (employeeId) => {
        if (!selectedPeriod) return;
        setLoading(true);
        const res = await payrollService.getEmployeePayslip(employeeId, selectedPeriod);
        if (res.success) { setPayslipData(res.data); setShowDialog(true); }
        else setError(res.message || 'Failed to load payslip');
        setLoading(false);
    };

    const handleDownloadPayslip = async (employeeId) => {
        if (!selectedPeriod) return;
        setDownloadingId(employeeId);
        try {
            const res = await payrollService.getEmployeePayslip(employeeId, selectedPeriod);
            if (res.success && res.data) await generatePayslipPDF(res.data, getCompanyInfo());
            else setError(res.message || 'Failed to generate payslip');
        } catch { setError('Failed to generate payslip PDF'); }
        finally { setDownloadingId(null); }
    };

    const filteredEmployees = selectedEmployee === 'all'
        ? employees
        : employees.filter(e => e.employee_id === parseInt(selectedEmployee));

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><CircularProgress /></Box>;
    }

    // ── Employee self-service ──
    if (isEmployee) {
        if (periods.length === 0) {
            return (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <PayslipIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography color="text.secondary">No processed payroll periods found yet.</Typography>
                </Paper>
            );
        }
        return <EmployeePayslips periods={periods} getCompanyInfo={getCompanyInfo} />;
    }

    // ── HR / Manager view ──
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>Employee Payslips</Typography>
                    <Typography variant="body2" color="text.secondary">View and download employee payslips</Typography>
                </Box>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Refresh</Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

            {/* Summary cards */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 180px' }}>
                    <CardContent>
                        <Typography variant="h4" color="primary.main" fontWeight={700}>{employees.length}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Employees</Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 180px' }}>
                    <CardContent>
                        <Typography variant="h4" color="success.main" fontWeight={700}>{periods.length}</Typography>
                        <Typography variant="body2" color="text.secondary">Payroll Periods</Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Period</InputLabel>
                        <Select value={selectedPeriod || ''} label="Period" onChange={e => handlePeriodChange(e.target.value)}>
                            {periods.map(p => <MenuItem key={p.period_id} value={p.period_id}>{p.period_name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Employee</InputLabel>
                        <Select value={selectedEmployee} label="Employee" onChange={e => setSelectedEmployee(e.target.value)}>
                            <MenuItem value="all">All Employees</MenuItem>
                            {employees.map(e => (
                                <MenuItem key={e.employee_id} value={e.employee_id}>
                                    {e.employee_name || `${e.first_name || ''} ${e.last_name || ''}`.trim()}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredEmployees.map(emp => (
                            <TableRow key={emp.employee_id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                            {(emp.employee_name || emp.first_name || '?').charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {emp.employee_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">{emp.employee_code}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>{emp.department || 'N/A'}</TableCell>
                                <TableCell>{emp.designation || 'N/A'}</TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton size="small" onClick={() => handleViewPayslip(emp.employee_id)} disabled={!selectedPeriod} title="View">
                                            <ViewIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDownloadPayslip(emp.employee_id)} disabled={!selectedPeriod || downloadingId === emp.employee_id} title="Download PDF">
                                            {downloadingId === emp.employee_id ? <CircularProgress size={16} /> : <DownloadIcon />}
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Payslip dialog */}
            <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PayslipIcon /> Payslip Preview
                    </Box>
                </DialogTitle>
                <DialogContent><PayslipBody payslipData={payslipData} /></DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDialog(false)}>Close</Button>
                    <Button startIcon={<PrintIcon />} onClick={() => window.print()}>Print</Button>
                    <Button
                        variant="contained"
                        startIcon={downloadingId === 'dialog' ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                        disabled={downloadingId === 'dialog'}
                        onClick={async () => {
                            if (!payslipData) return;
                            setDownloadingId('dialog');
                            try { await generatePayslipPDF(payslipData, getCompanyInfo()); }
                            catch { setError('Failed to generate PDF'); }
                            finally { setDownloadingId(null); }
                        }}
                    >
                        Download PDF
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Payslips;
