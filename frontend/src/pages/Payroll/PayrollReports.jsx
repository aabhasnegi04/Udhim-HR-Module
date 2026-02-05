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
    Avatar,
    IconButton,
    Stack,
    Tabs,
    Tab,
    LinearProgress
} from '@mui/material';
import {
    Download as DownloadIcon,
    Print as PrintIcon,
    Refresh as RefreshIcon,
    Assessment as ReportIcon,
    TrendingUp as TrendingUpIcon,
    PieChart as PieChartIcon,
    BarChart as BarChartIcon
} from '@mui/icons-material';

// Mock report data
const mockReportData = {
    salaryRegister: [
        {
            employeeId: 'EMP001',
            employeeName: 'John Smith',
            department: 'Engineering',
            designation: 'Software Engineer',
            basicSalary: 50000,
            allowances: 35000,
            grossSalary: 90000,
            deductions: 15100,
            netSalary: 74900
        },
        {
            employeeId: 'EMP002',
            employeeName: 'Sarah Johnson',
            department: 'HR',
            designation: 'HR Manager',
            basicSalary: 40000,
            allowances: 28000,
            grossSalary: 71000,
            deductions: 10710,
            netSalary: 60290
        },
        {
            employeeId: 'EMP003',
            employeeName: 'Michael Chen',
            department: 'Engineering',
            designation: 'Senior Software Engineer',
            basicSalary: 60000,
            allowances: 42000,
            grossSalary: 110000,
            deductions: 19400,
            netSalary: 90600
        }
    ],
    departmentWise: [
        {
            department: 'Engineering',
            employeeCount: 25,
            totalGross: 2250000,
            totalDeductions: 337500,
            totalNet: 1912500,
            averageSalary: 90000
        },
        {
            department: 'HR',
            employeeCount: 8,
            totalGross: 568000,
            totalDeductions: 85200,
            totalNet: 482800,
            averageSalary: 71000
        },
        {
            department: 'Marketing',
            employeeCount: 15,
            totalGross: 750000,
            totalDeductions: 112500,
            totalNet: 637500,
            averageSalary: 50000
        },
        {
            department: 'Sales',
            employeeCount: 20,
            totalGross: 1000000,
            totalDeductions: 150000,
            totalNet: 850000,
            averageSalary: 50000
        }
    ],
    ctcComparison: [
        {
            employeeId: 'EMP001',
            employeeName: 'John Smith',
            currentCTC: 1080000,
            previousCTC: 960000,
            increment: 120000,
            incrementPercentage: 12.5
        },
        {
            employeeId: 'EMP002',
            employeeName: 'Sarah Johnson',
            currentCTC: 852000,
            previousCTC: 780000,
            increment: 72000,
            incrementPercentage: 9.2
        },
        {
            employeeId: 'EMP003',
            employeeName: 'Michael Chen',
            currentCTC: 1320000,
            previousCTC: 1200000,
            increment: 120000,
            incrementPercentage: 10.0
        }
    ],
    monthlyTrend: [
        { month: 'Aug 2024', totalPayroll: 4500000, employeeCount: 68 },
        { month: 'Sep 2024', totalPayroll: 4650000, employeeCount: 68 },
        { month: 'Oct 2024', totalPayroll: 4750000, employeeCount: 68 },
        { month: 'Nov 2024', totalPayroll: 4850000, employeeCount: 68 },
        { month: 'Dec 2024', totalPayroll: 5000000, employeeCount: 68 }
    ]
};

const PayrollReports = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedMonth, setSelectedMonth] = useState('2025-01');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [reportType, setReportType] = useState('summary');

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleExportReport = (format) => {
        console.log(`Exporting report in ${format} format`);
        // Export logic would go here
    };

    const renderSalaryRegister = () => (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Salary Register
            </Typography>
            
            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                            {mockReportData.salaryRegister.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Employees
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                            ₹{Math.round(mockReportData.salaryRegister.reduce((sum, emp) => sum + emp.grossSalary, 0) / 100000)}L
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Gross Salary
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
                            ₹{Math.round(mockReportData.salaryRegister.reduce((sum, emp) => sum + emp.deductions, 0) / 1000)}K
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Deductions
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                            ₹{Math.round(mockReportData.salaryRegister.reduce((sum, emp) => sum + emp.netSalary, 0) / 100000)}L
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Net Payable
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Salary Register Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Basic Salary</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Allowances</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Gross Salary</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Deductions</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Net Salary</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockReportData.salaryRegister.map((employee) => (
                            <TableRow key={employee.employeeId} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                            {employee.employeeName.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {employee.employeeName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {employee.employeeId}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>{employee.department}</TableCell>
                                <TableCell>{employee.designation}</TableCell>
                                <TableCell align="right">₹{employee.basicSalary.toLocaleString('en-IN')}</TableCell>
                                <TableCell align="right">₹{employee.allowances.toLocaleString('en-IN')}</TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600}>
                                        ₹{employee.grossSalary.toLocaleString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ color: 'error.main' }}>
                                    ₹{employee.deductions.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600} color="success.main">
                                        ₹{employee.netSalary.toLocaleString('en-IN')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    const renderDepartmentWise = () => (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Department-wise Payroll Analysis
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {mockReportData.departmentWise.map((dept, index) => (
                    <Card key={index} sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                {dept.department}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Employee Count
                                </Typography>
                                <Typography variant="h6" fontWeight={600}>
                                    {dept.employeeCount}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Total Gross
                                </Typography>
                                <Typography variant="h6" color="primary.main" fontWeight={600}>
                                    ₹{(dept.totalGross / 100000).toFixed(1)}L
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Total Deductions
                                </Typography>
                                <Typography variant="h6" color="error.main" fontWeight={600}>
                                    ₹{(dept.totalDeductions / 1000).toFixed(0)}K
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Net Payable
                                </Typography>
                                <Typography variant="h6" color="success.main" fontWeight={600}>
                                    ₹{(dept.totalNet / 100000).toFixed(1)}L
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={(dept.totalNet / dept.totalGross) * 100}
                                color="success"
                                sx={{ height: 8, borderRadius: 4, mb: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                Average Salary: ₹{(dept.averageSalary / 1000).toFixed(0)}K
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Box>
    );

    const renderCTCComparison = () => (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                CTC Comparison & Increment Analysis
            </Typography>
            
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Previous CTC</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Current CTC</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Increment</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Increment %</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Performance</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockReportData.ctcComparison.map((employee) => (
                            <TableRow key={employee.employeeId} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                            {employee.employeeName.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {employee.employeeName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {employee.employeeId}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    ₹{(employee.previousCTC / 100000).toFixed(1)}L
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600}>
                                        ₹{(employee.currentCTC / 100000).toFixed(1)}L
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600} color="success.main">
                                        +₹{(employee.increment / 1000).toFixed(0)}K
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600} color="primary.main">
                                        {employee.incrementPercentage}%
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={employee.incrementPercentage > 10 ? 'Excellent' : 'Good'}
                                        color={employee.incrementPercentage > 10 ? 'success' : 'info'}
                                        size="small"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    const renderMonthlyTrend = () => (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Monthly Payroll Trend
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                {mockReportData.monthlyTrend.map((month, index) => (
                    <Card key={index} sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                {month.month}
                            </Typography>
                            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>
                                ₹{(month.totalPayroll / 100000).toFixed(1)}L
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                Total Payroll
                            </Typography>
                            <Typography variant="body2" color="info.main" fontWeight={600}>
                                {month.employeeCount} Employees
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* Trend Analysis */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Trend Analysis
                </Typography>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Average Monthly Growth</Typography>
                        <Typography variant="h6" color="success.main" fontWeight={600}>+2.8%</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Highest Month</Typography>
                        <Typography variant="h6" fontWeight={600}>Dec 2024</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">YoY Growth</Typography>
                        <Typography variant="h6" color="primary.main" fontWeight={600}>+15.2%</Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );

    const tabs = [
        { label: 'Salary Register', icon: <ReportIcon />, component: renderSalaryRegister() },
        { label: 'Department Analysis', icon: <PieChartIcon />, component: renderDepartmentWise() },
        { label: 'CTC Comparison', icon: <TrendingUpIcon />, component: renderCTCComparison() },
        { label: 'Monthly Trend', icon: <BarChartIcon />, component: renderMonthlyTrend() }
    ];

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Payroll Reports & Analytics
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Comprehensive payroll analysis and detailed reports
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            onClick={() => window.print()}
                            size="small"
                        >
                            Print
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleExportReport('excel')}
                            size="small"
                        >
                            Excel
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleExportReport('pdf')}
                            size="small"
                        >
                            PDF
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
                    <Box sx={{ flex: '0 0 150px', minWidth: '150px' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Department</InputLabel>
                            <Select
                                value={departmentFilter}
                                label="Department"
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Departments</MenuItem>
                                <MenuItem value="Engineering">Engineering</MenuItem>
                                <MenuItem value="HR">HR</MenuItem>
                                <MenuItem value="Marketing">Marketing</MenuItem>
                                <MenuItem value="Sales">Sales</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary">
                            Report Period: {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Report Tabs */}
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

            {/* Report Content */}
            <Box>
                {tabs[activeTab]?.component}
            </Box>
        </Box>
    );
};

export default PayrollReports;