import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
    Stack, Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Alert, CircularProgress
} from '@mui/material';
import {
    Visibility as ViewIcon, Refresh as RefreshIcon,
    Policy as PolicyIcon, Description as DocumentIcon
} from '@mui/icons-material';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';
import apiService from '../services/api';

const CompanyPolicies = () => {
    const { currentView } = useProfileSwitching();
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState(null);

    const fetchPolicies = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiService.get('/employees/company-policies');
            if (res.success) {
                setPolicies(res.data?.policies || []);
            } else {
                setError(res.error || 'Failed to load policies');
            }
        } catch (err) {
            setError(err.message || 'Failed to load policies');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPolicies(); }, []);

    const getVisibility = (policy) => {
        try {
            return typeof policy.visibility_settings === 'string' 
                ? JSON.parse(policy.visibility_settings) 
                : (policy.visibility_settings || []);
        } catch {
            return [];
        }
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Company Policies
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        View all company policies available to you
                    </Typography>
                </Box>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPolicies} size="small">
                    Refresh
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 180px' }}>
                    <CardContent>
                        <Typography variant="h4" color="primary.main" fontWeight={700}>
                            {policies.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Total Policies</Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 180px' }}>
                    <CardContent>
                        <Typography variant="h4" color="success.main" fontWeight={700}>
                            {policies.filter(p => p.policy_status === 'Active').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Active</Typography>
                    </CardContent>
                </Card>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Policy Title</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Version</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <CircularProgress size={24} />
                                </TableCell>
                            </TableRow>
                        ) : policies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Box sx={{ py: 4 }}>
                                        <PolicyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            No policies available
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : policies.map((policy) => (
                            <TableRow key={policy.policy_id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <PolicyIcon sx={{ mr: 1.5, color: 'text.secondary' }} />
                                        <Typography variant="body2" fontWeight={600}>
                                            {policy.policy_title}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip label={policy.category || policy.policy_category} size="small" />
                                </TableCell>
                                <TableCell>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            maxWidth: 300, 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis', 
                                            whiteSpace: 'nowrap' 
                                        }}
                                    >
                                        {policy.description || policy.policy_description}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={policy.policy_status || 'Active'}
                                        color={policy.policy_status === 'Active' ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {policy.policy_version || '1.0'}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton 
                                        size="small" 
                                        onClick={() => { 
                                            setSelectedPolicy(policy); 
                                            setShowViewDialog(true); 
                                        }}
                                        color="primary"
                                    >
                                        <ViewIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* View Dialog */}
            <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DocumentIcon /> Policy Details
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedPolicy && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                {selectedPolicy.policy_title}
                            </Typography>
                            {[
                                ['Category', selectedPolicy.category || selectedPolicy.policy_category],
                                ['Description', selectedPolicy.description || selectedPolicy.policy_description],
                                ['Version', selectedPolicy.policy_version],
                                ['Status', selectedPolicy.policy_status],
                                ['Effective Date', selectedPolicy.effective_date 
                                    ? new Date(selectedPolicy.effective_date).toLocaleDateString('en-IN') 
                                    : '—'
                                ],
                            ].map(([label, val]) => (
                                <Box key={label} sx={{ mb: 1.5 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        {label}
                                    </Typography>
                                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                                        {val || '—'}
                                    </Typography>
                                </Box>
                            ))}
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

export default CompanyPolicies;
