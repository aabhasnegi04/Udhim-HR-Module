import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, CircularProgress, InputAdornment
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, History as HistoryIcon, Search as SearchIcon } from '@mui/icons-material';
import factoryPayrollService from '../../services/factoryPayrollService';

export default function RateManagement() {
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [rateForm, setRateForm] = useState({
    dailyRate: '',
    effectiveFrom: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    // Filter workers based on search term
    if (searchTerm) {
      const filtered = workers.filter(worker =>
        worker.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredWorkers(filtered);
    } else {
      setFilteredWorkers(workers);
    }
  }, [searchTerm, workers]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await factoryPayrollService.getAllWorkersWithRates();
      
      if (response.success && response.data) {
        setWorkers(response.data);
        setFilteredWorkers(response.data);
      } else {
        setError(response.message || 'No workers found');
      }
    } catch (err) {
      setError('Failed to load factory workers');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRate = (worker) => {
    setSelectedWorker(worker);
    setRateForm({
      dailyRate: worker.daily_rate || '',
      effectiveFrom: new Date().toISOString().split('T')[0]
    });
    setAssignDialogOpen(true);
    setError('');
    setSuccess('');
  };

  const handleSaveRate = async () => {
    try {
      if (!rateForm.dailyRate || rateForm.dailyRate <= 0) {
        setError('Please enter a valid daily rate');
        return;
      }

      const response = await factoryPayrollService.assignWorkerRate(
        selectedWorker.employee_id,
        parseFloat(rateForm.dailyRate),
        rateForm.effectiveFrom
      );

      if (response.success) {
        setSuccess('Rate assigned successfully');
        setAssignDialogOpen(false);
        fetchWorkers();
      } else {
        setError(response.message || 'Failed to assign rate');
      }
    } catch (err) {
      setError('Failed to assign rate');
    }
  };

  const getRateStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'No Rate Assigned':
        return 'error';
      default:
        return 'default';
    }
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
      {/* Header with Search */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Factory Workers Rate Management</Typography>
        <TextField
          size="small"
          placeholder="Search workers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
      </Box>

      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Workers Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell>Employee Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Shift</TableCell>
              <TableCell align="right">Daily Rate</TableCell>
              <TableCell align="right">Hourly Rate</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredWorkers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary">No factory workers found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkers.map((worker) => (
                <TableRow key={worker.employee_id} hover>
                  <TableCell>{worker.employee_code}</TableCell>
                  <TableCell>{worker.employee_name}</TableCell>
                  <TableCell>{worker.department}</TableCell>
                  <TableCell>{worker.shift_name || '-'}</TableCell>
                  <TableCell align="right">
                    {worker.daily_rate ? `₹${worker.daily_rate.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {worker.hourly_rate ? `₹${worker.hourly_rate.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={worker.rate_status}
                      color={getRateStatusColor(worker.rate_status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleAssignRate(worker)}
                      title={worker.daily_rate ? 'Update Rate' : 'Assign Rate'}
                    >
                      {worker.daily_rate ? <EditIcon /> : <AddIcon />}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Assign/Edit Rate Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedWorker?.daily_rate ? 'Update Rate' : 'Assign Rate'} - {selectedWorker?.employee_name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Daily Rate"
              type="number"
              value={rateForm.dailyRate}
              onChange={(e) => setRateForm({ ...rateForm, dailyRate: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
              fullWidth
              required
            />
            <TextField
              label="Effective From"
              type="date"
              value={rateForm.effectiveFrom}
              onChange={(e) => setRateForm({ ...rateForm, effectiveFrom: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
            {rateForm.dailyRate && (
              <Alert severity="info">
                Hourly Rate: ₹{(parseFloat(rateForm.dailyRate) / 8).toFixed(2)}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveRate} variant="contained">
            Save Rate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
