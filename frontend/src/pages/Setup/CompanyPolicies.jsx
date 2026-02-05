import { useState, useContext } from 'react';
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
    Alert,
    Switch,
    FormControlLabel,
    Checkbox,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Upload as UploadIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    Policy as PolicyIcon,
    CheckCircle as CheckIcon,
    Description as DocumentIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

// Mock policy data
const mockPolicies = [
    {
        id: 1,
        title: 'Employee Code of Conduct',
        category: 'HR Policy',
        description: 'Guidelines for professional behavior and workplace ethics',
        visibility: ['Employee', 'Manager', 'HR'],
        isActive: true,
        requiresAcknowledgment: true,
        uploadedBy: 'HR Admin',
        uploadedOn: '2024-12-01',
        fileSize: '2.5 MB',
        fileType: 'PDF',
        acknowledgedBy: ['EMP001', 'EMP002', 'EMP003']
    },
    {
        id: 2,
        title: 'Leave Policy 2025',
        category: 'Leave Policy',
        description: 'Updated leave policy including new work-from-home guidelines',
        visibility: ['Employee', 'Manager', 'HR'],
        isActive: true,
        requiresAcknowledgment: true,
        uploadedBy: 'HR Admin',
        uploadedOn: '2025-01-01',
        fileSize: '1.8 MB',
        fileType: 'PDF',
        acknowledgedBy: ['EMP001', 'EMP002']
    },
    {
        id: 3,
        title: 'IT Security Guidelines',
        category: 'IT Policy',
        description: 'Information security protocols and data protection guidelines',
        visibility: ['Employee', 'Manager', 'HR'],
        isActive: true,
        requiresAcknowledgment: true,
        uploadedBy: 'IT Admin',
        uploadedOn: '2024-11-15',
        fileSize: '3.2 MB',
        fileType: 'PDF',
        acknowledgedBy: ['EMP001']
    },
    {
        id: 4,
        title: 'Performance Management Framework',
        category: 'HR Policy',
        description: 'Annual performance review process and evaluation criteria',
        visibility: ['Manager', 'HR'],
        isActive: true,
        requiresAcknowledgment: false,
        uploadedBy: 'HR Admin',
        uploadedOn: '2024-10-01',
        fileSize: '4.1 MB',
        fileType: 'PDF',
        acknowledgedBy: []
    }
];

const CompanyPolicies = () => {
    const { user } = useContext(AuthContext);
    const [policies, setPolicies] = useState(mockPolicies);
    const [showPolicyDialog, setShowPolicyDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [isNewPolicy, setIsNewPolicy] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        visibility: [],
        isActive: true,
        requiresAcknowledgment: false
    });

    // Filter policies based on user role
    const getFilteredPolicies = () => {
        return policies.filter(policy => 
            policy.visibility.includes(user?.role) && policy.isActive
        );
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNewPolicy = () => {
        setIsNewPolicy(true);
        setSelectedPolicy(null);
        resetForm();
        setShowPolicyDialog(true);
    };

    const handleEditPolicy = (policy) => {
        setIsNewPolicy(false);
        setSelectedPolicy(policy);
        setFormData({
            title: policy.title,
            category: policy.category,
            description: policy.description,
            visibility: policy.visibility,
            isActive: policy.isActive,
            requiresAcknowledgment: policy.requiresAcknowledgment
        });
        setShowPolicyDialog(true);
    };

    const handleViewPolicy = (policy) => {
        setSelectedPolicy(policy);
        setShowViewDialog(true);
    };

    const handleSavePolicy = () => {
        if (isNewPolicy) {
            const newPolicy = {
                id: policies.length + 1,
                ...formData,
                uploadedBy: user?.name || 'HR Admin',
                uploadedOn: new Date().toISOString().split('T')[0],
                fileSize: '1.0 MB',
                fileType: 'PDF',
                acknowledgedBy: []
            };
            setPolicies(prev => [...prev, newPolicy]);
        } else {
            setPolicies(prev => prev.map(policy => 
                policy.id === selectedPolicy.id 
                    ? { ...policy, ...formData }
                    : policy
            ));
        }
        setShowPolicyDialog(false);
        resetForm();
    };

    const handleAcknowledgePolicy = (policyId) => {
        setPolicies(prev => prev.map(policy => 
            policy.id === policyId 
                ? {
                    ...policy,
                    acknowledgedBy: [...policy.acknowledgedBy, 'EMP001'] // Mock current user
                }
                : policy
        ));
    };

    const resetForm = () => {
        setFormData({
            title: '',
            category: '',
            description: '',
            visibility: [],
            isActive: true,
            requiresAcknowledgment: false
        });
    };

    const policyCategories = [
        'HR Policy',
        'Leave Policy',
        'IT Policy',
        'Finance Policy',
        'Safety Policy',
        'Compliance Policy'
    ];

    const visibilityOptions = ['Employee', 'Manager', 'HR'];

    const filteredPolicies = getFilteredPolicies();
    const isHR = user?.role === 'HR';

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {isHR ? 'Company Policy Management' : 'Company Policies'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {isHR ? 
                                'Manage and distribute company policies and documents' :
                                'View company policies and acknowledge receipt'}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => setPolicies(mockPolicies)}
                            size="small"
                        >
                            Refresh
                        </Button>
                        {isHR && (
                            <>
                                <Button
                                    variant="outlined"
                                    startIcon={<UploadIcon />}
                                    size="small"
                                >
                                    Upload
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleNewPolicy}
                                >
                                    Add Policy
                                </Button>
                            </>
                        )}
                    </Stack>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                            {filteredPolicies.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Available Policies
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                            {filteredPolicies.filter(p => p.acknowledgedBy.includes('EMP001')).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Acknowledged
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                            {filteredPolicies.filter(p => p.requiresAcknowledgment && !p.acknowledgedBy.includes('EMP001')).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Pending Action
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Policies Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Policy Title</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                            {isHR && <TableCell sx={{ fontWeight: 600 }}>Visibility</TableCell>}
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Uploaded On</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredPolicies.map((policy) => {
                            const isAcknowledged = policy.acknowledgedBy.includes('EMP001');
                            const needsAcknowledgment = policy.requiresAcknowledgment && !isAcknowledged;

                            return (
                                <TableRow key={policy.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <PolicyIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {policy.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {policy.fileType} • {policy.fileSize}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={policy.category} size="small" />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {policy.description}
                                        </Typography>
                                    </TableCell>
                                    {isHR && (
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {policy.visibility.map((role) => (
                                                    <Chip
                                                        key={role}
                                                        label={role}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <Stack spacing={0.5}>
                                            <Chip
                                                label={policy.isActive ? 'Active' : 'Inactive'}
                                                color={policy.isActive ? 'success' : 'default'}
                                                size="small"
                                            />
                                            {policy.requiresAcknowledgment && (
                                                <Chip
                                                    label={isAcknowledged ? 'Acknowledged' : 'Pending'}
                                                    color={isAcknowledged ? 'success' : 'warning'}
                                                    size="small"
                                                    icon={isAcknowledged ? <CheckIcon /> : undefined}
                                                />
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {new Date(policy.uploadedOn).toLocaleDateString('en-IN')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton size="small" onClick={() => handleViewPolicy(policy)}>
                                                <ViewIcon />
                                            </IconButton>
                                            <IconButton size="small">
                                                <DownloadIcon />
                                            </IconButton>
                                            {isHR && (
                                                <>
                                                    <IconButton size="small" onClick={() => handleEditPolicy(policy)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton size="small" color="error">
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </>
                                            )}
                                            {needsAcknowledgment && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={() => handleAcknowledgePolicy(policy.id)}
                                                >
                                                    Acknowledge
                                                </Button>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Policy Dialog (HR Only) */}
            {isHR && (
                <Dialog open={showPolicyDialog} onClose={() => setShowPolicyDialog(false)} maxWidth="md" fullWidth>
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PolicyIcon />
                            {isNewPolicy ? 'Add New Policy' : `Edit Policy - ${selectedPolicy?.title}`}
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                            {/* Basic Information */}
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                    Policy Information
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <TextField
                                        fullWidth
                                        label="Policy Title"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="e.g., Employee Code of Conduct"
                                    />
                                    <FormControl fullWidth>
                                        <InputLabel>Category</InputLabel>
                                        <Select
                                            value={formData.category}
                                            label="Category"
                                            onChange={(e) => handleInputChange('category', e.target.value)}
                                        >
                                            {policyCategories.map((category) => (
                                                <MenuItem key={category} value={category}>{category}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Brief description of the policy"
                                    multiline
                                    rows={2}
                                />
                            </Box>

                            <Divider />

                            {/* Visibility Settings */}
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                    Visibility & Access
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Select which roles can view this policy
                                </Typography>
                                <List>
                                    {visibilityOptions.map((role) => (
                                        <ListItem key={role} sx={{ px: 0 }}>
                                            <ListItemIcon>
                                                <Checkbox
                                                    checked={formData.visibility.includes(role)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            handleInputChange('visibility', [...formData.visibility, role]);
                                                        } else {
                                                            handleInputChange('visibility', formData.visibility.filter(r => r !== role));
                                                        }
                                                    }}
                                                />
                                            </ListItemIcon>
                                            <ListItemText primary={role} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>

                            <Divider />

                            {/* Settings */}
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                    Policy Settings
                                </Typography>
                                <Stack spacing={2}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.isActive}
                                                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                            />
                                        }
                                        label="Active Policy"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.requiresAcknowledgment}
                                                onChange={(e) => handleInputChange('requiresAcknowledgment', e.target.checked)}
                                            />
                                        }
                                        label="Requires Employee Acknowledgment"
                                    />
                                </Stack>
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowPolicyDialog(false)}>Cancel</Button>
                        <Button 
                            variant="contained" 
                            onClick={handleSavePolicy}
                            disabled={!formData.title || !formData.category || formData.visibility.length === 0}
                        >
                            {isNewPolicy ? 'Add Policy' : 'Update Policy'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Policy View Dialog */}
            <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DocumentIcon />
                        Policy Details
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedPolicy && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                {selectedPolicy.title}
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">Category</Typography>
                                <Typography variant="body1">{selectedPolicy.category}</Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">Description</Typography>
                                <Typography variant="body1">{selectedPolicy.description}</Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">File Information</Typography>
                                <Typography variant="body1">
                                    {selectedPolicy.fileType} • {selectedPolicy.fileSize}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">Uploaded</Typography>
                                <Typography variant="body1">
                                    {new Date(selectedPolicy.uploadedOn).toLocaleDateString('en-IN')} by {selectedPolicy.uploadedBy}
                                </Typography>
                            </Box>

                            {selectedPolicy.requiresAcknowledgment && (
                                <Alert 
                                    severity={selectedPolicy.acknowledgedBy.includes('EMP001') ? 'success' : 'warning'}
                                    sx={{ mt: 2 }}
                                >
                                    {selectedPolicy.acknowledgedBy.includes('EMP001') 
                                        ? 'You have acknowledged this policy'
                                        : 'This policy requires your acknowledgment'}
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowViewDialog(false)}>Close</Button>
                    <Button startIcon={<DownloadIcon />} variant="outlined">
                        Download
                    </Button>
                    {selectedPolicy?.requiresAcknowledgment && !selectedPolicy?.acknowledgedBy.includes('EMP001') && (
                        <Button 
                            variant="contained" 
                            onClick={() => {
                                handleAcknowledgePolicy(selectedPolicy.id);
                                setShowViewDialog(false);
                            }}
                        >
                            Acknowledge
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CompanyPolicies;