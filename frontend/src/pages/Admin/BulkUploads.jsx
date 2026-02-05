import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    LinearProgress,
    Alert,
    Stack,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    Upload as UploadIcon,
    Download as DownloadIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    People as PeopleIcon,
    Event as EventIcon,
    Description as TemplateIcon,
    CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

const BulkUploads = () => {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Mock upload history
    const uploadHistory = [
        {
            id: 1,
            type: 'Employee Master',
            fileName: 'employees_2024.xlsx',
            uploadDate: '2024-01-15',
            status: 'Success',
            totalRecords: 45,
            successRecords: 45,
            failedRecords: 0,
            uploadedBy: 'Sarah Johnson'
        },
        {
            id: 2,
            type: 'Holiday Calendar',
            fileName: 'holidays_2024.xlsx',
            uploadDate: '2024-01-10',
            status: 'Success',
            totalRecords: 12,
            successRecords: 12,
            failedRecords: 0,
            uploadedBy: 'Sarah Johnson'
        },
        {
            id: 3,
            type: 'Employee Master',
            fileName: 'new_hires_jan.xlsx',
            uploadDate: '2024-01-08',
            status: 'Partial',
            totalRecords: 8,
            successRecords: 6,
            failedRecords: 2,
            uploadedBy: 'Sarah Johnson'
        }
    ];

    const uploadTypes = [
        {
            title: 'Employee Master Upload',
            description: 'Bulk upload employee data with personal and official information',
            icon: <PeopleIcon />,
            templateName: 'employee_master_template.xlsx',
            requiredFields: ['Employee ID', 'First Name', 'Last Name', 'Email', 'Department', 'Designation', 'DOJ']
        },
        {
            title: 'Holiday Calendar Upload',
            description: 'Upload annual holiday calendar for attendance calculations',
            icon: <EventIcon />,
            templateName: 'holiday_calendar_template.xlsx',
            requiredFields: ['Holiday Name', 'Date', 'Type', 'Status']
        },
        {
            title: 'Salary Structure Upload',
            description: 'Bulk upload salary structures and compensation details',
            icon: <TemplateIcon />,
            templateName: 'salary_structure_template.xlsx',
            requiredFields: ['Structure Name', 'Grade', 'Basic Salary', 'Allowances', 'Deductions']
        }
    ];

    const handleFileUpload = (event, type) => {
        const file = event.target.files[0];
        if (file) {
            setIsUploading(true);
            setUploadProgress(0);
            
            // Simulate upload progress
            const interval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setIsUploading(false);
                        return 100;
                    }
                    return prev + 10;
                });
            }, 200);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Success':
                return 'success';
            case 'Partial':
                return 'warning';
            case 'Failed':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Success':
                return <CheckCircleIcon />;
            case 'Partial':
                return <WarningIcon />;
            case 'Failed':
                return <ErrorIcon />;
            default:
                return null;
        }
    };

    return (
        <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
                Bulk uploads are the primary entry point for system data. Use templates to ensure data consistency.
            </Alert>

            {/* Upload Progress */}
            {isUploading && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Upload in Progress...
                    </Typography>
                    <LinearProgress 
                        variant="determinate" 
                        value={uploadProgress} 
                        sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                        {uploadProgress}% completed
                    </Typography>
                </Paper>
            )}

            {/* Upload Types */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Available Upload Types
            </Typography>
            
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                mb: 4 
            }}>
                {uploadTypes.map((type, index) => (
                    <Card key={index} sx={{ flex: 1 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ 
                                    p: 1, 
                                    borderRadius: 1, 
                                    bgcolor: 'primary.light',
                                    color: 'primary.main',
                                    mr: 2 
                                }}>
                                    {type.icon}
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {type.title}
                                </Typography>
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {type.description}
                            </Typography>

                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Required Fields:
                            </Typography>
                            <List dense sx={{ mb: 2 }}>
                                {type.requiredFields.slice(0, 3).map((field, idx) => (
                                    <ListItem key={idx} sx={{ py: 0, px: 0 }}>
                                        <ListItemText 
                                            primary={field}
                                            primaryTypographyProps={{ variant: 'caption' }}
                                        />
                                    </ListItem>
                                ))}
                                {type.requiredFields.length > 3 && (
                                    <ListItem sx={{ py: 0, px: 0 }}>
                                        <ListItemText 
                                            primary={`+${type.requiredFields.length - 3} more fields`}
                                            primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                        />
                                    </ListItem>
                                )}
                            </List>

                            <Stack spacing={1}>
                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    size="small"
                                    fullWidth
                                >
                                    Download Template
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<CloudUploadIcon />}
                                    component="label"
                                    size="small"
                                    fullWidth
                                    disabled={isUploading}
                                >
                                    Upload File
                                    <input
                                        type="file"
                                        hidden
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => handleFileUpload(e, type.title)}
                                    />
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Upload History */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Upload History
            </Typography>

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Upload Type</TableCell>
                                <TableCell>File Name</TableCell>
                                <TableCell>Upload Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Records</TableCell>
                                <TableCell>Success Rate</TableCell>
                                <TableCell>Uploaded By</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {uploadHistory.map((upload) => (
                                <TableRow key={upload.id}>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {upload.type}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{upload.fileName}</TableCell>
                                    <TableCell>
                                        {new Date(upload.uploadDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={upload.status}
                                            color={getStatusColor(upload.status)}
                                            size="small"
                                            icon={getStatusIcon(upload.status)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {upload.totalRecords} total
                                        </Typography>
                                        {upload.failedRecords > 0 && (
                                            <Typography variant="caption" color="error">
                                                {upload.failedRecords} failed
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {Math.round((upload.successRecords / upload.totalRecords) * 100)}%
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{upload.uploadedBy}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default BulkUploads;