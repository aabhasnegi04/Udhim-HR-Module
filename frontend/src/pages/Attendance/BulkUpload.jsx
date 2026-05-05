import { useState } from 'react';
import {
    Box, Typography, Paper, Button, Alert, Stack
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Download as DownloadIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import attendanceService from '../../services/attendanceService';
import BulkUploadDialog from './BulkUploadDialog';

const BulkUpload = () => {
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const downloadTemplate = async () => {
        try {
            await attendanceService.downloadBulkUploadTemplate();
        } catch {
            setError('Failed to download template');
        }
    };

    const handleUploadSuccess = (result) => {
        setSuccess(`Successfully processed ${result.successful_rows} punch records. Attendance generated for ${result.date_range?.from} to ${result.date_range?.to}`);
        setTimeout(() => setSuccess(''), 5000);
    };

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
                Bulk Upload Attendance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload Excel files exported from biometric devices
            </Typography>

            {/* Success Message */}
            {success && (
                <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            {/* Error Message */}
            {error && (
                <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Instructions */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <InfoIcon color="primary" />
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                How to Upload Attendance
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                1. Export attendance data from your biometric device(s) as Excel files (.xlsx or .xls)
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                2. Click "Upload Attendance" and select one or more Excel files
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                3. Review the preview to verify punch data
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                4. Click "Process & Generate Attendance" to complete the upload
                            </Typography>
                        </Box>
                    </Box>

                    <Alert severity="info">
                        <Typography variant="body2">
                            <strong>Multiple Devices:</strong> If you have multiple biometric devices, you can upload all Excel files at once. The system will automatically combine punches from all devices.
                        </Typography>
                    </Alert>

                    <Alert severity="warning">
                        <Typography variant="body2">
                            <strong>Expected Format:</strong> Excel file must have columns: ID, Name, Time
                        </Typography>
                    </Alert>
                </Stack>
            </Paper>

            {/* Actions */}
            <Stack direction="row" spacing={2}>
                <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => setShowUploadDialog(true)}
                    size="large"
                >
                    Upload Attendance
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={downloadTemplate}
                >
                    Download Template
                </Button>
            </Stack>

            {/* Upload Dialog */}
            <BulkUploadDialog
                open={showUploadDialog}
                onClose={() => setShowUploadDialog(false)}
                onSuccess={handleUploadSuccess}
            />
        </Box>
    );
};

export default BulkUpload;
