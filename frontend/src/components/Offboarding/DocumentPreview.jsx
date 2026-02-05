import {
    Box,
    Typography,
    Paper,
    Button,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    Description as DocumentIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
    CheckCircle as CheckIcon,
    Pending as PendingIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';

const DocumentPreview = ({ document, onDownload, onView }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'Completed': return <CheckIcon color="success" />;
            case 'Submitted': return <CheckIcon color="info" />;
            case 'Rejected': return <CancelIcon color="error" />;
            case 'Pending': return <PendingIcon color="warning" />;
            default: return <PendingIcon color="warning" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'Submitted': return 'info';
            case 'Rejected': return 'error';
            case 'Pending': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Paper sx={{ p: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DocumentIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {document.name}
                        </Typography>
                        {document.description && (
                            <Typography variant="body2" color="text.secondary">
                                {document.description}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <Chip
                    label={document.status}
                    color={getStatusColor(document.status)}
                    icon={getStatusIcon(document.status)}
                />
            </Box>

            {document.date && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {document.status} on {new Date(document.date).toLocaleDateString('en-IN')}
                </Typography>
            )}

            {document.details && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Document Details:
                    </Typography>
                    <List dense>
                        {document.details.map((detail, index) => (
                            <ListItem key={index} sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={detail}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                {(document.status === 'Completed' || document.status === 'Submitted') && (
                    <>
                        <Button
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => onView && onView(document)}
                        >
                            View
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={() => onDownload && onDownload(document)}
                        >
                            Download
                        </Button>
                    </>
                )}
                {document.status === 'Pending' && (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                        Document will be available once processed
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

export default DocumentPreview;