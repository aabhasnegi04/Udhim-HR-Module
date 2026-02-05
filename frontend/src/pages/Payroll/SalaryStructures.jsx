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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Switch,
    FormControlLabel,
    InputAdornment
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    ContentCopy as CopyIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';

// Mock salary structures data
const mockSalaryStructures = [
    {
        id: 1,
        name: 'Software Engineer - L1',
        type: 'Monthly',
        ctc: 720000,
        monthlySalary: 60000,
        grade: 'L1',
        applicableRoles: ['Software Engineer', 'Junior Developer'],
        earnings: {
            basic: 30000,
            hra: 12000,
            specialAllowance: 15000,
            bonus: 3000
        },
        deductions: {
            pf: 3600,
            esi: 900,
            pt: 200,
            tds: 5000
        },
        netPay: 50300,
        status: 'Active'
    },
    {
        id: 2,
        name: 'Senior Software Engineer - L2',
        type: 'CTC',
        ctc: 1200000,
        monthlySalary: 100000,
        grade: 'L2',
        applicableRoles: ['Senior Software Engineer', 'Tech Lead'],
        earnings: {
            basic: 50000,
            hra: 20000,
            specialAllowance: 25000,
            bonus: 5000
        },
        deductions: {
            pf: 6000,
            esi: 0,
            pt: 200,
            tds: 12000
        },
        netPay: 81800,
        status: 'Active'
    },
    {
        id: 3,
        name: 'Manager - M1',
        type: 'CTC',
        ctc: 1800000,
        monthlySalary: 150000,
        grade: 'M1',
        applicableRoles: ['Engineering Manager', 'Team Lead'],
        earnings: {
            basic: 75000,
            hra: 30000,
            specialAllowance: 35000,
            bonus: 10000
        },
        deductions: {
            pf: 9000,
            esi: 0,
            pt: 200,
            tds: 20000
        },
        netPay: 120800,
        status: 'Active'
    }
];

const SalaryStructures = () => {
    const [structures, setStructures] = useState(mockSalaryStructures);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [selectedStructure, setSelectedStructure] = useState(null);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Monthly',
        grade: '',
        applicableRoles: '',
        earnings: {
            basic: 0,
            hra: 0,
            specialAllowance: 0,
            bonus: 0
        },
        deductions: {
            pf: 0,
            esi: 0,
            pt: 0,
            tds: 0
        }
    });

    const handleInputChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const calculateTotals = () => {
        const totalEarnings = Object.values(formData.earnings).reduce((sum, val) => sum + Number(val || 0), 0);
        const totalDeductions = Object.values(formData.deductions).reduce((sum, val) => sum + Number(val || 0), 0);
        const netPay = totalEarnings - totalDeductions;
        const ctc = formData.type === 'CTC' ? totalEarnings * 12 : totalEarnings;
        
        return { totalEarnings, totalDeductions, netPay, ctc };
    };

    const handleCreateStructure = () => {
        const { totalEarnings, totalDeductions, netPay, ctc } = calculateTotals();
        
        const newStructure = {
            id: structures.length + 1,
            ...formData,
            ctc,
            monthlySalary: totalEarnings,
            netPay,
            applicableRoles: formData.applicableRoles.split(',').map(role => role.trim()),
            status: 'Active'
        };
        
        setStructures(prev => [...prev, newStructure]);
        setShowCreateDialog(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'Monthly',
            grade: '',
            applicableRoles: '',
            earnings: {
                basic: 0,
                hra: 0,
                specialAllowance: 0,
                bonus: 0
            },
            deductions: {
                pf: 0,
                esi: 0,
                pt: 0,
                tds: 0
            }
        });
    };

    const handleViewStructure = (structure) => {
        setSelectedStructure(structure);
        setShowViewDialog(true);
    };

    const handleCopyStructure = (structure) => {
        setFormData({
            name: `${structure.name} - Copy`,
            type: structure.type,
            grade: structure.grade,
            applicableRoles: structure.applicableRoles.join(', '),
            earnings: { ...structure.earnings },
            deductions: { ...structure.deductions }
        });
        setShowCreateDialog(true);
    };

    const { totalEarnings, totalDeductions, netPay, ctc } = calculateTotals();

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Salary Structure Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create and manage salary structures for different roles and grades
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => setStructures(mockSalaryStructures)}
                            size="small"
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setShowCreateDialog(true)}
                        >
                            Create Structure
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                            {structures.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Structures
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                            {structures.filter(s => s.status === 'Active').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Active Structures
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                            ₹{Math.round(structures.reduce((sum, s) => sum + s.ctc, 0) / structures.length / 100000)}L
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Average CTC
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Structures Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Structure Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">CTC</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Monthly</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Net Pay</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {structures.map((structure) => (
                            <TableRow key={structure.id} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>
                                        {structure.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {structure.applicableRoles.join(', ')}
                                    </Typography>
                                </TableCell>
                                <TableCell>{structure.type}</TableCell>
                                <TableCell>
                                    <Chip label={structure.grade} size="small" />
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600}>
                                        ₹{(structure.ctc / 100000).toFixed(1)}L
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    ₹{structure.monthlySalary.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600} color="success.main">
                                        ₹{structure.netPay.toLocaleString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={structure.status}
                                        color={structure.status === 'Active' ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton size="small" onClick={() => handleViewStructure(structure)}>
                                            <ViewIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleCopyStructure(structure)}>
                                            <CopyIcon />
                                        </IconButton>
                                        <IconButton size="small">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small" color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create Structure Dialog */}
            <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Create Salary Structure</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        {/* Basic Information */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Basic Information
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <TextField
                                    fullWidth
                                    label="Structure Name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={formData.type}
                                        label="Type"
                                        onChange={(e) => handleInputChange('type', e.target.value)}
                                    >
                                        <MenuItem value="Monthly">Monthly</MenuItem>
                                        <MenuItem value="CTC">CTC</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <TextField
                                    fullWidth
                                    label="Grade"
                                    value={formData.grade}
                                    onChange={(e) => handleInputChange('grade', e.target.value)}
                                />
                                <TextField
                                    fullWidth
                                    label="Applicable Roles (comma separated)"
                                    value={formData.applicableRoles}
                                    onChange={(e) => handleInputChange('applicableRoles', e.target.value)}
                                />
                            </Box>
                        </Box>

                        <Divider />

                        {/* Earnings */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Earnings
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Basic Salary"
                                    type="number"
                                    value={formData.earnings.basic}
                                    onChange={(e) => handleInputChange('earnings.basic', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                                    }}
                                    sx={{ flex: '1 1 200px', minWidth: '200px' }}
                                />
                                <TextField
                                    label="HRA"
                                    type="number"
                                    value={formData.earnings.hra}
                                    onChange={(e) => handleInputChange('earnings.hra', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                                    }}
                                    sx={{ flex: '1 1 200px', minWidth: '200px' }}
                                />
                                <TextField
                                    label="Special Allowance"
                                    type="number"
                                    value={formData.earnings.specialAllowance}
                                    onChange={(e) => handleInputChange('earnings.specialAllowance', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                                    }}
                                    sx={{ flex: '1 1 200px', minWidth: '200px' }}
                                />
                                <TextField
                                    label="Bonus"
                                    type="number"
                                    value={formData.earnings.bonus}
                                    onChange={(e) => handleInputChange('earnings.bonus', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                                    }}
                                    sx={{ flex: '1 1 200px', minWidth: '200px' }}
                                />
                            </Box>
                        </Box>

                        <Divider />

                        {/* Deductions */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Deductions
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="PF"
                                    type="number"
                                    value={formData.deductions.pf}
                                    onChange={(e) => handleInputChange('deductions.pf', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                                    }}
                                    sx={{ flex: '1 1 200px', minWidth: '200px' }}
                                />
                                <TextField
                                    label="ESI"
                                    type="number"
                                    value={formData.deductions.esi}
                                    onChange={(e) => handleInputChange('deductions.esi', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                                    }}
                                    sx={{ flex: '1 1 200px', minWidth: '200px' }}
                                />
                                <TextField
                                    label="Professional Tax"
                                    type="number"
                                    value={formData.deductions.pt}
                                    onChange={(e) => handleInputChange('deductions.pt', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                                    }}
                                    sx={{ flex: '1 1 200px', minWidth: '200px' }}
                                />
                                <TextField
                                    label="TDS"
                                    type="number"
                                    value={formData.deductions.tds}
                                    onChange={(e) => handleInputChange('deductions.tds', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                                    }}
                                    sx={{ flex: '1 1 200px', minWidth: '200px' }}
                                />
                            </Box>
                        </Box>

                        <Divider />

                        {/* Summary */}
                        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Summary
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Total Earnings</Typography>
                                    <Typography variant="h6" color="success.main">₹{totalEarnings.toLocaleString('en-IN')}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Total Deductions</Typography>
                                    <Typography variant="h6" color="error.main">₹{totalDeductions.toLocaleString('en-IN')}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Net Pay</Typography>
                                    <Typography variant="h6" color="primary.main">₹{netPay.toLocaleString('en-IN')}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">CTC</Typography>
                                    <Typography variant="h6">₹{(ctc / 100000).toFixed(1)}L</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateStructure}>
                        Create Structure
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Structure Dialog */}
            <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Salary Structure Details</DialogTitle>
                <DialogContent>
                    {selectedStructure && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>{selectedStructure.name}</Typography>
                            
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary">Earnings</Typography>
                                {Object.entries(selectedStructure.earnings).map(([key, value]) => (
                                    <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </Typography>
                                        <Typography variant="body2">₹{value.toLocaleString('en-IN')}</Typography>
                                    </Box>
                                ))}
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary">Deductions</Typography>
                                {Object.entries(selectedStructure.deductions).map(([key, value]) => (
                                    <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" sx={{ textTransform: 'uppercase' }}>
                                            {key}
                                        </Typography>
                                        <Typography variant="body2">₹{value.toLocaleString('en-IN')}</Typography>
                                    </Box>
                                ))}
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">Net Pay</Typography>
                                <Typography variant="h6" color="primary.main">
                                    ₹{selectedStructure.netPay.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowViewDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SalaryStructures;