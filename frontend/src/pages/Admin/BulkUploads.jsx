import { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Paper, Button, Alert, Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, LinearProgress, CircularProgress,
    FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
    Upload as UploadIcon,
    Download as DownloadIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    People as PeopleIcon,
    CloudUpload as CloudUploadIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import adminService from '../../services/adminService';

const MODULE_CONFIG = {
    EMPLOYEES: {
        label: 'Employee Master',
        templateType: 'employee-master',
        description: 'Bulk upload employee data with dropdown validation for departments, designations, and more',
        requiredFields: ['Employee ID', 'First Name', 'Last Name', 'Email', 'Department', 'Designation', 'Date of Joining'],
    },
    EMPLOYEE_IMAGES: {
        label: 'Employee Images',
        templateType: null,
        description: 'Upload employee photos for face recognition. ZIP file with images named by employee code (e.g., EMP001.jpg)',
        requiredFields: ['ZIP file containing images named as: EMP001.jpg, EMP002.png, etc.'],
        isZipUpload: true,
    },
    ATTENDANCE: {
        label: 'Attendance',
        templateType: 'attendance',
        description: 'Upload attendance records for a date range',
        requiredFields: ['Employee ID', 'Date', 'Check In', 'Check Out', 'Status'],
    },
};

const statusColor = (s) => s === 'Success' ? 'success' : s === 'Partial' ? 'warning' : 'error';

const BulkUploads = () => {
    const [selectedModule, setSelectedModule] = useState('EMPLOYEES');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [error, setError] = useState('');
    const fileInputRef = useRef();

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await adminService.getBulkUploadLogs();
            // api.js returns raw JSON, not {data: ...}
            const logs = res.success && Array.isArray(res.data) ? res.data : [];
            setHistory(logs);
        } catch (err) {
            console.error('Failed to load history:', err);
            setHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => { loadHistory(); }, []);

    const handleDownloadTemplate = async () => {
        try {
            // Employee Images doesn't have a template
            if (selectedModule === 'EMPLOYEE_IMAGES') {
                setError('Employee Images upload does not require a template. Simply upload a ZIP file with images named by employee code (e.g., EMP001.jpg, EMP002.png)');
                return;
            }
            await adminService.downloadBulkUploadTemplate(MODULE_CONFIG[selectedModule].templateType);
        } catch {
            setError('Failed to download template');
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        setUploading(true);
        setUploadProgress(20);
        setUploadResult(null);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            setUploadProgress(50);

            // Call the correct endpoint based on module
            const endpoint = selectedModule === 'EMPLOYEES' 
                ? '/admin/bulk-upload/employees'
                : selectedModule === 'EMPLOYEE_IMAGES'
                ? '/admin/bulk-upload/employee-images'
                : '/admin/bulk-upload/attendance';

            const token = sessionStorage.getItem('hrms_token');
            const companyCode = import.meta.env.VITE_COMPANY_CODE;
            const currentView = localStorage.getItem('preferred_view') || 'HR';
            
            const headers = {
                'Authorization': `Bearer ${token}`,
                'X-Current-View': currentView
            };
            
            if (companyCode) {
                headers['X-Company-Code'] = companyCode;
            }
            
            // Use the same base URL as apiService
            const baseURL = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
            const response = await fetch(`${baseURL}${endpoint}`, {
                method: 'POST',
                headers,
                body: formData
            });

            const res = await response.json();
            setUploadProgress(90);

            if (res.success) {
                const data = res.data || {};
                const total   = data.total || 0;
                const success = data.success || 0;
                const failed  = data.failed || 0;
                const skipped = data.skipped || 0;

                // Log to DB (fire and forget)
                adminService.logBulkUpload({
                    file_name: file.name,
                    module: selectedModule,
                    total_records: total,
                    success_records: success,
                    failed_records: failed,
                });

                setUploadResult({
                    fileName: file.name,
                    total, success, failed, skipped,
                    errors: data.errors || [],
                    status: failed === 0 ? 'Success' : success === 0 ? 'Failed' : 'Partial',
                });

                setUploadProgress(100);
                loadHistory();
            } else {
                setError(res.message || 'Upload failed');
            }
        } catch (err) {
            setError(err?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const config = MODULE_CONFIG[selectedModule];

    return (
        <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
                Download the template for your module, fill it in, then upload. All records are validated before import.
            </Alert>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
            )}

            {/* Upload Panel */}
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle1" fontWeight={600}>Upload Data</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Select a module, download the template, fill it in, then upload
                    </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 3 }}>
                        <FormControl sx={{ minWidth: 220 }}>
                            <InputLabel>Module</InputLabel>
                            <Select
                                value={selectedModule}
                                label="Module"
                                onChange={e => { setSelectedModule(e.target.value); setUploadResult(null); }}
                            >
                                {Object.entries(MODULE_CONFIG).map(([key, cfg]) => (
                                    <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate}
                            disabled={selectedModule === 'EMPLOYEE_IMAGES'}>
                            {selectedModule === 'EMPLOYEE_IMAGES' ? 'No Template' : 'Download Template'}
                        </Button>

                        <Button
                            variant="contained"
                            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
                            component="label"
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : 'Upload File'}
                            <input ref={fileInputRef} type="file" hidden 
                                accept={selectedModule === 'EMPLOYEE_IMAGES' ? '.zip' : '.xlsx,.xls,.csv'}
                                onChange={handleFileSelect} />
                        </Button>
                    </Box>

                    {/* Module info */}
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {config.description}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                            Required columns: {config.requiredFields.join(' · ')}
                        </Typography>
                    </Box>

                    {/* Employee Images - Special Instructions */}
                    {selectedModule === 'EMPLOYEE_IMAGES' && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                            <Typography variant="subtitle2" fontWeight={600} color="info.main" sx={{ mb: 1.5 }}>
                                📋 How to Upload Employee Images
                            </Typography>
                            
                            <Box component="ol" sx={{ pl: 2.5, m: 0, '& li': { mb: 1 } }}>
                                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                    <strong>Collect Photos:</strong> Get clear, front-facing photos of each employee (JPG or PNG format)
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                    <strong>Rename Files:</strong> Rename each image to match employee code
                                    <Box sx={{ mt: 0.5, pl: 2, fontFamily: 'monospace', fontSize: '0.85rem', color: 'success.main' }}>
                                        ✓ EMP001.jpg<br/>
                                        ✓ EMP002.png<br/>
                                        ✓ EMP003.jpeg
                                    </Box>
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                    <strong>Create ZIP:</strong> Select all renamed images → Right-click → "Compress" or "Send to Compressed folder"
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                    <strong>Upload:</strong> Click "Upload File" above and select your ZIP file
                                </Typography>
                                <Typography component="li" variant="body2">
                                    <strong>Review:</strong> Check results and fix any errors if needed
                                </Typography>
                            </Box>

                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'info.200' }}>
                                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                    ⚠️ Important Requirements:
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    • One face per image (no group photos)
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    • Clear, well-lit photos
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    • No sunglasses or face coverings
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    • File size: Max 10MB per image
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Progress */}
                    {uploading && (
                        <Box sx={{ mt: 2 }}>
                            <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 0.5 }} />
                            <Typography variant="caption" color="text.secondary">
                                {uploadProgress}% — processing...
                            </Typography>
                        </Box>
                    )}

                    {/* Result */}
                    {uploadResult && !uploading && (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity={uploadResult.failed === 0 ? 'success' : uploadResult.success === 0 ? 'error' : 'warning'}>
                                <strong>{uploadResult.fileName}</strong> — {uploadResult.success} succeeded,{' '}
                                {uploadResult.failed} failed
                                {uploadResult.skipped > 0 && `, ${uploadResult.skipped} skipped`}
                                {' '}out of {uploadResult.total} records
                            </Alert>
                            {uploadResult.errors?.length > 0 && (
                                <Box sx={{ mt: 1, p: 1.5, bgcolor: 'error.50', borderRadius: 1, maxHeight: 160, overflow: 'auto' }}>
                                    {uploadResult.errors.slice(0, 15).map((e, i) => (
                                        <Typography key={i} variant="caption" color="error.main" display="block" sx={{ mb: 0.5 }}>
                                            Row {e.row} ({e.employee_code}): {e.error}
                                        </Typography>
                                    ))}
                                    {uploadResult.errors.length > 15 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                            +{uploadResult.errors.length - 15} more errors
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Upload History */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={600}>Upload History</Typography>
                <Button size="small" startIcon={<RefreshIcon />} onClick={loadHistory} disabled={historyLoading}>
                    Refresh
                </Button>
            </Box>

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                {['File', 'Module', 'Total', 'Success', 'Failed', 'Status', 'Uploaded By', 'Date'].map(h => (
                                    <TableCell key={h}><Typography variant="caption" fontWeight={600}>{h}</Typography></TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {historyLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                            No uploads yet. Upload your first file above.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : history.map((row, idx) => {
                                const s = row.failed_records === 0 ? 'Success'
                                    : row.success_records === 0 ? 'Failed' : 'Partial';
                                return (
                                    <TableRow key={row.upload_id || idx} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                                                {row.file_name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={row.module} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>{row.total_records}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="success.main">{row.success_records}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color={row.failed_records > 0 ? 'error.main' : 'text.secondary'}>
                                                {row.failed_records}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={s}
                                                color={statusColor(s)}
                                                size="small"
                                                icon={s === 'Success' ? <CheckCircleIcon /> : s === 'Partial' ? <WarningIcon /> : <ErrorIcon />}
                                            />
                                        </TableCell>
                                        <TableCell>{row.uploaded_by_name || '—'}</TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {row.uploaded_at ? new Date(row.uploaded_at).toLocaleDateString() : '—'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default BulkUploads;
