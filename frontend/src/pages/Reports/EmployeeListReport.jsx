import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress, Alert,
    Stack, IconButton, FormControl, InputLabel, Select, MenuItem, Chip,
} from '@mui/material';
import { TableChart as ExcelIcon, ArrowBack as ArrowBackIcon, People as PeopleIcon } from '@mui/icons-material';
import api from '../../services/api';
import * as ExcelJS from 'exceljs';
import dayjs from 'dayjs';

const EmployeeListReport = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [departments, setDepartments] = useState([]);

    const [statusFilter, setStatusFilter] = useState('ACTIVE');
    const [departmentFilter, setDepartmentFilter] = useState('ALL');
    const [workerCategoryFilter, setWorkerCategoryFilter] = useState('ALL');

    useEffect(() => {
        loadFilterOptions();
    }, []);

    useEffect(() => {
        loadEmployees();
    }, [statusFilter, departmentFilter, workerCategoryFilter]);

    const loadFilterOptions = async () => {
        try {
            const response = await api.get('/attendance/reports/employee-list', { params: { status: 'ALL' } });
            if (response.success && Array.isArray(response.data?.employees)) {
                const uniqueDepts = [...new Set(
                    response.data.employees.map(e => e.department).filter(Boolean)
                )].sort();
                setDepartments(uniqueDepts);
            }
        } catch (_) {
            setDepartments([]);
        }
    };

    const loadEmployees = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = { status: statusFilter };
            if (departmentFilter !== 'ALL') params.department = departmentFilter;
            if (workerCategoryFilter !== 'ALL') params.worker_category = workerCategoryFilter;

            const response = await api.get('/attendance/reports/employee-list', { params });
            if (response.success) {
                setEmployees(response.data.employees || []);
            } else {
                setError('Failed to load employees');
            }
        } catch (_) {
            setError('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const fmt = (val) => val || '';
    const fmtDate = (val) => val ? dayjs(val).format('YYYY-MM-DD') : '';

    const handleExportToExcel = async () => {
        if (employees.length === 0) { alert('No data to export'); return; }
        try {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Employee List', {
                views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }]
            });

            const COLS = 16;
            const lastCol = String.fromCharCode(64 + COLS); // 'P'

            // Title
            ws.mergeCells(`A1:${lastCol}1`);
            Object.assign(ws.getCell('A1'), {
                value: 'EMPLOYEE MASTER LIST',
                font: { bold: true, size: 16, color: { argb: 'FFFFFFFF' } },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
                alignment: { vertical: 'middle', horizontal: 'center' },
            });
            ws.getRow(1).height = 30;

            // Filter info
            ws.mergeCells(`A2:${lastCol}2`);
            const filterParts = [];
            if (departmentFilter !== 'ALL') filterParts.push(`Dept: ${departmentFilter}`);
            if (workerCategoryFilter !== 'ALL') filterParts.push(`Category: ${workerCategoryFilter}`);
            if (statusFilter !== 'ALL') filterParts.push(`Status: ${statusFilter}`);
            Object.assign(ws.getCell('A2'), {
                value: `Filters: ${filterParts.length ? filterParts.join(' | ') : 'None'} | Generated: ${new Date().toLocaleString()}`,
                font: { size: 11, italic: true },
                alignment: { vertical: 'middle', horizontal: 'center' },
            });
            ws.getRow(2).height = 20;

            // Summary
            ws.mergeCells(`A3:${lastCol}3`);
            Object.assign(ws.getCell('A3'), {
                value: `Total Employees: ${employees.length}`,
                font: { bold: true, size: 12 },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } },
                alignment: { vertical: 'middle', horizontal: 'center' },
            });
            ws.getRow(3).height = 25;

            ws.addRow([]); // empty row

            // Headers - same order as bulk upload template
            const headers = [
                'Employee Code', 'First Name', 'Last Name',
                'Department', 'Designation', 'Date of Joining (YYYY-MM-DD)',
                'Email (optional)', 'Phone', 'DOB (YYYY-MM-DD)', 'Gender', 'Address',
                'Emergency Contact Phone', 'Work Location', 'Employment Type',
                'Worker Category', 'Shift (optional)'
            ];

            ws.columns = [
                { width: 15 }, { width: 20 }, { width: 20 },
                { width: 20 }, { width: 25 }, { width: 20 },
                { width: 30 }, { width: 15 }, { width: 15 },
                { width: 12 }, { width: 40 }, { width: 20 },
                { width: 20 }, { width: 15 }, { width: 15 }, { width: 15 },
            ];

            const headerRow = ws.addRow(headers);
            headerRow.height = 25;
            headerRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = {
                    top: { style: 'thin' }, left: { style: 'thin' },
                    bottom: { style: 'thin' }, right: { style: 'thin' }
                };
            });

            // Data rows
            employees.forEach((emp, index) => {
                const row = ws.addRow([
                    fmt(emp.employee_code),
                    fmt(emp.first_name),
                    fmt(emp.last_name),
                    fmt(emp.department),
                    fmt(emp.designation),
                    fmtDate(emp.date_of_joining),
                    fmt(emp.email),
                    fmt(emp.phone),
                    fmtDate(emp.dob),
                    fmt(emp.gender),
                    fmt(emp.address),
                    fmt(emp.emergency_contact),
                    fmt(emp.work_location),
                    fmt(emp.employment_type),
                    fmt(emp.worker_category) || 'OFFICE',
                    fmt(emp.shift_name),
                ]);
                row.height = 22;
                const even = index % 2 === 0;

                row.eachCell((cell, col) => {
                    if (even) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
                    cell.alignment = { vertical: 'middle', horizontal: col <= 3 || col === 11 ? 'left' : 'center' };
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                        right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                    };
                    // Color-code worker category column (15)
                    if (col === 15) {
                        const isFactory = (emp.worker_category || '').toUpperCase() === 'FACTORY';
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isFactory ? 'FFFFEB9C' : 'FFD9E1F2' } };
                        cell.font = { bold: true, color: { argb: isFactory ? 'FF9C5700' : 'FF1F4E78' } };
                    }
                });
            });

            const suffix = departmentFilter !== 'ALL' ? `_${departmentFilter.replace(/\s+/g, '_')}` : '';
            const filename = `Employee_List${suffix}_${dayjs().format('YYYY-MM-DD')}.xlsx`;
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
        } catch (_) {
            alert('Failed to export to Excel');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/reports')} sx={{ color: 'primary.main' }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <PeopleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>Employee List Report</Typography>
                </Box>

                {/* Filters */}
                <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Status</InputLabel>
                        <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                            <MenuItem value="ALL">All Status</MenuItem>
                            <MenuItem value="ACTIVE">Active</MenuItem>
                            <MenuItem value="INACTIVE">Inactive</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Department</InputLabel>
                        <Select value={departmentFilter} label="Department" onChange={(e) => setDepartmentFilter(e.target.value)}>
                            <MenuItem value="ALL">All Departments</MenuItem>
                            {departments.map((dept) => (
                                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Worker Category</InputLabel>
                        <Select value={workerCategoryFilter} label="Worker Category" onChange={(e) => setWorkerCategoryFilter(e.target.value)}>
                            <MenuItem value="ALL">All Categories</MenuItem>
                            <MenuItem value="OFFICE">Office</MenuItem>
                            <MenuItem value="FACTORY">Factory</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        startIcon={<ExcelIcon />}
                        onClick={handleExportToExcel}
                        disabled={loading || employees.length === 0}
                    >
                        Export to Excel
                    </Button>
                </Stack>

                {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {!loading && !error && (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Showing {employees.length} employee{employees.length !== 1 ? 's' : ''}
                        </Typography>

                        {employees.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography variant="body1" color="text.secondary">
                                    No employees found with the selected filters
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer sx={{ maxHeight: 600 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            {['Code', 'First Name', 'Last Name', 'Department', 'Designation', 'Category', 'Email', 'Phone', 'DOJ', 'Status'].map(h => (
                                                <TableCell key={h} sx={{ fontWeight: 600, backgroundColor: '#1976d2', color: 'white', whiteSpace: 'nowrap' }}>
                                                    {h}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {employees.map((emp, index) => (
                                            <TableRow key={emp.employee_id} sx={{
                                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
                                                '&:hover': { backgroundColor: '#e3f2fd' }
                                            }}>
                                                <TableCell>{emp.employee_code}</TableCell>
                                                <TableCell>{emp.first_name || '-'}</TableCell>
                                                <TableCell>{emp.last_name || '-'}</TableCell>
                                                <TableCell>{emp.department || '-'}</TableCell>
                                                <TableCell>{emp.designation || '-'}</TableCell>
                                                <TableCell>
                                                    <Chip label={emp.worker_category || 'OFFICE'} size="small"
                                                        color={emp.worker_category === 'FACTORY' ? 'warning' : 'info'} />
                                                </TableCell>
                                                <TableCell>{emp.email || '-'}</TableCell>
                                                <TableCell>{emp.phone || '-'}</TableCell>
                                                <TableCell>{fmtDate(emp.date_of_joining) || '-'}</TableCell>
                                                <TableCell>
                                                    <Chip label={emp.status} size="small"
                                                        color={emp.status === 'ACTIVE' ? 'success' : 'default'} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default EmployeeListReport;
