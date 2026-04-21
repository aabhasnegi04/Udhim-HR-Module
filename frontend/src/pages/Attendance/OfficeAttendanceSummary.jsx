import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    MenuItem,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    TableChart as ExcelIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const OfficeAttendanceSummary = () => {
    const [dateRange, setDateRange] = useState({
        from: dayjs().startOf('month'),
        to: dayjs().endOf('month')
    });
    const [department, setDepartment] = useState('All');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerateReport = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // TODO: Call API to get summary report data
            console.log('Generating report for:', {
                from: dateRange.from.format('YYYY-MM-DD'),
                to: dateRange.to.format('YYYY-MM-DD'),
                department
            });
            
            // Placeholder - will implement grid display next
            alert('Report generation coming soon!');
        } catch (err) {
            setError('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            {/* Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Office Attendance Summary
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Generate grid-style attendance summary for office employees
                </Typography>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'end' }}>
                        <DatePicker
                            label="From Date"
                            value={dateRange.from}
                            onChange={(newValue) => setDateRange(prev => ({ ...prev, from: newValue }))}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    sx: { minWidth: 180 }
                                }
                            }}
                        />

                        <DatePicker
                            label="To Date"
                            value={dateRange.to}
                            onChange={(newValue) => setDateRange(prev => ({ ...prev, to: newValue }))}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    sx: { minWidth: 180 }
                                }
                            }}
                        />

                        <TextField
                            select
                            label="Department"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            size="small"
                            sx={{ minWidth: 180 }}
                        >
                            <MenuItem value="All">All Departments</MenuItem>
                            <MenuItem value="Engineering">Engineering</MenuItem>
                            <MenuItem value="Sales">Sales</MenuItem>
                            <MenuItem value="Marketing">Marketing</MenuItem>
                            <MenuItem value="HR">HR</MenuItem>
                        </TextField>

                        <Button
                            variant="contained"
                            onClick={handleGenerateReport}
                            disabled={loading}
                        >
                            {loading ? 'Generating...' : 'Generate Report'}
                        </Button>

                        <Button
                            variant="outlined"
                            startIcon={<ExcelIcon />}
                            disabled
                        >
                            Export to Excel
                        </Button>
                    </Box>
                </LocalizationProvider>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </Paper>

            {/* Report Display Area */}
            <Paper sx={{ p: 3, minHeight: 400 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Select date range and click "Generate Report"
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Grid-style attendance summary will be displayed here
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default OfficeAttendanceSummary;
