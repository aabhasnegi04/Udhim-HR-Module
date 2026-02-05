import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    CardActions,
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
    FormControlLabel,
    Checkbox
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Upload as UploadIcon,
    Download as DownloadIcon,
    Policy as PolicyIcon,
    Security as SecurityIcon,
    Work as WorkIcon,
    People as PeopleIcon
} from '@mui/icons-material';

const CompanyPolicies = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [openViewer, setOpenViewer] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [editPolicy, setEditPolicy] = useState(null);
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load policies when component mounts
    useEffect(() => {
        loadPolicies();
    }, []);

    const loadPolicies = async () => {
        try {
            setLoading(true);
            const result = await adminService.getCompanyPolicies();
            if (result.success) {
                setPolicies(result.data || []);
            }
        } catch (error) {
            console.error('Load policies error:', error);
        } finally {
            setLoading(false);
        }
    };

    const policyCategories = ['HR Policy', 'IT Policy', 'Leave Policy', 'Finance Policy', 'Safety Policy'];
    const visibilityOptions = ['Employee', 'Manager', 'HR Only'];

    const handleAddPolicy = () => {
        setEditPolicy(null);
        setOpenDialog(true);
    };

    const handleEditPolicy = (policy) => {
        setEditPolicy(policy);
        setOpenDialog(true);
    };

    const handleViewPolicy = (policy) => {
        setSelectedPolicy(policy);
        setOpenViewer(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditPolicy(null);
    };

    const handleCloseViewer = () => {
        setOpenViewer(false);
        setSelectedPolicy(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active':
                return 'success';
            case 'Draft':
                return 'warning';
            case 'Archived':
                return 'default';
            default:
                return 'default';
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'HR Policy':
                return 'primary';
            case 'IT Policy':
                return 'info';
            case 'Leave Policy':
                return 'success';
            case 'Finance Policy':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'HR Policy':
                return <PeopleIcon />;
            case 'IT Policy':
                return <SecurityIcon />;
            case 'Leave Policy':
                return <WorkIcon />;
            default:
                return <PolicyIcon />;
        }
    };

    return (
        <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
                Company policies configured here will be accessible to employees based on visibility settings. Ensure all policies are up-to-date and compliant.
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
                    Company Policies ({policies.length})
                </Typography>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                    >
                        Upload Policy
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddPolicy}
                    >
                        Add Policy
                    </Button>
                </Stack>
            </Box>

            {/* Policies Table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Policy Title</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Version</TableCell>
                                <TableCell>Effective Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Visibility</TableCell>
                                <TableCell>File Size</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {policies.map((policy) => (
                                <TableRow key={policy.policy_id}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ 
                                                p: 1, 
                                                borderRadius: 1, 
                                                bgcolor: `${getCategoryColor(policy.policy_category)}.light`,
                                                color: `${getCategoryColor(policy.policy_category)}.main`,
                                                mr: 2,
                                                display: 'flex'
                                            }}>
                                                {getCategoryIcon(policy.policy_category)}
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {policy.policy_title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {policy.policy_description}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={policy.policy_category} 
                                            color={getCategoryColor(policy.policy_category)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>v{policy.policy_version}</TableCell>
                                    <TableCell>
                                        {policy.effective_date ? new Date(policy.effective_date).toLocaleDateString() : 'Not set'}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={policy.policy_status} 
                                            color={getStatusColor(policy.policy_status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5}>
                                            {policy.visibility_settings ? 
                                                JSON.parse(policy.visibility_settings).map((vis, index) => (
                                                    <Chip 
                                                        key={index}
                                                        label={vis} 
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                )) : 
                                                <Chip label="All" variant="outlined" size="small" />
                                            }
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{policy.file_size || 'N/A'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleViewPolicy(policy)}
                                        >
                                            <ViewIcon />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleEditPolicy(policy)}
                                        >
                                            <EditIcon />
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

            {/* Add/Edit Policy Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editPolicy ? 'Edit Policy' : 'Add New Policy'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Policy Title"
                            fullWidth
                            defaultValue={editPolicy?.title || ''}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Category</InputLabel>
                            <Select
                                defaultValue={editPolicy?.category || ''}
                                label="Category"
                            >
                                {policyCategories.map((category) => (
                                    <MenuItem key={category} value={category}>
                                        {category}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            defaultValue={editPolicy?.description || ''}
                        />
                        <TextField
                            label="Version"
                            fullWidth
                            defaultValue={editPolicy?.version || '1.0'}
                        />
                        <TextField
                            label="Effective Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            defaultValue={editPolicy?.effectiveDate || ''}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                defaultValue={editPolicy?.status || 'Draft'}
                                label="Status"
                            >
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Draft">Draft</MenuItem>
                                <MenuItem value="Archived">Archived</MenuItem>
                            </Select>
                        </FormControl>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Visibility Settings
                            </Typography>
                            {visibilityOptions.map((option) => (
                                <FormControlLabel
                                    key={option}
                                    control={
                                        <Checkbox 
                                            defaultChecked={editPolicy?.visibility?.includes(option) || false}
                                        />
                                    }
                                    label={option}
                                />
                            ))}
                        </Box>
                        <Button
                            variant="outlined"
                            startIcon={<UploadIcon />}
                            component="label"
                        >
                            Upload Policy Document
                            <input type="file" hidden accept=".pdf,.doc,.docx" />
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button variant="contained" onClick={handleCloseDialog}>
                        {editPolicy ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Policy Viewer Dialog */}
            <Dialog open={openViewer} onClose={handleCloseViewer} maxWidth="lg" fullWidth>
                <DialogTitle>
                    {selectedPolicy?.title} (v{selectedPolicy?.version})
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                            <Chip 
                                label={selectedPolicy?.category} 
                                color={getCategoryColor(selectedPolicy?.category)}
                                size="small"
                            />
                            <Chip 
                                label={selectedPolicy?.status} 
                                color={getStatusColor(selectedPolicy?.status)}
                                size="small"
                            />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {selectedPolicy?.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Effective Date: {selectedPolicy && new Date(selectedPolicy.effectiveDate).toLocaleDateString()} | 
                            Last Updated: {selectedPolicy && new Date(selectedPolicy.lastUpdated).toLocaleDateString()} by {selectedPolicy?.updatedBy}
                        </Typography>
                    </Box>
                    <Paper sx={{ p: 3, bgcolor: 'grey.50', minHeight: 400 }}>
                        <Typography variant="body1">
                            Policy document content would be displayed here...
                        </Typography>
                    </Paper>
                </DialogContent>
                <DialogActions>
                    <Button startIcon={<DownloadIcon />}>
                        Download
                    </Button>
                    <Button onClick={handleCloseViewer}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CompanyPolicies;