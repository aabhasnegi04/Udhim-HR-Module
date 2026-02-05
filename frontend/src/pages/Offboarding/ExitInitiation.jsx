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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    ExitToApp as ExitIcon,
    Refresh as RefreshIcon,
    Person as PersonIcon
} from '@mui/icons-material';

// Mock exit data
const mockExitData = [
    {
        id: 1,
        employeeId: 'EMP001',
        employeeName: 'John Smith',
        department: 'Engineering',
        designation: 'Senior Developer',
        lastWorkingDay: '2025-01-15',
        exitType: 'Resignation',
        exitReason: 'Better Opportunity',
        status: 'In Progress',
        initiatedBy: 'HR Team',
        initiatedOn: '2025-01-02'
    },
    {
        id: 2,
        employeeId: 'EMP005',
        employeeName: 'David Wilson',
        department: 'Sales',
        designation: 'Sales Executive',
        lastWorkingDay: '2024-12-31',
        exitType: 'Termination',
        exitReason: 'Performance Issues',
        status: 'Completed',
        initiatedBy: 'HR Team',
        initiatedOn: '2024-12-15'
    }
];

const ExitInitiation = () => {
    const [exitRequests, setExitRequests] = useState(mockExitData);
    const [showInitiateDialog, setShowInitiateDialog] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: '',
        lastWorkingDay: '',
        exitType: '',
        exitReason: '',
        notes: ''
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleInitiateExit = () => {
        const newExit = {
            id: exitRequests.length + 1,
            ...formData,
            employeeName: 'Selected Employee', // In real app, fetch from employee ID
            department: 'Department',
            designation: 'Designation',
            status: 'In Progress',
            initiatedBy: 'HR Team',
            initiatedOn: new Date().toISOString().split('T')[0]
        };
        
        setExitRequests(prev => [...prev, newExit]);
        setShowInitiateDialog(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            employeeId: '',
            lastWorkingDay: '',
            exitType: '',
            exitReason: '',
            notes: ''
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'In Progress': return 'warning';
            case 'Completed': return 'success';
            case 'Cancelled': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Employee Exit Initiation
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Initiate and manage employee offboarding processes
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => setExitRequests(mockExitData)}
                            size="small"
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setShowInitiateDialog(true)}
                        >
                            Initiate Exit
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                            {exitRequests.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Exit Requests
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                            {exitRequests.filter(e => e.status === 'In Progress').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            In Progress
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                            {exitRequests.filter(e => e.status === 'Completed').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Completed
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Exit Requests Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Exit Type</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Last Working Day</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Initiated On</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {exitRequests.map((exit) => (
                            <TableRow key={exit.id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                            {exit.employeeName.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {exit.employeeName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {exit.employeeId} • {exit.department}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip 
                                        label={exit.exitType} 
                                        size="small"
                                        color={exit.exitType === 'Resignation' ? 'info' : 'error'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>
                                        {new Date(exit.lastWorkingDay).toLocaleDateString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {exit.exitReason}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={exit.status}
                                        color={getStatusColor(exit.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {new Date(exit.initiatedOn).toLocaleDateString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton size="small">
                                            <ViewIcon />
                                        </IconButton>
                                        <IconButton size="small">
                                            <EditIcon />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Initiate Exit Dialog */}
            <Dialog open={showInitiateDialog} onClose={() => setShowInitiateDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ExitIcon />
                        Initiate Employee Exit
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 3, mt: 1 }}>
                        This will start the formal offboarding process for the selected employee.
                    </Alert>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Employee Selection */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Employee Information
                            </Typography>
                            <FormControl fullWidth>
                                <InputLabel>Select Employee</InputLabel>
                                <Select
                                    value={formData.employeeId}
                                    label="Select Employee"
                                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                                >
                                    <MenuItem value="EMP001">John Smith (EMP001) - Engineering</MenuItem>
                                    <MenuItem value="EMP002">Sarah Johnson (EMP002) - HR</MenuItem>
                                    <MenuItem value="EMP003">Michael Chen (EMP003) - Engineering</MenuItem>
                                    <MenuItem value="EMP004">Emily Davis (EMP004) - Sales</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Divider />

                        {/* Exit Details */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Exit Details
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <TextField
                                    fullWidth
                                    label="Last Working Day"
                                    type="date"
                                    value={formData.lastWorkingDay}
                                    onChange={(e) => handleInputChange('lastWorkingDay', e.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Exit Type</InputLabel>
                                    <Select
                                        value={formData.exitType}
                                        label="Exit Type"
                                        onChange={(e) => handleInputChange('exitType', e.target.value)}
                                    >
                                        <MenuItem value="Resignation">Resignation</MenuItem>
                                        <MenuItem value="Termination">Termination</MenuItem>
                                        <MenuItem value="Absconded">Absconded</MenuItem>
                                        <MenuItem value="Retirement">Retirement</MenuItem>
                                        <MenuItem value="End of Contract">End of Contract</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <TextField
                                fullWidth
                                label="Exit Reason"
                                value={formData.exitReason}
                                onChange={(e) => handleInputChange('exitReason', e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Additional Notes"
                                multiline
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                placeholder="Any additional information about the exit..."
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowInitiateDialog(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleInitiateExit}
                        disabled={!formData.employeeId || !formData.lastWorkingDay || !formData.exitType}
                    >
                        Initiate Exit Process
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ExitInitiation;