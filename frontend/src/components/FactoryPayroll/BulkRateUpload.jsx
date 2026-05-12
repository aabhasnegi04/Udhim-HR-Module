import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Alert, Chip, CircularProgress,
  Stepper, Step, StepLabel,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import factoryPayrollService from '../../services/factoryPayrollService';

const TODAY = new Date().toISOString().split('T')[0];

// Validate YYYY-MM-DD format
const isValidDate = (str) => {
  if (!str) return false;
  const d = new Date(str);
  return !isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(String(str).trim());
};

export default function BulkRateUpload({ open, onClose, workers = [], onSuccess }) {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(0);
  const [parsedRows, setParsedRows] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [fileError, setFileError] = useState('');

  const codeMap = Object.fromEntries(
    workers.map(w => [String(w.employee_code).trim().toLowerCase(), w])
  );

  const reset = () => {
    setStep(0);
    setParsedRows([]);
    setUploadResult(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => { reset(); onClose(); };

  // ── Download template (backend generates it) ───────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      await factoryPayrollService.downloadRateTemplate();
    } catch {
      setFileError('Failed to download template. Please try again.');
    }
  };

  // ── Parse uploaded Excel ───────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Find header row
        let headerIdx = -1;
        for (let i = 0; i < Math.min(raw.length, 10); i++) {
          if (raw[i].some(cell => String(cell).toLowerCase().includes('employee code'))) {
            headerIdx = i;
            break;
          }
        }
        if (headerIdx === -1) {
          setFileError('Could not find header row. Make sure the file has an "Employee Code" column.');
          return;
        }

        const headers = raw[headerIdx].map(h => String(h).trim().toLowerCase());
        const codeCol     = headers.findIndex(h => h.includes('employee code'));
        const rateCol     = headers.findIndex(h => h.includes('new daily rate'));
        const dateCol     = headers.findIndex(h => h.includes('effective from'));

        if (codeCol === -1 || rateCol === -1) {
          setFileError('Missing required columns: "Employee Code" and "New Daily Rate (₹)"');
          return;
        }

        const dataRows = raw.slice(headerIdx + 1).filter(row =>
          row[codeCol] !== '' && row[codeCol] !== undefined
        );

        if (dataRows.length === 0) {
          setFileError('No data rows found. Please fill in the New Daily Rate column.');
          return;
        }

        const validated = dataRows.map((row) => {
          const code    = String(row[codeCol]).trim();
          const rateRaw = row[rateCol];
          const rate    = rateRaw !== '' ? Number(rateRaw) : null;
          const dateRaw = dateCol !== -1 ? String(row[dateCol]).trim() : '';
          // Accept XLSX serial numbers too (ExcelJS stores dates as serials)
          let effectiveFrom = TODAY;
          if (dateRaw && dateRaw !== '0' && dateRaw !== '') {
            if (isValidDate(dateRaw)) {
              effectiveFrom = dateRaw;
            } else {
              // Try parsing as Excel serial
              const serial = Number(dateRaw);
              if (!isNaN(serial) && serial > 40000) {
                const d = XLSX.SSF.parse_date_code(serial);
                effectiveFrom = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
              }
            }
          }

          const worker = codeMap[code.toLowerCase()];
          let error = null;
          if (!worker) error = 'Employee code not found';
          else if (rate === null) error = 'Daily rate is empty — row will be skipped';
          else if (isNaN(rate) || rate <= 0) error = 'Daily rate must be a positive number';

          return {
            employee_code: code,
            employee_name: worker?.employee_name || '—',
            department: worker?.department || '—',
            current_rate: worker?.daily_rate || null,
            new_rate: rate,
            effective_from: effectiveFrom,
            employee_id: worker?.employee_id || null,
            error,
            skip: rate === null,
          };
        });

        setParsedRows(validated);
        setStep(1);
      } catch {
        setFileError('Failed to parse file. Please use the downloaded template.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const validRows = parsedRows.filter(r => !r.error && !r.skip && r.employee_id);
    if (validRows.length === 0) { setFileError('No valid rows to upload.'); return; }

    setUploading(true);
    try {
      const rates = validRows.map(r => ({
        employee_id:    r.employee_id,
        daily_rate:     r.new_rate,
        effective_from: r.effective_from,
      }));

      const response = await factoryPayrollService.bulkAssignRates(rates);

      if (response.success) {
        setUploadResult({ success: true, message: response.message || 'Bulk upload completed', data: response.data });
        setStep(2);
        onSuccess?.();
      } else {
        setUploadResult({ success: false, message: response.message || 'Upload failed' });
        setStep(2);
      }
    } catch (err) {
      setUploadResult({ success: false, message: 'Upload failed: ' + err.message });
      setStep(2);
    } finally {
      setUploading(false);
    }
  };

  const validCount = parsedRows.filter(r => !r.error && !r.skip).length;
  const errorCount = parsedRows.filter(r => r.error && !r.skip).length;
  const skipCount  = parsedRows.filter(r => r.skip).length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Bulk Rate Upload
        <Typography variant="body2" color="text.secondary">
          Upload an Excel file to update daily rates — each employee can have a different effective date
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {['Upload File', 'Preview & Validate', 'Result'].map(label => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {/* ── Step 0: Upload ── */}
        {step === 0 && (
          <Box>
            {fileError && <Alert severity="error" sx={{ mb: 2 }}>{fileError}</Alert>}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate}>
                Download Template
              </Button>
              <Button variant="contained" startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()}>
                Choose Excel File
              </Button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileChange} />
            </Box>

            <Alert severity="info">
              <strong>How it works:</strong>
              <ol style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
                <li>Download the template — pre-filled with all factory workers and their current rates</li>
                <li>Fill <strong>New Daily Rate (₹)</strong> for workers you want to update. Leave blank to skip.</li>
                <li>Fill <strong>Effective From (YYYY-MM-DD)</strong> per employee — each can have a different date. Defaults to today if left blank.</li>
                <li>Upload and review the preview before submitting</li>
              </ol>
            </Alert>
          </Box>
        )}

        {/* ── Step 1: Preview ── */}
        {step === 1 && (
          <Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1 }}>Preview:</Typography>
              <Chip icon={<CheckIcon />} label={`${validCount} will update`} color="success" size="small" />
              {errorCount > 0 && <Chip icon={<ErrorIcon />} label={`${errorCount} errors`} color="error" size="small" />}
              {skipCount  > 0 && <Chip icon={<WarningIcon />} label={`${skipCount} skipped`} color="default" size="small" />}
            </Box>

            {errorCount > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {errorCount} row(s) have errors and will not be uploaded.
              </Alert>
            )}

            <TableContainer component={Paper} sx={{ maxHeight: 420 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell align="right">Current Rate</TableCell>
                    <TableCell align="right">New Rate</TableCell>
                    <TableCell align="right">Change</TableCell>
                    <TableCell>Effective From</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedRows.map((row, i) => {
                    const change = row.current_rate && row.new_rate
                      ? row.new_rate - Number(row.current_rate) : null;
                    return (
                      <TableRow key={i} sx={{ bgcolor: row.error ? 'error.50' : row.skip ? 'grey.50' : 'inherit', opacity: row.skip ? 0.5 : 1 }}>
                        <TableCell>{row.employee_code}</TableCell>
                        <TableCell>{row.employee_name}</TableCell>
                        <TableCell>{row.department}</TableCell>
                        <TableCell align="right">{row.current_rate ? `₹${Number(row.current_rate).toFixed(2)}` : '—'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{row.new_rate ? `₹${Number(row.new_rate).toFixed(2)}` : '—'}</TableCell>
                        <TableCell align="right">
                          {change !== null ? (
                            <Typography variant="body2" color={change > 0 ? 'success.main' : change < 0 ? 'error.main' : 'text.secondary'} fontWeight={600}>
                              {change > 0 ? '+' : ''}{change.toFixed(2)}
                            </Typography>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color={row.effective_from === TODAY ? 'text.secondary' : 'primary.main'}>
                            {row.effective_from ? new Date(row.effective_from).toLocaleDateString('en-GB') : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {row.skip   ? <Chip label="Skipped" size="small" variant="outlined" /> :
                           row.error  ? <Chip label={row.error} size="small" color="error" /> :
                                        <Chip label="Ready" size="small" color="success" />}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ── Step 2: Result ── */}
        {step === 2 && uploadResult && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            {uploadResult.success ? (
              <>
                <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Upload Successful</Typography>
                <Typography color="text.secondary">{uploadResult.message}</Typography>
                {uploadResult.data && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Chip label={`${uploadResult.data.success_count} updated`} color="success" />
                    {uploadResult.data.failed_count > 0 && <Chip label={`${uploadResult.data.failed_count} failed`} color="error" />}
                  </Box>
                )}
              </>
            ) : (
              <>
                <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Upload Failed</Typography>
                <Typography color="text.secondary">{uploadResult.message}</Typography>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {step === 0 && <Button onClick={handleClose}>Cancel</Button>}
        {step === 1 && (
          <>
            <Button onClick={() => { setStep(0); setParsedRows([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}>Back</Button>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={validCount === 0 || uploading}
              startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}>
              {uploading ? 'Uploading...' : `Upload ${validCount} Rate${validCount !== 1 ? 's' : ''}`}
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <Button onClick={reset}>Upload Another</Button>
            <Button variant="contained" onClick={handleClose}>Done</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
