import { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, CircularProgress, Alert, Tooltip,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import factoryPayrollService from '../../services/factoryPayrollService';

const fmt = (v) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

// ── Payslip body ───────────────────────────────────────────────────────────
const PayslipBody = ({ data, period }) => {
  if (!data) return null;
  const companyName = import.meta.env.VITE_COMPANY_NAME || 'Company';

  const borderStyle = '1px solid #333';
  const lightBorder = '1px solid #999';

  return (
    <Box sx={{
      p: 0,
      bgcolor: 'white',
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '12px',
      color: '#000',
      width: '100%',
    }}>
      {/* ── Letterhead ── */}
      <Box sx={{
        borderBottom: '3px double #000',
        pb: 1.5,
        mb: 0,
        px: 3,
        pt: 2,
        textAlign: 'center',
        bgcolor: '#f8f8f8',
        borderTop: '3px double #000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}>
        {import.meta.env.VITE_COMPANY_LOGO && (
          <Box
            component="img"
            src={import.meta.env.VITE_COMPANY_LOGO}
            alt={companyName}
            sx={{ height: 48, width: 'auto', objectFit: 'contain' }}
          />
        )}
        <Box>
          <Typography sx={{ fontSize: '20px', fontWeight: 700, letterSpacing: 1, fontFamily: 'inherit', color: '#000' }}>
            {companyName.toUpperCase()}
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#444', fontFamily: 'inherit', mt: 0.25 }}>
            WAGE SLIP FOR THE MONTH OF {period?.period_name?.toUpperCase()}
          </Typography>
          <Typography sx={{ fontSize: '10px', color: '#666', fontFamily: 'inherit' }}>
            {period?.start_date ? new Date(period.start_date).toLocaleDateString('en-GB') : ''} to {period?.end_date ? new Date(period.end_date).toLocaleDateString('en-GB') : ''}
          </Typography>
        </Box>
      </Box>

      {/* ── Employee details table ── */}
      <Box sx={{ border: borderStyle, mx: 3, mt: 1.5 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: lightBorder }}>
          <Box sx={{ p: 0.75, px: 1.5, borderRight: lightBorder }}>
            <Typography sx={{ fontSize: '10px', color: '#555', fontFamily: 'inherit' }}>Employee Name</Typography>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, fontFamily: 'inherit' }}>{data.employee_name}</Typography>
          </Box>
          <Box sx={{ p: 0.75, px: 1.5 }}>
            <Typography sx={{ fontSize: '10px', color: '#555', fontFamily: 'inherit' }}>Employee Code</Typography>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, fontFamily: 'inherit' }}>{data.employee_code}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <Box sx={{ p: 0.75, px: 1.5, borderRight: lightBorder }}>
            <Typography sx={{ fontSize: '10px', color: '#555', fontFamily: 'inherit' }}>Department</Typography>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, fontFamily: 'inherit' }}>{data.department}</Typography>
          </Box>
          <Box sx={{ p: 0.75, px: 1.5 }}>
            <Typography sx={{ fontSize: '10px', color: '#555', fontFamily: 'inherit' }}>Designation</Typography>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, fontFamily: 'inherit' }}>{data.designation || 'Factory Worker'}</Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Attendance table ── */}
      <Box sx={{ mx: 3, mt: 1.5 }}>
        <Box sx={{
          bgcolor: '#222', color: 'white', px: 1.5, py: 0.5,
          fontSize: '11px', fontWeight: 700, fontFamily: 'inherit', letterSpacing: 0.5,
        }}>
          ATTENDANCE DETAILS
        </Box>
        <Box sx={{ border: borderStyle, borderTop: 'none' }}>
          {/* Header row */}
          <Box sx={{
            display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
            bgcolor: '#f0f0f0', borderBottom: lightBorder,
          }}>
            {['Total Days', 'Days Present', 'Half Days', 'Days Absent', 'Hours Worked', 'Daily Rate (₹)'].map(h => (
              <Box key={h} sx={{ p: 0.75, px: 1, borderRight: lightBorder, '&:last-child': { borderRight: 'none' } }}>
                <Typography sx={{ fontSize: '9px', fontWeight: 700, fontFamily: 'inherit', color: '#333', textAlign: 'center' }}>{h}</Typography>
              </Box>
            ))}
          </Box>
          {/* Data row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {[
              data.total_days_in_period,
              Number(data.days_present || 0).toFixed(1),
              Number(data.days_half || 0).toFixed(1),
              Number(data.days_absent || 0).toFixed(1),
              Number(data.total_hours_worked || 0).toFixed(2),
              fmt(data.daily_rate),
            ].map((val, i) => (
              <Box key={i} sx={{ p: 0.75, px: 1, borderRight: lightBorder, '&:last-child': { borderRight: 'none' } }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', textAlign: 'center' }}>{val}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Earnings table ── */}
      <Box sx={{ mx: 3, mt: 1.5 }}>
        <Box sx={{
          bgcolor: '#222', color: 'white', px: 1.5, py: 0.5,
          fontSize: '11px', fontWeight: 700, fontFamily: 'inherit', letterSpacing: 0.5,
        }}>
          EARNINGS
        </Box>
        <Box sx={{ border: borderStyle, borderTop: 'none' }}>
          {/* Header */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', bgcolor: '#f0f0f0', borderBottom: lightBorder }}>
            <Box sx={{ p: 0.75, px: 1.5, borderRight: lightBorder }}>
              <Typography sx={{ fontSize: '9px', fontWeight: 700, fontFamily: 'inherit', color: '#333' }}>DESCRIPTION</Typography>
            </Box>
            <Box sx={{ p: 0.75, px: 1.5, minWidth: 120, textAlign: 'right' }}>
              <Typography sx={{ fontSize: '9px', fontWeight: 700, fontFamily: 'inherit', color: '#333' }}>AMOUNT (₹)</Typography>
            </Box>
          </Box>
          {/* Rows */}
          {[
            ['Basic Pay', data.basic_pay],
            ['Overtime Pay', data.overtime_pay],
            ['Sunday Bonus', data.sunday_pay],
          ].map(([label, val], i) => (
            <Box key={label} sx={{
              display: 'grid', gridTemplateColumns: '1fr auto',
              borderBottom: i < 2 ? lightBorder : 'none',
              bgcolor: i % 2 === 0 ? 'white' : '#fafafa',
            }}>
              <Box sx={{ p: 0.75, px: 1.5, borderRight: lightBorder }}>
                <Typography sx={{ fontSize: '11px', fontFamily: 'inherit' }}>{label}</Typography>
              </Box>
              <Box sx={{ p: 0.75, px: 1.5, minWidth: 120, textAlign: 'right' }}>
                <Typography sx={{ fontSize: '11px', fontFamily: 'inherit' }}>₹ {fmt(val)}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Summary totals ── */}
      <Box sx={{ mx: 3, mt: 1.5, border: borderStyle }}>
        {[
          { label: 'GROSS EARNINGS', value: data.gross_earnings, bold: true, bg: '#f5f5f5' },
          ...(Number(data.total_deductions || 0) > 0 ? [{ label: 'TOTAL DEDUCTIONS', value: `-${fmt(data.total_deductions)}`, bold: false, bg: 'white', red: true }] : []),
          { label: 'NET SALARY PAYABLE', value: data.net_salary, bold: true, bg: '#222', white: true },
        ].map(({ label, value, bold, bg, white, red }, i, arr) => (
          <Box key={label} sx={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            px: 1.5, py: 0.75, bgcolor: bg,
            borderBottom: i < arr.length - 1 ? lightBorder : 'none',
          }}>
            <Typography sx={{
              fontSize: bold ? '12px' : '11px',
              fontWeight: bold ? 700 : 400,
              fontFamily: 'inherit',
              color: white ? 'white' : red ? '#c00' : '#000',
              letterSpacing: bold ? 0.5 : 0,
            }}>
              {label}
            </Typography>
            <Typography sx={{
              fontSize: bold ? '14px' : '12px',
              fontWeight: 700,
              fontFamily: 'inherit',
              color: white ? 'white' : red ? '#c00' : '#000',
            }}>
              ₹ {typeof value === 'string' ? value : fmt(value)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ── Payment status + footer ── */}
      <Box sx={{ mx: 3, mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: '10px', color: '#555', fontFamily: 'inherit' }}>
          Payment Status:&nbsp;
          <Box component="span" sx={{ fontWeight: 700, color: data.payment_status === 'PAID' ? '#006600' : '#cc6600' }}>
            {data.payment_status || 'PENDING'}
          </Box>
        </Typography>
        {data.payment_date && (
          <Typography sx={{ fontSize: '10px', color: '#555', fontFamily: 'inherit' }}>
            Payment Date: <Box component="span" sx={{ fontWeight: 700 }}>{new Date(data.payment_date).toLocaleDateString('en-GB')}</Box>
          </Typography>
        )}
      </Box>

      {/* ── Signature row ── */}
      <Box sx={{ mx: 3, mt: 3, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ textAlign: 'center', minWidth: 140 }}>
          <Box sx={{ borderTop: '1px solid #333', pt: 0.5 }}>
            <Typography sx={{ fontSize: '10px', fontFamily: 'inherit', color: '#333' }}>Employee Signature</Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 140 }}>
          <Box sx={{ borderTop: '1px solid #333', pt: 0.5 }}>
            <Typography sx={{ fontSize: '10px', fontFamily: 'inherit', color: '#333' }}>Authorised Signatory</Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Footer ── */}
      <Box sx={{ borderTop: '2px solid #333', mx: 3, mb: 2, pt: 0.75, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '9px', color: '#666', fontFamily: 'inherit', fontStyle: 'italic' }}>
          This is a computer-generated wage slip. No signature is required.
        </Typography>
      </Box>
    </Box>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
export default function FactoryPayslips() {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const payslipRef = useRef(null);

  useEffect(() => { loadPeriods(); }, []);

  const loadPeriods = async () => {
    try {
      setPeriodsLoading(true);
      const res = await factoryPayrollService.getPayrollPeriods();
      if (res.success && res.data) {
        const done = res.data.filter(p => ['CALCULATED', 'LOCKED'].includes(p.status));
        setPeriods(done);
        if (done.length > 0) {
          setSelectedPeriodId(done[0].period_id);
          setSelectedPeriod(done[0]);
        }
      }
    } catch { setError('Failed to load payroll periods'); }
    finally { setPeriodsLoading(false); }
  };

  useEffect(() => {
    if (!selectedPeriodId) return;
    setSelectedPeriod(periods.find(p => p.period_id === selectedPeriodId) || null);
    loadSummary(selectedPeriodId);
  }, [selectedPeriodId]);

  const loadSummary = async (periodId) => {
    setLoading(true); setError('');
    try {
      const res = await factoryPayrollService.getPayrollSummary(periodId);
      if (res.success && res.data) {
        setSummary(Array.isArray(res.data) ? res.data : []);
      } else {
        setError(res.message || 'Failed to load summary'); setSummary([]);
      }
    } catch { setError('Failed to load summary'); setSummary([]); }
    finally { setLoading(false); }
  };

  const handlePreview = (row) => { setPreviewData(row); setPreviewOpen(true); };

  const handleDownload = async (row) => {
    setPreviewData(row);
    setPreviewOpen(true);
    setTimeout(() => doDownload(row), 400);
  };

  const doDownload = async (row) => {
    if (!payslipRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(payslipRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, w, h);
      const target = row || previewData;
      pdf.save(`Payslip_${target?.employee_code}_${selectedPeriod?.period_name?.replace(/\s+/g, '_') || 'period'}.pdf`);
    } catch (e) { console.error('PDF failed:', e); }
    finally { setDownloading(false); }
  };

  if (periodsLoading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress /></Box>
  );

  if (periods.length === 0) return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <ReceiptIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" color="text.secondary">No Calculated Payroll Periods</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Go to Payroll Periods, create a period and calculate payroll first.
      </Typography>
    </Box>
  );

  const totalNet = summary.reduce((s, r) => s + Number(r.net_salary || 0), 0);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Period selector + summary */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Payroll Period</InputLabel>
          <Select value={selectedPeriodId} onChange={(e) => setSelectedPeriodId(e.target.value)} label="Payroll Period">
            {periods.map(p => (
              <MenuItem key={p.period_id} value={p.period_id}>
                {p.period_name}&nbsp;
                <Chip label={p.status} size="small" color={p.status === 'LOCKED' ? 'success' : 'warning'} sx={{ ml: 1 }} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedPeriod && (
          <>
            <Box>
              <Typography variant="caption" color="text.secondary">Period</Typography>
              <Typography variant="body2" fontWeight={600}>
                {new Date(selectedPeriod.start_date).toLocaleDateString('en-GB')} – {new Date(selectedPeriod.end_date).toLocaleDateString('en-GB')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Employees</Typography>
              <Typography variant="body2" fontWeight={600}>{summary.length}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Total Payable</Typography>
              <Typography variant="body2" fontWeight={700} color="success.main">₹{fmt(totalNet)}</Typography>
            </Box>
          </>
        )}
      </Paper>

      {/* Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Code</TableCell>
                <TableCell>Employee Name</TableCell>
                <TableCell>Department</TableCell>
                <TableCell align="center">Days Present</TableCell>
                <TableCell align="center">Hours</TableCell>
                <TableCell align="right">Daily Rate</TableCell>
                <TableCell align="right">Basic Pay</TableCell>
                <TableCell align="right">OT Pay</TableCell>
                <TableCell align="right">Gross</TableCell>
                <TableCell align="right">Net Salary</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>No payroll data for this period</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                summary.map((row) => (
                  <TableRow key={row.summary_id} hover>
                    <TableCell>{row.employee_code}</TableCell>
                    <TableCell>{row.employee_name}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell align="center">{Number(row.days_present || 0).toFixed(1)}</TableCell>
                    <TableCell align="center">{Number(row.total_hours_worked || 0).toFixed(1)}h</TableCell>
                    <TableCell align="right">₹{fmt(row.daily_rate)}</TableCell>
                    <TableCell align="right">₹{fmt(row.basic_pay)}</TableCell>
                    <TableCell align="right">₹{fmt(row.overtime_pay)}</TableCell>
                    <TableCell align="right">₹{fmt(row.gross_earnings)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>₹{fmt(row.net_salary)}</TableCell>
                    <TableCell align="center">
                      <Chip label={row.payment_status || 'PENDING'} size="small"
                        color={row.payment_status === 'PAID' ? 'success' : 'warning'} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Preview Payslip">
                        <IconButton size="small" color="info" onClick={() => handlePreview(row)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download PDF">
                        <IconButton size="small" color="primary" onClick={() => handleDownload(row)}>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Preview / Download Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Wage Slip — {previewData?.employee_name}
          <Typography variant="body2" color="text.secondary">{selectedPeriod?.period_name}</Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box ref={payslipRef}>
            <PayslipBody data={previewData} period={selectedPeriod} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={downloading ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={() => doDownload()}
            disabled={downloading}
          >
            {downloading ? 'Generating...' : 'Download PDF'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
