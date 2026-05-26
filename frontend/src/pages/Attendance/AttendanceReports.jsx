import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
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
    Stack,
    CircularProgress,
    Alert,
    Autocomplete,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Assessment as ReportIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    DateRange as DateIcon,
    FilterList as FilterIcon,
    Factory as FactoryIcon,
    Business as OfficeIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import attendanceService from '../../services/attendanceService';
import employeeService from '../../services/employeeService';
import { exportFactoryGridToExcel } from './factoryGridExport';
import DeptShiftRangeReport from './DeptShiftRangeReport';

const AttendanceReports = ({ attendanceType = 'office' }) => {
    const [reportCategory, setReportCategory] = useState(attendanceType); // Sync with parent
    const [selectedReport, setSelectedReport] = useState('monthly');
    const [dateRange, setDateRange] = useState({
        from: dayjs().startOf('month'),
        to: dayjs()
    });
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [summary, setSummary] = useState({
        totalRecords: 0,
        presentDays: 0,
        pendingRecords: 0,
        absentDays: 0
    });

    // Extra filters
    const [filterShift, setFilterShift] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterMinHours, setFilterMinHours] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [shifts, setShifts] = useState([]);
    const [departments, setDepartments] = useState([]);

    const reportTypes = [
        { value: 'dateRange', label: 'Date Range Report', icon: <DateIcon /> },
        { value: 'monthly', label: 'Monthly Summary', icon: <ReportIcon /> },
        { value: 'deptShiftRange', label: 'Dept Shift Range', icon: <FactoryIcon /> },
    ];

    // Load employees on mount
    useEffect(() => {
        loadEmployees();
        loadShifts();
    }, []);

    // Sync reportCategory with parent attendanceType
    useEffect(() => {
        setReportCategory(attendanceType);
        loadEmployees(); // Reload employees when category changes
    }, [attendanceType]);

    // Reload employees when reportCategory changes
    useEffect(() => {
        loadEmployees();
    }, [reportCategory]);

    const loadShifts = async () => {
        try {
            const res = await import('../../services/api').then(m => m.default.get('/attendance/shifts'));
            if (res.success) setShifts(res.data?.shifts || []);
        } catch { /* shifts optional */ }
    };

    // Auto-load report data only after first manual load
    useEffect(() => {
        if (hasLoadedOnce && dateRange.from && dateRange.to && 
            dayjs.isDayjs(dateRange.from) && dayjs.isDayjs(dateRange.to)) {
            loadReportData();
        }
    }, [selectedReport, dateRange.from?.format('YYYY-MM-DD'), dateRange.to?.format('YYYY-MM-DD'), selectedEmployee?.employee_id, filterDepartment, reportCategory]);

    const loadEmployees = async () => {
        try {
            const result = await employeeService.getAllEmployees();
            if (result.success) {
                const allEmployees = result.data || [];
                setEmployees(allEmployees);
                
                // Extract unique departments from all employees
                const uniqueDepts = [...new Set(allEmployees.map(e => e.department).filter(Boolean))];
                setDepartments(uniqueDepts);
            }
        } catch (error) {
            console.error('Failed to load employees:', error);
        }
    };

    const loadReportData = async () => {
        try {
            setLoading(true);
            setError(null);
            setHasLoadedOnce(true);

            // Validate dates before making API call
            if (!dateRange.from || !dateRange.to) {
                setError('Please select valid date range');
                setReportData([]);
                setLoading(false);
                return;
            }

            if (!dayjs.isDayjs(dateRange.from) || !dayjs.isDayjs(dateRange.to)) {
                setError('Invalid date format');
                setReportData([]);
                setLoading(false);
                return;
            }

            if (selectedReport === 'dateRange') {
                const workerCategory = reportCategory === 'factory' ? 'FACTORY' : 'OFFICE';
                
                const result = await attendanceService.getAttendanceByDateRange(
                    dateRange.from.format('YYYY-MM-DD'),
                    dateRange.to.format('YYYY-MM-DD'),
                    selectedEmployee?.employee_id,
                    workerCategory,
                    filterDepartment || null
                );
                
                if (result.success) {
                    setReportData(result.data || []);
                    calculateSummary(result.data || []);
                } else {
                    setError(result.error || 'Failed to load report data');
                    setReportData([]);
                }
            } else if (selectedReport === 'monthly') {
                const result = await attendanceService.getMonthlyAttendanceSummary(
                    dateRange.from.year(),
                    dateRange.from.month() + 1,
                    selectedEmployee?.employee_id
                );

                if (result.success) {
                    setReportData(result.data || []);
                    calculateMonthlySummary(result.data || []);
                } else {
                    setError(result.error || 'Failed to load monthly summary');
                    setReportData([]);
                }
            }
        } catch (error) {
            console.error('Load report data error:', error);
            setError('Failed to load report data');
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering — zero extra API calls
    const filteredData = reportData.filter(row => {
        if (filterType && row.attendance_type && row.attendance_type !== filterType) return false;
        if (filterMinHours) {
            const hrs = row.effective_hours ?? (row.working_minutes ? row.working_minutes / 60 : null);
            if (hrs === null || hrs < parseFloat(filterMinHours)) return false;
        }
        return true;
    });

    const fmtHours = (row) => {
        const mins = row.effective_hours != null
            ? Math.round(row.effective_hours * 60)
            : row.working_minutes;
        if (!mins) return '—';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
    };

    const fmtOT = (row) => {
        if (!row.overtime_hours || row.overtime_hours <= 0) return '—';
        const mins = Math.round(row.overtime_hours * 60);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
    };

    const typeColor = (t) => {
        if (!t) return 'default';
        const map = { FULL: 'success', HALF: 'warning', ABSENT: 'error', OVERTIME: 'info', PENDING: 'warning' };
        return map[t] || 'default';
    };

    const calculateSummary = (data) => {
        const totalRecords = data.length;
        const presentCount = data.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
        const pendingCount = data.filter(r => r.status === 'PENDING').length;
        const absentCount = data.filter(r => r.status === 'ABSENT').length;
        const avgAttendance = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

        setSummary({
            totalRecords,
            presentDays: presentCount,
            pendingRecords: pendingCount,
            absentDays: absentCount
        });
    };

    const calculateMonthlySummary = (data) => {
        const totalRecords = data.length;
        let totalPresent = 0;
        let totalLate = 0;
        let totalAbsent = 0;
        let totalWorkingDays = 0;

        data.forEach(record => {
            totalPresent += record.present_days || 0;
            totalLate += record.late_days || 0;
            totalAbsent += record.absent_days || 0;
            totalWorkingDays += record.working_days || 0;
        });

        const avgAttendance = totalWorkingDays > 0 
            ? Math.round((totalPresent / totalWorkingDays) * 100) 
            : 0;

        setSummary({
            totalRecords,
            avgAttendance,
            lateInstances: totalLate,
            absentDays: totalAbsent
        });
    };

    const handleExport = (format) => {
        if (reportData.length === 0) {
            alert('No data to export');
            return;
        }

        if (format === 'excel') {
            exportToExcel();
        } else if (format === 'pdf') {
            exportToPDF();
        }
    };

    const exportToExcel = async () => {
        try {
            // For Factory reports, use grid format for both monthly and date range
            if (reportCategory === 'factory' && (selectedReport === 'monthly' || selectedReport === 'dateRange')) {
                await exportFactoryGridExcel();
                return;
            }

            // For other reports, use standard export with filtered data
            let csvContent = '';
            let filename = '';

            if (selectedReport === 'dateRange') {
                filename = `Attendance_Report_${dateRange.from.format('YYYY-MM-DD')}_to_${dateRange.to.format('YYYY-MM-DD')}.csv`;
                
                // CSV Header
                csvContent = 'Employee,Date,Status,Check-in,Check-out,Working Hours\n';
                
                // CSV Data - use filteredData instead of reportData
                filteredData.forEach(row => {
                    const workingHours = row.working_minutes 
                        ? `${Math.floor(row.working_minutes / 60)}h ${row.working_minutes % 60}m`
                        : '-';
                    
                    csvContent += `"${row.employee_name}","${row.attendance_date}","${row.status}","${row.first_check_in || '-'}","${row.last_check_out || '-'}","${workingHours}"\n`;
                });
            } else if (selectedReport === 'monthly') {
                filename = `Monthly_Summary_${dateRange.from.format('YYYY-MM')}.csv`;
                
                // CSV Header
                csvContent = 'Employee,Present,Absent,Late,WFH,Working Days,Attendance %\n';
                
                // CSV Data - use filteredData instead of reportData
                filteredData.forEach(row => {
                    const attendancePercent = row.working_days > 0
                        ? Math.round((row.present_days / row.working_days) * 100)
                        : 0;
                    
                    csvContent += `"${row.employee_name}",${row.present_days || 0},${row.absent_days || 0},${row.late_days || 0},${row.wfh_days || 0},${row.working_days || 0},${attendancePercent}%\n`;
                });
            }

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Excel export successful');
        } catch (error) {
            console.error('Excel export failed:', error);
            alert('Failed to export to Excel');
        }
    };

    const exportFactoryGridExcel = async () => {
        try {
            // Determine date range based on report type
            let startDate, endDate;
            
            if (selectedReport === 'monthly') {
                // For monthly report, use full month range
                startDate = dateRange.from.startOf('month');
                endDate = dateRange.from.endOf('month');
            } else {
                // For date range report, use selected dates
                startDate = dateRange.from;
                endDate = dateRange.to;
            }
            
            // Build query parameters with filters
            const params = new URLSearchParams({
                start_date: startDate.format('YYYY-MM-DD'),
                end_date: endDate.format('YYYY-MM-DD'),
                employee_type: 'Factory'
            });
            
            // Add optional filters
            if (selectedEmployee?.employee_id) {
                params.append('employee_id', selectedEmployee.employee_id);
            }
            if (filterDepartment) {
                params.append('department', filterDepartment);
            }
            
            const response = await import('../../services/api').then(m => m.default.get(
                `/attendance/reports/summary?${params.toString()}`
            ));

            if (!response.success || !response.data.records) {
                alert('Failed to fetch grid data');
                return;
            }

            // For monthly reports, fetch:
            // 1. Worker rates (always available once assigned)
            // 2. Payroll summary (only available after payroll is calculated)
            let payrollData = [];
            if (selectedReport === 'monthly') {
                try {
                    // Try payroll summary first (has full breakdown)
                    const payrollResponse = await import('../../services/api').then(m => m.default.get(
                        `/factory-payroll/summary-by-month?year=${startDate.year()}&month=${startDate.month() + 1}`
                    ));
                    if (payrollResponse.success && Array.isArray(payrollResponse.data) && payrollResponse.data.length > 0) {
                        payrollData = payrollResponse.data;
                    } else {
                        // Payroll not calculated yet — fall back to just worker rates
                        const ratesResponse = await import('../../services/api').then(m => m.default.get(
                            `/factory-payroll/workers-with-rates?employee_status=ALL`
                        ));
                        if (ratesResponse.success && ratesResponse.data) {
                            // Map to same shape payrollMap expects: {employee_id, daily_rate}
                            payrollData = ratesResponse.data.map(w => ({
                                employee_id: w.employee_id,
                                daily_rate: w.daily_rate,
                                // gross/net not available yet
                                gross_earnings: null,
                                net_salary: null,
                            }));
                        }
                    }
                } catch {
                    // silently ignore — columns stay blank
                }
            }

            // Use the new export function with beautiful formatting
            await exportFactoryGridToExcel(startDate, endDate, response.data.records, payrollData);
        } catch (error) {
            console.error('Factory grid export failed:', error);
            alert('Failed to export factory grid: ' + error.message);
        }
    };

    const exportToPDF = () => {
        try {
            // Create a printable HTML content
            let htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Attendance Report</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            padding: 20px;
                        }
                        h1 {
                            color: #1976d2;
                            font-size: 24px;
                            margin-bottom: 10px;
                        }
                        .subtitle {
                            color: #666;
                            font-size: 14px;
                            margin-bottom: 20px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                        }
                        th {
                            background-color: #1976d2;
                            color: white;
                            padding: 12px;
                            text-align: left;
                            font-weight: 600;
                        }
                        td {
                            padding: 10px;
                            border-bottom: 1px solid #ddd;
                        }
                        tr:hover {
                            background-color: #f5f5f5;
                        }
                        .status-chip {
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: 600;
                        }
                        .status-present { background-color: #e8f5e9; color: #2e7d32; }
                        .status-absent { background-color: #ffebee; color: #c62828; }
                        .status-late { background-color: #fff3e0; color: #ef6c00; }
                        .status-wfh { background-color: #e3f2fd; color: #1565c0; }
                        .summary {
                            margin-top: 30px;
                            display: flex;
                            gap: 20px;
                        }
                        .summary-card {
                            flex: 1;
                            padding: 15px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            text-align: center;
                        }
                        .summary-value {
                            font-size: 24px;
                            font-weight: 700;
                            margin-bottom: 5px;
                        }
                        .summary-label {
                            font-size: 12px;
                            color: #666;
                        }
                        @media print {
                            body { padding: 0; }
                        }
                    </style>
                </head>
                <body>
                    <h1>${reportTypes.find(t => t.value === selectedReport)?.label}</h1>
                    <div class="subtitle">
                        ${selectedReport === 'monthly' 
                            ? `Month: ${dateRange.from.format('MMMM YYYY')}`
                            : `Period: ${dateRange.from.format('MMM DD, YYYY')} to ${dateRange.to.format('MMM DD, YYYY')}`
                        }
                        ${selectedEmployee ? ` | Employee: ${selectedEmployee.employee_name}` : ''}
                    </div>
                    
                    <table>
            `;

            if (selectedReport === 'dateRange') {
                htmlContent += `
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Working Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                `;
                
                // Use filteredData instead of reportData
                filteredData.forEach(row => {
                    const workingHours = row.working_minutes 
                        ? `${Math.floor(row.working_minutes / 60)}h ${row.working_minutes % 60}m`
                        : '-';
                    
                    const statusClass = `status-${row.status.toLowerCase()}`;
                    
                    htmlContent += `
                        <tr>
                            <td>${row.employee_name}</td>
                            <td>${row.attendance_date}</td>
                            <td><span class="status-chip ${statusClass}">${row.status}</span></td>
                            <td>${row.first_check_in || '-'}</td>
                            <td>${row.last_check_out || '-'}</td>
                            <td>${workingHours}</td>
                        </tr>
                    `;
                });
            } else if (selectedReport === 'monthly') {
                htmlContent += `
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Late</th>
                            <th>WFH</th>
                            <th>Working Days</th>
                            <th>Attendance %</th>
                        </tr>
                    </thead>
                    <tbody>
                `;
                
                // Use filteredData instead of reportData
                filteredData.forEach(row => {
                    const attendancePercent = row.working_days > 0
                        ? Math.round((row.present_days / row.working_days) * 100)
                        : 0;
                    
                    htmlContent += `
                        <tr>
                            <td>${row.employee_name}</td>
                            <td><span class="status-chip status-present">${row.present_days || 0}</span></td>
                            <td><span class="status-chip status-absent">${row.absent_days || 0}</span></td>
                            <td><span class="status-chip status-late">${row.late_days || 0}</span></td>
                            <td><span class="status-chip status-wfh">${row.wfh_days || 0}</span></td>
                            <td>${row.working_days || 0}</td>
                            <td><strong>${attendancePercent}%</strong></td>
                        </tr>
                    `;
                });
            }

            htmlContent += `
                    </tbody>
                </table>
                
                <div class="summary">
                    <div class="summary-card">
                        <div class="summary-value" style="color: #2e7d32;">${summary.totalRecords}</div>
                        <div class="summary-label">Total Records</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value" style="color: #1976d2;">${summary.avgAttendance}%</div>
                        <div class="summary-label">Avg Attendance</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value" style="color: #ef6c00;">${summary.lateInstances}</div>
                        <div class="summary-label">Late Instances</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value" style="color: #c62828;">${summary.absentDays}</div>
                        <div class="summary-label">Absent Days</div>
                    </div>
                </div>
                
                </body>
                </html>
            `;

            // Open print dialog
            const printWindow = window.open('', '_blank');
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            
            // Wait for content to load then print
            printWindow.onload = function() {
                printWindow.focus();
                printWindow.print();
            };
            
            console.log('PDF export initiated');
        } catch (error) {
            console.error('PDF export failed:', error);
            alert('Failed to export to PDF');
        }
    };

    const renderReportContent = () => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (error) {
            return (
                <Box sx={{ p: 3 }}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            );
        }

        if (!hasLoadedOnce) {
            return (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Select filters and click "Generate Report"
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Choose report type, date range, and optionally filter by employee
                    </Typography>
                </Box>
            );
        }

        if (reportData.length === 0) {
            return (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        No data available for the selected filters
                    </Typography>
                </Box>
            );
        }

        switch (selectedReport) {
            case 'dateRange':
                return (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Employee</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Check-in</TableCell>
                                    <TableCell>Check-out</TableCell>
                                    <TableCell align="center">Hours</TableCell>
                                    <TableCell align="center">Overtime</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredData.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{row.employee_name}</TableCell>
                                        <TableCell>{row.attendance_date}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={row.status}
                                                color={
                                                    row.status === 'PRESENT' ? 'success' :
                                                    row.status === 'ABSENT' ? 'error' :
                                                    row.status === 'LATE' ? 'warning' :
                                                    row.status === 'WFH' ? 'info' : 'default'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {row.attendance_type
                                                ? <Chip label={row.attendance_type} color={typeColor(row.attendance_type)} size="small" variant="outlined" />
                                                : '—'
                                            }
                                        </TableCell>
                                        <TableCell>{row.first_check_in || '—'}</TableCell>
                                        <TableCell>{row.last_check_out || '—'}</TableCell>
                                        <TableCell align="center"><strong>{fmtHours(row)}</strong></TableCell>
                                        <TableCell align="center">{fmtOT(row)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                );

            case 'monthly':
                return (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Code</TableCell>
                                    <TableCell>Employee</TableCell>
                                    <TableCell>Department</TableCell>
                                    <TableCell align="center">Present</TableCell>
                                    <TableCell align="center">Absent</TableCell>
                                    <TableCell align="center">Late</TableCell>
                                    <TableCell align="center">Total Hours</TableCell>
                                    <TableCell align="center">Attendance %</TableCell>
                                    {reportCategory === 'factory' && <>
                                        <TableCell align="right">Daily Rate</TableCell>
                                        <TableCell align="right">Basic Pay</TableCell>
                                        <TableCell align="right">OT Pay</TableCell>
                                        <TableCell align="right">Gross</TableCell>
                                        <TableCell align="right">Net Salary</TableCell>
                                        <TableCell align="center">Payment</TableCell>
                                    </>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reportData.map((row, index) => {
                                    const totalDays = (row.present_days || 0) + (row.absent_days || 0) + (row.late_days || 0);
                                    const attendancePercent = totalDays > 0
                                        ? Math.round(((row.present_days || 0) / totalDays) * 100)
                                        : 0;
                                    const fmt = (v) => v != null ? `₹${Number(v).toFixed(2)}` : '—';
                                    const hasPayroll = row.gross_earnings != null;

                                    return (
                                        <TableRow key={index}>
                                            <TableCell>{row.employee_code || '—'}</TableCell>
                                            <TableCell>{row.employee_name}</TableCell>
                                            <TableCell>{row.master_department || row.department || '—'}</TableCell>
                                            <TableCell align="center">
                                                <Chip label={row.present_days || 0} color="success" size="small" />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={row.absent_days || 0} color="error" size="small" />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={row.late_days || 0} color="warning" size="small" />
                                            </TableCell>
                                            <TableCell align="center">
                                                {row.total_hours_worked ? Number(row.total_hours_worked).toFixed(1) + 'h' : '—'}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={600}
                                                    color={attendancePercent >= 90 ? 'success.main' : attendancePercent >= 75 ? 'warning.main' : 'error.main'}
                                                >
                                                    {attendancePercent}%
                                                </Typography>
                                            </TableCell>
                                            {reportCategory === 'factory' && <>
                                                <TableCell align="right">{fmt(row.daily_rate)}</TableCell>
                                                <TableCell align="right">{hasPayroll ? fmt(row.basic_pay) : '—'}</TableCell>
                                                <TableCell align="right">{hasPayroll ? fmt(row.overtime_pay) : '—'}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>{hasPayroll ? fmt(row.gross_earnings) : '—'}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{hasPayroll ? fmt(row.net_salary) : '—'}</TableCell>
                                                <TableCell align="center">
                                                    {hasPayroll ? (
                                                        <Chip
                                                            label={row.payment_status || 'PENDING'}
                                                            size="small"
                                                            color={row.payment_status === 'PAID' ? 'success' : 'warning'}
                                                        />
                                                    ) : <Chip label="Not Calculated" size="small" variant="outlined" />}
                                                </TableCell>
                                            </>}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                );

            default:
                return null;
        }
    };

    // If deptShiftRange is selected, render it outside the main Paper wrapper
    if (selectedReport === 'deptShiftRange') {
        return (
            <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
                <Box sx={{ mb: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>Report Type</InputLabel>
                        <Select
                            value={selectedReport}
                            label="Report Type"
                            onChange={(e) => setSelectedReport(e.target.value)}
                        >
                            {reportTypes.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {type.icon}
                                        {type.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <DeptShiftRangeReport />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {reportCategory === 'factory' ? 'Factory Worker Reports' : 'Office Employee Reports'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {reportCategory === 'factory' 
                        ? 'Generate reports for factory workers with shift-based attendance'
                        : 'Generate reports for office employees with standard attendance'}
                </Typography>
            </Box>

            {/* Reports - Works for both Factory and Office */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
                            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Report Type</InputLabel>
                                    <Select
                                        value={selectedReport}
                                        label="Report Type"
                                        onChange={(e) => setSelectedReport(e.target.value)}
                                    >
                                        {reportTypes.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {type.icon}
                                                    {type.label}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {selectedReport === 'dateRange' && (
                                <>
                                    <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                                        <DatePicker
                                            label="From Date"
                                            value={dateRange.from}
                                            onChange={(newValue) => setDateRange(prev => ({ ...prev, from: newValue }))}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    size: 'small'
                                                }
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                                        <DatePicker
                                            label="To Date"
                                            value={dateRange.to}
                                            onChange={(newValue) => setDateRange(prev => ({ ...prev, to: newValue }))}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    size: 'small'
                                                }
                                            }}
                                        />
                                    </Box>
                                </>
                            )}

                            {selectedReport === 'monthly' && (
                                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                                    <DatePicker
                                        label="Select Month"
                                        views={['year', 'month']}
                                        value={dateRange.from}
                                        onChange={(newValue) => setDateRange({ from: newValue, to: newValue })}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                size: 'small'
                                            }
                                        }}
                                    />
                                </Box>
                            )}

                            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                                <Autocomplete
                                    size="small"
                                    options={employees}
                                    getOptionLabel={(option) => `${option.employee_code} - ${option.employee_name}`}
                                    value={selectedEmployee}
                                    onChange={(event, newValue) => setSelectedEmployee(newValue)}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Employee (Optional)" />
                                    )}
                                />
                            </Box>

                            {/* Department filter */}
                            <Box sx={{ flex: '1 1 160px', minWidth: '160px' }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Department</InputLabel>
                                    <Select value={filterDepartment} label="Department"
                                        onChange={e => setFilterDepartment(e.target.value)}>
                                        <MenuItem value="">All Departments</MenuItem>
                                        {departments.map(dept => (
                                            <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Attendance Type filter */}
                            <Box sx={{ flex: '1 1 160px', minWidth: '160px' }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Attendance Type</InputLabel>
                                    <Select value={filterType} label="Attendance Type"
                                        onChange={e => setFilterType(e.target.value)}>
                                        <MenuItem value="">All Types</MenuItem>
                                        <MenuItem value="FULL">Full Day</MenuItem>
                                        <MenuItem value="HALF">Half Day</MenuItem>
                                        <MenuItem value="ABSENT">Absent</MenuItem>
                                        <MenuItem value="OVERTIME">Overtime</MenuItem>
                                        <MenuItem value="PENDING">Pending</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Min hours filter */}
                            <Box sx={{ flex: '0 1 130px', minWidth: '120px' }}>
                                <TextField
                                    label="Min Hours"
                                    type="number"
                                    size="small"
                                    value={filterMinHours}
                                    onChange={e => setFilterMinHours(e.target.value)}
                                    inputProps={{ min: 0, max: 24, step: 1 }}
                                    placeholder="e.g. 6"
                                    fullWidth
                                />
                            </Box>

                            <Box sx={{ flex: '0 0 auto' }}>
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        variant="contained"
                                        onClick={loadReportData}
                                        disabled={loading}
                                        size="small"
                                    >
                                        {loading ? 'Loading...' : 'Generate Report'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<ExcelIcon />}
                                        onClick={() => handleExport('excel')}
                                        size="small"
                                        disabled={reportData.length === 0}
                                    >
                                        Excel
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<PdfIcon />}
                                        onClick={() => handleExport('pdf')}
                                        size="small"
                                        disabled={reportData.length === 0}
                                    >
                                        PDF
                                    </Button>
                                </Stack>
                            </Box>
                        </Box>
                    </Box>
                </LocalizationProvider>
            </Paper>

            {/* Report Content */}
            <Paper sx={{ overflow: 'hidden' }}>
                <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 1, sm: 0 }
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {reportTypes.find(type => type.value === selectedReport)?.label}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {filteredData.length !== reportData.length && (
                                <Typography variant="body2" color="primary">
                                    {filteredData.length} of {reportData.length} records
                                </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                                {selectedReport === 'monthly'
                                    ? `Month: ${dateRange.from.format('MMMM YYYY')}`
                                    : `Period: ${dateRange.from.format('MMM DD, YYYY')} to ${dateRange.to.format('MMM DD, YYYY')}`
                                }
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ overflow: 'auto' }}>
                    {renderReportContent()}
                </Box>

                {/* Summary Footer */}
                <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="h6" color="text.primary">
                                    {summary.totalRecords}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Records
                                </Typography>
                            </Card>
                        </Box>
                        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="h6" color="success.main">
                                    {summary.presentDays}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Present Days
                                </Typography>
                            </Card>
                        </Box>
                        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="h6" color="warning.main">
                                    {summary.pendingRecords}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Pending Records
                                </Typography>
                            </Card>
                        </Box>
                        <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="h6" color="error.main">
                                    {summary.absentDays}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Absent Days
                                </Typography>
                            </Card>
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default AttendanceReports;