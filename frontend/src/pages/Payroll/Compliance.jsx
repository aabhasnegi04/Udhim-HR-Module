import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Stack,
    Tabs,
    Tab,
    Alert,
    LinearProgress
} from '@mui/material';
import {
    Download as DownloadIcon,
    Visibility as ViewIcon,
    Print as PrintIcon,
    Refresh as RefreshIcon,
    AccountBalance as PFIcon,
    LocalHospital as ESIIcon,
    Gavel as PTIcon,
    Receipt as TDSIcon,
    Description as Form16Icon
} from '@mui/icons-material';

// Mock compliance data
const mockComplianceData = {
    pf: {
        summary: {
            totalEmployees: 45,
            totalEmployerContribution: 125000,
            totalEmployeeContribution: 125000,
            totalContribution: 250000
        },
        details: [
            { employeeId: 'EMP001', employeeName: 'John Smith', basicSalary: 50000, employeeContribution: 6000, employerContribution: 6000 },
            { employeeId: 'EMP002', employeeName: 'Sarah Johnson', basicSalary: 40000, employeeContribution: 4800, employerContribution: 4800 },
            { employeeId: 'EMP003', employeeName: 'Michael Chen', basicSalary: 60000, employeeContribution: 7200, employerContribution: 7200 }
        ]
    },
    esi: {
        summary: {
            totalEmployees: 25,
            totalEmployerContribution: 18750,
            totalEmployeeContribution: 6250,
            totalContribution: 25000
        },
        details: [
            { employeeId: 'EMP001', employeeName: 'John Smith', grossSalary: 90000, employeeContribution: 900, employerContribution: 2700 },
            { employeeId: 'EMP002', employeeName: 'Sarah Johnson', grossSalary: 71000, employeeContribution: 710, employerContribution: 2130 }
        ]
    },
    pt: {
        summary: {
            totalEmployees: 50,
            totalAmount: 10000,
            averagePerEmployee: 200
        },
        details: [
            { employeeId: 'EMP001', employeeName: 'John Smith', grossSalary: 90000, ptAmount: 200 },
            { employeeId: 'EMP002', employeeName: 'Sarah Johnson', grossSalary: 71000, ptAmount: 200 },
            { employeeId: 'EMP003', employeeName: 'Michael Chen', grossSalary: 110000, ptAmount: 200 }
        ]
    },
    tds: {
        summary: {
            totalEmployees: 35,
            totalTDSDeducted: 450000,
            averagePerEmployee: 12857
        },
        details: [
            { employeeId: 'EMP001', employeeName: 'John Smith', annualSalary: 1080000, tdsDeducted: 96000, taxSlab: '20%' },
            { employeeId: 'EMP002', employeeName: 'Sarah Johnson', annualSalary: 852000, tdsDeducted: 60000, taxSlab: '20%' },
            { employeeId: 'EMP003', employeeName: 'Michael Chen', annualSalary: 1320000, tdsDeducted: 144000, taxSlab: '30%' }
        ]
    }
};

const Compliance = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedMonth, setSelectedMonth] = useState('2025-01');
    const [selectedYear, setSelectedYear] = useState('2025');

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleDownloadReport = (reportType) => {
        console.log(`Downloading ${reportType} report for ${selectedMonth}`);
        // Download logic would go here
    };

    const renderPFSummary = () => (
        <Box>
            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                            {mockComplianceData.pf.summary.totalEmployees}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Eligible Employees
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                            ₹{(mockComplianceData.pf.summary.totalEmployeeContribution / 1000).toFixed(0)}K
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Employee Contribution
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                            ₹{(mockComplianceData.pf.summary.totalEmployerContribution / 1000).toFixed(0)}K
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Employer Contribution
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                            ₹{(mockComplianceData.pf.summary.totalContribution / 1000).toFixed(0)}K
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total PF Contribution
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* PF Details Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Basic Salary</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Employee PF (12%)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Employer PF (12%)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Total PF</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockComplianceData.pf.details.map((employee, index) => (
                            <TableRow key={index} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>
                                        {employee.employeeName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {employee.employeeId}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    ₹{employee.basicSalary.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell align="right">
                                    ₹{employee.employeeContribution.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell align="right">
                                    ₹{employee.employerContribution.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600}>
                                        ₹{(employee.employeeContribution + employee.employerContribution).toLocaleString('en-IN')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    const renderESISummary = () => (
        <Box>
            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                            {mockComplianceData.esi.summary.totalEmployees}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Eligible Employees
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                            ₹{(mockComplianceData.esi.summary.totalEmployeeContribution / 1000).toFixed(0)}K
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Employee Contribution (0.75%)
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                            ₹{(mockComplianceData.esi.summary.totalEmployerContribution / 1000).toFixed(0)}K
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Employer Contribution (3.25%)
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                            ₹{(mockComplianceData.esi.summary.totalContribution / 1000).toFixed(0)}K
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total ESI Contribution
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
                ESI is applicable for employees with gross salary up to ₹25,000 per month.
            </Alert>

            {/* ESI Details Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Gross Salary</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Employee ESI (0.75%)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Employer ESI (3.25%)</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Total ESI</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockComplianceData.esi.details.map((employee, index) => (
                            <TableRow key={index} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>
                                        {employee.employeeName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {employee.employeeId}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    ₹{employee.grossSalary.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell align="right">
                                    ₹{employee.employeeContribution.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell align="right">
                                    ₹{employee.employerContribution.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600}>
                                        ₹{(employee.employeeContribution + employee.employerContribution).toLocaleString('en-IN')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    const renderPTSummary = () => (
        <Box>
            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                            {mockComplianceData.pt.summary.totalEmployees}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Eligible Employees
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                            ₹{mockComplianceData.pt.summary.totalAmount.toLocaleString('en-IN')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total PT Collected
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                            ₹{mockComplianceData.pt.summary.averagePerEmployee}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Average per Employee
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
                Professional Tax varies by state. Current rate: ₹200 per month for salaries above ₹10,000.
            </Alert>

            {/* PT Details Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Gross Salary</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">PT Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockComplianceData.pt.details.map((employee, index) => (
                            <TableRow key={index} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>
                                        {employee.employeeName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {employee.employeeId}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    ₹{employee.grossSalary.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600}>
                                        ₹{employee.ptAmount}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip label="Deducted" color="success" size="small" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    const renderTDSSummary = () => (
        <Box>
            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                            {mockComplianceData.tds.summary.totalEmployees}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Employees with TDS
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
                            ₹{(mockComplianceData.tds.summary.totalTDSDeducted / 100000).toFixed(1)}L
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total TDS Deducted
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                            ₹{Math.round(mockComplianceData.tds.summary.averagePerEmployee / 1000)}K
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Average TDS per Employee
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            <Alert severity="warning" sx={{ mb: 3 }}>
                TDS rates vary based on income slabs. Ensure Form 16 is generated for all employees with TDS deductions.
            </Alert>

            {/* TDS Details Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Annual Salary</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">TDS Deducted</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Tax Slab</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockComplianceData.tds.details.map((employee, index) => (
                            <TableRow key={index} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>
                                        {employee.employeeName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {employee.employeeId}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    ₹{(employee.annualSalary / 100000).toFixed(1)}L
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600} color="error.main">
                                        ₹{employee.tdsDeducted.toLocaleString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip label={employee.taxSlab} color="info" size="small" />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small">
                                        <Form16Icon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    const tabs = [
        { label: 'Provident Fund', icon: <PFIcon />, component: renderPFSummary() },
        { label: 'ESI', icon: <ESIIcon />, component: renderESISummary() },
        { label: 'Professional Tax', icon: <PTIcon />, component: renderPTSummary() },
        { label: 'TDS', icon: <TDSIcon />, component: renderTDSSummary() }
    ];

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Compliance & Statutory Reports
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage PF, ESI, Professional Tax, and TDS compliance reports
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            size="small"
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownloadReport('compliance')}
                            size="small"
                        >
                            Export All
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '0 0 150px', minWidth: '150px' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Month</InputLabel>
                            <Select
                                value={selectedMonth}
                                label="Month"
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            >
                                <MenuItem value="2025-01">January 2025</MenuItem>
                                <MenuItem value="2024-12">December 2024</MenuItem>
                                <MenuItem value="2024-11">November 2024</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '0 0 120px', minWidth: '120px' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Year</InputLabel>
                            <Select
                                value={selectedYear}
                                label="Year"
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                <MenuItem value="2025">2025</MenuItem>
                                <MenuItem value="2024">2024</MenuItem>
                                <MenuItem value="2023">2023</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary">
                            Compliance Period: {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Compliance Tabs */}
            <Paper sx={{ mb: { xs: 2, sm: 3 } }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            minWidth: { xs: 'auto', sm: 120 },
                            px: { xs: 2, sm: 3 }
                        }
                    }}
                >
                    {tabs.map((tab, index) => (
                        <Tab
                            key={index}
                            label={tab.label}
                            icon={tab.icon}
                            iconPosition="start"
                        />
                    ))}
                </Tabs>
            </Paper>

            {/* Tab Content */}
            <Box>
                {tabs[activeTab]?.component}
            </Box>
        </Box>
    );
};

export default Compliance;