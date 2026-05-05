import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    CircularProgress,
    Alert,
    Stack,
    IconButton,
} from '@mui/material';
import {
    TableChart as ExcelIcon,
    DateRange as DateIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import api from '../../services/api';
import * as ExcelJS from 'exceljs';

const DepartmentShiftSummary = () => {
    const navigate = useNavigate();
    const [reportDate, setReportDate] = useState(dayjs());
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Only load data if reportDate is valid
        if (reportDate && reportDate.isValid && reportDate.isValid()) {
            loadReportData();
        }
    }, [reportDate]);

    const loadReportData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Ensure reportDate is valid before making the request
            if (!reportDate || !reportDate.isValid || !reportDate.isValid()) {
                setError('Please select a valid date');
                setLoading(false);
                return;
            }

            const formattedDate = reportDate.format('YYYY-MM-DD');

            const response = await api.get('/attendance/reports/department-shift-summary', {
                params: {
                    report_date: formattedDate
                }
            });

            if (response.success) {
                setReportData(response.data);
            } else {
                setError(response.error || 'Failed to load report data');
            }
        } catch (error) {
            setError('Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    const handleExportToExcel = async () => {
        if (!reportData || !reportData.departments) {
            alert('No data to export');
            return;
        }

        try {
            // Get all unique shifts
            const allShifts = new Set();
            Object.values(reportData.departments).forEach(dept => {
                Object.keys(dept).forEach(shift => allShifts.add(shift));
            });
            const shifts = Array.from(allShifts).sort();

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Department Shift Summary', {
                views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }]
            });

            // Title Row
            const titleColSpan = shifts.length + 2; // Department + shifts + Total
            worksheet.mergeCells(1, 1, 1, titleColSpan);
            const titleCell = worksheet.getCell(1, 1);
            titleCell.value = 'DEPARTMENT-WISE SHIFT SUMMARY REPORT';
            titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
            titleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1976D2' }
            };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(1).height = 30;

            // Date Row
            worksheet.mergeCells(2, 1, 2, titleColSpan);
            const dateCell = worksheet.getCell(2, 1);
            dateCell.value = `Report Date: ${reportDate.format('MMMM DD, YYYY')} | Generated: ${new Date().toLocaleString()}`;
            dateCell.font = { size: 11, italic: true };
            dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(2).height = 20;

            // Summary Row
            worksheet.mergeCells(3, 1, 3, titleColSpan);
            const summaryCell = worksheet.getCell(3, 1);
            summaryCell.value = `Total Present Employees: ${reportData.grand_total} | Departments: ${Object.keys(reportData.departments).length}`;
            summaryCell.font = { bold: true, size: 12 };
            summaryCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE3F2FD' }
            };
            summaryCell.alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(3).height = 25;

            // Empty row
            worksheet.addRow([]);

            // Header Row
            const headerRow = worksheet.addRow(['Department', ...shifts, 'Total']);
            headerRow.height = 25;

            // Set column widths
            worksheet.getColumn(1).width = 20; // Department column
            shifts.forEach((_, index) => {
                worksheet.getColumn(index + 2).width = 15; // Shift columns
            });
            worksheet.getColumn(shifts.length + 2).width = 12; // Total column

            // Style header row
            headerRow.eachCell((cell, colNumber) => {
                if (colNumber === shifts.length + 2) {
                    // Total column - darker blue
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF0D47A1' }
                    };
                } else {
                    // Regular header - blue
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF1976D2' }
                    };
                }
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

            // Department Data Rows
            Object.entries(reportData.departments).forEach(([dept, shiftCounts], index) => {
                const deptTotal = Object.values(shiftCounts).reduce((sum, count) => sum + count, 0);
                const rowData = [dept];
                
                shifts.forEach(shift => {
                    rowData.push(shiftCounts[shift] || 0);
                });
                
                rowData.push(deptTotal);
                
                const row = worksheet.addRow(rowData);
                row.height = 22;
                const isEvenRow = index % 2 === 0;

                row.eachCell((cell, colNumber) => {
                    // Alternating background for data rows
                    if (colNumber === 1) {
                        // Department name - left aligned, bold
                        cell.font = { bold: true };
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                    } else if (colNumber === shifts.length + 2) {
                        // Total column - light blue background
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFE3F2FD' }
                        };
                        cell.font = { bold: true };
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    } else {
                        // Shift count cells
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        cell.font = { size: 10 };
                    }

                    // Alternating row colors for readability
                    if (isEvenRow && colNumber !== shifts.length + 2) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF5F5F5' }
                        };
                    }

                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
                    };
                });
            });

            // Total Row
            const totalRowData = ['Total'];
            shifts.forEach(shift => {
                totalRowData.push(reportData.total_by_shift[shift] || 0);
            });
            totalRowData.push(reportData.grand_total);

            const totalRow = worksheet.addRow(totalRowData);
            totalRow.height = 28;

            totalRow.eachCell((cell, colNumber) => {
                if (colNumber === shifts.length + 2) {
                    // Grand total - darkest blue
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF0D47A1' }
                    };
                } else {
                    // Total row - medium blue
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF1976D2' }
                    };
                }
                cell.font = {
                    bold: true,
                    color: { argb: 'FFFFFFFF' },
                    size: 12
                };
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: 'center'
                };
                cell.border = {
                    top: { style: 'medium', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'medium', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
            });

            // Generate filename
            const filename = `Department_Shift_Summary_${reportDate.format('YYYY-MM-DD')}.xlsx`;

            // Write file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
        } catch (error) {
            alert('Failed to export to Excel');
        }
    };

    // Get all unique shifts for table headers
    const getUniqueShifts = () => {
        if (!reportData || !reportData.departments) return [];
        
        const allShifts = new Set();
        Object.values(reportData.departments).forEach(dept => {
            Object.keys(dept).forEach(shift => allShifts.add(shift));
        });
        
        return Array.from(allShifts).sort();
    };

    const shifts = getUniqueShifts();

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton 
                            onClick={() => navigate('/reports')}
                            sx={{ 
                                color: 'primary.main',
                                '&:hover': { backgroundColor: 'primary.light' }
                            }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            Department-wise Shift Summary
                        </Typography>
                    </Box>
                </Box>

                {/* Filters */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Report Date"
                            value={reportDate}
                            onChange={(newValue) => setReportDate(newValue)}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    sx: { width: 200 }
                                }
                            }}
                        />
                    </LocalizationProvider>

                    <Button
                        variant="contained"
                        startIcon={<ExcelIcon />}
                        onClick={handleExportToExcel}
                        disabled={loading || !reportData || Object.keys(reportData.departments || {}).length === 0}
                    >
                        Export to Excel
                    </Button>
                </Stack>

                {/* Loading State */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {/* Error State */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Report Table */}
                {!loading && !error && reportData && (
                    <>
                        {Object.keys(reportData.departments).length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography variant="body1" color="text.secondary">
                                    No data available for {reportDate.format('MMMM DD, YYYY')}
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600, backgroundColor: '#1976d2', color: 'white', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
                                                Department
                                            </TableCell>
                                            {shifts.map(shift => (
                                                <TableCell 
                                                    key={shift} 
                                                    align="center"
                                                    sx={{ fontWeight: 600, backgroundColor: '#1976d2', color: 'white', borderRight: '1px solid rgba(224, 224, 224, 1)' }}
                                                >
                                                    {shift}
                                                </TableCell>
                                            ))}
                                            <TableCell 
                                                align="center"
                                                sx={{ fontWeight: 600, backgroundColor: '#0d47a1', color: 'white' }}
                                            >
                                                Total
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {/* Department Rows */}
                                        {Object.entries(reportData.departments).map(([dept, shiftCounts], index) => {
                                            const deptTotal = Object.values(shiftCounts).reduce((sum, count) => sum + count, 0);
                                            const rowColor = index % 2 === 0 ? '#ffffff' : '#f5f5f5';
                                            
                                            return (
                                                <TableRow key={dept} sx={{ backgroundColor: rowColor }}>
                                                    <TableCell sx={{ fontWeight: 600, borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
                                                        {dept}
                                                    </TableCell>
                                                    {shifts.map(shift => (
                                                        <TableCell 
                                                            key={shift} 
                                                            align="center"
                                                            sx={{ 
                                                                borderRight: '1px solid rgba(224, 224, 224, 1)',
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            {shiftCounts[shift] || 0}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell 
                                                        align="center"
                                                        sx={{ fontWeight: 700, backgroundColor: '#e3f2fd' }}
                                                    >
                                                        {deptTotal}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}

                                        {/* Total Row */}
                                        <TableRow sx={{ backgroundColor: '#1976d2' }}>
                                            <TableCell sx={{ fontWeight: 700, color: 'white', borderRight: '1px solid rgba(255, 255, 255, 0.3)' }}>
                                                Total
                                            </TableCell>
                                            {shifts.map(shift => (
                                                <TableCell 
                                                    key={shift} 
                                                    align="center"
                                                    sx={{ fontWeight: 700, color: 'white', borderRight: '1px solid rgba(255, 255, 255, 0.3)' }}
                                                >
                                                    {reportData.total_by_shift[shift] || 0}
                                                </TableCell>
                                            ))}
                                            <TableCell 
                                                align="center"
                                                sx={{ fontWeight: 700, backgroundColor: '#0d47a1', color: 'white' }}
                                            >
                                                {reportData.grand_total}
                                            </TableCell>
                                        </TableRow>
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

export default DepartmentShiftSummary;
