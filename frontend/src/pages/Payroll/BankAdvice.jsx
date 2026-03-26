import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, MenuItem,
    Select, FormControl, InputLabel, Chip, Alert, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, CircularProgress
} from '@mui/material';
import { Download as DownloadIcon, Edit as EditIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import payrollService from '../../services/payrollService';

const BankAdvice = () => {
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [bankAdvice, setBankAdvice] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editEmployee, setEditEmployee] = useState(null);
    const [bankForm, setBankForm] = useState({ bank_account_number: '', bank_name: '', bank_ifsc_code: '', bank_branch: '' });
    const [saving, setSaving] = useState(false);
    const [markPaidDialog, setMarkPaidDialog] = useState(false);
    const [paymentReference, setPaymentReference] = useState('');
    const [marking, setMarking] = useState(false);

    useEffect(() => {
        loadPeriods();
    }, []);

    const loadPeriods = async () => {
        try {
            const res = await payrollService.getPeriods();
            if (res.success) {
                setPeriods((res.data || []).filter(p => p.status === 'LOCKED' || p.status === 'COMPLETED'));
            }
        } catch {}
    };

    const loadBankAdvice = async (periodId) => {
        try {
            setLoading(true);
            setError(null);
            const res = await payrollService.getBankAdvice(periodId);
            if (res.success) {
                setBankAdvice(Array.isArray(res.data) ? res.data : []);
            } else {
                setError(res.message || 'Failed to load bank advice');
            }
        } catch (err) {
            setError('Failed to load bank advice');
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodChange = (e) => {
        setSelectedPeriod(e.target.value);
        if (e.target.value) loadBankAdvice(e.target.value);
    };

    const handleEditBank = (emp) => {
        setEditEmployee(emp);
        setBankForm({
            bank_account_number: emp.bank_account_number || '',
            bank_name: emp.bank_name || '',
            bank_ifsc_code: emp.bank_ifsc_code || '',
            bank_branch: emp.bank_branch || ''
        });
    };

    const handleSaveBank = async () => {
        try {
            setSaving(true);
            const res = await payrollService.updateBankDetails(editEmployee.employee_id, bankForm);
            if (res.success) {
                setEditEmployee(null);
                await loadBankAdvice(selectedPeriod);
            } else {
                setError(res.message);
            }
        } catch {
            setError('Failed to save bank details');
        } finally {
            setSaving(false);
        }
    };

    const handleMarkPaid = async () => {
        if (!paymentReference.trim()) return;
        try {
            setMarking(true);
            const res = await payrollService.markSalariesPaid(selectedPeriod, paymentReference.trim());
            if (res.success) {
                setMarkPaidDialog(false);
                setPaymentReference('');
                await loadBankAdvice(selectedPeriod);
                // Reload periods to reflect COMPLETED status
                const periodsRes = await payrollService.getPeriods();
                if (periodsRes.success) {
                    setPeriods((periodsRes.data || []).filter(p => p.status === 'LOCKED' || p.status === 'COMPLETED'));
                }
            } else {
                setError(res.message || 'Failed to mark salaries as paid');
            }
        } catch {
            setError('Failed to mark salaries as paid');
        } finally {
            setMarking(false);
        }
    };

    const handleExport = () => {
        if (!bankAdvice.length) return;
        const period = periods.find(p => p.period_id === selectedPeriod);
        const rows = [
            ['Employee Code', 'Employee Name', 'Department', 'Bank Name', 'Account Number', 'IFSC Code', 'Branch', 'Net Salary'],
            ...bankAdvice.map(e => [
                e.employee_code, e.employee_name, e.department,
                e.bank_name || '', e.bank_account_number || '',
                e.bank_ifsc_code || '', e.bank_branch || '',
                e.net_salary
            ])
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bank_advice_${period?.period_name || selectedPeriod}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalNet = bankAdvice.reduce((sum, e) => sum + (e.net_salary || 0), 0);
    const selectedPeriodObj = periods.find(p => p.period_id === selectedPeriod);
    const isLocked = selectedPeriodObj?.status === 'LOCKED';
    const allPaid = bankAdvice.length > 0 && bankAdvice.every(e => e.payment_status === 'PAID');

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Bank Advice</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {isLocked && bankAdvice.length > 0 && !allPaid && (
                        <Button variant="contained" color="success" startIcon={<CheckCircleIcon />}
                            onClick={() => setMarkPaidDialog(true)}>
                            Mark Salary Paid
                        </Button>
                    )}
                    {allPaid && (
                        <Chip label="All Salaries Paid" color="success" icon={<CheckCircleIcon />} />
                    )}
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} disabled={!bankAdvice.length}>
                        Export CSV
                    </Button>
                </Box>
            </Box>

            <FormControl size="small" sx={{ minWidth: 250, mb: 3 }}>
                <InputLabel>Select Locked Period</InputLabel>
                <Select value={selectedPeriod} label="Select Locked Period" onChange={handlePeriodChange}>
                    {periods.map(p => (
                        <MenuItem key={p.period_id} value={p.period_id}>
                            {p.period_name} — <Chip label={p.status} size="small" sx={{ ml: 1 }} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : bankAdvice.length === 0 && selectedPeriod ? (
                <Alert severity="info">No data found. Make sure the period is LOCKED.</Alert>
            ) : bankAdvice.length > 0 ? (
                <>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell>Employee</TableCell>
                                    <TableCell>Bank Name</TableCell>
                                    <TableCell>Account Number</TableCell>
                                    <TableCell>IFSC Code</TableCell>
                                    <TableCell>Branch</TableCell>
                                    <TableCell align="right">Net Salary</TableCell>
                                    <TableCell align="center">Edit Bank</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bankAdvice.map((emp) => (
                                    <TableRow key={emp.employee_code}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>{emp.employee_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{emp.employee_code}</Typography>
                                        </TableCell>
                                        <TableCell>{emp.bank_name || <Typography variant="caption" color="error">Not set</Typography>}</TableCell>
                                        <TableCell>{emp.bank_account_number || <Typography variant="caption" color="error">Not set</Typography>}</TableCell>
                                        <TableCell>{emp.bank_ifsc_code || '—'}</TableCell>
                                        <TableCell>{emp.bank_branch || '—'}</TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight={600} color="success.main">
                                                {payrollService.formatCurrency(emp.net_salary)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditBank(emp)}>
                                                Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="h6">
                            Total Transfer Amount: <strong style={{ color: '#2e7d32' }}>{payrollService.formatCurrency(totalNet)}</strong>
                        </Typography>
                    </Box>
                </>
            ) : null}

            {/* Mark Salary Paid Dialog */}
            <Dialog open={markPaidDialog} onClose={() => setMarkPaidDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Mark Salaries as Paid</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter the bank transfer reference number. This will mark all {bankAdvice.length} employee(s) as PAID and set the period to COMPLETED.
                    </Typography>
                    <TextField
                        size="small" fullWidth autoFocus
                        label="Payment Reference / UTR Number"
                        value={paymentReference}
                        onChange={e => setPaymentReference(e.target.value)}
                        placeholder="e.g. UTR123456789"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMarkPaidDialog(false)}>Cancel</Button>
                    <Button variant="contained" color="success" onClick={handleMarkPaid}
                        disabled={marking || !paymentReference.trim()}>
                        {marking ? 'Processing...' : 'Confirm Payment'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Bank Details Dialog */}
            <Dialog open={!!editEmployee} onClose={() => setEditEmployee(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Edit Bank Details — {editEmployee?.employee_name}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField size="small" label="Bank Name" fullWidth value={bankForm.bank_name}
                            onChange={e => setBankForm(f => ({ ...f, bank_name: e.target.value }))} />
                        <TextField size="small" label="Account Number" fullWidth value={bankForm.bank_account_number}
                            onChange={e => setBankForm(f => ({ ...f, bank_account_number: e.target.value }))} />
                        <TextField size="small" label="IFSC Code" fullWidth value={bankForm.bank_ifsc_code}
                            onChange={e => setBankForm(f => ({ ...f, bank_ifsc_code: e.target.value }))} />
                        <TextField size="small" label="Branch" fullWidth value={bankForm.bank_branch}
                            onChange={e => setBankForm(f => ({ ...f, bank_branch: e.target.value }))} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditEmployee(null)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveBank} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BankAdvice;
