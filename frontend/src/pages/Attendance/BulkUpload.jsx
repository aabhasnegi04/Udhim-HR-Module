import { useState } from 'react';
import * as XLSX from 'xlsx';
import {
    Box, Typography, Paper, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Alert, LinearProgress,
    Divider, TextField, CircularProgress,
} from '@mui/material';
import {
    CloudUpload as UploadIcon, CheckCircle as SuccessIcon,
    Download as DownloadIcon, Info as InfoIcon, Refresh as ReprocessIcon,
    Visibility as PreviewIcon,
} from '@mui/icons-material';
import attendanceService from '../../services/attendanceService';
import ApiService from '../../services/api';

// Format minutes as "Xh Ym"
const fmtDuration = (minutes) => {
    if (!minutes || minutes <= 0) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

// Parse device XLS/XLSX client-side and group by employee+date
const parseDeviceFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

            // Find header row
            let headerIdx = 0;
            let idCol = -1, timeCol = -1, nameCol = -1;
            for (let i = 0; i < Math.min(5, rows.length); i++) {
                const r = rows[i].map(c => String(c).trim().toUpperCase());
                if (r.includes('ID') && r.includes('TIME')) {
                    headerIdx = i;
                    idCol = r.indexOf('ID');
                    timeCol = r.indexOf('TIME');
                    nameCol = r.indexOf('NAME');
                    break;
                }
            }
            if (idCol === -1) { reject(new Error('Missing ID or TIME column')); return; }

            // Group punches by employee+date
            const groups = {};
            for (let i = headerIdx + 1; i < rows.length; i++) {
                const row = rows[i];
                const rawId = row[idCol];
                const rawTime = row[timeCol];
                if (!rawId && !rawTime) continue;

                const empId = parseInt(String(rawId).trim());
                const name = nameCol >= 0 ? String(row[nameCol]).trim() : '';
                if (isNaN(empId)) continue;

                let dt;
                if (rawTime instanceof Date) {
                    dt = rawTime;
                } else {
                    const s = String(rawTime).trim();
                    dt = new Date(s.replace(/\//g, '-'));
                    if (isNaN(dt)) continue;
                }

                const dateKey = dt.toISOString().split('T')[0];
                const key = `${empId}_${dateKey}`;
                if (!groups[key]) groups[key] = { empId, name, date: dateKey, punches: [] };
                groups[key].punches.push(dt);
            }

            // Build preview rows
            const preview = Object.values(groups).map(g => {
                g.punches.sort((a, b) => a - b);
                const first = g.punches[0];
                const last = g.punches[g.punches.length - 1];
                const minutes = Math.round((last - first) / 60000);
                return {
                    empId: g.empId,
                    name: g.name,
                    date: g.date,
                    firstPunch: first.toTimeString().slice(0, 5),
                    lastPunch: last.toTimeString().slice(0, 5),
                    punchCount: g.punches.length,
                    duration: fmtDuration(minutes),
                    durationMinutes: minutes,
                    flag: g.punches.length === 1 ? 'single-punch' : null,
                };
            }).sort((a, b) => a.date.localeCompare(b.date) || a.empId - b.empId);

            resolve(preview);
        } catch (err) {
            reject(err);
        }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
});

const BulkUpload = () => {
    const [step, setStep] = useState('upload'); // upload | preview | uploading | success
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [parsing, setParsing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState('');

    // Reprocess state
    const [reprocessStart, setReprocessStart] = useState(new Date().toISOString().split('T')[0]);
    const [reprocessEnd, setReprocessEnd] = useState(new Date().toISOString().split('T')[0]);
    const [reprocessing, setReprocessing] = useState(false);
    const [reprocessMsg, setReprocessMsg] = useState('');

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        setError('');
        setParsing(true);
        try {
            const rows = await parseDeviceFile(file);
            setPreview(rows);
            setStep('preview');
        } catch (err) {
            setError(`Failed to parse file: ${err.message}`);
        } finally {
            setParsing(false);
        }
    };

    const handleUpload = async () => {
        setUploading(true);
        setStep('uploading');
        setError('');
        try {
            const result = await attendanceService.bulkUploadAttendance(selectedFile);
            setUploadResult(result.success ? result.data : null);
            if (!result.success) setError(result.error || 'Upload failed');
            else setStep('success');
        } catch (err) {
            setError('Upload failed. Please try again.');
            setStep('preview');
        } finally {
            setUploading(false);
        }
    };

    const handleReset = () => {
        setStep('upload');
        setSelectedFile(null);
        setPreview([]);
        setUploadResult(null);
        setError('');
    };

    const handleReprocess = async () => {
        setReprocessing(true);
        setReprocessMsg('');
        try {
            const res = await ApiService.post('/attendance/factory/process', {
                start_date: reprocessStart, end_date: reprocessEnd,
            });
            setReprocessMsg(res.success ? `✅ ${res.message}` : `❌ ${res.error || 'Failed'}`);
        } catch {
            setReprocessMsg('❌ Failed to process attendance');
        } finally {
            setReprocessing(false);
        }
    };

    const downloadTemplate = async () => {
        try {
            await attendanceService.downloadBulkUploadTemplate();
        } catch { setError('Failed to download template'); }
    };

    const singlePunchCount = preview.filter(r => r.flag === 'single-punch').length;

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>Device Attendance Upload</Typography>
                <Typography variant="body2" color="text.secondary">
                    Upload the raw punch log exported from the biometric device via USB
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            {/* STEP 1: Upload */}
            {step === 'upload' && (
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '2 1 500px' }}>
                        {parsing && <LinearProgress sx={{ mb: 2 }} />}
                        <Paper sx={{
                            p: 6, textAlign: 'center', border: '2px dashed',
                            borderColor: 'primary.main', bgcolor: 'primary.50',
                            minHeight: 350, display: 'flex', flexDirection: 'column', justifyContent: 'center'
                        }}>
                            <UploadIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                            <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
                                Upload Device Export File
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                                Select the .xls file exported from the biometric device USB.
                                The file will be previewed before uploading.
                            </Typography>
                            <input accept=".xlsx,.xls" style={{ display: 'none' }} id="file-upload"
                                type="file" onChange={handleFileSelect} />
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <label htmlFor="file-upload">
                                    <Button variant="contained" component="span" size="large" startIcon={<UploadIcon />}>
                                        Choose File
                                    </Button>
                                </label>
                                <Button variant="outlined" size="large" startIcon={<DownloadIcon />} onClick={downloadTemplate}>
                                    Sample Template
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                    <Box sx={{ flex: '1 1 280px' }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <InfoIcon color="primary" /> File Format
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Required Columns:</Typography>
                            <Box component="ul" sx={{ pl: 2, m: 0, mb: 2 }}>
                                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}><strong>ID</strong> — Employee ID</Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}><strong>Name</strong> — Employee name</Typography>
                                <Typography component="li" variant="body2"><strong>Time</strong> — YYYY/MM/DD HH:MM:SS</Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>What happens:</Typography>
                            <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>File is previewed before upload</Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>First punch = check-in, last = check-out</Typography>
                                <Typography component="li" variant="body2">Attendance auto-calculated after upload</Typography>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            )}

            {/* STEP 2: Preview */}
            {step === 'preview' && (
                <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <strong>{selectedFile?.name}</strong> — {preview.length} employee-day records found
                        {singlePunchCount > 0 && ` · ⚠️ ${singlePunchCount} with single punch (will be flagged)`}
                    </Alert>

                    <Paper sx={{ mb: 2 }}>
                        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: 1, borderColor: 'divider' }}>
                            <PreviewIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle1" fontWeight={600}>Preview — Review before uploading</Typography>
                        </Box>
                        <TableContainer sx={{ maxHeight: 450 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Emp ID</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>First Punch</TableCell>
                                        <TableCell>Last Punch</TableCell>
                                        <TableCell>Punches</TableCell>
                                        <TableCell>Duration</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {preview.map((row, i) => (
                                        <TableRow key={i} sx={{ bgcolor: row.flag ? 'warning.50' : 'inherit' }}>
                                            <TableCell>{row.empId}</TableCell>
                                            <TableCell>{row.name || '—'}</TableCell>
                                            <TableCell>{row.date}</TableCell>
                                            <TableCell>{row.firstPunch}</TableCell>
                                            <TableCell>{row.punchCount > 1 ? row.lastPunch : '—'}</TableCell>
                                            <TableCell>{row.punchCount}</TableCell>
                                            <TableCell><strong>{row.duration}</strong></TableCell>
                                            <TableCell>
                                                {row.flag === 'single-punch'
                                                    ? <Chip label="Single Punch" color="warning" size="small" />
                                                    : <Chip label="OK" color="success" size="small" />
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button variant="outlined" onClick={handleReset}>Cancel</Button>
                        <Button variant="contained" onClick={handleUpload}>
                            Confirm & Upload
                        </Button>
                    </Box>
                </Box>
            )}

            {/* STEP 3: Uploading */}
            {step === 'uploading' && (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <CircularProgress size={60} sx={{ mb: 3 }} />
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Uploading & Processing...</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Saving punch records and calculating attendance. This may take a moment.
                    </Typography>
                    <LinearProgress sx={{ mt: 3, maxWidth: 400, mx: 'auto' }} />
                </Paper>
            )}

            {/* STEP 4: Success */}
            {step === 'success' && uploadResult && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <SuccessIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>Upload Complete</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {uploadResult.successful_rows} punch records saved.
                        Attendance calculated for{' '}
                        <strong>{uploadResult.date_range?.from}</strong> to{' '}
                        <strong>{uploadResult.date_range?.to}</strong>.
                    </Typography>
                    {uploadResult.failed_rows > 0 && (
                        <Alert severity="warning" sx={{ mb: 2, textAlign: 'left' }}>
                            {uploadResult.failed_rows} rows had errors and were skipped.
                            {uploadResult.errors?.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    {uploadResult.errors.slice(0, 5).map((e, i) => (
                                        <Typography key={i} variant="caption" display="block">
                                            Row {e.row} (emp {e.employee_id}): {e.error}
                                        </Typography>
                                    ))}
                                    {uploadResult.errors.length > 5 && (
                                        <Typography variant="caption">...and {uploadResult.errors.length - 5} more</Typography>
                                    )}
                                </Box>
                            )}
                        </Alert>
                    )}
                    <Button variant="contained" onClick={handleReset}>Upload Another File</Button>
                </Paper>
            )}

            {/* Reprocess Section */}
            <Box sx={{ mt: 5 }}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReprocessIcon color="primary" /> Reprocess Attendance
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Recalculate attendance for a date range — use after changing shift timings or correcting punch data.
                </Typography>
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <TextField label="From Date" type="date" value={reprocessStart}
                            onChange={e => setReprocessStart(e.target.value)} size="small"
                            InputLabelProps={{ shrink: true }} />
                        <TextField label="To Date" type="date" value={reprocessEnd}
                            onChange={e => setReprocessEnd(e.target.value)} size="small"
                            InputLabelProps={{ shrink: true }} />
                        <Button variant="outlined" startIcon={<ReprocessIcon />}
                            onClick={handleReprocess} disabled={reprocessing}>
                            {reprocessing ? 'Processing...' : 'Process Attendance'}
                        </Button>
                    </Box>
                    {reprocessMsg && (
                        <Alert severity={reprocessMsg.startsWith('✅') ? 'success' : 'error'}
                            sx={{ mt: 2 }} onClose={() => setReprocessMsg('')}>
                            {reprocessMsg}
                        </Alert>
                    )}
                </Paper>
            </Box>
        </Box>
    );
};

export default BulkUpload;
