import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
    TextField,
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Checkbox,
    FormControlLabel,
    LinearProgress,
    Divider,
    Alert
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Pending as PendingIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Timeline as TimelineIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';

// Import components
import ClearanceChecklist from '../../components/Offboarding/ClearanceChecklist';
import ExitTimeline from '../../components/Offboarding/ExitTimeline';

// Mock clearance data
const mockClearanceData = [
    {
        id: 1,
        employeeId: 'EMP001',
        employeeName: 'John Smith',
        department: 'Engineering',
        lastWorkingDay: '2025-01-15',
        overallStatus: 'In Progress',
        clearances: {
            it: { status: 'Approved', approvedBy: 'IT Admin', approvedOn: '2025-01-03', comments: 'All assets returned' },
            hr: { status: 'Pending', approvedBy: '', approvedOn: '', comments: '' },
            admin: { status: 'Pending', approvedBy: '', approvedOn: '', comments: '' },
            finance: { status: 'Rejected', approvedBy: 'Finance Head', approvedOn: '2025-01-04', comments: 'Pending advance settlement' }
        }
    },
    {
        id: 2,
        employeeId: 'EMP005',
        employeeName: 'David Wilson',
        department: 'Sales',
        lastWorkingDay: '2024-12-31',
        overallStatus: 'Completed',
        clearances: {
            it: { status: 'Approved', approvedBy: 'IT Admin', approvedOn: '2024-12-20', comments: 'All assets returned' },
            hr: { status: 'Approved', approvedBy: 'HR Manager', approvedOn: '2024-12-22', comments: 'Documents collected' },
            admin: { status: 'Approved', approvedBy: 'Admin Head', approvedOn: '2024-12-23', comments: 'Office access revoked' },
            finance: { status: 'Approved', approvedBy: 'Finance Head', approvedOn: '2024-12-24', comments: 'All settlements cleared' }
        }
    }
];

const ClearanceTracking = () => {
    const [clearanceData, setClearanceData] = useState(mockClearanceData);
    const [showClearanceDialog, setShowClearanceDialog] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const handleViewClearance = (employee) => {
        setSelectedEmployee(employee);
        setShowClearanceDialog(true);
    };

    const handleClearanceUpdate = (employeeId, step, status, comments) => {
        setClearanceData(prev => prev.map(emp => {
            if (emp.id === employeeId) {
                const updatedClearances = {
                    ...emp.clearances,
                    [step]: {
                        status,
                        approvedBy: status === 'Approved' ? 'Current User' : status === 'Rejected' ? 'Current User' : '',
                        approvedOn: status !== 'Pending' ? new Date().toISOString().split('T')[0] : '',
                        comments
                    }
                };

                // Calculate overall status
                const statuses = Object.values(updatedClearances).map(c => c.status);
                let overallStatus = 'In Progress';
                if (statuses.every(s => s === 'Approved')) {
                    overallStatus = 'Completed';
                } else if (statuses.some(s => s === 'Rejected')) {
                    overallStatus = 'Issues Found';
                }

                return {
                    ...emp,
                    clearances: updatedClearances,
                    overallStatus
                };
            }
            return emp;
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'success';
            case 'Rejected': return 'error';
            case 'Pending': return 'warning';
            case 'Completed': return 'success';
            case 'In Progress': return 'info';
            case 'Issues Found': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <CheckIcon />;
            case 'Rejected': return <CancelIcon />;
            case 'Pending': return <PendingIcon />;
            default: return <PendingIcon />;
        }
    };

    const calculateProgress = (clearances) => {
        const total = Object.keys(clearances).length;
        const approved = Object.values(clearances).filter(c => c.status === 'Approved').length;
        return (approved / total) * 100;
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Clearance Tracking
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Track and manage employee clearance processes across departments
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => setClearanceData(mockClearanceData)}
                            size="small"
                        >
                            Refresh
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                            {clearanceData.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Active Clearances
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                            {clearanceData.filter(c => c.overallStatus === 'In Progress').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            In Progress
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                            {clearanceData.filter(c => c.overallStatus === 'Completed').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Completed
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Clearance Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Last Working Day</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>IT</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>HR</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Admin</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Finance</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Overall Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {clearanceData.map((employee) => (
                            <TableRow key={employee.id} hover>
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
                                                {employee.employeeId} • {employee.department}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>
                                        {new Date(employee.lastWorkingDay).toLocaleDateString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ width: 100 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={calculateProgress(employee.clearances)}
                                            color="primary"
                                            sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {Math.round(calculateProgress(employee.clearances))}%
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={employee.clearances.it.status}
                                        color={getStatusColor(employee.clearances.it.status)}
                                        size="small"
                                        icon={getStatusIcon(employee.clearances.it.status)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={employee.clearances.hr.status}
                                        color={getStatusColor(employee.clearances.hr.status)}
                                        size="small"
                                        icon={getStatusIcon(employee.clearances.hr.status)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={employee.clearances.admin.status}
                                        color={getStatusColor(employee.clearances.admin.status)}
                                        size="small"
                                        icon={getStatusIcon(employee.clearances.admin.status)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={employee.clearances.finance.status}
                                        color={getStatusColor(employee.clearances.finance.status)}
                                        size="small"
                                        icon={getStatusIcon(employee.clearances.finance.status)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={employee.overallStatus}
                                        color={getStatusColor(employee.overallStatus)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton size="small" onClick={() => handleViewClearance(employee)}>
                                            <ViewIcon />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Clearance Detail Dialog */}
            <Dialog open={showClearanceDialog} onClose={() => setShowClearanceDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimelineIcon />
                        Clearance Details - {selectedEmployee?.employeeName}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedEmployee && (
                        <ExitTimeline 
                            employee={selectedEmployee}
                            onClearanceUpdate={handleClearanceUpdate}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowClearanceDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ClearanceTracking;