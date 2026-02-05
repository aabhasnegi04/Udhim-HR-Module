import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Avatar,
    IconButton,
} from '@mui/material';
import {
    Description as DocumentIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    InsertDriveFile as FileIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
    CloudUpload as UploadIcon,
} from '@mui/icons-material';

const DocumentCard = ({ document }) => {
    const getFileIcon = (type) => {
        switch (type.toLowerCase()) {
            case 'pdf':
                return <PdfIcon sx={{ color: '#d32f2f' }} />;
            case 'jpg':
            case 'jpeg':
            case 'png':
                return <ImageIcon sx={{ color: '#1976d2' }} />;
            default:
                return <FileIcon sx={{ color: '#757575' }} />;
        }
    };

    const getFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Card sx={{ height: '100%', '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.3s' }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                        {getFileIcon(document.type)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                fontWeight: 600, 
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {document.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            {getFileSize(document.size)} • Uploaded on {document.uploadDate}
                        </Typography>
                        <Chip 
                            label={document.category} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                        />
                    </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        size="small"
                        fullWidth
                    >
                        View
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        size="small"
                        fullWidth
                    >
                        Download
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

const DocumentsTab = ({ employee }) => {
    if (!employee) return null;

    // Mock documents data
    const documents = [
        {
            id: 1,
            name: 'Resume_John_Smith.pdf',
            type: 'pdf',
            size: 245760,
            category: 'Personal',
            uploadDate: 'Mar 15, 2022'
        },
        {
            id: 2,
            name: 'Aadhar_Card.pdf',
            type: 'pdf',
            size: 156432,
            category: 'Identity',
            uploadDate: 'Mar 15, 2022'
        },
        {
            id: 3,
            name: 'PAN_Card.jpg',
            type: 'jpg',
            size: 89234,
            category: 'Identity',
            uploadDate: 'Mar 15, 2022'
        },
        {
            id: 4,
            name: 'Degree_Certificate.pdf',
            type: 'pdf',
            size: 567890,
            category: 'Education',
            uploadDate: 'Mar 15, 2022'
        },
        {
            id: 5,
            name: 'Experience_Letter.pdf',
            type: 'pdf',
            size: 123456,
            category: 'Experience',
            uploadDate: 'Mar 15, 2022'
        },
        {
            id: 6,
            name: 'Bank_Statement.pdf',
            type: 'pdf',
            size: 345678,
            category: 'Financial',
            uploadDate: 'Mar 20, 2022'
        },
        {
            id: 7,
            name: 'Passport_Copy.pdf',
            type: 'pdf',
            size: 234567,
            category: 'Identity',
            uploadDate: 'Apr 10, 2022'
        },
        {
            id: 8,
            name: 'Medical_Certificate.pdf',
            type: 'pdf',
            size: 178901,
            category: 'Medical',
            uploadDate: 'May 5, 2022'
        }
    ];

    const categories = [...new Set(documents.map(doc => doc.category))];

    return (
        <Box sx={{ mt: 3 }}>
            {/* Upload Section */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            Document Management
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Upload and manage employee documents securely
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<UploadIcon />}
                        sx={{ 
                            bgcolor: 'white', 
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'grey.100' }
                        }}
                    >
                        Upload Document
                    </Button>
                </Box>
            </Paper>

            {/* Documents by Category */}
            {categories.map((category) => {
                const categoryDocs = documents.filter(doc => doc.category === category);
                
                return (
                    <Box key={category} sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                            {category} Documents ({categoryDocs.length})
                        </Typography>
                        
                        <Grid container spacing={3}>
                            {categoryDocs.map((document) => (
                                <Grid item xs={12} sm={6} md={4} key={document.id}>
                                    <DocumentCard document={document} />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                );
            })}

            {/* Empty State */}
            {documents.length === 0 && (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <DocumentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No documents uploaded
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Upload documents to get started
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<UploadIcon />}
                    >
                        Upload First Document
                    </Button>
                </Paper>
            )}
        </Box>
    );
};

export default DocumentsTab;