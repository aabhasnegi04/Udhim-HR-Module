import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, Alert, LinearProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, Stack, IconButton, Collapse
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon,
    CheckCircle as SuccessIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon
} from '@mui/icons-material';
import ApiService from '../../services/api';

export default function BulkUploadDialog({ open, onClose, onSuccess }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [showSamplePunches, setShowSamplePunches] = useState(false);
    const [showErrors, setShowErrors] = useState(false);

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);
        setPreview(null);
        setError('');
    };

    const handleRemoveFile = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        if (newFiles.length === 0) {
            setPreview(null);
        }
    };

    const handlePreview = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one file');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            // Don't set Content-Type header - browser will set it automatically with boundary
            const response = await ApiService.post('/attendance/bulk-upload/preview', formData);

            if (response.success) {
                setPreview(response.data);
            } else {
                setError(response.error || 'Failed to preview files');
            }
        } catch (err) {
            setError('Failed to preview files');
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async () => {
        if (!preview) {
            setError('Please preview files first');
            return;
        }

        setProcessing(true);
        setError('');

        try {
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            // Don't set Content-Type header - browser will set it automatically with boundary
            const response = await ApiService.post('/attendance/bulk-upload/process-multiple', formData);

            if (response.success) {
                onSuccess(response.data);
                handleClose();
            } else {
                setError(response.error || 'Failed to process files');
            }
        } catch (err) {
            setError('Failed to process files');
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        setSelectedFiles([]);
        setPreview(null);
        setError('');
        setShowSamplePunches(false);
        setShowErrors(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                📤 Upload Factory Attendance
            </DialogTitle>

            <DialogContent>
                <Stack spacing={3}>
                    {/* File Selection */}
                    <Box>
                        <input
                            accept=".xlsx,.xls"
                            style={{ display: 'none' }}
                            id="bulk-upload-files"
                            multiple
                            type="file"
                            onChange={handleFileSelect}
                        />
                        <label htmlFor="bulk-upload-files">
                            <Button
                                variant="outlined"
                                component="span"
                                startIcon={<UploadIcon />}
                                fullWidth
                            >
                                Select Files (Multiple files allowed)
                            </Button>
                        </label>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Select Excel files exported from biometric devices (.xlsx or .xls)
                        </Typography>
                    </Box>

                    {/* Selected Files */}
                    {selectedFiles.length > 0 && (
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Selected Files ({selectedFiles.length})
                            </Typography>
                            <Stack spacing={1}>
                                {selectedFiles.map((file, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 1,
                                            bgcolor: 'grey.50',
                                            borderRadius: 1
                                        }}
                                    >
                                        <Typography variant="body2">
                                            ✓ {file.name}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRemoveFile(index)}
                                            disabled={loading || processing}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Stack>

                            {!preview && (
                                <Button
                                    variant="contained"
                                    onClick={handlePreview}
                                    disabled={loading}
                                    sx={{ mt: 2 }}
                                    fullWidth
                                >
                                    {loading ? 'Analyzing...' : 'Preview Files'}
                                </Button>
                            )}
                        </Paper>
                    )}

                    {/* Loading */}
                    {loading && <LinearProgress />}

                    {/* Error */}
                    {error && (
                        <Alert severity="error" onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {/* Preview */}
                    {preview && (
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                📊 Preview
                            </Typography>

                            <Stack spacing={2}>
                                {/* Summary */}
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Punches: <strong>{preview.total_punches}</strong>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Date Range: <strong>{preview.date_range?.from} to {preview.date_range?.to}</strong>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Employees: <strong>{preview.unique_employees} workers</strong>
                                    </Typography>
                                </Box>

                                {/* File Summaries */}
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Files:
                                    </Typography>
                                    {preview.files?.map((file, index) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Chip
                                                label={`${file.punch_count} punches`}
                                                size="small"
                                                color={file.error_count > 0 ? 'warning' : 'success'}
                                            />
                                            <Typography variant="body2">{file.file_name}</Typography>
                                        </Box>
                                    ))}
                                </Box>

                                {/* Warnings */}
                                {preview.warnings && preview.warnings.length > 0 && (
                                    <Alert 
                                        severity={preview.warnings.some(w => w.type === 'early_morning_checkout') ? 'info' : 'warning'} 
                                        icon={<WarningIcon />}
                                    >
                                        <Typography variant="subtitle2" gutterBottom>
                                            {preview.warnings.length} notice(s):
                                        </Typography>
                                        {preview.warnings.map((warning, index) => (
                                            <Box key={index} sx={{ mb: warning.detail ? 1 : 0 }}>
                                                <Typography variant="body2">
                                                    • {warning.message}
                                                </Typography>
                                                {warning.detail && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2, display: 'block' }}>
                                                        {warning.detail}
                                                    </Typography>
                                                )}
                                                {warning.type === 'early_morning_checkout' && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2, display: 'block' }}>
                                                        Affected: {warning.affected_employees} employee(s)
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))}
                                    </Alert>
                                )}

                                {/* Sample Punches */}
                                {preview.sample_punches && preview.sample_punches.length > 0 && (
                                    <Box>
                                        <Button
                                            size="small"
                                            onClick={() => setShowSamplePunches(!showSamplePunches)}
                                            endIcon={showSamplePunches ? <CollapseIcon /> : <ExpandIcon />}
                                        >
                                            Punch Details ({preview.sample_punches.length} shown)
                                        </Button>
                                        {preview.punch_analysis?.early_morning_checkouts > 0 && (
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                (All {preview.punch_analysis.early_morning_checkouts} early morning checkouts + sample of regular punches)
                                            </Typography>
                                        )}
                                        <Collapse in={showSamplePunches}>
                                            <TableContainer sx={{ mt: 1, maxHeight: 200 }}>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Emp Code</TableCell>
                                                            <TableCell>Punch Time</TableCell>
                                                            <TableCell>Type</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {preview.sample_punches.map((punch, index) => (
                                                            <TableRow 
                                                                key={index}
                                                                sx={{ 
                                                                    bgcolor: punch.is_early_morning ? 'warning.lighter' : 'inherit' 
                                                                }}
                                                            >
                                                                <TableCell>{punch.employee_code}</TableCell>
                                                                <TableCell>{punch.log_time}</TableCell>
                                                                <TableCell>
                                                                    {punch.is_early_morning ? (
                                                                        <Chip 
                                                                            label={punch.note} 
                                                                            size="small" 
                                                                            color="warning"
                                                                            sx={{ fontSize: '0.7rem' }}
                                                                        />
                                                                    ) : (
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {punch.note}
                                                                        </Typography>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Collapse>
                                    </Box>
                                )}

                                {/* Errors */}
                                {preview.errors && preview.errors.length > 0 && (
                                    <Box>
                                        <Button
                                            size="small"
                                            color="error"
                                            onClick={() => setShowErrors(!showErrors)}
                                            endIcon={showErrors ? <CollapseIcon /> : <ExpandIcon />}
                                        >
                                            Errors ({preview.errors.length})
                                        </Button>
                                        <Collapse in={showErrors}>
                                            <Alert severity="error" sx={{ mt: 1 }}>
                                                {preview.errors.slice(0, 10).map((err, index) => (
                                                    <Typography key={index} variant="body2">
                                                        Row {err.row}: {err.error}
                                                    </Typography>
                                                ))}
                                                {preview.errors.length > 10 && (
                                                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                        ... and {preview.errors.length - 10} more errors
                                                    </Typography>
                                                )}
                                            </Alert>
                                        </Collapse>
                                    </Box>
                                )}
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={processing}>
                    Cancel
                </Button>
                {preview && (
                    <Button
                        variant="contained"
                        onClick={handleProcess}
                        disabled={processing}
                        startIcon={processing ? null : <SuccessIcon />}
                    >
                        {processing ? 'Processing...' : 'Process & Generate Attendance'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
