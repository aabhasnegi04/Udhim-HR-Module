import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Alert,
    CircularProgress, Button, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, InputAdornment, MenuItem,
    TableSortLabel, Checkbox, Stack, Divider
} from '@mui/material';
import { 
    Warning as WarningIcon, 
    Edit as EditIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import ApiService from '../../services/api';
import attendanceService from '../../services/attendanceService';

const PendingAttendance = () => {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editRow, setEditRow] = useState(null);
    const [checkoutTime, setCheckoutTime] = useState('');
    const [checkoutDate, setCheckoutDate] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    
    // Bulk selection
    const [selectedRows, setSelectedRows] = useState([]);
    const [bulkAction, setBulkAction] = useState('');
    const [bulkCheckoutTime, setBulkCheckoutTime] = useState('');
    const [bulkCheckoutDate, setBulkCheckoutDate] = useState('');
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    
    // Filtering and sorting states
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await ApiService.get('/attendance/factory/pending?days_back=60');
            if (res.success) {
                const data = res.data?.pending || [];
                setRecords(data);
                setFilteredRecords(data);
            }
            else setError('Failed to load pending records');
        } catch { setError('Failed to load pending records'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPending(); }, []);

    // Apply filters and sorting
    useEffect(() => {
        let filtered = [...records];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(r =>
                r.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Department filter
        if (departmentFilter && departmentFilter !== 'ALL') {
            filtered = filtered.filter(r => 
                (r.department === departmentFilter) || 
                (r.department_name === departmentFilter)
            );
        }

        // Date filter
        if (dateFilter) {
            filtered = filtered.filter(r => {
                const recordDate = fmtDate(r.attendance_date);
                return recordDate === dateFilter;
            });
        }

        // Sorting
        filtered.sort((a, b) => {
            let aVal, bVal;
            
            switch (sortBy) {
                case 'name':
                    aVal = a.employee_name || '';
                    bVal = b.employee_name || '';
                    break;
                case 'department':
                    aVal = a.department_name || a.department || '';
                    bVal = b.department_name || b.department || '';
                    break;
                case 'date':
                default:
                    aVal = a.attendance_date || '';
                    bVal = b.attendance_date || '';
                    break;
            }

            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        setFilteredRecords(filtered);
    }, [records, searchTerm, departmentFilter, dateFilter, sortBy, sortOrder]);

    // Get unique departments for filter
    const departments = ['ALL', ...new Set(records.map(r => r.department_name || r.department).filter(Boolean))];

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const handleFix = async () => {
        if (!checkoutTime || !checkoutDate || !editRow) return;
        setSaving(true);
        try {
            const date = fmtDate(editRow.attendance_date);
            const isMissingCheckIn = !editRow.first_check_in && editRow.last_check_out;
            
            // Helper to extract time from datetime string
            const extractTime = (datetime) => {
                if (!datetime) return null;
                const timeMatch = String(datetime).match(/(\d{2}:\d{2}:\d{2})/);
                return timeMatch ? timeMatch[1] : null;
            };
            
            // Combine date and time for the missing punch
            const combinedDateTime = `${checkoutDate} ${checkoutTime}:00`;
            
            const result = await attendanceService.editAttendanceRecord(editRow.attendance_id, {
                employee_id: editRow.employee_id,
                attendance_date: date,
                status: 'PRESENT',
                check_in_time: isMissingCheckIn 
                    ? combinedDateTime
                    : extractTime(editRow.first_check_in),
                check_out_time: isMissingCheckIn
                    ? extractTime(editRow.last_check_out)
                    : combinedDateTime,
            });
            if (result.success) {
                setSuccess(`Fixed attendance for ${editRow.employee_name} on ${date}`);
                setEditRow(null);
                setCheckoutTime('');
                setCheckoutDate('');
                fetchPending();
            } else {
                setError(result.error || 'Failed to fix record');
            }
        } catch { setError('Failed to fix record'); }
        finally { setSaving(false); }
    };

    // Bulk selection handlers
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedRows(filteredRecords.map(r => r.attendance_id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (attendanceId) => {
        setSelectedRows(prev => {
            if (prev.includes(attendanceId)) {
                return prev.filter(id => id !== attendanceId);
            } else {
                return [...prev, attendanceId];
            }
        });
    };

    const handleBulkAction = (action) => {
        if (selectedRows.length === 0) {
            setError('Please select at least one record');
            return;
        }
        
        // Filter selected records based on action type
        const selectedRecords = records.filter(r => selectedRows.includes(r.attendance_id));
        let applicableRecords = [];
        
        if (action === 'add_checkin') {
            // Only records missing check-in
            applicableRecords = selectedRecords.filter(r => !r.first_check_in && r.last_check_out);
        } else if (action === 'add_checkout') {
            // Only records missing checkout
            applicableRecords = selectedRecords.filter(r => r.first_check_in && !r.last_check_out);
        } else if (action === 'approve') {
            // Only records with both times (short duration)
            applicableRecords = selectedRecords.filter(r => r.first_check_in && r.last_check_out);
        } else {
            // Mark absent applies to all
            applicableRecords = selectedRecords;
        }
        
        if (applicableRecords.length === 0) {
            setError(`No applicable records for this action. Selected records don't match the action type.`);
            return;
        }
        
        if (applicableRecords.length < selectedRecords.length) {
            setError(`Only ${applicableRecords.length} of ${selectedRecords.length} selected records are applicable for this action.`);
            // Continue anyway with applicable records
        }
        
        setBulkAction(action);
        setShowBulkDialog(true);
    };

    const executeBulkAction = async () => {
        if (selectedRows.length === 0) return;
        
        setSaving(true);
        try {
            const selectedRecords = records.filter(r => selectedRows.includes(r.attendance_id));
            
            // Filter records based on action type
            let applicableRecords = [];
            if (bulkAction === 'add_checkin') {
                applicableRecords = selectedRecords.filter(r => !r.first_check_in && r.last_check_out);
            } else if (bulkAction === 'add_checkout') {
                applicableRecords = selectedRecords.filter(r => r.first_check_in && !r.last_check_out);
            } else if (bulkAction === 'approve') {
                applicableRecords = selectedRecords.filter(r => r.first_check_in && r.last_check_out);
            } else {
                applicableRecords = selectedRecords;
            }
            
            let successCount = 0;
            let failCount = 0;

            for (const record of applicableRecords) {
                const date = fmtDate(record.attendance_date);
                let updateData = {
                    employee_id: record.employee_id,
                    attendance_date: date,
                };

                if (bulkAction === 'absent') {
                    updateData.status = 'ABSENT';
                    updateData.check_in_time = null;
                    updateData.check_out_time = null;
                } else if (bulkAction === 'add_checkin') {
                    // Add check-in time ONLY for records missing check-in
                    if (!bulkCheckoutTime || !bulkCheckoutDate) {
                        setError('Please enter check-in date and time');
                        setSaving(false);
                        return;
                    }
                    updateData.status = 'PRESENT';
                    updateData.check_in_time = `${bulkCheckoutDate} ${bulkCheckoutTime}:00`;
                    // Extract time without timezone conversion
                    updateData.check_out_time = record.last_check_out
                        ? String(record.last_check_out).match(/(\d{2}:\d{2}:\d{2})/)?.[1] || null
                        : null;
                } else if (bulkAction === 'add_checkout') {
                    // Add checkout time ONLY for records missing checkout
                    if (!bulkCheckoutTime || !bulkCheckoutDate) {
                        setError('Please enter check-out date and time');
                        setSaving(false);
                        return;
                    }
                    updateData.status = 'PRESENT';
                    // Extract time without timezone conversion
                    updateData.check_in_time = record.first_check_in
                        ? String(record.first_check_in).match(/(\d{2}:\d{2}:\d{2})/)?.[1] || null
                        : null;
                    updateData.check_out_time = `${bulkCheckoutDate} ${bulkCheckoutTime}:00`;
                } else if (bulkAction === 'approve') {
                    // Approve records that already have both times (short duration)
                    updateData.status = 'PRESENT';
                    // Extract time without timezone conversion
                    updateData.check_in_time = record.first_check_in
                        ? String(record.first_check_in).match(/(\d{2}:\d{2}:\d{2})/)?.[1] || null
                        : null;
                    updateData.check_out_time = record.last_check_out
                        ? String(record.last_check_out).match(/(\d{2}:\d{2}:\d{2})/)?.[1] || null
                        : null;
                }

                const result = await attendanceService.editAttendanceRecord(record.attendance_id, updateData);
                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                }
            }

            if (successCount > 0) {
                setSuccess(`Successfully processed ${successCount} record(s)${failCount > 0 ? `, ${failCount} failed` : ''}`);
                setSelectedRows([]);
                fetchPending();
            } else {
                setError('Failed to process records');
            }
        } catch (err) {
            setError('Failed to process bulk action');
        } finally {
            setSaving(false);
            setShowBulkDialog(false);
            setBulkAction('');
            setBulkCheckoutTime('');
            setBulkCheckoutDate('');
        }
    };

    const fmt = (dt) => {
        if (!dt) return '—';
        // Extract time directly from datetime string to avoid timezone conversion
        const timeMatch = String(dt).match(/(\d{2}:\d{2}:\d{2})/);
        if (timeMatch) return timeMatch[1].slice(0, 5);
        return new Date(dt).toTimeString().slice(0, 5);
    };

    const fmtDate = (dt) => {
        if (!dt) return '—';
        
        try {
            // Handle string dates
            const dateStr = String(dt);
            
            // If it's already in YYYY-MM-DD format, return as is
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return dateStr;
            }
            
            // Parse the date and format it
            const date = new Date(dt);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
            
            // If all else fails, try to extract date parts from string
            const match = dateStr.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/);
            if (match) {
                const months = {
                    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                };
                const day = match[1].padStart(2, '0');
                const month = months[match[2]];
                const year = match[3];
                return `${year}-${month}-${day}`;
            }
        } catch (e) {
            console.error('Date formatting error:', e, dt);
        }
        
        return String(dt);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <WarningIcon color="warning" />
                <Typography variant="h6" fontWeight={600}>Pending Attendance Corrections</Typography>
                {filteredRecords.length > 0 && (
                    <Chip label={`${filteredRecords.length} pending`} color="warning" size="small" />
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
            ) : records.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No pending records. All attendance is complete.</Typography>
                </Paper>
            ) : (
                <>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <strong>Pending Records:</strong> These employees need attendance corrections.
                        <br />• Missing check-in = Punch detected after shift midpoint (likely checkout)
                        <br />• Missing checkout = Punch detected before shift midpoint (likely check-in)
                        <br />• Short duration = Less than 4 hours worked
                    </Alert>

                    {/* Filters */}
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <FilterIcon color="action" />
                            <TextField
                                size="small"
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ flex: 1, minWidth: 250 }}
                            />
                            <TextField
                                select
                                size="small"
                                label="Department"
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                sx={{ minWidth: 150 }}
                            >
                                {departments.map((dept) => (
                                    <MenuItem key={dept} value={dept}>
                                        {dept === 'ALL' ? 'All Departments' : dept}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                type="date"
                                size="small"
                                label="Date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ minWidth: 150 }}
                            />
                            {(searchTerm || departmentFilter !== 'ALL' || dateFilter) && (
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setDepartmentFilter('ALL');
                                        setDateFilter('');
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </Box>
                    </Paper>

                    {/* Bulk Actions */}
                    {selectedRows.length > 0 && (
                        <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.50' }}>
                            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                                <Typography variant="body2" fontWeight={600}>
                                    {selectedRows.length} selected
                                </Typography>
                                <Divider orientation="vertical" flexItem />
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={<CancelIcon />}
                                    onClick={() => handleBulkAction('absent')}
                                >
                                    Mark Absent
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<ScheduleIcon />}
                                    onClick={() => handleBulkAction('add_checkin')}
                                >
                                    Add Check-in Time
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<ScheduleIcon />}
                                    onClick={() => handleBulkAction('add_checkout')}
                                >
                                    Add Check-out Time
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={() => handleBulkAction('approve')}
                                >
                                    Approve & Recalculate
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => setSelectedRows([])}
                                >
                                    Clear Selection
                                </Button>
                            </Stack>
                        </Paper>
                    )}

                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedRows.length === filteredRecords.length && filteredRecords.length > 0}
                                            indeterminate={selectedRows.length > 0 && selectedRows.length < filteredRecords.length}
                                            onChange={handleSelectAll}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortBy === 'name'}
                                            direction={sortBy === 'name' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('name')}
                                        >
                                            Employee
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortBy === 'department'}
                                            direction={sortBy === 'department' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('department')}
                                        >
                                            Department
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortBy === 'date'}
                                            direction={sortBy === 'date' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('date')}
                                        >
                                            Date
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>Shift</TableCell>
                                    <TableCell>Check-in</TableCell>
                                    <TableCell>Check-out</TableCell>
                                    <TableCell>Duration</TableCell>
                                    <TableCell>Issue</TableCell>
                                    <TableCell>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRecords.map((row, i) => {
                                    const hasBothPunches = row.first_check_in && row.last_check_out;
                                    const missingCheckIn = !row.first_check_in && row.last_check_out;
                                    const missingCheckOut = row.first_check_in && !row.last_check_out;
                                    
                                    // Calculate duration
                                    let duration = '—';
                                    if (hasBothPunches) {
                                        // If working_minutes is 0, calculate from timestamps
                                        let minutes = row.working_minutes || 0;
                                        if (minutes === 0) {
                                            const checkIn = new Date(row.first_check_in);
                                            const checkOut = new Date(row.last_check_out);
                                            minutes = Math.round((checkOut - checkIn) / 60000);
                                        }
                                        const hours = Math.floor(minutes / 60);
                                        const mins = minutes % 60;
                                        duration = `${hours}h ${mins}m`;
                                    }
                                    
                                    let issueLabel = 'Unknown';
                                    let issueColor = 'default';
                                    
                                    if (missingCheckIn) {
                                        issueLabel = 'Missing check-in';
                                        issueColor = 'error';
                                    } else if (missingCheckOut) {
                                        issueLabel = 'Missing checkout';
                                        issueColor = 'warning';
                                    } else if (hasBothPunches) {
                                        issueLabel = 'Short duration';
                                        issueColor = 'info';
                                    }
                                    
                                    return (
                                    <TableRow 
                                        key={i} 
                                        sx={{ 
                                            bgcolor: selectedRows.includes(row.attendance_id) ? 'primary.50' : 'warning.50'
                                        }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedRows.includes(row.attendance_id)}
                                                onChange={() => handleSelectRow(row.attendance_id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{row.employee_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{row.employee_code}</Typography>
                                        </TableCell>
                                        <TableCell>{row.department_name || row.department || 'Not Assigned'}</TableCell>
                                        <TableCell>{fmtDate(row.attendance_date)}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={row.detected_shift || 'Unknown'} 
                                                size="small"
                                                color={row.detected_shift === 'Day Shift' ? 'primary' : row.detected_shift === 'Night Shift' ? 'secondary' : 'default'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {row.first_check_in ? fmt(row.first_check_in) : (
                                                <Chip label="Missing" color="error" size="small" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {row.last_check_out ? (
                                                <>
                                                    {fmt(row.last_check_out)}
                                                    {/* Show date indicator if checkout is next day */}
                                                    {row.first_check_in === null && row.last_check_out && 
                                                     new Date(row.last_check_out).toDateString() !== new Date(row.attendance_date).toDateString() && (
                                                        <Typography variant="caption" display="block" color="warning.main">
                                                            {new Date(row.last_check_out).toLocaleDateString('en-GB', { 
                                                                day: 'numeric', 
                                                                month: 'short', 
                                                                year: 'numeric' 
                                                            })}
                                                        </Typography>
                                                    )}
                                                </>
                                            ) : (
                                                <Chip label="Missing" color="warning" size="small" />
                                            )}
                                        </TableCell>
                                        <TableCell>{duration}</TableCell>
                                        <TableCell>
                                            <Chip label={issueLabel} color={issueColor} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            <Button size="small" variant="outlined" startIcon={<EditIcon />}
                                                onClick={() => { 
                                                    setEditRow(row); 
                                                    setCheckoutTime(''); 
                                                    // Smart default for checkout date
                                                    const attendanceDate = fmtDate(row.attendance_date);
                                                    if (row.detected_shift === 'Night Shift' && !row.last_check_out) {
                                                        // Night shift missing checkout: default to next day
                                                        const nextDay = new Date(row.attendance_date);
                                                        nextDay.setDate(nextDay.getDate() + 1);
                                                        setCheckoutDate(nextDay.toISOString().split('T')[0]);
                                                    } else {
                                                        // Day shift or missing check-in: default to same day
                                                        setCheckoutDate(attendanceDate);
                                                    }
                                                }}>
                                                Fix
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {/* Fix Dialog */}
            <Dialog open={!!editRow} onClose={() => setEditRow(null)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editRow && !editRow.first_check_in && editRow.last_check_out ? 'Enter Check-in Time' : 'Enter Check-out Time'}
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {editRow?.employee_name} — {fmtDate(editRow?.attendance_date)}
                        <br />
                        {editRow?.detected_shift && (
                            <>
                                <Chip 
                                    label={editRow.detected_shift} 
                                    size="small" 
                                    color={editRow.detected_shift === 'Day Shift' ? 'primary' : 'secondary'}
                                    sx={{ mr: 1, mt: 0.5 }}
                                />
                            </>
                        )}
                        {editRow && !editRow.first_check_in && editRow.last_check_out ? (
                            <>Check-out: {fmt(editRow?.last_check_out)}</>
                        ) : (
                            <>Check-in: {fmt(editRow?.first_check_in)}</>
                        )}
                    </Typography>
                    
                    {editRow?.detected_shift === 'Night Shift' && !editRow?.last_check_out && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Night shift checkout is typically on the next day morning
                        </Alert>
                    )}
                    
                    <Stack spacing={2}>
                        <TextField
                            label="Date"
                            type="date"
                            value={checkoutDate}
                            onChange={e => setCheckoutDate(e.target.value)}
                            fullWidth 
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label={editRow && !editRow.first_check_in && editRow.last_check_out ? 'Check-in Time' : 'Check-out Time'}
                            type="time"
                            value={checkoutTime}
                            onChange={e => setCheckoutTime(e.target.value)}
                            fullWidth 
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditRow(null)}>Cancel</Button>
                    <Button variant="contained" onClick={handleFix} disabled={saving || !checkoutTime || !checkoutDate}>
                        {saving ? 'Saving...' : 'Save & Recalculate'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Action Dialog */}
            <Dialog open={showBulkDialog} onClose={() => setShowBulkDialog(false)}>
                <DialogTitle>
                    {bulkAction === 'absent' && 'Mark Selected as Absent'}
                    {bulkAction === 'add_checkin' && 'Add Check-in Time for Selected'}
                    {bulkAction === 'add_checkout' && 'Add Check-out Time for Selected'}
                    {bulkAction === 'approve' && 'Approve & Recalculate Selected'}
                </DialogTitle>
                <DialogContent sx={{ pt: 2, minWidth: 400 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        This will update {selectedRows.length} record(s)
                    </Alert>
                    
                    {bulkAction === 'absent' && (
                        <Typography variant="body2">
                            All selected records will be marked as ABSENT. This action cannot be undone.
                        </Typography>
                    )}
                    
                    {bulkAction === 'add_checkin' && (
                        <>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Enter the check-in date and time to apply to all selected records (missing check-in):
                            </Typography>
                            <Stack spacing={2}>
                                <TextField
                                    label="Check-in Date"
                                    type="date"
                                    value={bulkCheckoutDate}
                                    onChange={e => setBulkCheckoutDate(e.target.value)}
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Check-in Time"
                                    type="time"
                                    value={bulkCheckoutTime}
                                    onChange={e => setBulkCheckoutTime(e.target.value)}
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Stack>
                        </>
                    )}
                    
                    {bulkAction === 'add_checkout' && (
                        <>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Enter the check-out date and time to apply to all selected records (missing checkout):
                            </Typography>
                            <Stack spacing={2}>
                                <TextField
                                    label="Check-out Date"
                                    type="date"
                                    value={bulkCheckoutDate}
                                    onChange={e => setBulkCheckoutDate(e.target.value)}
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Check-out Time"
                                    type="time"
                                    value={bulkCheckoutTime}
                                    onChange={e => setBulkCheckoutTime(e.target.value)}
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Stack>
                        </>
                    )}
                    
                    {bulkAction === 'approve' && (
                        <Typography variant="body2">
                            All selected records will be approved and attendance will be recalculated based on their existing check-in and check-out times.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setShowBulkDialog(false);
                        setBulkAction('');
                        setBulkCheckoutTime('');
                        setBulkCheckoutDate('');
                    }}>
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={executeBulkAction} 
                        disabled={saving || ((bulkAction === 'add_checkin' || bulkAction === 'add_checkout') && (!bulkCheckoutTime || !bulkCheckoutDate))}
                        color={bulkAction === 'absent' ? 'error' : 'primary'}
                    >
                        {saving ? 'Processing...' : 'Confirm & Update'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PendingAttendance;
