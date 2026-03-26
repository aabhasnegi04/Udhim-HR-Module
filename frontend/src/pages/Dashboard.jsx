import { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, Typography, Button, Paper,
    List, ListItem, ListItemText, ListItemIcon, Divider,
    Avatar, CircularProgress, Alert, Chip,
} from '@mui/material';
import {
    People as PeopleIcon,
    EventAvailable as AttendanceIcon,
    PendingActions as PendingIcon,
    AccountBalance as PayrollIcon,
    TrendingUp as TrendingUpIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    BeachAccess as LeaveIcon,
    PersonAdd as PersonAddIcon,
    Upload as UploadIcon,
    Assessment as AssessmentIcon,
    Description as DescriptionIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Refresh as RefreshIcon,
    FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboardService';
import attendanceService from '../services/attendanceService';
import leaveService from '../services/leaveService';
import holidayService from '../services/holidayService';
import apiService from '../services/api';
import InactiveEmployeeAlert from '../components/InactiveEmployeeAlert';

// ─── helpers ─────────────────────────────────────────────────────────────────
const alertMeta = (severity) => {
    if (severity === 'error')   return { color: 'error',   icon: <ErrorIcon fontSize="small" /> };
    if (severity === 'warning') return { color: 'warning', icon: <WarningIcon fontSize="small" /> };
    return                             { color: 'info',    icon: <InfoIcon fontSize="small" /> };
};

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
};

const Dashboard = () => {
    const { user } = useAuth();
    const { currentView, isHRView, isEmployeeView, profileInfo } = useProfileSwitching();
    const navigate = useNavigate();

    // ── shared ──
    const [error, setError] = useState('');

    // ── HR state ──
    const [hrLoading, setHrLoading] = useState(false);
    const [stats, setStats] = useState({
        totalEmployees: 0, presentToday: 0, absentToday: 0,
        onLeaveToday: 0, attendancePercentage: 0, pendingApprovals: 0,
    });
    const [alerts, setAlerts] = useState([]);
    const [trend, setTrend] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    // ── Employee state ──
    const [empLoading, setEmpLoading] = useState(false);
    const [employeeStats, setEmployeeStats] = useState({
        daysPresent: 0, leaveBalance: 0, attendanceRate: 0,
        todayStatus: 'Not Checked In', checkInTime: null,
    });
    const [payslipStatus, setPayslipStatus] = useState({ available: false, periodName: null, periodId: null });
    const [specialLeaves, setSpecialLeaves] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [companyPolicies, setCompanyPolicies] = useState([]);

    useEffect(() => {
        if (user?.role === 'HR' && currentView === 'HR') {
            loadHRDashboard();
        } else if (currentView === 'EMPLOYEE') {
            loadEmployeeDashboard();
        }
    }, [currentView, user?.role]);

    // ─────────────────────────────────────────────────────────────────────────
    // HR DASHBOARD LOADER
    // ─────────────────────────────────────────────────────────────────────────
    const loadHRDashboard = async () => {
        setHrLoading(true);
        setError('');
        try {
            const [statsRes, alertsRes, trendRes, activitiesRes] = await Promise.allSettled([
                dashboardService.getHRDashboardStats(),
                dashboardService.getHRAlerts(),
                dashboardService.getHRAttendanceTrend(),
                dashboardService.getHRRecentActivities(5),
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value.success) {
                const d = statsRes.value.data;
                setStats({
                    totalEmployees: d.total_employees || 0,
                    presentToday: d.present_today || 0,
                    absentToday: d.absent_today ?? Math.max(0, (d.total_employees || 0) - (d.present_today || 0) - (d.on_leave_today || 0)),
                    onLeaveToday: d.on_leave_today || 0,
                    attendancePercentage: d.attendance_percentage || 0,
                    pendingApprovals: d.pending_approvals || 0,
                });
            }

            if (alertsRes.status === 'fulfilled' && alertsRes.value.success) {
                setAlerts(alertsRes.value.data.alerts || []);
            }

            if (trendRes.status === 'fulfilled' && trendRes.value.success) {
                setTrend(trendRes.value.data.trend || []);
            }

            if (activitiesRes.status === 'fulfilled' && activitiesRes.value.success) {
                setRecentActivities(activitiesRes.value.data.activities || []);
            }
        } catch (e) {
            setError('Failed to load dashboard data');
        } finally {
            setHrLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // EMPLOYEE DASHBOARD LOADER
    // ─────────────────────────────────────────────────────────────────────────
    const loadEmployeeDashboard = async () => {
        setEmpLoading(true);
        setError('');
        try {
            const [todayRes, leaveRes, holidayRes, empStatsRes, policiesRes] = await Promise.allSettled([
                attendanceService.getTodayAttendanceStatus(user.employee_id),
                leaveService.getLeaveBalances(user.employee_id),
                holidayService.getPublicHolidays(),
                dashboardService.getEmployeeDashboardStats(),
                apiService.get('/employees/company-policies'), // Use employee endpoint instead of admin
            ]);

            // today status
            if (todayRes.status === 'fulfilled' && todayRes.value.success) {
                const d = todayRes.value.data;
                setEmployeeStats(prev => ({
                    ...prev,
                    todayStatus: d.has_checked_in ? 'Checked In' : 'Not Checked In',
                    checkInTime: d.check_in_time || null,
                }));
            }

            // leave balances
            if (leaveRes.status === 'fulfilled' && leaveRes.value.success) {
                const specialTypes = ['Maternity Leave', 'Paternity Leave', 'Bereavement Leave', 'Sabbatical Leave'];
                const data = leaveRes.value.data || [];
                const total = data
                    .filter(b => !specialTypes.includes(b.leave_name))
                    .reduce((s, b) => s + (parseFloat(b.remaining) || 0), 0);
                const special = data
                    .filter(b => specialTypes.includes(b.leave_name) && parseFloat(b.remaining) > 0)
                    .map(b => ({ name: b.leave_name, remaining: parseFloat(b.remaining) }));
                setEmployeeStats(prev => ({ ...prev, leaveBalance: total }));
                setSpecialLeaves(special);
            }

            // employee stats (attendance this month + payslip status)
            if (empStatsRes.status === 'fulfilled' && empStatsRes.value.success) {
                const d = empStatsRes.value.data;
                const att = d.attendance || {};
                setEmployeeStats(prev => ({
                    ...prev,
                    daysPresent: att.days_present || 0,
                    attendanceRate: att.attendance_percentage || 0,
                }));
                if (d.payslip_status) {
                    setPayslipStatus({
                        available: d.payslip_status.available,
                        periodName: d.payslip_status.period_name,
                        periodId: d.payslip_status.period_id,
                    });
                }
            }

            // holidays
            let hData = [];
            if (holidayRes.status === 'fulfilled' && holidayRes.value.success) {
                hData = holidayRes.value.data || [];
            }
            // Parse any date format to a local midnight Date
            const parseHolidayDate = (raw) => {
                const parsed = new Date(raw);
                if (!isNaN(parsed)) { parsed.setHours(0, 0, 0, 0); return parsed; }
                const parts = String(raw).split('T')[0].split('-');
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            };
            const today0 = new Date(); today0.setHours(0, 0, 0, 0);
            const upcomingFromApi = hData.filter(h => parseHolidayDate(h.holiday_date) >= today0);
            // If no upcoming holidays from API, use fallback
            const finalData = upcomingFromApi.length ? upcomingFromApi : (() => {
                const y = new Date().getFullYear();
                return [
                    { holiday_id: 1, holiday_name: 'Independence Day', holiday_date: `${y}-08-15` },
                    { holiday_id: 2, holiday_name: 'Gandhi Jayanti',    holiday_date: `${y}-10-02` },
                    { holiday_id: 3, holiday_name: 'Diwali',            holiday_date: `${y}-10-31` },
                    { holiday_id: 4, holiday_name: 'Christmas',         holiday_date: `${y}-12-25` },
                    { holiday_id: 5, holiday_name: 'New Year',          holiday_date: `${y + 1}-01-01` },
                ].filter(h => parseHolidayDate(h.holiday_date) >= today0);
            })();
            setHolidays(
                finalData
                    .sort((a, b) => parseHolidayDate(a.holiday_date) - parseHolidayDate(b.holiday_date))
                    .slice(0, 5)
            );

            // company policies - filter for employee visibility
            if (policiesRes.status === 'fulfilled' && policiesRes.value.success) {
                const employeePolicies = policiesRes.value.data?.policies || [];
                console.log('Policies API response:', policiesRes.value); // DEBUG
                console.log('Employee policies:', employeePolicies); // DEBUG
                setCompanyPolicies(employeePolicies.slice(0, 5)); // Show top 5
            } else {
                console.log('Policies fetch failed:', policiesRes); // DEBUG
            }
        } catch (e) {
            console.error('[Dashboard] loadEmployeeDashboard error:', e);
            setError('Failed to load dashboard data');
            // Still show fallback holidays even on error
            const y = new Date().getFullYear();
            const today2 = new Date(); today2.setHours(0, 0, 0, 0);
            setHolidays([
                { holiday_id: 1, holiday_name: 'Independence Day', holiday_date: `${y}-08-15` },
                { holiday_id: 2, holiday_name: 'Gandhi Jayanti',    holiday_date: `${y}-10-02` },
                { holiday_id: 3, holiday_name: 'Diwali',            holiday_date: `${y}-10-31` },
                { holiday_id: 4, holiday_name: 'Christmas',         holiday_date: `${y}-12-25` },
                { holiday_id: 5, holiday_name: 'New Year',          holiday_date: `${y + 1}-01-01` },
            ].filter(h => {
                const parts = h.holiday_date.split('-');
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])) >= today2;
            }));
        } finally {
            setEmpLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // LOADING STATES
    // ─────────────────────────────────────────────────────────────────────────
    if ((user?.role === 'HR' && currentView === 'HR' && hrLoading) ||
        (currentView === 'EMPLOYEE' && empLoading)) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HR DASHBOARD
    // ─────────────────────────────────────────────────────────────────────────
    if (user?.role === 'HR' && currentView === 'HR') {
        const trendColors = trend.map(d => d.percentage >= 80 ? '#4caf50' : d.percentage >= 60 ? '#ff9800' : '#f44336');

        return (
            <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>HR Dashboard</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>
                    </Box>
                    <Button size="small" startIcon={<RefreshIcon />} onClick={loadHRDashboard} disabled={hrLoading}>
                        Refresh
                    </Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

                {/* ── Needs Attention ── */}
                {alerts.length > 0 && (
                    <Paper sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'warning.light', bgcolor: 'warning.50' }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <WarningIcon fontSize="small" color="warning" /> Needs Attention
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {alerts.map((alert, i) => {
                                const meta = alertMeta(alert.severity);
                                return (
                                    <Chip
                                        key={i}
                                        icon={meta.icon}
                                        label={alert.message}
                                        color={meta.color}
                                        variant="outlined"
                                        size="small"
                                        onClick={() => navigate(alert.action_route)}
                                        sx={{ cursor: 'pointer', fontWeight: 500 }}
                                    />
                                );
                            })}
                        </Box>
                    </Paper>
                )}

                {/* ── Today Snapshot + Payroll Status ── */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    {/* Today Snapshot */}
                    <Paper sx={{ flex: '1 1 300px', p: 3 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Today at a Glance
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', mx: 'auto', mb: 0.5, width: 44, height: 44 }}>
                                    <PeopleIcon />
                                </Avatar>
                                <Typography variant="h5" fontWeight={700}>{stats.totalEmployees}</Typography>
                                <Typography variant="caption" color="text.secondary">Total</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', mx: 'auto', mb: 0.5, width: 44, height: 44 }}>
                                    <CheckCircleIcon />
                                </Avatar>
                                <Typography variant="h5" fontWeight={700} color="success.main">{stats.presentToday}</Typography>
                                <Typography variant="caption" color="text.secondary">Present</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Avatar sx={{ bgcolor: 'error.light', color: 'error.main', mx: 'auto', mb: 0.5, width: 44, height: 44 }}>
                                    <DotIcon />
                                </Avatar>
                                <Typography variant="h5" fontWeight={700} color="error.main">{stats.absentToday}</Typography>
                                <Typography variant="caption" color="text.secondary">Absent</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main', mx: 'auto', mb: 0.5, width: 44, height: 44 }}>
                                    <LeaveIcon />
                                </Avatar>
                                <Typography variant="h5" fontWeight={700} color="warning.main">{stats.onLeaveToday}</Typography>
                                <Typography variant="caption" color="text.secondary">On Leave</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Avatar sx={{ bgcolor: 'info.light', color: 'info.main', mx: 'auto', mb: 0.5, width: 44, height: 44 }}>
                                    <PendingIcon />
                                </Avatar>
                                <Typography variant="h5" fontWeight={700} color="info.main">{stats.pendingApprovals}</Typography>
                                <Typography variant="caption" color="text.secondary">Pending</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary">
                                Attendance rate: <strong>{stats.attendancePercentage}%</strong>
                            </Typography>
                        </Box>
                    </Paper>

                    {/* Quick Actions */}
                    <Paper sx={{ flex: '1 1 260px', p: 3 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Quick Actions
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => navigate('/employees/add')} fullWidth sx={{ justifyContent: 'flex-start' }}>
                                Add Employee
                            </Button>
                            <Button variant="outlined" startIcon={<PayrollIcon />} onClick={() => navigate('/payroll')} fullWidth sx={{ justifyContent: 'flex-start' }}>
                                Process Payroll
                            </Button>
                            <Button variant="outlined" startIcon={<LeaveIcon />} onClick={() => navigate('/leave')} fullWidth sx={{ justifyContent: 'flex-start' }}>
                                Review Leaves {stats.pendingApprovals > 0 && `(${stats.pendingApprovals})`}
                            </Button>
                            <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => navigate('/admin')} fullWidth sx={{ justifyContent: 'flex-start' }}>
                                Bulk Upload
                            </Button>
                        </Box>
                    </Paper>
                </Box>

                {/* ── Attendance Trend Chart ── */}
                {trend.length > 0 && (
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Attendance Trend — Last 7 Days
                        </Typography>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(val, name) => [val, name === 'present' ? 'Present' : name]}
                                    labelFormatter={(label, payload) => {
                                        const d = payload?.[0]?.payload;
                                        return d ? `${d.date} — ${d.percentage}%` : label;
                                    }}
                                />
                                <Bar dataKey="present" radius={[4, 4, 0, 0]}>
                                    {trend.map((_, i) => <Cell key={i} fill={trendColors[i]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                )}

                {/* ── Recent Activity ── */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Recent Activity
                    </Typography>
                    {recentActivities.length > 0 ? (
                        <List disablePadding>
                            {recentActivities.map((activity, i) => {
                                const iconMap = {
                                    LEAVE_APPROVED: { icon: CheckCircleIcon, color: 'success' },
                                    LEAVE_REJECTED: { icon: PendingIcon,     color: 'error' },
                                    LEAVE_PENDING:  { icon: PendingIcon,     color: 'warning' },
                                    EMPLOYEE_ADDED: { icon: PeopleIcon,      color: 'primary' },
                                };
                                const { icon: Icon, color } = iconMap[activity.type] || { icon: DescriptionIcon, color: 'info' };
                                const actDate = new Date(activity.date);
                                const diffDays = Math.floor((new Date() - actDate) / 86400000);
                                const timeLabel = diffDays === 0 ? activity.time : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
                                return (
                                    <Box key={i}>
                                        <ListItem sx={{ px: 0, py: 1.5 }}>
                                            <ListItemIcon sx={{ minWidth: 40 }}>
                                                <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 32, height: 32 }}>
                                                    <Icon sx={{ fontSize: 18 }} />
                                                </Avatar>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={<Typography variant="body2" fontWeight={500}>{activity.description}</Typography>}
                                                secondary={
                                                    <Typography variant="caption" color="text.secondary">
                                                        {activity.employee_name}
                                                        {activity.meta ? ` · ${activity.meta}` : ''}
                                                    </Typography>
                                                }
                                            />
                                            <Typography variant="caption" color="text.secondary">{timeLabel}</Typography>
                                        </ListItem>
                                        {i < recentActivities.length - 1 && <Divider />}
                                    </Box>
                                );
                            })}
                        </List>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                            No recent activities
                        </Typography>
                    )}
                </Paper>
            </Box>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MANAGER DASHBOARD (kept as-is for now — Phase 3)
    // ─────────────────────────────────────────────────────────────────────────
    if (user?.role === 'MANAGER' && currentView === 'MANAGER') {
        return (
            <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={700}>Manager Dashboard</Typography>
                    <Typography variant="body2" color="text.secondary">Welcome back! Here's your team overview</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    {[
                        { label: 'Team Members', value: 24, color: 'primary' },
                        { label: 'Present Today', value: 22, color: 'success' },
                        { label: 'Pending Approvals', value: 5, color: 'warning' },
                    ].map(({ label, value, color }) => (
                        <Card key={label} sx={{ flex: '1 1 200px' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{label}</Typography>
                                <Typography variant="h3" fontWeight={700}>{value}</Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Pending Leave Requests
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        Manager dashboard real data coming in Phase 3
                    </Typography>
                </Paper>
            </Box>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EMPLOYEE DASHBOARD
    // ─────────────────────────────────────────────────────────────────────────
    // Get display name from profileInfo (first_name + last_name) or fallback to user.name
    const getDisplayName = () => {
        if (profileInfo?.first_name && profileInfo?.last_name) {
            return `${profileInfo.first_name} ${profileInfo.last_name}`;
        }
        if (profileInfo?.full_name) {
            return profileInfo.full_name;
        }
        // Fallback to user.name and try to format it
        if (user?.name) {
            // If it's a username like "aabhasnegi04", just return first word capitalized
            const name = user.name.replace(/\d+/g, ''); // Remove numbers
            return name.charAt(0).toUpperCase() + name.slice(1);
        }
        return 'there';
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Greeting */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                    {getGreeting()}, {getDisplayName()} 👋
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            <InactiveEmployeeAlert />

            {/* Summary Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 2, mb: 3 }}>
                <Card>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Days Present</Typography>
                                <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{employeeStats.daysPresent}</Typography>
                                <Typography variant="caption" color="text.secondary">This month</Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: { xs: 36, sm: 48 }, height: { xs: 36, sm: 48 } }}>
                                <ScheduleIcon />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Leave Balance</Typography>
                                <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{employeeStats.leaveBalance}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Days remaining
                                    {specialLeaves.length > 0 && (
                                        <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                                            + {specialLeaves.map(l => `${l.remaining} ${l.name.replace(' Leave', '')}`).join(', ')}
                                        </Box>
                                    )}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: { xs: 36, sm: 48 }, height: { xs: 36, sm: 48 } }}>
                                <LeaveIcon />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>This Month</Typography>
                                <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{employeeStats.attendanceRate}%</Typography>
                                <Typography variant="caption" color={employeeStats.attendanceRate >= 90 ? 'success.main' : 'warning.main'} sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TrendingUpIcon sx={{ fontSize: 12, mr: 0.5 }} />
                                    {employeeStats.daysPresent} days present
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'info.light', color: 'info.main', width: { xs: 36, sm: 48 }, height: { xs: 36, sm: 48 } }}>
                                <TrendingUpIcon />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Payslip</Typography>
                                {payslipStatus.available ? (
                                    <>
                                        <Typography variant="body1" fontWeight={700} sx={{ mb: 0.5 }}>Ready</Typography>
                                        <Typography variant="caption" color="success.main">{payslipStatus.periodName}</Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <Button size="small" variant="outlined" onClick={() => navigate('/payroll/payslips')} sx={{ fontSize: '0.7rem', py: 0.25 }}>
                                                View
                                            </Button>
                                        </Box>
                                    </>
                                ) : (
                                    <>
                                        <Typography variant="body1" fontWeight={700} sx={{ mb: 0.5 }}>Not yet</Typography>
                                        <Typography variant="caption" color="text.secondary">No payslip available</Typography>
                                    </>
                                )}
                            </Box>
                            <Avatar sx={{ bgcolor: payslipStatus.available ? 'success.light' : 'grey.100', color: payslipStatus.available ? 'success.main' : 'grey.500', width: { xs: 36, sm: 48 }, height: { xs: 36, sm: 48 } }}>
                                <PayrollIcon />
                            </Avatar>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Quick Actions */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {[
                        { label: 'Check In/Out',    icon: <AttendanceIcon />, route: '/attendance' },
                        { label: 'Apply for Leave', icon: <LeaveIcon />,      route: '/leave' },
                        { label: 'View Payslip',    icon: <PayrollIcon />,    route: '/payroll/payslips' },
                        { label: 'Update Profile',  icon: <PeopleIcon />,     route: '/employees/profile' },
                    ].map(({ label, icon, route }) => (
                        <Button
                            key={label}
                            variant="outlined"
                            startIcon={icon}
                            onClick={() => navigate(route)}
                            sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' }, py: 1.5, justifyContent: 'flex-start', borderColor: 'divider', color: 'text.primary', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}
                        >
                            {label}
                        </Button>
                    ))}
                </Box>
            </Paper>

            {/* Upcoming Holidays */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Upcoming Holidays
                </Typography>
                {empLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
                ) : holidays.length > 0 ? (
                    <List disablePadding>
                        {holidays.map((holiday, i) => {
                            const hDate = new Date(holiday.holiday_date);
                            hDate.setHours(0, 0, 0, 0);
                            const today = new Date(); today.setHours(0, 0, 0, 0);
                            const daysUntil = Math.ceil((hDate - today) / 86400000);
                            return (
                                <Box key={holiday.holiday_id || i}>
                                    <ListItem sx={{ px: 0, py: 1.5 }}>
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 32, height: 32 }}>
                                                <ScheduleIcon sx={{ fontSize: 18 }} />
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={<Typography variant="body2" fontWeight={500}>{holiday.holiday_name}</Typography>}
                                            secondary={
                                                <Box component="span">
                                                    <Typography variant="caption" color="text.secondary" component="span">
                                                        {hDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </Typography>
                                                    {daysUntil >= 0 && (
                                                        <Typography variant="caption" color="primary.main" fontWeight={500} sx={{ display: 'block' }}>
                                                            {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                            secondaryTypographyProps={{ component: 'div' }}
                                        />
                                    </ListItem>
                                    {i < holidays.length - 1 && <Divider />}
                                </Box>
                            );
                        })}
                    </List>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No upcoming holidays</Typography>
                )}
            </Paper>

            {/* Company Policies */}
            {companyPolicies.length > 0 && (
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                            Company Policies
                        </Typography>
                        <Button size="small" onClick={() => navigate('/policies')} sx={{ textTransform: 'none' }}>
                            View All
                        </Button>
                    </Box>
                    <List disablePadding>
                        {companyPolicies.map((policy, i) => (
                            <Box key={policy.policy_id}>
                                <ListItem sx={{ px: 0, py: 1.5 }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <Avatar sx={{ bgcolor: 'info.light', color: 'info.main', width: 32, height: 32 }}>
                                            <DescriptionIcon sx={{ fontSize: 18 }} />
                                        </Avatar>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={<Typography variant="body2" fontWeight={500}>{policy.policy_title}</Typography>}
                                        secondary={
                                            <Box component="span">
                                                <Chip 
                                                    label={policy.category} 
                                                    size="small" 
                                                    sx={{ height: 18, fontSize: '0.65rem', mr: 0.5 }} 
                                                />
                                                <Typography variant="caption" color="text.secondary" component="span">
                                                    {policy.description?.substring(0, 60)}{policy.description?.length > 60 ? '...' : ''}
                                                </Typography>
                                            </Box>
                                        }
                                        secondaryTypographyProps={{ component: 'div' }}
                                    />
                                </ListItem>
                                {i < companyPolicies.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default Dashboard;
