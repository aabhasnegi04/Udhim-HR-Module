import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
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
    CircularProgress
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
import payrollService from '../../services/payrollService';

const Compliance = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Real data states
    const [pfData, setPfData] = useState([]);
    const [esiData, setEsiData] = useState([]);
    const [ptData, setPtData] = useState([]);
    const [tdsData, setTdsData] = useState([]);

    useEffect(() => {
        loadPeriods();
    }, []);

    useEffect(() => {
        if (selectedPeriod) {
            loadComplianceData();
        }
    }, [selectedPeriod, activeTab]);

    const loadPeriods = async () => {
        try {
            setLoading(true);
            const response = await payrollService.getPeriods();
            if (response.success) {
                setPeriods(response.data || []);
                if (response.data && response.data.length > 0) {
                    setSelectedPeriod(response.data[0].period_id);
                }
            }
        } catch (err) {
            setError('Failed to load payroll periods');
        } finally {
            setLoading(false);
        }
    };

    const loadComplianceData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Load data based on active tab
            switch (activeTab) {
                case 0: // PF
                    const pfResponse = await payrollService.getPFSummary(selectedPeriod);
                    setPfData(Array.isArray(pfResponse?.data) ? pfResponse.data : []);
                    break;
                case 1: // ESI
                    const esiResponse = await payrollService.getESISummary(selectedPeriod);
                    setEsiData(Array.isArray(esiResponse?.data) ? esiResponse.data : []);
                    break;
                case 2: // PT
                    const ptResponse = await payrollService.getPTSummary(selectedPeriod);
                    setPtData(Array.isArray(ptResponse?.data) ? ptResponse.data : []);
                    break;
                case 3: // TDS
                    const tdsResponse = await payrollService.getTDSSummary(selectedPeriod);
                    setTdsData(Array.isArray(tdsResponse?.data) ? tdsResponse.data : []);
                    break;
            }
        } catch (err) {
            setError('Failed to load compliance data');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handlePeriodChange = (event) => {
        setSelectedPeriod(event.target.value);
    };

    const handleDownloadReport = (reportType) => {
        // Download logic would go here
    };

    const calculatePFSummary = () => {
        if (!Array.isArray(pfData) || pfData.length === 0) return { totalEmployees: 0, totalEmployee: 0, totalEmployer: 0, total: 0 };
        if (!pfData || pfData.length === 0) return { totalEmployees: 0, totalEmployee: 0, totalEmployer: 0, total: 0 };
        return {
            totalEmployees: pfData.length,
            totalEmployee: pfData.reduce((sum, emp) => sum + (parseFloat(emp.employee_contribution) || 0), 0),
            totalEmployer: pfData.reduce((sum, emp) => sum + (parseFloat(emp.employer_contribution) || 0), 0),
            total: pfData.reduce((sum, emp) => sum + (parseFloat(emp.total_pf) || 0), 0)
        };
    };

    const calculateESISummary = () => {
        if (!Array.isArray(esiData) || esiData.length === 0) return { totalEmployees: 0, totalEmployee: 0, totalEmployer: 0, total: 0 };
        return {
            totalEmployees: esiData.length,
            totalEmployee: esiData.reduce((sum, emp) => sum + (parseFloat(emp.employee_contribution) || 0), 0),
            totalEmployer: esiData.reduce((sum, emp) => sum + (parseFloat(emp.employer_contribution) || 0), 0),
            total: esiData.reduce((sum, emp) => sum + (parseFloat(emp.total_esi) || 0), 0)
        };
    };

    const calculatePTSummary = () => {
        if (!Array.isArray(ptData) || ptData.length === 0) return { totalEmployees: 0, totalAmount: 0, average: 0 };
        const total = ptData.reduce((sum, emp) => sum + (parseFloat(emp.pt_amount) || 0), 0);
        return {
            totalEmployees: ptData.length,
            totalAmount: total,
            average: ptData.length > 0 ? total / ptData.length : 0
        };
    };

    const calculateTDSSummary = () => {
        if (!Array.isArray(tdsData) || tdsData.length === 0) return { totalEmployees: 0, totalTDS: 0, average: 0 };
        const total = tdsData.reduce((sum, emp) => sum + (parseFloat(emp.tds_deducted) || 0), 0);
        return {
            totalEmployees: tdsData.length,
            totalTDS: total,
            average: tdsData.length > 0 ? total / tdsData.length : 0
        };
    };

    const renderPFSummary = () => {
        const summary = calculatePFSummary();
        
        return (
            <Box>
                {/* Summary Cards */}
                <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                    <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                                {summary.totalEmployees}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Eligible Employees
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                                ₹{summary.totalEmployee.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Employee Contribution
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                                ₹{summary.totalEmployer.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Employer Contribution
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                                ₹{summary.total.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total PF Contribution
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : pfData.length > 0 ? (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Gross Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Employee PF (12%)</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Employer PF (12%)</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Total PF</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pfData.map((employee, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {employee.employee_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {employee.employee_code}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{employee.department_name || 'N/A'}</TableCell>
                                        <TableCell align="right">
                                            ₹{(parseFloat(employee.gross_salary) || 0).toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell align="right">
                                            ₹{(parseFloat(employee.employee_contribution) || 0).toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell align="right">
                                            ₹{(parseFloat(employee.employer_contribution) || 0).toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600}>
                                                ₹{(parseFloat(employee.total_pf) || 0).toLocaleString('en-IN')}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Alert severity="info">
                        No PF data available for this period. Employees may not have PF deductions.
                    </Alert>
                )}
            </Box>
        );
    };

    const renderESISummary = () => {
        const summary = calculateESISummary();
        
        return (
            <Box>
                {/* Summary Cards */}
                <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                    <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                                {summary.totalEmployees}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Eligible Employees
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                                ₹{summary.totalEmployee.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Employee Contribution (0.75%)
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                                ₹{summary.totalEmployer.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Employer Contribution (3.25%)
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                                ₹{summary.total.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total ESI Contribution
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                <Alert severity="info" sx={{ mb: 3 }}>
                    ESI is applicable for employees with gross salary up to ₹21,000 per month.
                </Alert>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : esiData.length > 0 ? (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Gross Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Employee ESI (0.75%)</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Employer ESI (3.25%)</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Total ESI</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {esiData.map((employee, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {employee.employee_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {employee.employee_code}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{employee.department_name || 'N/A'}</TableCell>
                                        <TableCell align="right">
                                            ₹{(parseFloat(employee.gross_salary) || 0).toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell align="right">
                                            ₹{(parseFloat(employee.employee_contribution) || 0).toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell align="right">
                                            ₹{(parseFloat(employee.employer_contribution) || 0).toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600}>
                                                ₹{(parseFloat(employee.total_esi) || 0).toLocaleString('en-IN')}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Alert severity="info">
                        No ESI data available for this period. Employees may not be eligible for ESI.
                    </Alert>
                )}
            </Box>
        );
    };

    const renderPTSummary = () => {
        const summary = calculatePTSummary();
        
        return (
            <Box>
                {/* Summary Cards */}
                <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                    <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                                {summary.totalEmployees}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Eligible Employees
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                                ₹{summary.totalAmount.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total PT Collected
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                                ₹{Math.round(summary.average)}
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

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : ptData.length > 0 ? (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Gross Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">PT Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ptData.map((employee, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {employee.employee_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {employee.employee_code}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{employee.department_name || 'N/A'}</TableCell>
                                        <TableCell align="right">
                                            ₹{(parseFloat(employee.gross_salary) || 0).toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600}>
                                                ₹{(parseFloat(employee.pt_amount) || 0).toLocaleString('en-IN')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={employee.status || 'DEDUCTED'} 
                                                color={employee.status === 'DEDUCTED' ? 'success' : 'default'} 
                                                size="small" 
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Alert severity="info">
                        No PT data available for this period.
                    </Alert>
                )}
            </Box>
        );
    };

    const renderTDSSummary = () => {
        const summary = calculateTDSSummary();
        
        return (
            <Box>
                {/* Summary Cards */}
                <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                    <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                                {summary.totalEmployees}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Employees with TDS
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
                                ₹{summary.totalTDS.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total TDS Deducted
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                                ₹{Math.round(summary.average).toLocaleString('en-IN')}
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

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : tdsData.length > 0 ? (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Annual Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">TDS Deducted</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Tax Slab</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tdsData.map((employee, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {employee.employee_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {employee.employee_code}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{employee.department_name || 'N/A'}</TableCell>
                                        <TableCell align="right">
                                            ₹{((parseFloat(employee.annual_salary) || 0) / 100000).toFixed(1)}L
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600} color="error.main">
                                                ₹{(parseFloat(employee.tds_deducted) || 0).toLocaleString('en-IN')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={employee.tax_slab || 'N/A'} color="info" size="small" />
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
                ) : (
                    <Alert severity="info">
                        No TDS data available for this period.
                    </Alert>
                )}
            </Box>
        );
    };

    const tabs = [
        { label: 'Provident Fund', icon: <PFIcon />, render: renderPFSummary },
        { label: 'ESI', icon: <ESIIcon />, render: renderESISummary },
        { label: 'Professional Tax', icon: <PTIcon />, render: renderPTSummary },
        { label: 'TDS', icon: <TDSIcon />, render: renderTDSSummary }
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
                            onClick={loadComplianceData}
                            size="small"
                            disabled={!selectedPeriod}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownloadReport('compliance')}
                            size="small"
                            disabled={!selectedPeriod}
                        >
                            Export All
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {!selectedPeriod && !loading && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Please select a payroll period to view compliance reports.
                </Alert>
            )}

            {/* Filters */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '0 0 250px', minWidth: '250px' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Payroll Period</InputLabel>
                            <Select
                                value={selectedPeriod || ''}
                                label="Payroll Period"
                                onChange={handlePeriodChange}
                            >
                                {periods.map(period => (
                                    <MenuItem key={period.period_id} value={period.period_id}>
                                        {period.period_name} ({period.status})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'right' }}>
                        {selectedPeriod && periods.length > 0 && (
                            <Typography variant="body2" color="text.secondary">
                                Compliance Period: {periods.find(p => p.period_id === selectedPeriod)?.period_name || ''}
                            </Typography>
                        )}
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
                {tabs[activeTab]?.render()}
            </Box>
        </Box>
    );
};

export default Compliance;