import { useState } from 'react';
import {
    Box, Typography, Paper, Button, Grid, FormControl,
    InputLabel, Select, MenuItem, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Stack, Divider,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Assessment as ReportIcon,
    WbSunny as DayIcon,
    NightlightRound as NightIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import apiService from '../../services/api';

export default function DeptShiftRangeReport() {
    const [startDate, setStartDate] = useState(dayjs().startOf('month'));
    const [endDate, setEndDate]     = useState(dayjs());
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState('');
    const [data, setData]           = useState(null);

    // ── Fetch ──────────────────────────────────────────────────────────────
    const fetchReport = async () => {
        if (!startDate || !endDate) { setError('Please select both dates'); return; }
        if (endDate.isBefore(startDate)) { setError('End date must be after start date'); return; }
        setLoading(true); setError(''); setData(null);
        try {
            const res = await apiService.get('/attendance/reports/department-shift-range', {
                params: {
                    start_date:    startDate.format('YYYY-MM-DD'),
                    end_date:      endDate.format('YYYY-MM-DD'),
                    status_filter: statusFilter,
                },
            });
            if (res.success) setData(res.data);
            else setError(res.message || 'Failed to load report');
        } catch { setError('Failed to connect to server'); }
        finally { setLoading(false); }
    };

    // ── Build pivot: dept → { 'Day Shift': row, 'Night Shift': row } ──────
    const departments = data ? [...new Set(data.aggregated.map(r => r.department))].sort() : [];
    const pivot = {};
    (data?.aggregated || []).forEach(r => {
        if (!pivot[r.department]) pivot[r.department] = {};
        pivot[r.department][r.shift_type] = r;
    });

    // ── Daily pivot: date → dept → { Day/Night: row } ─────────────────────
    const dates = data ? [...new Set(data.daily.map(r => r.attendance_date))].sort() : [];
    const dailyPivot = {};
    (data?.daily || []).forEach(r => {
        if (!dailyPivot[r.attendance_date]) dailyPivot[r.attendance_date] = {};
        if (!dailyPivot[r.attendance_date][r.department]) dailyPivot[r.attendance_date][r.department] = {};
        dailyPivot[r.attendance_date][r.department][r.shift_type] = r;
    });

    // ── Totals row ─────────────────────────────────────────────────────────
    const totals = { day: {}, night: {} };
    if (data) {
        ['total_present_days','unique_employees','full_day_count','half_day_count','overtime_count','total_overtime_hours'].forEach(k => {
            totals.day[k]   = data.aggregated.filter(r => r.shift_type === 'Day Shift').reduce((s, r) => s + (r[k] || 0), 0);
            totals.night[k] = data.aggregated.filter(r => r.shift_type === 'Night Shift').reduce((s, r) => s + (r[k] || 0), 0);
        });
    }

    // ── Excel Export ───────────────────────────────────────────────────────
    const exportExcel = async () => {
        if (!data) return;
        const wb = new ExcelJS.Workbook();

        // ── SHEET 1: Summary (one row per dept, Day/Night as grouped columns) ──
        const ws = wb.addWorksheet('Summary');

        // Title
        const totalCols = 1 + departments.length * 0 + 11; // dept + 5 day + 5 night + totals
        ws.mergeCells(`A1:K1`);
        const t = ws.getCell('A1');
        t.value = `Department Shift Report  |  ${startDate.format('DD MMM YYYY')} – ${endDate.format('DD MMM YYYY')}`;
        t.font  = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
        t.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E20' } };
        t.alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getRow(1).height = 28;

        // Group header row (Day Shift / Night Shift spans)
        const grpRow = ws.addRow(['', '☀ DAY SHIFT', '', '', '', '', '🌙 NIGHT SHIFT', '', '', '', '']);
        ws.mergeCells(`B2:F2`);
        ws.mergeCells(`G2:K2`);
        const dayCell   = ws.getCell('B2');
        const nightCell = ws.getCell('G2');
        [dayCell, nightCell].forEach((cell, idx) => {
            cell.font      = { bold: true, size: 11, color: { argb: idx === 0 ? 'FF5D4037' : 'FF0D47A1' } };
            cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx === 0 ? 'FFFFF9C4' : 'FFE3F2FD' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        grpRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        grpRow.height = 22;

        // Column header row
        const colLabels = ['Department',
            'Workers', 'Days Present', 'Full Day', 'Half Day', 'Overtime',
            'Workers', 'Days Present', 'Full Day', 'Half Day', 'Overtime',
        ];
        const hRow = ws.addRow(colLabels);
        hRow.eachCell((cell, col) => {
            const isDay   = col >= 2 && col <= 6;
            const isNight = col >= 7 && col <= 11;
            cell.fill = { type: 'pattern', pattern: 'solid',
                fgColor: { argb: col === 1 ? 'FFE0E0E0' : isDay ? 'FFFFF9C4' : 'FFE3F2FD' } };
            cell.font = { bold: true, size: 9,
                color: { argb: isDay ? 'FF5D4037' : isNight ? 'FF0D47A1' : 'FF000000' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = { bottom: { style: 'medium' } };
        });
        hRow.height = 24;

        ws.columns = [
            { width: 22 },
            { width: 10 }, { width: 14 }, { width: 10 }, { width: 10 }, { width: 10 },
            { width: 10 }, { width: 14 }, { width: 10 }, { width: 10 }, { width: 10 },
        ];

        // Data rows
        departments.forEach((dept, i) => {
            const d  = pivot[dept]?.['Day Shift'];
            const n  = pivot[dept]?.['Night Shift'];
            const bg = i % 2 === 0 ? 'FFF9FBE7' : 'FFFFFFFF';
            const row = ws.addRow([
                dept,
                d?.unique_employees   || 0, d?.total_present_days || 0,
                d?.full_day_count     || 0, d?.half_day_count     || 0, d?.overtime_count || 0,
                n?.unique_employees   || 0, n?.total_present_days || 0,
                n?.full_day_count     || 0, n?.half_day_count     || 0, n?.overtime_count || 0,
            ]);
            row.eachCell((cell, col) => {
                cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                cell.alignment = { horizontal: col === 1 ? 'left' : 'center', vertical: 'middle' };
                cell.font      = { size: 9, bold: col === 1 };
            });
            // Colour full/half/OT numbers
            row.getCell(4).font  = { size: 9, color: { argb: 'FF2E7D32' }, bold: true };
            row.getCell(5).font  = { size: 9, color: { argb: 'FFE65100' } };
            row.getCell(6).font  = { size: 9, color: { argb: 'FF0277BD' } };
            row.getCell(9).font  = { size: 9, color: { argb: 'FF2E7D32' }, bold: true };
            row.getCell(10).font = { size: 9, color: { argb: 'FFE65100' } };
            row.getCell(11).font = { size: 9, color: { argb: 'FF0277BD' } };
        });

        // Totals row
        const tRow = ws.addRow([
            'TOTAL',
            totals.day.unique_employees,   totals.day.total_present_days,
            totals.day.full_day_count,     totals.day.half_day_count,     totals.day.overtime_count,
            totals.night.unique_employees, totals.night.total_present_days,
            totals.night.full_day_count,   totals.night.half_day_count,   totals.night.overtime_count,
        ]);
        tRow.eachCell((cell, col) => {
            cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD7CCC8' } };
            cell.font      = { bold: true, size: 9 };
            cell.alignment = { horizontal: col === 1 ? 'left' : 'center', vertical: 'middle' };
            cell.border    = { top: { style: 'medium' } };
        });
        tRow.height = 20;

        // ── SHEET 2: Daily (date rows × dept columns, Day/Night sub-columns) ──
        const ws2 = wb.addWorksheet('Daily Breakdown');

        // Title
        const dailyCols = 1 + departments.length * 2;
        ws2.mergeCells(`A1:${String.fromCharCode(64 + dailyCols)}1`);
        const t2 = ws2.getCell('A1');
        t2.value = `Day-by-Day Breakdown  |  ${startDate.format('DD MMM YYYY')} – ${endDate.format('DD MMM YYYY')}`;
        t2.font  = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
        t2.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D47A1' } };
        t2.alignment = { horizontal: 'center', vertical: 'middle' };
        ws2.getRow(1).height = 28;

        // Department group header
        const deptGrpRow = ws2.addRow(['']);
        deptGrpRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF37474F' } };
        departments.forEach((dept, i) => {
            const col = 2 + i * 2;
            const colLetter = String.fromCharCode(64 + col);
            const colLetter2 = String.fromCharCode(64 + col + 1);
            ws2.mergeCells(`${colLetter}2:${colLetter2}2`);
            const cell = ws2.getCell(`${colLetter}2`);
            cell.value     = dept;
            cell.font      = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
            cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF37474F' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        deptGrpRow.height = 20;

        // Day/Night sub-header
        const subRow = ws2.addRow(['Date']);
        subRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF546E7A' } };
        subRow.getCell(1).font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
        subRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        departments.forEach((_, i) => {
            const col = 2 + i * 2;
            const dayCell2   = subRow.getCell(col);
            const nightCell2 = subRow.getCell(col + 1);
            dayCell2.value   = '☀ Day';
            nightCell2.value = '🌙 Night';
            dayCell2.fill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
            nightCell2.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
            dayCell2.font    = { bold: true, size: 8, color: { argb: 'FF5D4037' } };
            nightCell2.font  = { bold: true, size: 8, color: { argb: 'FF0D47A1' } };
            dayCell2.alignment   = { horizontal: 'center', vertical: 'middle' };
            nightCell2.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        subRow.height = 18;

        // Set column widths
        ws2.getColumn(1).width = 12;
        departments.forEach((_, i) => {
            ws2.getColumn(2 + i * 2).width     = 8;
            ws2.getColumn(2 + i * 2 + 1).width = 8;
        });

        // Data rows
        dates.forEach((date, i) => {
            const rowData = [dayjs(date).format('DD MMM')];
            departments.forEach(dept => {
                const d = dailyPivot[date]?.[dept]?.['Day Shift'];
                const n = dailyPivot[date]?.[dept]?.['Night Shift'];
                rowData.push(d?.employee_count || '');
                rowData.push(n?.employee_count || '');
            });
            const row = ws2.addRow(rowData);
            const bg  = i % 2 === 0 ? 'FFF5F5F5' : 'FFFFFFFF';
            row.eachCell((cell, col) => {
                cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.font      = { size: 9, bold: col === 1, color: { argb: cell.value ? 'FF000000' : 'FFBDBDBD' } };
            });
            row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        });

        // Download
        const buf  = await wb.xlsx.writeBuffer();
        const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href  = URL.createObjectURL(blob);
        link.download = `Dept_Shift_${startDate.format('YYYYMMDD')}_${endDate.format('YYYYMMDD')}.xlsx`;
        link.click();
    };

    // ── Cell helper ────────────────────────────────────────────────────────
    const Num = ({ val, color }) => (
        <Typography variant="body2" fontWeight={600} color={color || 'text.primary'} sx={{ fontSize: '0.85rem' }}>
            {val ?? 0}
        </Typography>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    Department Shift Report
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    How many workers were present per department, per shift — for any date range
                </Typography>

                {/* Filters */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                            <DatePicker label="From" value={startDate} onChange={setStartDate}
                                maxDate={dayjs()} format="DD/MM/YYYY"
                                slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <DatePicker label="To" value={endDate} onChange={setEndDate}
                                maxDate={dayjs()} minDate={startDate} format="DD/MM/YYYY"
                                slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} label="Status">
                                    <MenuItem value="ALL">All</MenuItem>
                                    <MenuItem value="PRESENT">Present only</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Stack direction="row" spacing={1}>
                                <Button variant="contained"
                                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ReportIcon />}
                                    onClick={fetchReport} disabled={loading}>
                                    Generate
                                </Button>
                                {data && (
                                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportExcel}>
                                        Download Excel
                                    </Button>
                                )}
                            </Stack>
                        </Grid>
                    </Grid>
                </Paper>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {!data && !loading && (
                    <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                        <ReportIcon sx={{ fontSize: 56, mb: 1, opacity: 0.25 }} />
                        <Typography variant="h6" color="text.secondary">Select dates and click Generate</Typography>
                    </Box>
                )}

                {data && (
                    <>
                        {/* ── SUMMARY TABLE ── */}
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                            Summary — {startDate.format('DD MMM')} to {endDate.format('DD MMM YYYY')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Total attendance days recorded per department across the selected period
                        </Typography>

                        <TableContainer component={Paper} sx={{ mb: 4 }}>
                            <Table size="small">
                                <TableHead>
                                    {/* Shift group header */}
                                    <TableRow>
                                        <TableCell rowSpan={2} sx={{ fontWeight: 700, bgcolor: 'grey.100', minWidth: 140 }}>
                                            Department
                                        </TableCell>
                                        <TableCell colSpan={5} align="center"
                                            sx={{ bgcolor: '#FFF9C4', fontWeight: 700, color: '#5D4037', borderLeft: '2px solid #F9A825' }}>
                                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                                                <DayIcon sx={{ fontSize: 16 }} /> <span>Day Shift</span>
                                            </Stack>
                                        </TableCell>
                                        <TableCell colSpan={5} align="center"
                                            sx={{ bgcolor: '#E3F2FD', fontWeight: 700, color: '#0D47A1', borderLeft: '2px solid #1565C0' }}>
                                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                                                <NightIcon sx={{ fontSize: 16 }} /> <span>Night Shift</span>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        {/* Day shift columns */}
                                        {['Workers', 'Days Present', 'Full Day', 'Half Day', 'Overtime'].map(h => (
                                            <TableCell key={`d-${h}`} align="center"
                                                sx={{ bgcolor: '#FFFDE7', fontSize: '0.75rem', fontWeight: 600,
                                                      borderLeft: h === 'Workers' ? '2px solid #F9A825' : undefined }}>
                                                {h}
                                            </TableCell>
                                        ))}
                                        {/* Night shift columns */}
                                        {['Workers', 'Days Present', 'Full Day', 'Half Day', 'Overtime'].map(h => (
                                            <TableCell key={`n-${h}`} align="center"
                                                sx={{ bgcolor: '#E8F5E9', fontSize: '0.75rem', fontWeight: 600,
                                                      borderLeft: h === 'Workers' ? '2px solid #1565C0' : undefined }}>
                                                {h}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {departments.map((dept, i) => {
                                        const d = pivot[dept]?.['Day Shift'];
                                        const n = pivot[dept]?.['Night Shift'];
                                        const bg = i % 2 === 0 ? 'grey.50' : 'white';
                                        return (
                                            <TableRow key={dept} sx={{ bgcolor: bg, '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell sx={{ fontWeight: 600 }}>{dept}</TableCell>
                                                {/* Day */}
                                                <TableCell align="center" sx={{ borderLeft: '2px solid #F9A825' }}>
                                                    <Num val={d?.unique_employees} />
                                                </TableCell>
                                                <TableCell align="center"><Num val={d?.total_present_days} /></TableCell>
                                                <TableCell align="center"><Num val={d?.full_day_count} color="success.main" /></TableCell>
                                                <TableCell align="center"><Num val={d?.half_day_count} color="warning.main" /></TableCell>
                                                <TableCell align="center"><Num val={d?.overtime_count} color="info.main" /></TableCell>
                                                {/* Night */}
                                                <TableCell align="center" sx={{ borderLeft: '2px solid #1565C0' }}>
                                                    <Num val={n?.unique_employees} />
                                                </TableCell>
                                                <TableCell align="center"><Num val={n?.total_present_days} /></TableCell>
                                                <TableCell align="center"><Num val={n?.full_day_count} color="success.main" /></TableCell>
                                                <TableCell align="center"><Num val={n?.half_day_count} color="warning.main" /></TableCell>
                                                <TableCell align="center"><Num val={n?.overtime_count} color="info.main" /></TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {/* Totals row */}
                                    <TableRow sx={{ bgcolor: 'grey.200' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>TOTAL</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, borderLeft: '2px solid #F9A825' }}>{totals.day.unique_employees}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>{totals.day.total_present_days}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: 'success.main' }}>{totals.day.full_day_count}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: 'warning.main' }}>{totals.day.half_day_count}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: 'info.main' }}>{totals.day.overtime_count}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, borderLeft: '2px solid #1565C0' }}>{totals.night.unique_employees}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>{totals.night.total_present_days}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: 'success.main' }}>{totals.night.full_day_count}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: 'warning.main' }}>{totals.night.half_day_count}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: 'info.main' }}>{totals.night.overtime_count}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Divider sx={{ mb: 3 }} />

                        {/* ── DAILY BREAKDOWN ── */}
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                            Day-by-Day Breakdown
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            How many workers showed up each day in each department
                        </Typography>

                        <TableContainer component={Paper}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.800', color: '#fff', minWidth: 100 }}>Date</TableCell>
                                        {departments.map(dept => (
                                            <TableCell key={dept} colSpan={2} align="center"
                                                sx={{ fontWeight: 700, bgcolor: 'grey.800', color: '#fff',
                                                      borderLeft: '1px solid rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
                                                {dept}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: 'grey.700', color: '#fff', fontSize: '0.7rem' }}>—</TableCell>
                                        {departments.map(dept => (
                                            <>
                                                <TableCell key={`${dept}-d`} align="center"
                                                    sx={{ bgcolor: '#FFF9C4', fontSize: '0.7rem', fontWeight: 600,
                                                          color: '#5D4037', borderLeft: '1px solid #F9A825' }}>
                                                    ☀ Day
                                                </TableCell>
                                                <TableCell key={`${dept}-n`} align="center"
                                                    sx={{ bgcolor: '#E3F2FD', fontSize: '0.7rem', fontWeight: 600, color: '#0D47A1' }}>
                                                    🌙 Night
                                                </TableCell>
                                            </>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {dates.map((date, i) => (
                                        <TableRow key={date} sx={{ bgcolor: i % 2 === 0 ? 'grey.50' : 'white', '&:hover': { bgcolor: 'action.hover' } }}>
                                            <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                {dayjs(date).format('DD MMM')}
                                            </TableCell>
                                            {departments.map(dept => {
                                                const d = dailyPivot[date]?.[dept]?.['Day Shift'];
                                                const n = dailyPivot[date]?.[dept]?.['Night Shift'];
                                                return (
                                                    <>
                                                        <TableCell key={`${date}-${dept}-d`} align="center"
                                                            sx={{ borderLeft: '1px solid #F9A825', fontSize: '0.82rem', fontWeight: d?.employee_count ? 600 : 400,
                                                                  color: d?.employee_count ? 'text.primary' : 'text.disabled' }}>
                                                            {d?.employee_count || '—'}
                                                        </TableCell>
                                                        <TableCell key={`${date}-${dept}-n`} align="center"
                                                            sx={{ fontSize: '0.82rem', fontWeight: n?.employee_count ? 600 : 400,
                                                                  color: n?.employee_count ? 'text.primary' : 'text.disabled' }}>
                                                            {n?.employee_count || '—'}
                                                        </TableCell>
                                                    </>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </Box>
        </LocalizationProvider>
    );
}
