import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Divider,
    Avatar,
} from '@mui/material';
import {
    AccountBalance as SalaryIcon,
    TrendingUp as EarningsIcon,
    TrendingDown as DeductionsIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';

const SalaryCard = ({ title, amount, subtitle, icon, color, isPositive = true }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {title}
                    </Typography>
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            fontWeight: 700, 
                            mb: 0.5,
                            color: isPositive ? 'success.main' : 'error.main'
                        }}
                    >
                        ₹{amount?.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {subtitle}
                    </Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 48, height: 48 }}>
                    {icon}
                </Avatar>
            </Box>
        </CardContent>
    </Card>
);

const SalaryPreview = ({ employee }) => {
    if (!employee) return null;

    // Mock salary data
    const salaryStructure = {
        basicSalary: 50000,
        hra: 20000,
        allowances: 15000,
        grossSalary: 85000,
        pf: 6000,
        tax: 8500,
        insurance: 2000,
        totalDeductions: 16500,
        netSalary: 68500
    };

    // Mock payslip history
    const payslipHistory = [
        { 
            month: 'December 2025', 
            gross: 85000, 
            deductions: 16500, 
            net: 68500, 
            status: 'Processed' 
        },
        { 
            month: 'November 2025', 
            gross: 85000, 
            deductions: 16500, 
            net: 68500, 
            status: 'Processed' 
        },
        { 
            month: 'October 2025', 
            gross: 85000, 
            deductions: 16500, 
            net: 68500, 
            status: 'Processed' 
        },
        { 
            month: 'September 2025', 
            gross: 82000, 
            deductions: 15800, 
            net: 66200, 
            status: 'Processed' 
        },
        { 
            month: 'August 2025', 
            gross: 82000, 
            deductions: 15800, 
            net: 66200, 
            status: 'Processed' 
        },
    ];

    return (
        <Box sx={{ mt: 3 }}>
            {/* Salary Summary Cards */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                Current Salary Structure
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <SalaryCard
                        title="Gross Salary"
                        amount={salaryStructure.grossSalary}
                        subtitle="Monthly"
                        icon={<SalaryIcon />}
                        color="primary"
                        isPositive={true}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <SalaryCard
                        title="Total Deductions"
                        amount={salaryStructure.totalDeductions}
                        subtitle="Monthly"
                        icon={<DeductionsIcon />}
                        color="error"
                        isPositive={false}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <SalaryCard
                        title="Net Salary"
                        amount={salaryStructure.netSalary}
                        subtitle="Take home"
                        icon={<EarningsIcon />}
                        color="success"
                        isPositive={true}
                    />
                </Grid>
            </Grid>

            {/* Detailed Breakdown */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Salary Breakdown
                </Typography>
                
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
                            Earnings
                        </Typography>
                        <Box sx={{ space: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Basic Salary</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    ₹{salaryStructure.basicSalary.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">HRA</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    ₹{salaryStructure.hra.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="body2">Allowances</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    ₹{salaryStructure.allowances.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>Total Earnings</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                                    ₹{salaryStructure.grossSalary.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>
                            Deductions
                        </Typography>
                        <Box sx={{ space: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Provident Fund</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    ₹{salaryStructure.pf.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Income Tax</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    ₹{salaryStructure.tax.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="body2">Insurance</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    ₹{salaryStructure.insurance.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>Total Deductions</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: 'error.main' }}>
                                    ₹{salaryStructure.totalDeductions.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Net Salary
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        ₹{salaryStructure.netSalary.toLocaleString('en-IN')}
                    </Typography>
                </Box>
            </Paper>

            {/* Payslip History */}
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Payslip History
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        size="small"
                    >
                        View All
                    </Button>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Month</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Gross Salary</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Deductions</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Net Salary</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {payslipHistory.map((payslip, index) => (
                                <TableRow key={index} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>
                                        {payslip.month}
                                    </TableCell>
                                    <TableCell align="right">
                                        ₹{payslip.gross.toLocaleString('en-IN')}
                                    </TableCell>
                                    <TableCell align="right">
                                        ₹{payslip.deductions.toLocaleString('en-IN')}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                                        ₹{payslip.net.toLocaleString('en-IN')}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Button
                                            variant="outlined"
                                            startIcon={<DownloadIcon />}
                                            size="small"
                                        >
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

export default SalaryPreview;