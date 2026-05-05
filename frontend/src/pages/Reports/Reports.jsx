import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
} from '@mui/material';
import {
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    Warning as WarningIcon,
    AttachMoney as PayrollIcon,
    ListAlt as ListIcon,
    Business as OfficeIcon,
    Assessment as ReportIcon,
} from '@mui/icons-material';

const Reports = () => {
    const navigate = useNavigate();

    const reportCards = [
        {
            id: 'currently-present',
            title: 'Currently Present',
            description: 'Real-time view of factory employees present today',
            icon: <PeopleIcon sx={{ fontSize: 40 }} />,
            color: '#1976D2',
            category: 'Factory Attendance',
            path: '/attendance',
            state: { attendanceType: 'factory', tab: 1 }
        },
        {
            id: 'factory-records',
            title: 'Factory Records',
            description: 'View and export factory attendance history',
            icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
            color: '#2E7D32',
            category: 'Factory Attendance',
            path: '/attendance',
            state: { attendanceType: 'factory', tab: 2 }
        },
        {
            id: 'pending-attendance',
            title: 'Pending Attendance',
            description: 'Records needing HR correction',
            icon: <WarningIcon sx={{ fontSize: 40 }} />,
            color: '#ED6C02',
            category: 'Factory Attendance',
            path: '/attendance',
            state: { attendanceType: 'factory', tab: 3 }
        },
        {
            id: 'date-range-report',
            title: 'Date Range Report',
            description: 'Datewise hours summary for factory workers',
            icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
            color: '#1565C0',
            category: 'Factory Attendance',
            path: '/attendance',
            state: { attendanceType: 'factory', tab: 5 }
        },
        {
            id: 'department-shift-summary',
            title: 'Department Shift Summary',
            description: 'Department-wise employee count by shift',
            icon: <ReportIcon sx={{ fontSize: 40 }} />,
            color: '#5E35B1',
            category: 'Factory Attendance',
            path: '/reports/department-shift-summary',
            comingSoon: false
        },
        {
            id: 'office-records',
            title: 'Office Attendance',
            description: 'Office employee attendance records',
            icon: <OfficeIcon sx={{ fontSize: 40 }} />,
            color: '#0288D1',
            category: 'Office Attendance',
            path: '/attendance',
            state: { attendanceType: 'office', tab: 1 }
        },
        {
            id: 'employee-list',
            title: 'Employee List',
            description: 'Download complete employee directory with filters',
            icon: <ListIcon sx={{ fontSize: 40 }} />,
            color: '#00897B',
            category: 'Employees',
            path: '/reports/employee-list',
            comingSoon: false
        },
        {
            id: 'payroll-report',
            title: 'Payroll Report',
            description: 'Monthly payroll summary',
            icon: <PayrollIcon sx={{ fontSize: 40 }} />,
            color: '#7B1FA2',
            category: 'Payroll',
            path: '/payroll',
            comingSoon: true
        },
    ];

    const handleCardClick = (report) => {
        if (report.comingSoon) {
            return;
        }
        if (report.path) {
            // Navigate with state to set the correct tab
            navigate(report.path, { state: report.state });
        }
    };

    const groupedReports = reportCards.reduce((acc, report) => {
        if (!acc[report.category]) {
            acc[report.category] = [];
        }
        acc[report.category].push(report);
        return acc;
    }, {});

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ mb: 3 }}>
                <Typography 
                    variant="h5" 
                    fontWeight={700} 
                    gutterBottom
                    sx={{ fontSize: '1.5rem' }}
                >
                    Reports
                </Typography>
                <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: '0.875rem' }}
                >
                    Access all reports and exports
                </Typography>
            </Box>

            {Object.entries(groupedReports).map(([category, reports]) => (
                <Box key={category} sx={{ mb: 3 }}>
                    <Typography 
                        variant="h6" 
                        fontWeight={600} 
                        sx={{ 
                            mb: 2,
                            fontSize: '1.1rem'
                        }}
                    >
                        {category}
                    </Typography>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, 1fr)',
                                md: 'repeat(3, 1fr)'
                            },
                            gap: 2.5,
                        }}
                    >
                        {reports.map((report) => (
                            <Card
                                key={report.id}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: '160px',
                                    cursor: report.comingSoon ? 'not-allowed' : 'pointer',
                                    opacity: report.comingSoon ? 0.6 : 1,
                                    transition: 'all 0.3s',
                                    '&:hover': report.comingSoon ? {} : {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4,
                                    },
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                                onClick={() => handleCardClick(report)}
                            >
                                <CardContent sx={{ flexGrow: 1, p: 2.5, pb: 1 }}>
                                    <Box
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            flexShrink: 0,
                                            borderRadius: 2,
                                            bgcolor: `${report.color}15`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 1.5,
                                            color: report.color,
                                        }}
                                    >
                                        {report.icon}
                                    </Box>
                                    <Typography 
                                        variant="subtitle1" 
                                        fontWeight={600} 
                                        sx={{ 
                                            fontSize: '0.95rem',
                                            lineHeight: 1.3,
                                            mb: 0.5
                                        }}
                                    >
                                        {report.title}
                                        {report.comingSoon && (
                                            <Chip
                                                label="Soon"
                                                size="small"
                                                sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                                            />
                                        )}
                                    </Typography>
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary"
                                        sx={{ 
                                            fontSize: '0.75rem',
                                            lineHeight: 1.4
                                        }}
                                    >
                                        {report.description}
                                    </Typography>
                                </CardContent>
                                {!report.comingSoon && (
                                    <CardActions sx={{ px: 2.5, pb: 2, pt: 0 }}>
                                        <Button
                                            size="small"
                                            sx={{ 
                                                color: report.color,
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                textTransform: 'none',
                                                p: 0,
                                                minWidth: 'auto'
                                            }}
                                        >
                                            Open Report →
                                        </Button>
                                    </CardActions>
                                )}
                            </Card>
                        ))}
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

export default Reports;
