import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, CircularProgress, Alert,
} from '@mui/material';
import {
    AccountBalance as SalaryIcon, TrendingUp as EarningsIcon,
    TrendingDown as DeductionsIcon, Badge as TemplateIcon,
} from '@mui/icons-material';
import payrollService from '../../services/payrollService';

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

const periodStatusColor = (s) => {
    switch ((s || '').toUpperCase()) {
        case 'PAID':       return 'success';
        case 'LOCKED':     return 'info';
        case 'CALCULATED': return 'warning';
        default:           return 'default';
    }
};

const SalaryPreview = ({ employee }) => {
    const [salaryData, setSalaryData] = useState(null);
    const [periods, setPeriods]       = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');

    useEffect(() => {
        if (!employee?.employee_id) return;
        const load = async () => {
            setLoading(true); setError('');
            try {
                const [salRes, perRes] = await Promise.all([
                    payrollService.getEmployeeSalaryDetails(employee.employee_id),
                    payrollService.getPeriods(),
                ]);
                if (salRes?.success) setSalaryData(salRes.data || null);

                if (perRes?.success) {
                    const all = Array.isArray(perRes.data?.periods) ? perRes.data.periods
                        : Array.isArray(perRes.data) ? perRes.data : [];
                    setPeriods(all.filter(p => ['CALCULATED','LOCKED','PAID'].includes(p.status)).slice(0, 6));
                }
            } catch { setError('Failed to load salary data'); }
            finally { setLoading(false); }
        };
        load();
    }, [employee]);

    if (!employee) return null;

    const components    = Array.isArray(salaryData?.components) ? salaryData.components
        : Array.isArray(salaryData?.salary_components) ? salaryData.salary_components : [];
    const earnings      = components.filter(c => (c.component_type || c.type || '').toUpperCase() === 'EARNING');
    const deductions    = components.filter(c => (c.component_type || c.type || '').toUpperCase() === 'DEDUCTION');
    const grossSalary   = salaryData?.monthly_ctc ?? salaryData?.gross_salary ?? salaryData?.ctc ?? 0;
    const totalDed      = deductions.reduce((s, c) => s + Number(c.calculated_amount ?? c.amount ?? 0), 0);
    const netSalary     = grossSalary - totalDed;

    return (
        <Box sx={{ mt: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : !salaryData ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <SalaryIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>No salary structure assigned</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Assign a salary template from Payroll → Assign Salary
                    </Typography>
                </Paper>
            ) : (
                <>
                    {/* Salary Summary */}
                    <Paper sx={{ p: 4, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                            Current Salary Structure
                        </Typography>
                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <InfoItem icon={<TemplateIcon />} label="Template" value={salaryData?.structure_name || salaryData?.template_name || 'Assigned'} />
                                <InfoItem icon={<SalaryIcon />}   label="Gross Salary (CTC)" value={`₹${Number(grossSalary).toLocaleString('en-IN')}`} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <InfoItem icon={<DeductionsIcon />} label="Total Deductions" value={`₹${Number(totalDed).toLocaleString('en-IN')}`} />
                                <InfoItem icon={<EarningsIcon />}   label="Net Salary" value={`₹${Number(netSalary).toLocaleString('en-IN')}`} chip chipColor="success" />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Breakdown */}
                    {components.length > 0 && (
                        <Paper sx={{ p: 4, mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                                Salary Breakdown
                            </Typography>
                            <Grid container spacing={4}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 600, mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Earnings
                                    </Typography>
                                    {earnings.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">No earnings components</Typography>
                                    ) : earnings.map((c, i) => (
                                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                            <Typography variant="body2" color="text.secondary">{c.component_name || c.name}</Typography>
                                            <Typography variant="body2" fontWeight={600}>₹{Number(c.calculated_amount ?? c.amount ?? 0).toLocaleString('en-IN')}</Typography>
                                        </Box>
                                    ))}
                                    <Divider sx={{ my: 1.5 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" fontWeight={600}>Total Earnings</Typography>
                                        <Typography variant="body2" fontWeight={700} color="success.main">₹{Number(grossSalary).toLocaleString('en-IN')}</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="error.main" sx={{ fontWeight: 600, mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Deductions
                                    </Typography>
                                    {deductions.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">No deduction components</Typography>
                                    ) : deductions.map((c, i) => (
                                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                            <Typography variant="body2" color="text.secondary">{c.component_name || c.name}</Typography>
                                            <Typography variant="body2" fontWeight={600}>₹{Number(c.calculated_amount ?? c.amount ?? 0).toLocaleString('en-IN')}</Typography>
                                        </Box>
                                    ))}
                                    <Divider sx={{ my: 1.5 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" fontWeight={600}>Total Deductions</Typography>
                                        <Typography variant="body2" fontWeight={700} color="error.main">₹{Number(totalDed).toLocaleString('en-IN')}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                            <Divider sx={{ my: 3 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" fontWeight={700}>Net Salary</Typography>
                                <Typography variant="h6" fontWeight={700} color="primary.main">₹{Number(netSalary).toLocaleString('en-IN')}</Typography>
                            </Box>
                        </Paper>
                    )}

                    {/* Payroll Periods */}
                    <Paper sx={{ p: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                            Payroll Periods
                        </Typography>
                        {periods.length === 0 ? (
                            <Typography color="text.secondary" sx={{ py: 2 }}>No processed payroll periods yet</Typography>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                                            <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {periods.map((p, i) => (
                                            <TableRow key={p.period_id || i} hover>
                                                <TableCell sx={{ fontWeight: 500 }}>{p.period_name}</TableCell>
                                                <TableCell>{p.start_date ? new Date(p.start_date).toLocaleDateString('en-IN') : '-'}</TableCell>
                                                <TableCell>{p.end_date ? new Date(p.end_date).toLocaleDateString('en-IN') : '-'}</TableCell>
                                                <TableCell>
                                                    <Chip label={p.status} color={periodStatusColor(p.status)} size="small" sx={{ fontWeight: 500 }} />
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

export default SalaryPreview;
