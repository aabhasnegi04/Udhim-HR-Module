import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    Event as EventIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import holidayService from '../../services/holidayService';

const HolidayManagement = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [newHoliday, setNewHoliday] = useState({
        holiday_date: dayjs(),
        holiday_name: '',
        holiday_type: 'NATIONAL',
        description: '',
        calendar_year: new Date().getFullYear()
    });

    // Load holidays on component mount
    useEffect(() => {
        loadHolidays();
    }, [selectedYear]);

    const loadHolidays = async () => {
        try {
            setLoading(true);
            const result = await holidayService.getHolidaysByYear(selectedYear);
            if (result.success) {
                setHolidays(result.data || []);
            } else {
                setErrorMessage(result.error || 'Failed to load holidays');
                setShowError(true);
            }
        } catch (error) {
            setErrorMessage('Failed to load holidays');
            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleAddHoliday = async () => {
        try {
            const holidayData = {
                holiday_date: newHoliday.holiday_date.format('YYYY-MM-DD'),
                holiday_name: newHoliday.holiday_name,
                holiday_type: newHoliday.holiday_type,
                calendar_year: newHoliday.holiday_date.year()
            };

            const result = await holidayService.addHoliday(holidayData);
            
            if (result.success) {
                setShowAddDialog(false);
                setNewHoliday({
                    holiday_date: dayjs(),
                    holiday_name: '',
                    holiday_type: 'NATIONAL',
                    description: '',
                    calendar_year: new Date().getFullYear()
                });
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
                loadHolidays(); // Reload the list
            } else {
                setErrorMessage(result.error || 'Failed to add holiday');
                setShowError(true);
            }
        } catch (error) {
            setErrorMessage('Failed to add holiday');
            setShowError(true);
        }
    };

    const handleEditHoliday = (holiday) => {
        setEditingHoliday(holiday);
        setNewHoliday({
            holiday_date: dayjs(holiday.holiday_date),
            holiday_name: holiday.holiday_name,
            holiday_type: holiday.holiday_type,
            description: '',
            calendar_year: dayjs(holiday.holiday_date).year()
        });
        setShowAddDialog(true);
    };

    const handleUpdateHoliday = async () => {
        try {
            const holidayData = {
                holiday_date: newHoliday.holiday_date.format('YYYY-MM-DD'),
                holiday_name: newHoliday.holiday_name,
                holiday_type: newHoliday.holiday_type,
                calendar_year: newHoliday.holiday_date.year()
            };

            const result = await holidayService.updateHoliday(editingHoliday.holiday_id, holidayData);
            
            if (result.success) {
                setShowAddDialog(false);
                setEditingHoliday(null);
                setNewHoliday({
                    holiday_date: dayjs(),
                    holiday_name: '',
                    holiday_type: 'NATIONAL',
                    description: '',
                    calendar_year: new Date().getFullYear()
                });
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
                loadHolidays(); // Reload the list
            } else {
                setErrorMessage(result.error || 'Failed to update holiday');
                setShowError(true);
            }
        } catch (error) {
            setErrorMessage('Failed to update holiday');
            setShowError(true);
        }
    };

    const handleDeleteHoliday = async (holidayId) => {
        if (!window.confirm('Are you sure you want to delete this holiday?')) {
            return;
        }

        try {
            const result = await holidayService.deleteHoliday(holidayId);
            
            if (result.success) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
                loadHolidays(); // Reload the list
            } else {
                setErrorMessage(result.error || 'Failed to delete holiday');
                setShowError(true);
            }
        } catch (error) {
            setErrorMessage('Failed to delete holiday');
            setShowError(true);
        }
    };

    const exportHolidays = () => {
        // TODO: Implement export functionality
        alert('Export functionality coming soon!');
    };

    const handleBulkUpload = () => {
        // TODO: Implement bulk upload functionality
        setShowUploadDialog(false);
        alert('Bulk upload functionality coming soon!');
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Company Holiday Calendar
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage company holidays and leave calendar
                </Typography>
            </Box>

            {showSuccess && (
                <Alert severity="success" sx={{ mb: { xs: 2, sm: 3 } }} onClose={() => setShowSuccess(false)}>
                    Holiday calendar updated successfully!
                </Alert>
            )}

            {showError && (
                <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 } }} onClose={() => setShowError(false)}>
                    {errorMessage}
                </Alert>
            )}

            {/* Action Buttons */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Holiday Calendar Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Add, edit, and manage company holidays
                        </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setShowAddDialog(true)}
                                size="small"
                            >
                                Add Holiday
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<UploadIcon />}
                                onClick={() => setShowUploadDialog(true)}
                                size="small"
                            >
                                Bulk Upload
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={exportHolidays}
                                size="small"
                            >
                                Export List
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* Holiday Statistics */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3, md: 4 }, mb: { xs: 2, sm: 3, md: 4 }, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 180px', minWidth: { xs: '150px', sm: '180px' } }}>
                        <Card sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
                            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
                                <Typography variant="h3" sx={{ 
                                    fontWeight: 700, 
                                    color: 'error.main', 
                                    mb: 1,
                                    fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
                                }}>
                                    {holidays.filter(h => h.holiday_type === 'NATIONAL').length}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                    National Holidays
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                    Mandatory holidays
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 180px', minWidth: { xs: '150px', sm: '180px' } }}>
                        <Card sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
                            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
                                <Typography variant="h3" sx={{ 
                                    fontWeight: 700, 
                                    color: 'warning.main', 
                                    mb: 1,
                                    fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
                                }}>
                                    {holidays.filter(h => h.holiday_type === 'OPTIONAL').length}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                    Optional Holidays
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                    Employee choice
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 180px', minWidth: { xs: '150px', sm: '180px' } }}>
                        <Card sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
                            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
                                <Typography variant="h3" sx={{ 
                                    fontWeight: 700, 
                                    color: 'primary.main', 
                                    mb: 1,
                                    fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
                                }}>
                                    {holidays.length}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                    Total Holidays
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                    This year
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 180px', minWidth: { xs: '150px', sm: '180px' } }}>
                        <Card sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
                            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
                                <Typography variant="h3" sx={{ 
                                    fontWeight: 700, 
                                    color: 'success.main', 
                                    mb: 1,
                                    fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
                                }}>
                                    {holidays.filter(h => new Date(h.holiday_date) > new Date()).length}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                    Upcoming
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                    Remaining holidays
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            )}

            {/* Holiday List */}
            <Paper sx={{ overflow: 'hidden' }}>
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Holiday Calendar ({selectedYear})
                    </Typography>
                </Box>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : holidays.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                            No holidays found for {selectedYear}
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Holiday Name</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {holidays
                                    .sort((a, b) => new Date(a.holiday_date) - new Date(b.holiday_date))
                                    .map((holiday, index) => (
                                        <TableRow key={holiday.holiday_id || `holiday-${index}`} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <EventIcon color="primary" fontSize="small" />
                                                    {new Date(holiday.holiday_date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {holiday.holiday_name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={holiday.holiday_type}
                                                    color={holiday.holiday_type === 'NATIONAL' ? 'error' : 'warning'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditHoliday(holiday)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteHoliday(holiday.holiday_id)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Add/Edit Holiday Dialog */}
            <Dialog
                open={showAddDialog}
                onClose={() => {
                    setShowAddDialog(false);
                    setEditingHoliday(null);
                    setNewHoliday({ date: new Date().toISOString().split('T')[0], name: '', type: 'National', description: '' });
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Holiday Date"
                                value={newHoliday.holiday_date}
                                onChange={(newValue) => setNewHoliday({ ...newHoliday, holiday_date: newValue })}
                                slotProps={{
                                    textField: {
                                        fullWidth: true
                                    }
                                }}
                            />
                        </LocalizationProvider>
                        <TextField
                            fullWidth
                            label="Holiday Name"
                            value={newHoliday.holiday_name}
                            onChange={(e) => setNewHoliday({ ...newHoliday, holiday_name: e.target.value })}
                            placeholder="e.g., Independence Day"
                        />
                        <FormControl fullWidth>
                            <InputLabel>Holiday Type</InputLabel>
                            <Select
                                value={newHoliday.holiday_type}
                                onChange={(e) => setNewHoliday({ ...newHoliday, holiday_type: e.target.value })}
                                label="Holiday Type"
                            >
                                <MenuItem value="NATIONAL">National Holiday</MenuItem>
                                <MenuItem value="OPTIONAL">Optional Holiday</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setShowAddDialog(false);
                        setEditingHoliday(null);
                        setNewHoliday({
                            holiday_date: dayjs(),
                            holiday_name: '',
                            holiday_type: 'NATIONAL',
                            description: '',
                            calendar_year: new Date().getFullYear()
                        });
                    }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={editingHoliday ? handleUpdateHoliday : handleAddHoliday}
                        disabled={!newHoliday.holiday_name || !newHoliday.holiday_date}
                    >
                        {editingHoliday ? 'Update' : 'Add'} Holiday
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Upload Dialog */}
            <Dialog
                open={showUploadDialog}
                onClose={() => setShowUploadDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Bulk Upload Holidays</DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Upload Holiday Calendar
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Select an Excel file containing holiday data
                        </Typography>
                        <input
                            accept=".xlsx,.xls"
                            style={{ display: 'none' }}
                            id="holiday-file-upload"
                            type="file"
                        />
                        <label htmlFor="holiday-file-upload">
                            <Button variant="contained" component="span" startIcon={<UploadIcon />}>
                                Choose File
                            </Button>
                        </label>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowUploadDialog(false)}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleBulkUpload}>
                        Upload
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default HolidayManagement;