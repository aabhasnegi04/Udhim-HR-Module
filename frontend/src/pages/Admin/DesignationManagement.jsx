import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';

const DesignationManagement = () => {
  const [mappings, setMappings] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [formData, setFormData] = useState({
    designation_name: '',
    role_code: ''
  });
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mappingsResult, rolesResult] = await Promise.all([
        adminService.getDesignationMappings(),
        adminService.getAvailableRoles()
      ]);

      if (mappingsResult.success) {
        setMappings(mappingsResult.data.mappings || []);
      }

      if (rolesResult.success) {
        setAvailableRoles(rolesResult.data.roles || []);
      }
    } catch (error) {
      showAlert('Failed to load designation mappings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, severity = 'info') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 5000);
  };

  const handleOpenDialog = (mapping = null) => {
    if (mapping) {
      setEditingMapping(mapping);
      setFormData({
        designation_name: mapping.designation_name,
        role_code: mapping.role_code
      });
    } else {
      setEditingMapping(null);
      setFormData({
        designation_name: '',
        role_code: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMapping(null);
    setFormData({
      designation_name: '',
      role_code: ''
    });
  };

  const handleSubmit = async () => {
    try {
      let result;
      
      if (editingMapping) {
        // Update existing mapping
        result = await adminService.updateDesignationMapping(
          editingMapping.mapping_id,
          { role_code: formData.role_code }
        );
      } else {
        // Add new mapping
        result = await adminService.addDesignationMapping(formData);
      }

      if (result.success) {
        showAlert(
          editingMapping 
            ? 'Designation mapping updated successfully' 
            : 'Designation mapping added successfully',
          'success'
        );
        handleCloseDialog();
        loadData();
      } else {
        showAlert(result.message || 'Operation failed', 'error');
      }
    } catch (error) {
      showAlert('Failed to save designation mapping', 'error');
    }
  };

  const handleDelete = async (mappingId) => {
    if (!window.confirm('Are you sure you want to delete this designation mapping?')) {
      return;
    }

    try {
      const result = await adminService.deleteDesignationMapping(mappingId);
      
      if (result.success) {
        showAlert('Designation mapping deleted successfully', 'success');
        loadData();
      } else {
        showAlert(result.message || 'Failed to delete designation mapping', 'error');
      }
    } catch (error) {
      showAlert('Failed to delete designation mapping', 'error');
    }
  };

  const getRoleColor = (roleCode) => {
    const colors = {
      'HR': 'primary',
      'MANAGER': 'secondary',
      'EMPLOYEE': 'default'
    };
    return colors[roleCode] || 'default';
  };

  const getRoleDisplayName = (roleCode) => {
    const role = availableRoles.find(r => r.role_code === roleCode);
    return role ? role.role_name : roleCode;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <BusinessIcon color="primary" />
              <Typography variant="h6">
                Designation Role Mappings
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Mapping
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" mb={3}>
            Configure which role is automatically assigned when creating employees with specific designations.
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Designation</TableCell>
                  <TableCell>Assigned Role</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mappings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No designation mappings found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  mappings.map((mapping) => (
                    <TableRow key={mapping.mapping_id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {mapping.designation_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleDisplayName(mapping.role_code)}
                          color={getRoleColor(mapping.role_code)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(mapping.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(mapping)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(mapping.mapping_id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMapping ? 'Edit Designation Mapping' : 'Add Designation Mapping'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Designation Name"
              value={formData.designation_name}
              onChange={(e) => setFormData({ ...formData, designation_name: e.target.value })}
              margin="normal"
              disabled={editingMapping} // Can't edit designation name
              helperText={editingMapping ? "Designation name cannot be changed" : "Enter the exact designation name"}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role_code}
                onChange={(e) => setFormData({ ...formData, role_code: e.target.value })}
                label="Role"
              >
                {availableRoles.map((role) => (
                  <MenuItem key={role.role_code} value={role.role_code}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={role.role_name}
                        color={getRoleColor(role.role_code)}
                        size="small"
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Alert severity="info" sx={{ mt: 2 }}>
              When an employee is created with this designation, they will automatically be assigned the selected role and gain access to the corresponding dashboard features.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.designation_name || !formData.role_code}
          >
            {editingMapping ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DesignationManagement;