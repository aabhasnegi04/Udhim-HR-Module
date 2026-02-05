import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    LinearProgress,
    Divider,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    CheckCircle as SuccessIcon,
    Download as DownloadIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import attendanceService from '../../services/attendanceService';

const BulkUpload = () => {
    const [uploadStep, setUploadStep] = useState('upload'); // upload, preview, validation, success
    const [selectedFile, setSelectedFile] = useState(null);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [validationResults, setValidationResults] = useState(null);
    const [error, setError] = useState('');

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setUploadStep('preview');
            setError('');
        }
    };

    const handleValidate = async () => {
        if (!selectedFile) return;
        
        setUploading(true);
        setError('');
        
        try {
            const result = await attendanceService.bulkUploadAttendance(selectedFile);
            
            if (result.success) {
                setValidationResults(result.data);
                setUploading(false);
                
                // Always show the modal to display results (even if all failed)
                setShowValidationModal(true);
            } else {
                setUploading(false);
                setError(result.error || 'Failed to process file');
            }
        } catch (err) {
            setUploading(false);
            setError('Failed to upload file. Please try again.');
            console.error('Upload error:', err);
        }
    };

    const handleConfirmUpload = () => {
        setShowValidationModal(false);
        setUploadStep('success');
    };

    const handleReset = () => {
        setUploadStep('upload');
        setSelectedFile(null);
        setShowValidationModal(false);
        setUploading(false);
        setValidationResults(null);
        setError('');
    };

    const downloadTemplate = async () => {
        try {
            const result = await attendanceService.downloadBulkUploadTemplate();
            if (!result.success) {
                setError('Failed to download template');
            }
        } catch (err) {
            setError('Failed to download template');
            console.error('Template download error:', err);
        }
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Excel File Upload
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Upload attendance data for multiple employees using Excel files
                </Typography>
            </Box>

            {/* Upload Step */}
            {uploadStep === 'upload' && (
                <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3, md: 4 }, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '2 1 500px', minWidth: { xs: '300px', sm: '500px' } }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}
                        
                        <Paper sx={{ 
                            p: { xs: 3, sm: 4, md: 6 }, 
                            textAlign: 'center', 
                            border: '2px dashed', 
                            borderColor: 'primary.main', 
                            bgcolor: 'primary.50', 
                            minHeight: { xs: 300, sm: 350, md: 400 }, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center' 
                        }}>
                            <UploadIcon sx={{ fontSize: { xs: 60, sm: 70, md: 80 }, color: 'primary.main', mb: { xs: 2, sm: 3 } }} />
                            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                                Upload Attendance File
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ 
                                mb: { xs: 3, sm: 4 }, 
                                maxWidth: 500, 
                                mx: 'auto',
                                fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}>
                                Select an Excel file (.xlsx, .xls) containing attendance data. Make sure your file follows the required format.
                            </Typography>
                            
                            <input
                                accept=".xlsx,.xls"
                                style={{ display: 'none' }}
                                id="file-upload"
                                type="file"
                                onChange={handleFileSelect}
                            />
                            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <label htmlFor="file-upload">
                                    <Button
                                        variant="contained"
                                        component="span"
                                        size="large"
                                        startIcon={<UploadIcon />}
                                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                                    >
                                        Choose File
                                    </Button>
                                </label>
                                
                                <Button
                                    variant="outlined"
                                    size="large"
                                    startIcon={<DownloadIcon />}
                                    onClick={downloadTemplate}
                                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                                >
                                    Download Template
                                </Button>
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mt: { xs: 2, sm: 3 } }}>
                                Supported formats: .xlsx, .xls (Max size: 10MB)
                            </Typography>
                        </Paper>
                    </Box>

                    <Box sx={{ flex: '1 1 300px', minWidth: { xs: '300px', sm: '350px' } }}>
                        <Paper sx={{ p: { xs: 3, sm: 4 }, height: 'fit-content' }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: { xs: 2, sm: 3 }, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <InfoIcon color="primary" />
                                Upload Instructions
                            </Typography>
                            
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                Required Columns:
                            </Typography>
                            <Box component="ul" sx={{ pl: 2, m: 0, mb: { xs: 2, sm: 3 } }}>
                                <Typography component="li" variant="body2" sx={{ mb: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                    <strong>Employee ID</strong> - Unique identifier
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                    <strong>Date</strong> - Format: DD-MM-YYYY
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                    <strong>Check-in Time</strong> - Format: HH:MM
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                    <strong>Check-out Time</strong> - Format: HH:MM
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                    <strong>Status</strong> - Present/Absent/Late/etc.
                                </Typography>
                            </Box>

                            <Divider sx={{ my: { xs: 2, sm: 3 } }} />

                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                Tips for Success:
                            </Typography>
                            <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                <Typography component="li" variant="body2" sx={{ mb: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                    Use the provided template
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                    Ensure all required fields are filled
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                    Check date and time formats
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                    Verify employee IDs exist in system
                                </Typography>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            )}

            {/* Preview Step */}
            {uploadStep === 'preview' && selectedFile && (
                <Box>
                    <Alert severity="info" sx={{ mb: { xs: 2, sm: 3 } }}>
                        File selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </Alert>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            Ready to Upload
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, sm: 3 } }}>
                            Click "Validate & Upload" to process the file. The system will validate all records and save them to the database.
                        </Typography>
                    </Paper>

                    <Box sx={{ 
                        display: 'flex', 
                        gap: { xs: 1, sm: 2 }, 
                        justifyContent: 'flex-end',
                        flexDirection: { xs: 'column', sm: 'row' }
                    }}>
                        <Button variant="outlined" onClick={handleReset} fullWidth={false} disabled={uploading}>
                            Cancel
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={handleValidate}
                            disabled={uploading}
                            fullWidth={false}
                        >
                            {uploading ? 'Processing...' : 'Validate & Upload'}
                        </Button>
                    </Box>

                    {uploading && <LinearProgress sx={{ mt: 2 }} />}
                </Box>
            )}

            {/* Success Step */}
            {uploadStep === 'success' && validationResults && (
                <Paper sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                    <SuccessIcon sx={{ fontSize: { xs: 48, sm: 64 }, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        Upload Successful!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 2, sm: 3 } }}>
                        {validationResults.successful_rows} attendance records have been successfully uploaded.
                    </Typography>
                    {validationResults.failed_rows > 0 && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            {validationResults.failed_rows} records failed validation and were not uploaded.
                        </Alert>
                    )}
                    <Button variant="contained" onClick={handleReset}>
                        Upload Another File
                    </Button>
                </Paper>
            )}

            {/* Validation Results Modal */}
            <Dialog
                open={showValidationModal}
                onClose={() => setShowValidationModal(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Upload Results</DialogTitle>
                <DialogContent>
                    {validationResults && (
                        <>
                            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                                <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                                    <Card sx={{ textAlign: 'center', p: 2 }}>
                                        <Typography variant="h4" color="primary.main">
                                            {validationResults.total_rows}
                                        </Typography>
                                        <Typography variant="body2">Total Rows</Typography>
                                    </Card>
                                </Box>
                                <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                                    <Card sx={{ textAlign: 'center', p: 2 }}>
                                        <Typography variant="h4" color="success.main">
                                            {validationResults.successful_rows}
                                        </Typography>
                                        <Typography variant="body2">Successful</Typography>
                                    </Card>
                                </Box>
                                <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                                    <Card sx={{ textAlign: 'center', p: 2 }}>
                                        <Typography variant="h4" color="error.main">
                                            {validationResults.failed_rows}
                                        </Typography>
                                        <Typography variant="body2">Failed</Typography>
                                    </Card>
                                </Box>
                            </Box>

                            {validationResults.errors && validationResults.errors.length > 0 && (
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                        Errors Found:
                                    </Typography>
                                    <TableContainer sx={{ maxHeight: 400 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Row</TableCell>
                                                    <TableCell>Employee ID</TableCell>
                                                    <TableCell>Error</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {validationResults.errors.map((error, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{error.row}</TableCell>
                                                        <TableCell>{error.employee_id}</TableCell>
                                                        <TableCell>
                                                            <Chip label={error.error} color="error" size="small" />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowValidationModal(false)}>
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleConfirmUpload}
                        disabled={!validationResults || validationResults.successful_rows === 0}
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BulkUpload;