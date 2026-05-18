import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    TextField,
    MenuItem,
    IconButton,
    Avatar,
    Card,
    CardContent,
    Tooltip,
    ToggleButton,
    ToggleButtonGroup,
    CircularProgress,
    Alert,
    Button,
} from '@mui/material';
import {
    Edit as EditIcon,
    Search as SearchIcon,
    ViewModule as ViewModuleIcon,
    ViewList as ViewListIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import attendanceService from '../../services/attendanceService';
import EditAttendanceDialog from '../../components/EditAttendanceDialog';
import { useAuth } from '../../context/AuthContext';
import { useProfileSwitching } from '../../context/ProfileSwitchingContext';

const AttendanceTable = () => {
    const { user } = useAuth();
    const { currentView, isEmployeeView, isHRView, isManagerView } = useProfileSwitching();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(6);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Present'); // Default to Present for factory attendance
    const [departmentFilter, setDepartmentFilter] = useState('All');
    const [employeeTypeFilter, setEmployeeTypeFilter] = useState('All');
    const [dateRange, setDateRange] = useState('today'); // 'today', 'week', 'month', 'custom'
    const [selectedMonth, setSelectedMonth] = useState(dayjs());
    const [customStartDate, setCustomStartDate] = useState(dayjs().subtract(7, 'day'));
    const [customEndDate, setCustomEndDate] = useState(dayjs());
    
    // Default view: table/list for desktop (md+), cards/grid for mobile
    const getDefaultViewMode = () => {
        return window.innerWidth >= 900 ? 'table' : 'cards';
    };
    const [viewMode, setViewMode] = useState(getDefaultViewMode());
    
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [departments, setDepartments] = useState([]);
    const [employeeTypes, setEmployeeTypes] = useState([]);
    
    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    // Handle window resize to update view mode responsively
    useEffect(() => {
        const handleResize = () => {
            const newDefaultView = window.innerWidth >= 900 ? 'table' : 'cards';
            setViewMode(newDefaultView);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load attendance data
    useEffect(() => {
        loadAttendanceData();
    }, [dateRange, selectedMonth, customStartDate, customEndDate, currentView]);

    const loadAttendanceData = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Calculate date range based on selection
            const today = dayjs();
            let startDate, endDate;
            
            if (dateRange === 'today') {
                startDate = today;
                endDate = today;
            } else if (dateRange === 'yesterday') {
                startDate = today.subtract(1, 'day');
                endDate = today.subtract(1, 'day');
            } else if (dateRange === 'week') {
                startDate = today.subtract(7, 'day');
                endDate = today;
            } else if (dateRange === 'month' && selectedMonth) {
                startDate = selectedMonth.startOf('month');
                endDate = selectedMonth.endOf('month');
            } else if (dateRange === 'custom' && customStartDate && customEndDate) {
                startDate = customStartDate;
                endDate = customEndDate;
            } else {
                startDate = today.subtract(7, 'day');
                endDate = today;
            }
            
            // For employees, pass their employee_id to only see their own records
            let employeeId = null;
            if (isEmployeeView()) {
                employeeId = user.employee_id;
            }
            
            const result = await attendanceService.getAttendanceByDateRange(
                startDate.format('YYYY-MM-DD'),
                endDate.format('YYYY-MM-DD'),
                employeeId
            );
            
            if (result.success && result.data) {
                // Transform backend data
                const transformedData = result.data.map((record, index) => ({
                    id: record.attendance_id || index,
                    employeeId: record.employee_code || record.employee_id,
                    employeeNumericId: record.employee_id,
                    name: record.employee_name || 'Unknown',
                    avatar: (record.employee_name || 'U').charAt(0),
                    department: record.department || 'Not Assigned',
                    workerCategory: record.worker_category || 'N/A',
                    designation: record.designation || 'N/A',
                    date: record.attendance_date,
                    checkIn: record.first_check_in || '—',
                    checkOut: record.last_check_out || '—',
                    shiftType: record.shift_type || '—',
                    status: record.status || 'Unknown',
                    attendanceType: record.attendance_type || 'N/A',
                    workingHours: record.working_minutes ? `${Math.floor(record.working_minutes / 60)}h ${record.working_minutes % 60}m` : '0h',
                    effectiveHours: record.effective_hours || 0,
                    overtimeHours: record.overtime_hours || 0,
                    notes: record.notes || ''
                }));
                
                // Extract unique departments and worker categories
                const uniqueDepts = [...new Set(transformedData.map(r => r.department).filter(d => d && d !== 'Not Assigned'))];
                const uniqueTypes = [...new Set(transformedData.map(r => r.workerCategory).filter(t => t && t !== 'N/A'))];
                
                setDepartments(uniqueDepts.sort());
                setEmployeeTypes(uniqueTypes.sort());
                setAttendanceData(transformedData);
                
                if (transformedData.length === 0) {
                    setError('No attendance records found for the selected date range.');
                }
            } else {
                setError(result.error || 'Failed to load attendance data');
            }
        } catch (err) {
            setError('Failed to connect to server');
            console.error('Load attendance error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getStatusColor = (status) => {
        const statusUpper = status?.toUpperCase();
        switch (statusUpper) {
            case 'PRESENT':
                return 'success';
            case 'LATE':
                return 'warning';
            case 'ABSENT':
                return 'error';
            case 'HALF DAY':
                return 'info';
            case 'WFH':
            case 'WORK FROM HOME':
                return 'primary';
            case 'HOLIDAY':
                return 'default';
            default:
                return 'default';
        }
    };

    const filteredData = attendanceData.filter(record => {
        const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || record.status.toUpperCase() === statusFilter.toUpperCase();
        const matchesDepartment = departmentFilter === 'All' || record.department === departmentFilter;
        const matchesEmployeeType = employeeTypeFilter === 'All' || record.workerCategory === employeeTypeFilter;
        
        return matchesSearch && matchesStatus && matchesDepartment && matchesEmployeeType;
    });

    const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Edit handlers
    const handleEditClick = (record) => {
        setSelectedRecord(record);
        setEditDialogOpen(true);
    };

    const handleEditSave = () => {
        // Reload data after successful edit
        loadAttendanceData();
    };

    const handleEditClose = () => {
        setEditDialogOpen(false);
        setSelectedRecord(null);
    };

    const exportToExcel = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Attendance Records', {
                views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }]
            });

            // Get date range for title
            let dateRangeText = '';
            if (dateRange === 'today') {
                dateRangeText = dayjs().format('DD MMM YYYY');
            } else if (dateRange === 'yesterday') {
                dateRangeText = dayjs().subtract(1, 'day').format('DD MMM YYYY');
            } else if (dateRange === 'week') {
                dateRangeText = `${dayjs().subtract(7, 'day').format('DD MMM')} - ${dayjs().format('DD MMM YYYY')}`;
            } else if (dateRange === 'month') {
                dateRangeText = selectedMonth.format('MMMM YYYY');
            } else if (dateRange === 'custom') {
                dateRangeText = `${customStartDate.format('DD MMM')} - ${customEndDate.format('DD MMM YYYY')}`;
            }

            // Title Row
            worksheet.mergeCells('A1:K1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'ATTENDANCE RECORDS REPORT';
            titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
            titleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2E7D32' }
            };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(1).height = 28;

            // Info Row
            worksheet.mergeCells('A2:K2');
            const infoCell = worksheet.getCell('A2');
            infoCell.value = `Period: ${dateRangeText} | Department: ${departmentFilter} | Status: ${statusFilter} | Worker Type: ${employeeTypeFilter}`;
            infoCell.font = { size: 9, italic: true };
            infoCell.alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(2).height = 18;

            // Stats Row
            const stats = {
                total: filteredData.length,
                present: filteredData.filter(r => r.status.toUpperCase() === 'PRESENT').length,
                absent: filteredData.filter(r => r.status.toUpperCase() === 'ABSENT').length,
                full: filteredData.filter(r => r.attendanceType === 'FULL').length,
                half: filteredData.filter(r => r.attendanceType === 'HALF').length,
                overtime: filteredData.filter(r => r.attendanceType === 'OVERTIME').length,
                pending: filteredData.filter(r => r.attendanceType === 'PENDING').length,
            };

            worksheet.mergeCells('A3:K3');
            const statsCell = worksheet.getCell('A3');
            statsCell.value = `Total: ${stats.total} | Present: ${stats.present} | Absent: ${stats.absent} | Full Day: ${stats.full} | Half Day: ${stats.half} | Overtime: ${stats.overtime} | Pending: ${stats.pending}`;
            statsCell.font = { bold: true, size: 9 };
            statsCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE8F5E9' }
            };
            statsCell.alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(3).height = 20;

            // Empty row
            worksheet.addRow([]);

            // Header row
            const headerRow = worksheet.addRow([
                'Emp Code',
                'Employee Name',
                'Department',
                'Date',
                'Check In',
                'Check Out',
                'Shift',
                'Working Hours',
                'Effective Hrs',
                'Overtime Hrs',
                'Type',
                'Status'
            ]);

            // Set column widths
            worksheet.columns = [
                { width: 10 },  // Emp Code
                { width: 22 },  // Name
                { width: 15 },  // Department
                { width: 11 },  // Date
                { width: 10 },  // Check In
                { width: 10 },  // Check Out
                { width: 12 },  // Shift
                { width: 12 },  // Working Hours
                { width: 11 },  // Effective Hrs
                { width: 11 },  // Overtime Hrs
                { width: 10 },  // Type
                { width: 10 }   // Status
            ];

            // Style header row
            headerRow.height = 22;
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1B5E20' }
                };
                cell.font = {
                    bold: true,
                    color: { argb: 'FFFFFFFF' },
                    size: 10
                };
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
            });

            // Sort data by:
            // 1. Status (Present first, then Absent)
            // 2. Department (alphabetically)
            // 3. Employee name (alphabetically)
            const sortedData = [...filteredData].sort((a, b) => {
                // First sort by status (Present = 0, Absent = 1, others = 2)
                const statusOrder = (status) => {
                    const s = status.toUpperCase();
                    if (s === 'PRESENT') return 0;
                    if (s === 'ABSENT') return 1;
                    return 2;
                };
                const statusCompare = statusOrder(a.status) - statusOrder(b.status);
                if (statusCompare !== 0) return statusCompare;
                
                // Then sort by department
                const deptCompare = (a.department || '').localeCompare(b.department || '');
                if (deptCompare !== 0) return deptCompare;
                
                // Finally sort by employee name
                return a.name.localeCompare(b.name);
            });

            // Add data rows
            sortedData.forEach((record, index) => {
                // Format check-in and check-out times safely
                const formatTime = (timeStr) => {
                    if (!timeStr || timeStr === '—') return '—';
                    try {
                        // If it's already formatted (like "8:16 AM"), return as is
                        if (typeof timeStr === 'string' && (timeStr.includes('AM') || timeStr.includes('PM'))) {
                            return timeStr;
                        }
                        // Otherwise try to parse as datetime
                        const date = dayjs(timeStr);
                        return date.isValid() ? date.format('hh:mm A') : timeStr;
                    } catch {
                        return timeStr || '—';
                    }
                };

                const row = worksheet.addRow([
                    record.employeeId,
                    record.name,
                    record.department,
                    dayjs(record.date).format('DD MMM YYYY'),
                    formatTime(record.checkIn),
                    formatTime(record.checkOut),
                    record.shiftType !== '—' ? record.shiftType : '',
                    record.workingHours,
                    Number(record.effectiveHours || 0).toFixed(2),
                    Number(record.overtimeHours || 0).toFixed(2),
                    record.attendanceType,
                    record.status
                ]);

                row.height = 20;
                const isEvenRow = index % 2 === 0;

                row.eachCell((cell, colNumber) => {
                    // Set font size for all cells
                    cell.font = { size: 9 };
                    // Alternating background
                    if (isEvenRow) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF1F8E9' }
                        };
                    }

                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: colNumber === 2 ? 'left' : 'center'
                    };
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
                    };

                    // Color code Type column
                    if (colNumber === 11) {
                        if (record.attendanceType === 'FULL') {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFD1E7DD' }
                            };
                            cell.font = { bold: true, color: { argb: 'FF0A3622' }, size: 9 };
                        } else if (record.attendanceType === 'HALF') {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFFFF3CD' }
                            };
                            cell.font = { bold: true, color: { argb: 'FF664D03' }, size: 9 };
                        } else if (record.attendanceType === 'OVERTIME') {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFCFE2FF' }
                            };
                            cell.font = { bold: true, color: { argb: 'FF052C65' }, size: 9 };
                        } else if (record.attendanceType === 'PENDING') {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFFEF3C7' }
                            };
                            cell.font = { bold: true, color: { argb: 'FF92400E' }, size: 9 };
                        }
                    }

                    // Color code Status column
                    if (colNumber === 12) {
                        if (record.status.toUpperCase() === 'PRESENT') {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFD1E7DD' }
                            };
                            cell.font = { bold: true, color: { argb: 'FF0F5132' }, size: 9 };
                        } else if (record.status.toUpperCase() === 'ABSENT') {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFF8D7DA' }
                            };
                            cell.font = { bold: true, color: { argb: 'FF842029' }, size: 9 };
                        } else if (record.status.toUpperCase() === 'LATE') {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFFFF3CD' }
                            };
                            cell.font = { bold: true, color: { argb: 'FF664D03' }, size: 9 };
                        }
                    }

                    // Highlight overtime hours if > 0
                    if (colNumber === 10 && Number(record.overtimeHours || 0) > 0) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFD0F0FD' }
                        };
                        cell.font = { bold: true, color: { argb: 'FF055160' }, size: 9 };
                    }
                });
            });

            // Add summary footer
            worksheet.addRow([]);
            const summaryRow = worksheet.addRow([
                'SUMMARY',
                `Total Records: ${stats.total}`,
                `Present: ${stats.present}`,
                `Absent: ${stats.absent}`,
                `Full Day: ${stats.full}`,
                `Half Day: ${stats.half}`,
                `Overtime: ${stats.overtime}`,
                `Pending: ${stats.pending}`,
                '',
                '',
                `Generated: ${dayjs().format('DD MMM YYYY hh:mm A')}`
            ]);

            summaryRow.height = 22;
            summaryRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE8F5E9' }
                };
                cell.font = { bold: true, size: 9, color: { argb: 'FF1B5E20' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'medium', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'medium', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
            });

            // Generate filename
            const deptSuffix = departmentFilter === 'All' ? '' : `_${departmentFilter.replace(/\s+/g, '_')}`;
            const statusSuffix = statusFilter === 'All' ? '' : `_${statusFilter.replace(/\s+/g, '_')}`;
            const filename = `Attendance_Records${deptSuffix}${statusSuffix}_${dateRangeText.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`;

            // Write file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();

        } catch (error) {
            console.error('Excel export failed:', error);
            alert('Failed to export to Excel: ' + error.message);
        }
    };

    const renderTableView = () => (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 700, md: 'auto' } }}>
                <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Check In</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Check Out</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Shift</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Hours</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        {isHRView() && <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {paginatedData.map((record) => (
                        <TableRow key={record.id} hover>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                                        {record.avatar}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {record.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {record.employeeId}
                                        </Typography>
                                    </Box>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2">{record.department}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {record.workerCategory}
                                </Typography>
                            </TableCell>
                            <TableCell>{record.date}</TableCell>
                            <TableCell>{record.checkIn}</TableCell>
                            <TableCell>{record.checkOut}</TableCell>
                            <TableCell>
                                {record.shiftType !== '—' && (
                                    <Chip
                                        label={record.shiftType}
                                        size="small"
                                        variant="outlined"
                                        color={record.shiftType === 'Day Shift' ? 'warning' : 'info'}
                                    />
                                )}
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                    {record.workingHours}
                                </Typography>
                                {record.overtimeHours > 0 && (
                                    <Typography variant="caption" color="primary.main">
                                        +{record.overtimeHours}h OT
                                    </Typography>
                                )}
                            </TableCell>
                            <TableCell>
                                {record.attendanceType !== 'N/A' && (
                                    <Chip
                                        label={record.attendanceType}
                                        size="small"
                                        variant="outlined"
                                        color={
                                            record.attendanceType === 'FULL' ? 'success' :
                                            record.attendanceType === 'HALF' ? 'warning' :
                                            record.attendanceType === 'OVERTIME' ? 'info' :
                                            record.attendanceType === 'PENDING' ? 'warning' :
                                            'default'
                                        }
                                    />
                                )}
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={record.status}
                                    color={getStatusColor(record.status)}
                                    size="small"
                                />
                            </TableCell>
                            {isHRView() && (
                                <TableCell>
                                    <Tooltip title="Edit attendance">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleEditClick(record)}
                                            color="primary"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <TablePagination
                rowsPerPageOptions={[6, 12, 24, 50]}
                component="div"
                count={filteredData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </TableContainer>
    );

    const renderCardView = () => (
        <Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {paginatedData.map((record) => (
                    <Box key={record.id} sx={{ flex: '1 1 300px', minWidth: '300px', maxWidth: '400px' }}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Avatar sx={{ width: 40, height: 40 }}>
                                        {record.avatar}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {record.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {record.employeeId} • {record.department}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={record.status}
                                        color={getStatusColor(record.status)}
                                        size="small"
                                    />
                                </Box>
                                
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Check In
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {record.checkIn}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Check Out
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {record.checkOut}
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Working Hours
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {record.workingHours}
                                        </Typography>
                                    </Box>
                                    {isHRView() && (
                                        <IconButton 
                                            size="small"
                                            onClick={() => handleEditClick(record)}
                                            color="primary"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                                
                                {record.notes && (
                                    <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Notes: {record.notes}
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                ))}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <TablePagination
                    rowsPerPageOptions={[6, 12, 24]}
                    component="div"
                    count={filteredData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Box>
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Filters and Search */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {isEmployeeView() ? 'My Attendance Records' : 
                         isManagerView() ? 'Team Attendance Records' : 
                         'Employee Attendance Records'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {isEmployeeView() ? 'View your daily attendance data' : 
                         'View and manage daily attendance data'}
                    </Typography>
                </Box>
                
                {/* Error Alert */}
                {error && (
                    <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
                
                {/* Loading State */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                )}
                
                {!loading && (
                    <>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Box sx={{ 
                                display: 'flex', 
                                gap: { xs: 1, sm: 2 }, 
                                alignItems: 'end',
                                flexDirection: { xs: 'column', sm: 'row' },
                                mb: 2
                            }}>
                                <TextField
                                    placeholder="Search by name or employee ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    sx={{ flex: 1, minWidth: { xs: '100%', sm: 250 } }}
                                    slotProps={{
                                        input: {
                                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                                        }
                                    }}
                                    size="small"
                                />
                                
                                <TextField
                                    select
                                    label="Date Range"
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    sx={{ minWidth: { xs: '100%', sm: 140 } }}
                                    size="small"
                                >
                                    <MenuItem value="today">Today</MenuItem>
                                    <MenuItem value="yesterday">Yesterday</MenuItem>
                                    <MenuItem value="week">Last 7 Days</MenuItem>
                                    <MenuItem value="month">Month</MenuItem>
                                    <MenuItem value="custom">Custom Range</MenuItem>
                                </TextField>
                                
                                {dateRange === 'month' && (
                                    <DatePicker
                                        label="Select Month"
                                        views={['year', 'month']}
                                        value={selectedMonth}
                                        onChange={(newValue) => setSelectedMonth(newValue)}
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                sx: { minWidth: { xs: '100%', sm: 180 } }
                                            }
                                        }}
                                    />
                                )}
                                
                                {dateRange === 'custom' && (
                                    <>
                                        <DatePicker
                                            label="From Date"
                                            value={customStartDate}
                                            onChange={(newValue) => setCustomStartDate(newValue)}
                                            slotProps={{
                                                textField: {
                                                    size: 'small',
                                                    sx: { minWidth: { xs: '100%', sm: 150 } }
                                                }
                                            }}
                                        />
                                        <DatePicker
                                            label="To Date"
                                            value={customEndDate}
                                            onChange={(newValue) => setCustomEndDate(newValue)}
                                            slotProps={{
                                                textField: {
                                                    size: 'small',
                                                    sx: { minWidth: { xs: '100%', sm: 150 } }
                                                }
                                            }}
                                        />
                                    </>
                                )}
                                
                                <TextField
                                    select
                                    label="Status"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    sx={{ minWidth: { xs: '100%', sm: 120 } }}
                                    size="small"
                                >
                                    <MenuItem value="All">All Status</MenuItem>
                                    <MenuItem value="Present">Present</MenuItem>
                                    <MenuItem value="Absent">Absent</MenuItem>
                                    <MenuItem value="Late">Late</MenuItem>
                                    <MenuItem value="Half Day">Half Day</MenuItem>
                                    <MenuItem value="Work From Home">Work From Home</MenuItem>
                                </TextField>
                                
                                <TextField
                                    select
                                    label="Department"
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                    sx={{ minWidth: { xs: '100%', sm: 140 } }}
                                    size="small"
                                    disabled={departments.length === 0}
                                >
                                    <MenuItem value="All">All Departments</MenuItem>
                                    {departments.length > 0 ? (
                                        departments.map((dept) => (
                                            <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled>No departments</MenuItem>
                                    )}
                                </TextField>
                                
                                <TextField
                                    select
                                    label="Worker Type"
                                    value={employeeTypeFilter}
                                    onChange={(e) => setEmployeeTypeFilter(e.target.value)}
                                    sx={{ minWidth: { xs: '100%', sm: 140 } }}
                                    size="small"
                                    disabled={employeeTypes.length === 0}
                                >
                                    <MenuItem value="All">All Types</MenuItem>
                                    {employeeTypes.length > 0 ? (
                                        employeeTypes.map((type) => (
                                            <MenuItem key={type} value={type}>{type}</MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled>No types</MenuItem>
                                    )}
                                </TextField>
                            </Box>
                        </LocalizationProvider>
                
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 }
                }}>
                    <Typography variant="body2" color="text.secondary">
                        Showing {filteredData.length} attendance records
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={exportToExcel}
                            disabled={filteredData.length === 0}
                            size="small"
                            sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
                        >
                            Export to Excel
                        </Button>
                        
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={(_, newMode) => newMode && setViewMode(newMode)}
                            size="small"
                        >
                            <ToggleButton value="table">
                                <ViewListIcon />
                            </ToggleButton>
                            <ToggleButton value="cards">
                                <ViewModuleIcon />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </Box>
                    </>
                )}
            </Paper>

            {/* Data Display */}
            {!loading && (viewMode === 'table' ? renderTableView() : renderCardView())}
            
            {/* Empty State */}
            {!loading && attendanceData.length === 0 && (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No attendance records found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Start marking attendance to see records here
                    </Typography>
                </Paper>
            )}

            {/* Edit Attendance Dialog */}
            <EditAttendanceDialog
                open={editDialogOpen}
                onClose={handleEditClose}
                attendanceRecord={selectedRecord}
                onSave={handleEditSave}
            />
        </Box>
    );
};

export default AttendanceTable;