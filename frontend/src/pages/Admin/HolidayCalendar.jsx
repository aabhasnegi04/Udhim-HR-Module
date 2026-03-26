import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import AppDatePicker from '../../components/common/AppDatePicker';
import {
    Box,
    Typography,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Alert,
    Card,
    CardContent,
    CircularProgress,
    Snackbar
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Upload as UploadIcon,
    Download as DownloadIcon,
    Event as EventIcon,
    CalendarToday as CalendarIcon
} from '@mui/icons-material';

const HolidayCalendar = () => {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [openDialog, setOpenDialog] = useState(false);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [editHoliday, setEditHoliday] = useState(null);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({});

    // Load holidays when component mounts or year changes
    useEffect(() => {
        loadHolidays();
    }, [selectedYear]);

    const loadHolidays = async () => {
        try {
            setLoading(true);
            const result = await adminService.getHolidays(selectedYear);
            if (result.success) {
                setHolidays(result.data || []);
            } else {
                setError(result.error || 'Failed to load holidays');
            }
        } catch (error) {
            setError('Failed to load holidays');
            console.error('Load holidays error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Generate year options (current year and 2 years back/forward)
    const getYearOptions = () => {
        const years = [];
        for (let i = currentYear - 2; i <= currentYear + 2; i++) {
            years.push(i);
        }
        return years;
    };

    const yearStats = {
        total: holidays.length,
        national: holidays.filter(h => h.holiday_type === 'National').length,
        optional: holidays.filter(h => h.holiday_type === 'Optional').length,
        active: holidays.filter(h => h.is_active).length
    };

    const handleYearChange = (event) => {
        setSelectedYear(event.target.value);
    };

    const handleAddHoliday = () => {
        setEditHoliday(null);
        setFormData({
            holiday_name: '',
            holiday_date: '',
            holiday_type: 'National',
            calendar_year: selectedYear
        });
        setOpenDialog(true);
    };

    const handleEditHoliday = (holiday) => {
        setEditHoliday(holiday);
        setFormData({
            holiday_name: holiday.holiday_name,
            holiday_date: holiday.holiday_date,
            holiday_type: holiday.holiday_type,
            calendar_year: holiday.calendar_year
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditHoliday(null);
        setFormData({});
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            let result;

            if (editHoliday) {
                result = await adminService.updateHoliday(editHoliday.holiday_id, formData);
            } else {
                result = await adminService.addHoliday(formData);
            }

            if (result.success) {
                setSuccess(`Holiday ${editHoliday ? 'updated' : 'added'} successfully`);
                handleCloseDialog();
                loadHolidays(); // Reload holidays
            } else {
                setError(result.error || 'Operation failed');
            }
        } catch (error) {
            setError('Operation failed');
            console.error('Submit error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteHoliday = async (holidayId) => {
        if (!window.confirm('Are you sure you want to delete this holiday?')) {
            return;
        }

        try {
            setLoading(true);
            const result = await adminService.deleteHoliday(holidayId);
            
            if (result.success) {
                setSuccess('Holiday deleted successfully');
                loadHolidays(); // Reload holidays
            } else {
                setError(result.error || 'Failed to delete holiday');
            }
        } catch (error) {
            setError('Failed to delete holiday');
            console.error('Delete error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const handleDownloadTemplate = async () => {
        try {
            setLoading(true);
            const result = await adminService.downloadHolidayTemplate();
            if (result.success) {
                setSuccess('Template downloaded successfully');
            } else {
                setError(result.error || 'Failed to download template');
            }
        } catch (error) {
            setError('Failed to download template');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenUploadDialog = () => {
        setUploadFile(null);
        setUploadResult(null);
        setOpenUploadDialog(true);
    };

    const handleCloseUploadDialog = () => {
        setOpenUploadDialog(false);
        setUploadFile(null);
        setUploadResult(null);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                setError('Please select an Excel file (.xlsx or .xls)');
                return;
            }
            setUploadFile(file);
        }
    };

    const handleBulkUpload = async () => {
        if (!uploadFile) {
            setError('Please select a file');
            return;
        }

        try {
            setUploadProgress(true);
            const result = await adminService.bulkUploadHolidays(uploadFile);
            
            if (result.success) {
                setUploadResult(result.data);
                setSuccess(result.message || 'Holidays uploaded successfully');
                loadHolidays(); // Reload holidays
                
                // Close dialog after 3 seconds if all succeeded
                if (result.data.failed === 0) {
                    setTimeout(() => {
                        handleCloseUploadDialog();
                    }, 3000);
                }
            } else {
                setUploadResult(result.data);
                setError(result.error || 'Upload failed');
            }
        } catch (error) {
            setError('Failed to upload file');
        } finally {
            setUploadProgress(false);
        }
    };

    return (
        <Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
                Holiday calendar configured here will be used by the Attendance module for leave calculations and reporting.
            </Alert>

            {/* Error/Success Messages */}
            <Snackbar 
                open={!!error} 
                autoHideDuration={6000} 
                onClose={() => setError('')}
            >
                <Alert severity="error" onClose={() => setError('')}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar 
                open={!!success} 
                autoHideDuration={6000} 
                onClose={() => setSuccess('')}
            >
                <Alert severity="success" onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            </Snackbar>

            {/* Year Selector and Actions */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                flexWrap: 'wrap',
                gap: 2
            }}>
                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Year</InputLabel>
                    <Select
                        value={selectedYear}
                        onChange={handleYearChange}
                        label="Year"
                    >
                        {getYearOptions().map((year) => (
                            <MenuItem key={year} value={year}>
                                {year}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={handleOpenUploadDialog}
                        disabled={loading}
                    >
                        Upload Excel
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadTemplate}
                        disabled={loading}
                    >
                        Download Template
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddHoliday}
                    >
                        Add Holiday
                    </Button>
                </Stack>
            </Box>

            {/* Year Statistics */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mb: 3 
            }}>
                <Card sx={{ flex: 1 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <EventIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {yearStats.total}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Holidays
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: 1 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <CalendarIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {yearStats.national}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            National Holidays
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: 1 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <EventIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {yearStats.optional}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Optional Holidays
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Holidays Table */}
            <Paper>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Holiday Name</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Day</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {holidays.map((holiday) => (
                                    <TableRow key={holiday.holiday_id}>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {holiday.holiday_name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(holiday.holiday_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(holiday.holiday_date).toLocaleDateString('en-US', { weekday: 'long' })}
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={holiday.holiday_type} 
                                                color={holiday.holiday_type === 'National' ? 'primary' : 'warning'} 
                                                size="small" 
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={holiday.is_active ? 'Active' : 'Inactive'} 
                                                color={holiday.is_active ? 'success' : 'default'} 
                                                size="small" 
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleEditHoliday(holiday)}
                                                disabled={loading}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                color="error"
                                                onClick={() => handleDeleteHoliday(holiday.holiday_id)}
                                                disabled={loading}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {holidays.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <Typography variant="body2" color="text.secondary">
                                                No holidays found for {selectedYear}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Add/Edit Holiday Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editHoliday ? 'Edit Holiday' : 'Add Holiday'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Holiday Name"
                            fullWidth
                            value={formData.holiday_name || ''}
                            onChange={(e) => handleFormChange('holiday_name', e.target.value)}
                            required
                        />
                        <AppDatePicker
                            label="Date"
                            value={formData.holiday_date || ''}
                            onChange={(v) => handleFormChange('holiday_date', v)}
                            required
                        />
                        <FormControl fullWidth>
                            <InputLabel>Holiday Type</InputLabel>
                            <Select
                                value={formData.holiday_type || ''}
                                onChange={(e) => handleFormChange('holiday_type', e.target.value)}
                                label="Holiday Type"
                            >
                                <MenuItem value="National">National Holiday</MenuItem>
                                <MenuItem value="Optional">Optional Holiday</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Year"
                            type="number"
                            fullWidth
                            value={formData.calendar_year || selectedYear}
                            onChange={(e) => handleFormChange('calendar_year', parseInt(e.target.value))}
                            required
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={loading}>
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={20} /> : (editHoliday ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Upload Dialog */}
            <Dialog open={openUploadDialog} onClose={handleCloseUploadDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <UploadIcon />
                        Bulk Upload Holidays
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Alert severity="info">
                            Download the template, fill in holiday details, and upload the Excel file.
                        </Alert>

                        <Box sx={{ 
                            border: '2px dashed', 
                            borderColor: 'primary.main', 
                            borderRadius: 2, 
                            p: 3, 
                            textAlign: 'center',
                            bgcolor: 'background.paper'
                        }}>
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                                id="holiday-upload-file"
                            />
                            <label htmlFor="holiday-upload-file">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    startIcon={<UploadIcon />}
                                    disabled={uploadProgress}
                                >
                                    Select Excel File
                                </Button>
                            </label>
                            {uploadFile && (
                                <Typography variant="body2" sx={{ mt: 2, color: 'success.main' }}>
                                    Selected: {uploadFile.name}
                                </Typography>
                            )}
                        </Box>

                        {uploadResult && (
                            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Upload Results:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                                    <Chip label={`Total: ${uploadResult.total}`} color="primary" />
                                    <Chip label={`Success: ${uploadResult.success}`} color="success" />
                                    <Chip label={`Failed: ${uploadResult.failed}`} color="error" />
                                </Box>

                                {uploadResult.errors && uploadResult.errors.length > 0 && (
                                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                                        <Typography variant="caption" color="error" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                                            Errors:
                                        </Typography>
                                        {uploadResult.errors.map((err, idx) => (
                                            <Typography key={idx} variant="caption" color="error" sx={{ display: 'block', mb: 0.5 }}>
                                                Row {err.row} ({err.holiday_name}): {err.error}
                                            </Typography>
                                        ))}
                                    </Box>
                                )}
                            </Paper>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseUploadDialog} disabled={uploadProgress}>
                        Close
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleBulkUpload}
                        disabled={!uploadFile || uploadProgress}
                        startIcon={uploadProgress ? <CircularProgress size={16} /> : <UploadIcon />}
                    >
                        {uploadProgress ? 'Uploading...' : 'Upload'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default HolidayCalendar;