import { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TableSortLabel, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
  InputAdornment, FormControl, InputLabel, Select, MenuItem, Grid, Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import factoryPayrollService from '../../services/factoryPayrollService';
import BulkRateUpload from './BulkRateUpload';

const SORT_FIELDS = {
  employee_code: (a, b) => Number(a.employee_code) - Number(b.employee_code),
  employee_name: (a, b) => (a.employee_name || '').localeCompare(b.employee_name || ''),
  department: (a, b) => (a.department || '').localeCompare(b.department || ''),
  daily_rate: (a, b) => (Number(a.daily_rate) || 0) - (Number(b.daily_rate) || 0),
};

export default function RateManagement() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterRateStatus, setFilterRateStatus] = useState('ALL');
  const [filterEmployeeStatus, setFilterEmployeeStatus] = useState('ACTIVE');

  // Sort
  const [sortField, setSortField] = useState('employee_code');
  const [sortDir, setSortDir] = useState('asc');

  // Assign/Edit dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [rateForm, setRateForm] = useState({ dailyRate: '', effectiveFrom: new Date().toISOString().split('T')[0] });
  const [formError, setFormError] = useState('');

  // History dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyWorker, setHistoryWorker] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Page-level alerts
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  // Bulk upload dialog
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  useEffect(() => { fetchWorkers(); }, []);

  const fetchWorkers = async (empStatus) => {
    const status = empStatus ?? filterEmployeeStatus;
    try {
      setLoading(true);
      const response = await factoryPayrollService.getAllWorkersWithRates(status);
      if (response.success && response.data) {
        setWorkers(response.data);
      } else {
        showAlert(response.message || 'Failed to load workers', 'error');
      }
    } catch {
      showAlert('Failed to load factory workers', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when employee status filter changes
  useEffect(() => { fetchWorkers(filterEmployeeStatus); }, [filterEmployeeStatus]);

  const showAlert = (message, severity = 'success') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 5000);
  };

  // Derived: unique departments from loaded data
  const departments = useMemo(() => (
    [...new Set(workers.map(w => w.department).filter(Boolean))].sort()
  ), [workers]);

  // Filtered + sorted list
  const displayedWorkers = useMemo(() => {
    let list = workers.filter(w => {
      const search = searchTerm.toLowerCase();
      const matchSearch = !search ||
        w.employee_code?.toLowerCase().includes(search) ||
        w.employee_name?.toLowerCase().includes(search) ||
        w.department?.toLowerCase().includes(search);
      const matchDept = filterDepartment === 'ALL' || w.department === filterDepartment;
      const matchStatus = filterRateStatus === 'ALL' || w.rate_status === filterRateStatus;
      return matchSearch && matchDept && matchStatus;
    });

    const compareFn = SORT_FIELDS[sortField];
    if (compareFn) {
      list = [...list].sort((a, b) => sortDir === 'asc' ? compareFn(a, b) : compareFn(b, a));
    }
    return list;
  }, [workers, searchTerm, filterDepartment, filterRateStatus, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Assign / Edit rate
  const handleAssignRate = (worker) => {
    setSelectedWorker(worker);
    setRateForm({
      dailyRate: worker.daily_rate || '',
      effectiveFrom: new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setAssignDialogOpen(true);
  };

  const handleSaveRate = async () => {
    if (!rateForm.dailyRate || Number(rateForm.dailyRate) <= 0) {
      setFormError('Please enter a valid daily rate');
      return;
    }
    try {
      const response = await factoryPayrollService.assignWorkerRate(
        selectedWorker.employee_id,
        parseFloat(rateForm.dailyRate),
        rateForm.effectiveFrom
      );
      if (response.success) {
        setAssignDialogOpen(false);
        showAlert(`Rate updated for ${selectedWorker.employee_name}`);
        fetchWorkers();
      } else {
        setFormError(response.message || 'Failed to save rate');
      }
    } catch {
      setFormError('Failed to save rate');
    }
  };

  // Rate history
  const handleViewHistory = async (worker) => {
    setHistoryWorker(worker);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    setHistory([]);
    try {
      const response = await factoryPayrollService.getWorkerRateHistory(worker.employee_id);
      if (response.success && response.data) {
        setHistory(Array.isArray(response.data) ? response.data : []);
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getRateStatusColor = (status) => {
    if (status === 'Active') return 'success';
    if (status === 'No Rate Assigned') return 'error';
    return 'default';
  };

  const fmt = (val) => val ? `₹${Number(val).toFixed(2)}` : '-';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

  // Summary counts
  const totalWorkers = workers.length;
  const withRate = workers.filter(w => w.rate_status === 'Active').length;
  const withoutRate = workers.filter(w => w.rate_status === 'No Rate Assigned').length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Page alert */}
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 2 }} onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}

      {/* Summary cards */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => setBulkUploadOpen(true)}
        >
          Bulk Upload Rates
        </Button>
      </Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Workers', value: totalWorkers, color: 'primary.main' },
          { label: 'Rate Assigned', value: withRate, color: 'success.main' },
          { label: 'No Rate', value: withoutRate, color: 'error.main' },
        ].map(card => (
          <Grid item xs={12} sm={4} key={card.label}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color={card.color}>{card.value}</Typography>
              <Typography variant="body2" color="text.secondary">{card.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by code, name or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon /></InputAdornment>
                  ),
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} label="Department">
                <MenuItem value="ALL">All Departments</MenuItem>
                {departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Rate Status</InputLabel>
              <Select value={filterRateStatus} onChange={(e) => setFilterRateStatus(e.target.value)} label="Rate Status">
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="Active">Rate Assigned</MenuItem>
                <MenuItem value="No Rate Assigned">No Rate</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Employee Status</InputLabel>
              <Select value={filterEmployeeStatus} onChange={(e) => setFilterEmployeeStatus(e.target.value)} label="Employee Status">
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="RESIGNED">Resigned</MenuItem>
                <MenuItem value="ALL">All</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Typography variant="body2" color="text.secondary" align="right">
              Showing {displayedWorkers.length} of {totalWorkers}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'employee_code'}
                  direction={sortField === 'employee_code' ? sortDir : 'asc'}
                  onClick={() => handleSort('employee_code')}
                >
                  Code
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'employee_name'}
                  direction={sortField === 'employee_name' ? sortDir : 'asc'}
                  onClick={() => handleSort('employee_name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'department'}
                  direction={sortField === 'department' ? sortDir : 'asc'}
                  onClick={() => handleSort('department')}
                >
                  Department
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'daily_rate'}
                  direction={sortField === 'daily_rate' ? sortDir : 'asc'}
                  onClick={() => handleSort('daily_rate')}
                >
                  Daily Rate
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Hourly Rate</TableCell>
              <TableCell>Effective From</TableCell>
              <TableCell>Emp. Status</TableCell>
              <TableCell>Rate Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedWorkers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>No factory workers found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayedWorkers.map((worker) => (
                <TableRow key={worker.employee_id} hover>
                  <TableCell>{worker.employee_code}</TableCell>
                  <TableCell>{worker.employee_name}</TableCell>
                  <TableCell>{worker.department || '-'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {fmt(worker.daily_rate)}
                  </TableCell>
                  <TableCell align="right">{fmt(worker.hourly_rate)}</TableCell>
                  <TableCell>{fmtDate(worker.effective_from)}</TableCell>
                  <TableCell>
                    <Chip
                      label={worker.employee_status}
                      size="small"
                      color={worker.employee_status === 'ACTIVE' ? 'success' : worker.employee_status === 'INACTIVE' ? 'warning' : 'error'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={worker.rate_status} color={getRateStatusColor(worker.rate_status)} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={worker.daily_rate ? 'Update Rate' : 'Assign Rate'}>
                      <IconButton size="small" color="primary" onClick={() => handleAssignRate(worker)}>
                        {worker.daily_rate ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Rate History">
                      <IconButton size="small" color="info" onClick={() => handleViewHistory(worker)}>
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Assign / Edit Rate Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedWorker?.daily_rate ? 'Update Rate' : 'Assign Rate'} — {selectedWorker?.employee_name}
          <Typography variant="body2" color="text.secondary">
            {selectedWorker?.department} · Code: {selectedWorker?.employee_code}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && <Alert severity="error" onClose={() => setFormError('')}>{formError}</Alert>}
            {selectedWorker?.daily_rate && (
              <Alert severity="info" icon={<TrendingUpIcon />}>
                Current rate: {fmt(selectedWorker.daily_rate)} / day (effective {fmtDate(selectedWorker.effective_from)})
              </Alert>
            )}
            <TextField
              label="New Daily Rate (₹)"
              type="number"
              value={rateForm.dailyRate}
              onChange={(e) => setRateForm({ ...rateForm, dailyRate: e.target.value })}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
              fullWidth
              required
            />
            <TextField
              label="Effective From"
              type="date"
              value={rateForm.effectiveFrom}
              onChange={(e) => setRateForm({ ...rateForm, effectiveFrom: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
              required
            />
            {rateForm.dailyRate > 0 && (
              <Alert severity="success">
                Hourly Rate will be: ₹{(parseFloat(rateForm.dailyRate) / 8).toFixed(2)}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveRate} variant="contained">Save Rate</Button>
        </DialogActions>
      </Dialog>

      {/* Rate History Dialog */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Rate History — {historyWorker?.employee_name}
          <Typography variant="body2" color="text.secondary">
            {historyWorker?.department} · Code: {historyWorker?.employee_code}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {historyLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : history.length === 0 ? (
            <Box p={4} textAlign="center">
              <Typography color="text.secondary">No rate history found for this employee</Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {history.length} rate record{history.length !== 1 ? 's' : ''} found
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell>#</TableCell>
                      <TableCell align="right">Daily Rate</TableCell>
                      <TableCell align="right">Hourly Rate</TableCell>
                      <TableCell>Effective From</TableCell>
                      <TableCell>Effective To</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Set By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((record, index) => (
                      <TableRow key={record.rate_id} hover>
                        <TableCell>{history.length - index}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {fmt(record.daily_rate)}
                        </TableCell>
                        <TableCell align="right">{fmt(record.hourly_rate)}</TableCell>
                        <TableCell>{fmtDate(record.effective_from)}</TableCell>
                        <TableCell>{record.effective_to ? fmtDate(record.effective_to) : '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={record.duration || (record.effective_to ? '' : 'Current')}
                            size="small"
                            color={record.is_active ? 'success' : 'default'}
                            variant={record.is_active ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={record.is_active ? 'Active' : 'Superseded'}
                            size="small"
                            color={record.is_active ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{record.created_by_email || '-'}</Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {record.created_at ? new Date(record.created_at).toLocaleDateString('en-GB') : ''}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
          <Button
            variant="outlined"
            onClick={() => { setHistoryDialogOpen(false); handleAssignRate(historyWorker); }}
          >
            Update Rate
          </Button>
        </DialogActions>
      </Dialog>
      {/* Bulk Rate Upload Dialog */}
      <BulkRateUpload
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        workers={workers}
        onSuccess={() => {
          showAlert('Bulk rate upload completed successfully');
          fetchWorkers(filterEmployeeStatus);
        }}
      />
    </Box>
  );
}
