import { useState } from 'react';
import {
    Box, Typography, Paper, Button, Alert, Stack,
    Collapse, Chip, Divider
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Download as DownloadIcon,
    Info as InfoIcon,
    PersonOff as PersonOffIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import attendanceService from '../../services/attendanceService';
import BulkUploadDialog from './BulkUploadDialog';

const BulkUpload = () => {
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [inactivitySummary, setInactivitySummary] = useState(null);
    const [showSkipped, setShowSkipped] = useState(false);
    const [showNewlyInactive, setShowNewlyInactive] = useState(false);

    const downloadTemplate = async () => {
        try {
            await attendanceService.downloadBulkUploadTemplate();
        } catch {
            setError('Failed to download template');
        }
    };

    const handleUploadSuccess = (result) => {
        setSuccess(
            `Successfully processed ${result.successful_rows} punch records. ` +
            `Attendance generated for ${result.date_range?.from} to ${result.date_range?.to}`
        );
        setTimeout(() => setSuccess(''), 6000);

        // Show inactivity summary if there's anything to report
        const summary = result.inactivity_summary;
        if (
            summary &&
            (summary.skipped_inactive_employees?.length > 0 || summary.newly_inactivated_count > 0)
        ) {
            setInactivitySummary(summary);
            setShowSkipped(false);
            setShowNewlyInactive(false);
        } else {
            setInactivitySummary(null);
        }
    };

    const skipped = inactivitySummary?.skipped_inactive_employees ?? [];
    const newlyFactory = inactivitySummary?.newly_inactivated?.factory ?? [];
    const newlyOffice = inactivitySummary?.newly_inactivated?.office ?? [];
    const allNewlyInactive = [...newlyFactory, ...newlyOffice];

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

            {/* Inactivity Summary — persists until dismissed */}
            {inactivitySummary && (
                <Alert
                    severity="warning"
                    icon={<PersonOffIcon />}
                    onClose={() => setInactivitySummary(null)}
                    sx={{ mb: 2 }}
                >
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Employee Inactivity Report
                    </Typography>

                    {/* Skipped inactive employees */}
                    {skipped.length > 0 && (
                        <Box sx={{ mb: allNewlyInactive.length > 0 ? 1.5 : 0 }}>
                            <Box
                                sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                                onClick={() => setShowSkipped(v => !v)}
                            >
                                <Chip
                                    label={`${skipped.length} skipped`}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                />
                                <Typography variant="body2">
                                    INACTIVE employee(s) found in upload — their attendance was <strong>not uploaded</strong>.
                                    Reactivate from Employee Management if needed.
                                </Typography>
                                {showSkipped ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
                            </Box>
                            <Collapse in={showSkipped}>
                                <Box sx={{ mt: 1, ml: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {skipped.map(e => (
                                        <Chip
                                            key={e.employee_code}
                                            label={`#${e.employee_code}`}
                                            size="small"
                                            variant="outlined"
                                            color="default"
                                        />
                                    ))}
                                </Box>
                            </Collapse>
                        </Box>
                    )}

                    {skipped.length > 0 && allNewlyInactive.length > 0 && (
                        <Divider sx={{ my: 1 }} />
                    )}

                    {/* Newly auto-inactivated employees */}
                    {allNewlyInactive.length > 0 && (
                        <Box>
                            <Box
                                sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                                onClick={() => setShowNewlyInactive(v => !v)}
                            >
                                <Chip
                                    label={`${allNewlyInactive.length} auto-inactivated`}
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                />
                                <Typography variant="body2">
                                    Employee(s) marked <strong>INACTIVE</strong> — no punch recorded in the last 7 days.
                                </Typography>
                                {showNewlyInactive ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
                            </Box>
                            <Collapse in={showNewlyInactive}>
                                <Box sx={{ mt: 1, ml: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {allNewlyInactive.map(e => (
                                        <Chip
                                            key={e.employee_code}
                                            label={`#${e.employee_code} ${e.name || ''}`}
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                        />
                                    ))}
                                </Box>
                            </Collapse>
                        </Box>
                    )}
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

                    <Alert severity="info">
                        <Typography variant="body2">
                            <strong>Inactivity Check:</strong> After every upload, employees with no punch in the last 7 days are automatically marked Inactive. Office employees on approved leave are protected.
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
