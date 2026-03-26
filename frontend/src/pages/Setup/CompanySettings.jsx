import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, TextField, MenuItem,
    FormControl, InputLabel, Select, Alert, CircularProgress,
    Stack, Chip, Divider,
} from '@mui/material';
import {
    Business as BusinessIcon,
    LocationOn as LocationIcon,
    Phone as PhoneIcon,
    Schedule as ScheduleIcon,
    AccountBalance as PayrollIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Info as InfoIcon,
    CheckCircle as CheckIcon,
} from '@mui/icons-material';
import adminService from '../../services/adminService';

const DEFAULTS = {
    company_name: '', industry: '', company_size: '', founded_year: '',
    website: '', description: '', email: '', phone: '', alternate_phone: '',
    address_street: '', address_city: '', address_state: '', address_country: '', address_postal: '',
    working_days_per_week: 5, working_hours_per_day: 8, week_start_day: 'Monday',
    fiscal_year_start: 'April', leave_year_start: 'January',
    probation_period: 6, notice_period: 30,
    currency: 'INR', payroll_cycle: 'Monthly', salary_processing_day: 28,
    pf_rate: 12, esi_rate: 1.75, professional_tax: 200, gratuity_eligibility: 5,
};

const CURRENCY_OPTIONS = [
    { value: 'INR', label: 'INR — Indian Rupee (₹)', symbol: '₹' },
    { value: 'USD', label: 'USD — US Dollar ($)', symbol: '$' },
    { value: 'EUR', label: 'EUR — Euro (€)', symbol: '€' },
    { value: 'GBP', label: 'GBP — British Pound (£)', symbol: '£' },
    { value: 'AED', label: 'AED — UAE Dirham (د.إ)', symbol: 'د.إ' },
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

// ── Sub-components ────────────────────────────────────────────────────────

const Section = ({ icon, color = '#1976d2', title, subtitle, children }) => (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50',
        }}>
            <Box sx={{
                width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
                bgcolor: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color,
            }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="subtitle1" fontWeight={600} lineHeight={1.2}>{title}</Typography>
                {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
            </Box>
        </Box>
        <Box sx={{ p: 3 }}>{children}</Box>
    </Paper>
);

const Row = ({ children }) => (
    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>{children}</Box>
);

const PreviewPill = ({ label, value, color }) => (
    <Box sx={{
        px: 2, py: 1, borderRadius: 2, textAlign: 'center', minWidth: 80,
        bgcolor: color + '12', border: '1px solid', borderColor: color + '30',
    }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ color, lineHeight: 1.2 }}>{value || '—'}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
    </Box>
);

// ── Main Component ────────────────────────────────────────────────────────

const CompanySettings = () => {
    const [settings, setSettings] = useState(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchSettings = async () => {
        setLoading(true);
        setError('');
        const res = await adminService.getCompanySettings();
        if (res.success && res.data && Object.keys(res.data).length > 0) {
            setSettings({ ...DEFAULTS, ...res.data });
        }
        setLoading(false);
        setHasChanges(false);
    };

    useEffect(() => { fetchSettings(); }, []);

    const set = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
        setSuccess('');
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        const res = await adminService.saveCompanySettings(settings);
        setSaving(false);
        if (res.success) { setSuccess('Settings saved'); setHasChanges(false); }
        else setError(res.error || 'Failed to save settings');
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
        </Box>
    );

    const currencySymbol = CURRENCY_OPTIONS.find(c => c.value === settings.currency)?.symbol || settings.currency;

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1100, mx: 'auto' }}>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Company Settings</Typography>
                    <Typography variant="body2" color="text.secondary">
                        These settings drive payslips, leave calculations, offer letters, and payroll across the entire system.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    {hasChanges && !success && (
                        <Chip label="Unsaved changes" color="warning" size="small" variant="outlined" />
                    )}
                    {success && <Chip icon={<CheckIcon />} label="Saved" color="success" size="small" />}
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchSettings} size="small" disabled={saving}>
                        Reset
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                    >
                        Save Changes
                    </Button>
                </Stack>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>{error}</Alert>}

            {/* Live preview bar */}
            <Box sx={{
                display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center',
                p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
                    <InfoIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        How this appears across the system
                    </Typography>
                </Box>
                <PreviewPill label="Payslip header" value={settings.company_name} color="#1976d2" />
                <PreviewPill label="Currency" value={currencySymbol} color="#2e7d32" />
                <PreviewPill label="Work week" value={`${settings.working_days_per_week} days`} color="#ed6c02" />
                <PreviewPill label="Notice period" value={`${settings.notice_period} days`} color="#7b1fa2" />
                <PreviewPill label="Probation" value={`${settings.probation_period} months`} color="#0288d1" />
                <PreviewPill label="PF rate" value={`${settings.pf_rate}%`} color="#c62828" />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                {/* Row 1: Identity + Contact */}
                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
                    <Box sx={{ flex: 1.4 }}>
                        <Section icon={<BusinessIcon fontSize="small" />} color="#1976d2"
                            title="Company Identity"
                            subtitle="Appears on payslips, offer letters, and all generated documents">
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField fullWidth label="Company Name" value={settings.company_name}
                                    onChange={e => set('company_name', e.target.value)}
                                    helperText="Used as the header on every payslip and letter" />
                                <Row>
                                    <TextField fullWidth label="Industry" value={settings.industry}
                                        onChange={e => set('industry', e.target.value)} />
                                    <TextField fullWidth label="Founded Year" type="number" value={settings.founded_year}
                                        onChange={e => set('founded_year', e.target.value)} />
                                </Row>
                                <Row>
                                    <FormControl fullWidth>
                                        <InputLabel>Company Size</InputLabel>
                                        <Select value={settings.company_size} label="Company Size"
                                            onChange={e => set('company_size', e.target.value)}>
                                            {['1-10', '11-50', '50-100', '100-500', '500+'].map(s => (
                                                <MenuItem key={s} value={s}>{s} employees</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField fullWidth label="Website" value={settings.website}
                                        onChange={e => set('website', e.target.value)} />
                                </Row>
                                <TextField fullWidth label="About the Company" multiline rows={2}
                                    value={settings.description} onChange={e => set('description', e.target.value)}
                                    helperText="Optional — shown in employee portal" />
                            </Box>
                        </Section>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Section icon={<PhoneIcon fontSize="small" />} color="#2e7d32"
                            title="Contact Details"
                            subtitle="Printed on offer letters via {{CompanyEmail}} and {{CompanyPhone}}">
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField fullWidth label="Official Email" type="email" value={settings.email}
                                    onChange={e => set('email', e.target.value)}
                                    helperText="Replaces {{CompanyEmail}} in letter templates" />
                                <TextField fullWidth label="Primary Phone" value={settings.phone}
                                    onChange={e => set('phone', e.target.value)}
                                    helperText="Replaces {{CompanyPhone}} in letter templates" />
                                <TextField fullWidth label="Alternate Phone" value={settings.alternate_phone}
                                    onChange={e => set('alternate_phone', e.target.value)} />
                            </Box>
                        </Section>
                    </Box>
                </Box>

                {/* Row 2: Address */}
                <Section icon={<LocationIcon fontSize="small" />} color="#ed6c02"
                    title="Registered Address"
                    subtitle="Replaces {{CompanyAddress}} in offer letters and appointment letters">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField fullWidth label="Street / Building" value={settings.address_street}
                            onChange={e => set('address_street', e.target.value)} />
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <TextField sx={{ flex: '1 1 150px' }} label="City" value={settings.address_city}
                                onChange={e => set('address_city', e.target.value)} />
                            <TextField sx={{ flex: '1 1 150px' }} label="State / Province" value={settings.address_state}
                                onChange={e => set('address_state', e.target.value)} />
                            <TextField sx={{ flex: '1 1 150px' }} label="Country" value={settings.address_country}
                                onChange={e => set('address_country', e.target.value)} />
                            <TextField sx={{ flex: '1 1 110px' }} label="Postal Code" value={settings.address_postal}
                                onChange={e => set('address_postal', e.target.value)} />
                        </Box>
                    </Box>
                </Section>

                {/* Row 3: HR Policies + Payroll */}
                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>

                    <Box sx={{ flex: 1 }}>
                        <Section icon={<ScheduleIcon fontSize="small" />} color="#7b1fa2"
                            title="HR Policies"
                            subtitle="Controls leave calculations, offer letter terms, and work schedules">
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                                <Divider textAlign="left">
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Work Schedule</Typography>
                                </Divider>

                                <Row>
                                    <Box sx={{ flex: 1 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Working Days / Week</InputLabel>
                                            <Select value={settings.working_days_per_week} label="Working Days / Week"
                                                onChange={e => set('working_days_per_week', e.target.value)}>
                                                <MenuItem value={5}>5 days (Mon–Fri)</MenuItem>
                                                <MenuItem value={6}>6 days (Mon–Sat)</MenuItem>
                                                <MenuItem value={7}>7 days</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                            Used to calculate working days in leave requests
                                        </Typography>
                                    </Box>
                                    <TextField sx={{ flex: 1 }} label="Working Hours / Day" type="number"
                                        value={settings.working_hours_per_day}
                                        onChange={e => set('working_hours_per_day', e.target.value)} />
                                </Row>

                                <FormControl fullWidth>
                                    <InputLabel>Week Start Day</InputLabel>
                                    <Select value={settings.week_start_day} label="Week Start Day"
                                        onChange={e => set('week_start_day', e.target.value)}>
                                        <MenuItem value="Monday">Monday</MenuItem>
                                        <MenuItem value="Sunday">Sunday</MenuItem>
                                    </Select>
                                </FormControl>

                                <Divider textAlign="left">
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Year Boundaries</Typography>
                                </Divider>

                                <Row>
                                    <Box sx={{ flex: 1 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Fiscal Year Start</InputLabel>
                                            <Select value={settings.fiscal_year_start} label="Fiscal Year Start"
                                                onChange={e => set('fiscal_year_start', e.target.value)}>
                                                {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Leave Year Start</InputLabel>
                                            <Select value={settings.leave_year_start} label="Leave Year Start"
                                                onChange={e => set('leave_year_start', e.target.value)}>
                                                {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                            Determines which year's leave balance is used
                                        </Typography>
                                    </Box>
                                </Row>

                                <Divider textAlign="left">
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Employment Terms</Typography>
                                </Divider>

                                <Row>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField fullWidth label="Probation Period (months)" type="number"
                                            value={settings.probation_period}
                                            onChange={e => set('probation_period', e.target.value)} />
                                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                            Fills {'{{ProbationPeriod}}'} in offer letters
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField fullWidth label="Notice Period (days)" type="number"
                                            value={settings.notice_period}
                                            onChange={e => set('notice_period', e.target.value)} />
                                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                            Fills {'{{NoticePeriod}}'} in offer letters
                                        </Typography>
                                    </Box>
                                </Row>
                            </Box>
                        </Section>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Section icon={<PayrollIcon fontSize="small" />} color="#c62828"
                            title="Payroll Configuration"
                            subtitle="Drives salary calculations, deductions, and payslip formatting">
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                                <Divider textAlign="left">
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Currency & Cycle</Typography>
                                </Divider>

                                <Box>
                                    <FormControl fullWidth>
                                        <InputLabel>Currency</InputLabel>
                                        <Select value={settings.currency} label="Currency"
                                            onChange={e => set('currency', e.target.value)}>
                                            {CURRENCY_OPTIONS.map(c => (
                                                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                        Symbol used on payslips and salary structures
                                    </Typography>
                                </Box>

                                <Row>
                                    <FormControl fullWidth>
                                        <InputLabel>Payroll Cycle</InputLabel>
                                        <Select value={settings.payroll_cycle} label="Payroll Cycle"
                                            onChange={e => set('payroll_cycle', e.target.value)}>
                                            <MenuItem value="Monthly">Monthly</MenuItem>
                                            <MenuItem value="Bi-weekly">Bi-weekly</MenuItem>
                                            <MenuItem value="Weekly">Weekly</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField fullWidth label="Processing Day" type="number"
                                            value={settings.salary_processing_day}
                                            onChange={e => set('salary_processing_day', e.target.value)} />
                                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                            Day of month salary is processed
                                        </Typography>
                                    </Box>
                                </Row>

                                <Divider textAlign="left">
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Statutory Deductions</Typography>
                                </Divider>

                                <Row>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField fullWidth label="PF Rate (%)" type="number"
                                            value={settings.pf_rate} onChange={e => set('pf_rate', e.target.value)} />
                                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                            Auto-fills PF component in salary structures
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField fullWidth label="ESI Rate (%)" type="number"
                                            value={settings.esi_rate} onChange={e => set('esi_rate', e.target.value)} />
                                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                            Auto-fills ESI component in salary structures
                                        </Typography>
                                    </Box>
                                </Row>

                                <Row>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField fullWidth label={`Professional Tax (${currencySymbol})`} type="number"
                                            value={settings.professional_tax}
                                            onChange={e => set('professional_tax', e.target.value)} />
                                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                            Fixed monthly PT deduction
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField fullWidth label="Gratuity Eligibility (years)" type="number"
                                            value={settings.gratuity_eligibility}
                                            onChange={e => set('gratuity_eligibility', e.target.value)} />
                                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                            Min. years of service for gratuity
                                        </Typography>
                                    </Box>
                                </Row>
                            </Box>
                        </Section>
                    </Box>
                </Box>

                {/* Bottom save bar */}
                <Box sx={{
                    display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2,
                    p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider',
                }}>
                    {hasChanges && !success && (
                        <Typography variant="body2" color="warning.main">You have unsaved changes</Typography>
                    )}
                    {success && (
                        <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CheckIcon fontSize="small" /> Settings saved successfully
                        </Typography>
                    )}
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchSettings} disabled={saving}>
                        Reset
                    </Button>
                    <Button
                        variant="contained" size="large"
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                    >
                        Save Changes
                    </Button>
                </Box>

            </Box>
        </Box>
    );
};

export default CompanySettings;
