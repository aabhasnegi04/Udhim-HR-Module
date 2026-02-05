import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Stack,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    Grid
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
    Visibility as ViewIcon,
    AccountBalance as SalaryIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const SalaryStructures = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [openViewer, setOpenViewer] = useState(false);
    const [selectedStructure, setSelectedStructure] = useState(null);
    const [editStructure, setEditStructure] = useState(null);

    // Mock salary structure data
    const salaryStructures = [
        {
            id: 1,
            name: 'Software Engineer L1',
            grade: 'L1',
            department: 'Engineering',
            basicSalary: 60000,
            allowances: {
                hra: 18000,
                transport: 2400,
                medical: 1200,
                special: 6000
            },
            deductions: {
                pf: 7200,
                esi: 1080,
                tax: 8000
            },
            grossSalary: 87600,
            netSalary: 71320,
            status: 'Active',
            effectiveDate: '2024-01-01',
            employees: 15
        },
        {
            id: 2,
            name: 'Software Engineer L2',
            grade: 'L2',
            department: 'Engineering',
            basicSalary: 80000,
            allowances: {
                hra: 24000,
                transport: 2400,
                medical: 1200,
                special: 8000
            },
            deductions: {
                pf: 9600,
                esi: 1440,
                tax: 12000
            },
            grossSalary: 115600,
            netSalary: 92560,
            status: 'Active',
            effectiveDate: '2024-01-01',
            employees: 22
        },
        {
            id: 3,
            name: 'Senior Software Engineer L3',
            grade: 'L3',
            department: 'Engineering',
            basicSalary: 120000,
            allowances: {
                hra: 36000,
                transport: 2400,
                medical: 1200,
                special: 12000
            },
            deductions: {
                pf: 14400,
                esi: 0,
                tax: 20000
            },
            grossSalary: 171600,
            netSalary: 137200,
            status: 'Active',
            effectiveDate: '2024-01-01',
            employees: 8
        },
        {
            id: 4,
            name: 'HR Manager M1',
            grade: 'M1',
            department: 'Human Resources',
            basicSalary: 100000,
            allowances: {
                hra: 30000,
                transport: 2400,
                medical: 1200,
                special: 10000
            },
            deductions: {
                pf: 12000,
                esi: 0,
                tax: 16000
            },
            grossSalary: 143600,
            netSalary: 115600,
            status: 'Active',
            effectiveDate: '2024-01-01',
            employees: 3
        }
    ];

    const grades = ['L1', 'L2', 'L3', 'M1', 'M2', 'VP', 'SVP'];
    const departments = ['Engineering', 'Human Resources', 'Marketing', 'Finance', 'Sales'];

    const handleAddStructure = () => {
        setEditStructure(null);
        setOpenDialog(true);
    };

    const handleEditStructure = (structure) => {
        setEditStructure(structure);
        setOpenDialog(true);
    };

    const handleViewStructure = (structure) => {
        setSelectedStructure(structure);
        setOpenViewer(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditStructure(null);
    };

    const handleCloseViewer = () => {
        setOpenViewer(false);
        setSelectedStructure(null);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getGradeColor = (grade) => {
        if (grade.startsWith('L')) return 'primary';
        if (grade.startsWith('M')) return 'success';
        if (grade.includes('VP')) return 'warning';
        return 'default';
    };

    return (
        <Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
                Salary structures configured here will be used by the Payroll module. Changes affect all employees assigned to these structures.
            </Alert>

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
                    Salary Structures ({salaryStructures.length})
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddStructure}
                >
                    Add Structure
                </Button>
            </Box>

            {/* Salary Structures Table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Structure Name</TableCell>
                                <TableCell>Grade</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Basic Salary</TableCell>
                                <TableCell>Gross Salary</TableCell>
                                <TableCell>Net Salary</TableCell>
                                <TableCell>Employees</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {salaryStructures.map((structure) => (
                                <TableRow key={structure.id}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ 
                                                p: 1, 
                                                borderRadius: 1, 
                                                bgcolor: 'primary.light',
                                                color: 'primary.main',
                                                mr: 2,
                                                display: 'flex'
                                            }}>
                                                <SalaryIcon />
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {structure.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={structure.grade} 
                                            color={getGradeColor(structure.grade)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{structure.department}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {formatCurrency(structure.basicSalary)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {formatCurrency(structure.grossSalary)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                            {formatCurrency(structure.netSalary)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={`${structure.employees} emp`} 
                                            variant="outlined"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={structure.status} 
                                            color="success"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleViewStructure(structure)}
                                        >
                                            <ViewIcon />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleEditStructure(structure)}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small">
                                            <CopyIcon />
                                        </IconButton>
                                        <IconButton size="small" color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Add/Edit Structure Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editStructure ? 'Edit Salary Structure' : 'Add New Salary Structure'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Structure Name"
                            fullWidth
                            defaultValue={editStructure?.name || ''}
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Grade</InputLabel>
                                    <Select
                                        defaultValue={editStructure?.grade || ''}
                                        label="Grade"
                                    >
                                        {grades.map((grade) => (
                                            <MenuItem key={grade} value={grade}>
                                                {grade}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Department</InputLabel>
                                    <Select
                                        defaultValue={editStructure?.department || ''}
                                        label="Department"
                                    >
                                        {departments.map((dept) => (
                                            <MenuItem key={dept} value={dept}>
                                                {dept}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                        
                        <Divider />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Salary Components
                        </Typography>
                        
                        <TextField
                            label="Basic Salary"
                            type="number"
                            fullWidth
                            defaultValue={editStructure?.basicSalary || ''}
                        />
                        
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Allowances
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    label="HRA"
                                    type="number"
                                    fullWidth
                                    defaultValue={editStructure?.allowances?.hra || ''}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Transport Allowance"
                                    type="number"
                                    fullWidth
                                    defaultValue={editStructure?.allowances?.transport || ''}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Medical Allowance"
                                    type="number"
                                    fullWidth
                                    defaultValue={editStructure?.allowances?.medical || ''}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Special Allowance"
                                    type="number"
                                    fullWidth
                                    defaultValue={editStructure?.allowances?.special || ''}
                                />
                            </Grid>
                        </Grid>
                        
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Deductions
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <TextField
                                    label="PF"
                                    type="number"
                                    fullWidth
                                    defaultValue={editStructure?.deductions?.pf || ''}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    label="ESI"
                                    type="number"
                                    fullWidth
                                    defaultValue={editStructure?.deductions?.esi || ''}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    label="Tax"
                                    type="number"
                                    fullWidth
                                    defaultValue={editStructure?.deductions?.tax || ''}
                                />
                            </Grid>
                        </Grid>
                        
                        <TextField
                            label="Effective Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            defaultValue={editStructure?.effectiveDate || ''}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button variant="contained" onClick={handleCloseDialog}>
                        {editStructure ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Structure Viewer Dialog */}
            <Dialog open={openViewer} onClose={handleCloseViewer} maxWidth="md" fullWidth>
                <DialogTitle>
                    Salary Structure: {selectedStructure?.name}
                </DialogTitle>
                <DialogContent>
                    {selectedStructure && (
                        <Box>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Grade</Typography>
                                    <Chip 
                                        label={selectedStructure.grade} 
                                        color={getGradeColor(selectedStructure.grade)}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Department</Typography>
                                    <Typography variant="body1">{selectedStructure.department}</Typography>
                                </Grid>
                            </Grid>

                            <Paper sx={{ p: 2, mb: 2 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Salary Breakdown</Typography>
                                
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Basic Salary</Typography>
                                <Typography variant="h5" sx={{ mb: 2, color: 'primary.main' }}>
                                    {formatCurrency(selectedStructure.basicSalary)}
                                </Typography>

                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Allowances</Typography>
                                <Stack spacing={1} sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">HRA</Typography>
                                        <Typography variant="body2">{formatCurrency(selectedStructure.allowances.hra)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Transport</Typography>
                                        <Typography variant="body2">{formatCurrency(selectedStructure.allowances.transport)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Medical</Typography>
                                        <Typography variant="body2">{formatCurrency(selectedStructure.allowances.medical)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Special</Typography>
                                        <Typography variant="body2">{formatCurrency(selectedStructure.allowances.special)}</Typography>
                                    </Box>
                                </Stack>

                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Deductions</Typography>
                                <Stack spacing={1} sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">PF</Typography>
                                        <Typography variant="body2">-{formatCurrency(selectedStructure.deductions.pf)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">ESI</Typography>
                                        <Typography variant="body2">-{formatCurrency(selectedStructure.deductions.esi)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Tax</Typography>
                                        <Typography variant="body2">-{formatCurrency(selectedStructure.deductions.tax)}</Typography>
                                    </Box>
                                </Stack>

                                <Divider sx={{ my: 2 }} />
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Gross Salary</Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        {formatCurrency(selectedStructure.grossSalary)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Net Salary</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                                        {formatCurrency(selectedStructure.netSalary)}
                                    </Typography>
                                </Box>
                            </Paper>

                            <Typography variant="body2" color="text.secondary">
                                Effective Date: {new Date(selectedStructure.effectiveDate).toLocaleDateString()} | 
                                Assigned to {selectedStructure.employees} employees
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseViewer}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SalaryStructures;