import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  InputAdornment, Alert, IconButton, Tooltip, Stack, Button, MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckInIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Download as DownloadIcon,
  FilterAltOff as ClearFilterIcon
} from '@mui/icons-material';
import ExcelJS from 'exceljs';
import attendanceService from '../../services/attendanceService';

export default function CurrentlyPresent() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Get unique departments
  const departments = ['All', ...new Set(employees.map(e => e.department).filter(Boolean))].sort();

  useEffect(() => {
    fetchCurrentlyPresent();
  }, [selectedDate]);

  useEffect(() => {
    // Filter employees based on search term and department
    let filtered = employees;

    // Apply department filter
    if (departmentFilter && departmentFilter !== 'All') {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEmployees(filtered);
  }, [searchTerm, departmentFilter, employees]);

  const fetchCurrentlyPresent = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await attendanceService.getCurrentlyPresent(selectedDate);
      
      if (response.success) {
        setEmployees(response.data || []);
        setFilteredEmployees(response.data || []);
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Failed to load currently present employees');
      }
    } catch (err) {
      setError('Failed to load currently present employees');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDepartmentFilter('All');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CHECKED_IN':
        return 'success';
      case 'PRESENT':
        return 'info';
      case 'CHECKED_OUT':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeStr;
    }
  };

  const exportToExcel = async () => {
    try {
      // Fetch all active employees
      const allEmployeesResponse = await attendanceService.getAllActiveEmployees();
      if (!allEmployeesResponse.success) {
        alert('Failed to fetch employee list');
        return;
      }
      
      let allEmployees = allEmployeesResponse.data || [];
      
      // Apply department filter to all employees if not "All"
      if (departmentFilter && departmentFilter !== 'All') {
        allEmployees = allEmployees.filter(emp => emp.department === departmentFilter);
      }
      
      const presentCount = filteredEmployees.length;
      const totalActiveEmployees = allEmployees.length;
      const notPresentCount = totalActiveEmployees - presentCount;
      
      // Filter not present employees
      const presentEmployeeIds = new Set(filteredEmployees.map(e => e.employee_id));
      const notPresentEmployees = allEmployees.filter(e => !presentEmployeeIds.has(e.employee_id));
      
      const workbook = new ExcelJS.Workbook();
      
      // ===== SHEET 1: Currently Present =====
      const worksheet = workbook.addWorksheet('Currently Present', {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }]
      });

      // Title Row
      worksheet.mergeCells('A1:H1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = departmentFilter === 'All' 
        ? 'CURRENTLY PRESENT EMPLOYEES REPORT' 
        : `CURRENTLY PRESENT EMPLOYEES REPORT - ${departmentFilter}`;
      titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' }
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).height = 30;

      // Date and Summary Row
      worksheet.mergeCells('A2:H2');
      const dateCell = worksheet.getCell('A2');
      dateCell.value = `Date: ${selectedDate} | Department: ${departmentFilter} | Generated: ${new Date().toLocaleString()}`;
      dateCell.font = { size: 11, italic: true };
      dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 20;

      // Statistics Row
      worksheet.mergeCells('A3:H3');
      const statsCell = worksheet.getCell('A3');
      statsCell.value = `Total Active Employees: ${totalActiveEmployees} | Currently Present: ${presentCount} | Not Present Yet: ${notPresentCount}`;
      statsCell.font = { bold: true, size: 12 };
      statsCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE3F2FD' }
      };
      statsCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(3).height = 25;

      // Empty row
      worksheet.addRow([]);

      // Add header row manually
      const headerRow = worksheet.addRow([
        'Emp Code',
        'Emp Name',
        'Department',
        'Category',
        'Shift',
        'Check-in Time',
        'Punches',
        'Status'
      ]);

      // Set column widths
      worksheet.columns = [
        { key: 'code', width: 12 },
        { key: 'name', width: 25 },
        { key: 'department', width: 18 },
        { key: 'category', width: 12 },
        { key: 'shift', width: 15 },
        { key: 'checkin', width: 15 },
        { key: 'punches', width: 10 },
        { key: 'status', width: 30 }
      ];

      // Style header row
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        cell.font = {
          bold: true,
          color: { argb: 'FFFFFFFF' },
          size: 11
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });

      // Add data rows
      filteredEmployees.forEach((emp, index) => {
        const row = worksheet.addRow([
          emp.employee_code,
          emp.employee_name,
          emp.department || '-',
          emp.worker_category || 'OFFICE',
          emp.shift_name || '-',
          formatTime(emp.check_in_time),
          emp.total_punches || 0,
          emp.status_description || emp.presence_status
        ]);

        row.height = 22;
        const isEvenRow = index % 2 === 0;

        row.eachCell((cell, colNumber) => {
          // Alternating background
          if (isEvenRow) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8F9FA' }
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

          // Color code status column
          if (colNumber === 8) {
            if (emp.presence_status === 'CHECKED_IN') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFC6EFCE' }
              };
              cell.font = { bold: true, color: { argb: 'FF006100' } };
            } else if (emp.presence_status === 'PRESENT') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9E1F2' }
              };
              cell.font = { bold: true, color: { argb: 'FF1F4E78' } };
            } else if (emp.presence_status === 'CHECKED_OUT') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF4CCCC' }
              };
              cell.font = { bold: true, color: { argb: 'FF660000' } };
            }
          }

          // Color code category column
          if (colNumber === 4) {
            if (emp.worker_category === 'FACTORY') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFEB9C' }
              };
              cell.font = { bold: true, color: { argb: 'FF9C5700' } };
            } else {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9E1F2' }
              };
              cell.font = { bold: true, color: { argb: 'FF1F4E78' } };
            }
          }
        });
      });

      // Add summary footer
      worksheet.addRow([]);
      const summaryRow = worksheet.addRow([
        'SUMMARY',
        `Present: ${presentCount}`,
        `Not Present: ${notPresentCount}`,
        `Checked In: ${stats.checkedIn}`,
        `On Premises: ${stats.present}`,
        '',
        '',
        `Total: ${totalActiveEmployees}`
      ]);
      
      summaryRow.height = 25;
      summaryRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2EFDA' }
        };
        cell.font = { bold: true, size: 11, color: { argb: 'FF375623' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });

      // ===== SHEET 2: Not Present Yet =====
      const notPresentSheet = workbook.addWorksheet('Not Present Yet', {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }]
      });

      // Title Row
      notPresentSheet.mergeCells('A1:E1');
      const npTitleCell = notPresentSheet.getCell('A1');
      npTitleCell.value = departmentFilter === 'All' 
        ? 'EMPLOYEES NOT PRESENT YET' 
        : `EMPLOYEES NOT PRESENT YET - ${departmentFilter}`;
      npTitleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      npTitleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD32F2F' }
      };
      npTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      notPresentSheet.getRow(1).height = 30;

      // Date Row
      notPresentSheet.mergeCells('A2:E2');
      const npDateCell = notPresentSheet.getCell('A2');
      npDateCell.value = `Date: ${selectedDate} | Department: ${departmentFilter} | Total Not Present: ${notPresentCount}`;
      npDateCell.font = { size: 11, italic: true };
      npDateCell.alignment = { vertical: 'middle', horizontal: 'center' };
      notPresentSheet.getRow(2).height = 20;

      // Empty row
      notPresentSheet.addRow([]);
      notPresentSheet.addRow([]);

      // Header row
      const npHeaderRow = notPresentSheet.addRow([
        'Emp Code',
        'Emp Name',
        'Department',
        'Category',
        'Shift'
      ]);

      // Set column widths
      notPresentSheet.columns = [
        { width: 12 },
        { width: 25 },
        { width: 18 },
        { width: 12 },
        { width: 15 }
      ];

      // Style header row
      npHeaderRow.height = 25;
      npHeaderRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE57373' }
        };
        cell.font = {
          bold: true,
          color: { argb: 'FFFFFFFF' },
          size: 11
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });

      // Note: To populate this sheet, you need to fetch all active employees
      // Add not present employees data
      notPresentEmployees.forEach((emp, index) => {
        const row = notPresentSheet.addRow([
          emp.employee_code,
          emp.employee_name,
          emp.department || '-',
          emp.worker_category || 'OFFICE',
          emp.shift_name || '-'
        ]);

        row.height = 22;
        const isEvenRow = index % 2 === 0;

        row.eachCell((cell, colNumber) => {
          // Alternating background
          if (isEvenRow) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFEF2F2' }
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

          // Color code category column
          if (colNumber === 4) {
            if (emp.worker_category === 'FACTORY') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFEB9C' }
              };
              cell.font = { bold: true, color: { argb: 'FF9C5700' } };
            } else {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9E1F2' }
              };
              cell.font = { bold: true, color: { argb: 'FF1F4E78' } };
            }
          }
        });
      });

      // Generate filename
      const deptSuffix = departmentFilter === 'All' ? '' : `_${departmentFilter.replace(/\s+/g, '_')}`;
      const filename = `Currently_Present${deptSuffix}_${selectedDate}_${new Date().getTime()}.xlsx`;

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

  const stats = {
    total: filteredEmployees.length,
    checkedIn: filteredEmployees.filter(e => e.presence_status === 'CHECKED_IN').length,
    present: filteredEmployees.filter(e => e.presence_status === 'PRESENT').length,
    checkedOut: filteredEmployees.filter(e => e.presence_status === 'CHECKED_OUT').length
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
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Currently Present
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time view of employees who have checked in today
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon color="primary" />
            <Box>
              <Typography variant="h4" fontWeight={700}>{stats.total}</Typography>
              <Typography variant="caption" color="text.secondary">Total Present</Typography>
            </Box>
          </Box>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, border: '1px solid', borderColor: 'success.main', bgcolor: 'success.lighter' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckInIcon color="success" />
            <Box>
              <Typography variant="h4" fontWeight={700} color="success.dark">{stats.checkedIn}</Typography>
              <Typography variant="caption" color="text.secondary">Checked In</Typography>
            </Box>
          </Box>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, border: '1px solid', borderColor: 'info.main', bgcolor: 'info.lighter' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimeIcon color="info" />
            <Box>
              <Typography variant="h4" fontWeight={700} color="info.dark">{stats.present}</Typography>
              <Typography variant="caption" color="text.secondary">On Premises</Typography>
            </Box>
          </Box>
        </Paper>
      </Stack>

      {/* Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          type="date"
          label="Date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ width: 200 }}
        />
        <TextField
          select
          label="Department"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          size="small"
          sx={{ width: 200 }}
        >
          {departments.map((dept) => (
            <MenuItem key={dept} value={dept}>
              {dept}
            </MenuItem>
          ))}
        </TextField>
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
        <Tooltip title="Reset Filters">
          <IconButton 
            onClick={handleResetFilters} 
            color="default"
            disabled={searchTerm === '' && departmentFilter === 'All'}
          >
            <ClearFilterIcon />
          </IconButton>
        </Tooltip>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={exportToExcel}
          disabled={filteredEmployees.length === 0}
        >
          Export to Excel
        </Button>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchCurrentlyPresent} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        {lastUpdated && (
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell>Employee Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Designation</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Shift</TableCell>
              <TableCell>Check-in Time</TableCell>
              <TableCell>Last Seen</TableCell>
              <TableCell>Punches</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    {searchTerm ? 'No employees found matching your search' : 'No employees currently present'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.employee_id} hover>
                  <TableCell>{employee.employee_code}</TableCell>
                  <TableCell>{employee.employee_name}</TableCell>
                  <TableCell>{employee.department || '-'}</TableCell>
                  <TableCell>{employee.designation || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={employee.worker_category || 'OFFICE'}
                      size="small"
                      color={employee.worker_category === 'FACTORY' ? 'warning' : 'primary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{employee.shift_name || '-'}</TableCell>
                  <TableCell>{formatTime(employee.check_in_time)}</TableCell>
                  <TableCell>{formatTime(employee.last_seen_time)}</TableCell>
                  <TableCell align="center">{employee.total_punches || 0}</TableCell>
                  <TableCell>
                    <Tooltip title={employee.status_description || ''}>
                      <Chip
                        label={employee.presence_status?.replace('_', ' ')}
                        color={getStatusColor(employee.presence_status)}
                        size="small"
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
