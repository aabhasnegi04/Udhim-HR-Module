import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    CardActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Stack,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Grid,
    CircularProgress
} from '@mui/material';
import {
    Download as DownloadIcon,
    Assessment as ReportIcon,
    People as PeopleIcon,
    Schedule as AttendanceIcon,
    BeachAccess as LeaveIcon,
    AccountBalance as PayrollIcon
} from '@mui/icons-material';
import adminService from '../../services/adminService';

const SystemReports = () => {
    const [selectedReport, setSelectedReport] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [department, setDepartment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Report types configuration
    const reportTypes = [
        {
            id: 'employee-master',
            title: 'Employee Master Report',
            description: 'Complete employee database with personal and official information',
            icon: <PeopleIcon />,
            category: 'Employee',
            lastGenerated: '2024-01-15',
            records: 8
        },
        {
            id: 'attendance-summary',
            title: 'Attendance Summary Report',
            description: 'Monthly attendance summary with present, absent, and leave days',
            icon: <AttendanceIcon />,
            category: 'Attendance',
            lastGenerated: '2024-01-14',
            records: 240
        },
        {
            id: 'leave-summary',
            title: 'Leave Summary Report',
            description: 'Leave balance, taken, and pending leave requests by employee',
            icon: <LeaveIcon />,
            category: 'Leave',
            lastGenerated: '2024-01-13',
            records: 24
        }
    ];

    const recentReports = [
        {
            id: 1,
            name: 'Employee Master Report - January 2026',
            type: 'Employee Master',
            generatedDate: '2026-01-29',
            generatedBy: 'Admin User',
            fileSize: '2.3 KB',
            status: 'Ready'
        }
    ];

    const departments = ['All Departments', 'Engineering', 'Human Resources', 'Marketing', 'Finance'];

    const handleGenerateReport = async () => {
        if (!selectedReport) {
            setError('Please select a report type');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            // Prepare filters
            const filters = {};
            
            if (dateRange.from) {
                filters.date_from = dateRange.from;
            }
            
            if (dateRange.to) {
                filters.date_to = dateRange.to;
            }
            
            if (department && department !== 'All Departments') {
                filters.department = department;
            }

            // Generate report
            const result = await adminService.generateSystemReport(selectedReport, filters);
            
            if (result.success) {
                setSuccess(`Report generated successfully! Found ${result.data.length} records.`);
                
                // Convert data to CSV and download
                if (result.data && result.data.length > 0) {
                    downloadCSV(result.data, selectedReport);
                }
            } else {
                setError(result.error || 'Failed to generate report');
            }
        } catch (err) {
            setError('Failed to generate report: ' + err.message);
            console.error('Report generation error:', err);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = (data, reportType) => {
        if (!data || data.length === 0) {
            setError('No data to download');
            return;
        }

        // Get column headers from first row
        const headers = Object.keys(data[0]);
        
        // Create CSV content
        const csvContent = [
            headers.join(','), // Header row
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Handle null/undefined values and escape commas
                    if (value === null || value === undefined) return '';
                    const stringValue = String(value);
                    // Escape quotes and wrap in quotes if contains comma
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(',')
            )
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `${reportType}-${timestamp}.csv`;
        link.setAttribute('download', filename);
        
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'Employee':
                return 'primary';
            case 'Attendance':
                return 'success';
            case 'Leave':
                return 'warning';
            case 'Payroll':
                return 'info';
            default:
                return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Ready':
                return 'success';
            case 'Processing':
                return 'warning';
            case 'Failed':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
                System reports provide comprehensive data exports for analysis and compliance. All reports include data from across modules.
            </Alert>

            {/* Success Message */}
            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Error Message */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Header Actions */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    System Reports
                </Typography>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                    >
                        Download Template
                    </Button>
                </Stack>
            </Box>

            {/* Report Generation Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ 
                            p: 1, 
                            borderRadius: 1, 
                            bgcolor: 'primary.light',
                            color: 'primary.main',
                            mr: 2 
                        }}>
                            <ReportIcon />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Generate New Report
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Select report type and configure filters to generate comprehensive data exports
                            </Typography>
                        </Box>
                    </Box>
                    
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        alignItems: 'flex-end',
                        flexWrap: 'wrap',
                        mb: 2
                    }}>
                        <Box sx={{ flex: '2 1 300px', minWidth: 300 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Report Type</InputLabel>
                                <Select
                                    value={selectedReport}
                                    onChange={(e) => setSelectedReport(e.target.value)}
                                    label="Report Type"
                                    size="small"
                                    sx={{
                                        '& .MuiSelect-select': {
                                            display: 'flex',
                                            alignItems: 'center',
                                            py: 1
                                        }
                                    }}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                maxHeight: 400,
                                                minWidth: 350,
                                                '& .MuiMenuItem-root': {
                                                    py: 1.5,
                                                    px: 2,
                                                    whiteSpace: 'normal'
                                                }
                                            }
                                        }
                                    }}
                                    renderValue={(selected) => {
                                        if (!selected) return '';
                                        const selectedReport = reportTypes.find(report => report.id === selected);
                                        if (!selectedReport) return '';
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ 
                                                    color: `${getCategoryColor(selectedReport.category)}.main`,
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}>
                                                    {selectedReport.icon}
                                                </Box>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {selectedReport.title}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {reportTypes.map((report) => (
                                        <MenuItem key={report.id} value={report.id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                                <Box sx={{ 
                                                    color: `${getCategoryColor(report.category)}.main`,
                                                    display: 'flex'
                                                }}>
                                                    {report.icon}
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                        {report.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {report.description}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        
                        <Box sx={{ flex: '1 1 150px', minWidth: 150 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Department</InputLabel>
                                <Select
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    label="Department"
                                    size="small"
                                >
                                    {departments.map((dept) => (
                                        <MenuItem key={dept} value={dept}>
                                            {dept}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        
                        <Box sx={{ flex: '0 1 140px', minWidth: 140 }}>
                            <TextField
                                label="From Date"
                                type="date"
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                value={dateRange.from}
                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                            />
                        </Box>
                        
                        <Box sx={{ flex: '0 1 140px', minWidth: 140 }}>
                            <TextField
                                label="To Date"
                                type="date"
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                value={dateRange.to}
                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                            />
                        </Box>
                        
                        <Box sx={{ flex: '0 0 auto' }}>
                            <Button
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ReportIcon />}
                                onClick={handleGenerateReport}
                                disabled={!selectedReport || loading}
                                sx={{ 
                                    height: 40,
                                    px: 3,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {loading ? 'Generating...' : 'Generate'}
                            </Button>
                        </Box>
                        
                        {selectedReport && (
                            <Box sx={{ flex: '0 0 auto' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setSelectedReport('');
                                        setDateRange({ from: '', to: '' });
                                        setDepartment('');
                                    }}
                                    sx={{ 
                                        height: 40,
                                        px: 2,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    Clear
                                </Button>
                            </Box>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {/* Available Report Types */}
            <Paper sx={{ mb: 3 }}>
                <Box sx={{ p: 3, pb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Available Report Types
                    </Typography>
                </Box>
                <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                    gap: 2,
                    p: 3,
                    pt: 0
                }}>
                    {reportTypes.map((report) => (
                        <Card 
                            key={report.id} 
                            variant="outlined"
                            sx={{ 
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    boxShadow: 2,
                                    borderColor: 'primary.main'
                                },
                                ...(selectedReport === report.id && {
                                    borderColor: 'primary.main',
                                    bgcolor: 'primary.50'
                                })
                            }}
                            onClick={() => setSelectedReport(report.id)}
                        >
                            <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ 
                                        p: 1, 
                                        borderRadius: 1, 
                                        bgcolor: `${getCategoryColor(report.category)}.light`,
                                        color: `${getCategoryColor(report.category)}.main`,
                                        mr: 2 
                                    }}>
                                        {report.icon}
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                            {report.title}
                                        </Typography>
                                        <Chip 
                                            label={report.category} 
                                            color={getCategoryColor(report.category)}
                                            size="small"
                                        />
                                    </Box>
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {report.description}
                                </Typography>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {report.records} records
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Last: {new Date(report.lastGenerated).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </Paper>

            {/* Recent Reports */}
            <Paper>
                <Box sx={{ p: 3, pb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Recent Reports
                    </Typography>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Report Name</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Generated Date</TableCell>
                                <TableCell>Generated By</TableCell>
                                <TableCell>File Size</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recentReports.map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {report.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={report.type} 
                                            variant="outlined"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(report.generatedDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{report.generatedBy}</TableCell>
                                    <TableCell>{report.fileSize}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={report.status} 
                                            color={getStatusColor(report.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            size="small"
                                            startIcon={<DownloadIcon />}
                                            disabled={report.status !== 'Ready'}
                                        >
                                            Download
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {recentReports.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                                            No reports generated yet. Generate your first report to see it here.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default SystemReports;