import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Grid, Divider,
    Button, Chip, CircularProgress, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, IconButton, Tooltip,
} from '@mui/material';
import {
    PictureAsPdf as PdfIcon, Image as ImageIcon, InsertDriveFile as FileIcon,
    Download as DownloadIcon, Visibility as ViewIcon, Delete as DeleteIcon,
    CloudUpload as UploadIcon, Description as DocIcon,
    CalendarToday as DateIcon, Person as PersonIcon, FolderOpen as FolderIcon,
} from '@mui/icons-material';
import documentService from '../../services/documentService';

// ── helpers ──────────────────────────────────────────────────
const fileIcon = (type) => {
    if (!type) return <FileIcon />;
    if (type === 'pdf') return <PdfIcon sx={{ color: '#d32f2f' }} />;
    if (['jpg', 'jpeg', 'png'].includes(type)) return <ImageIcon sx={{ color: '#1976d2' }} />;
    return <FileIcon sx={{ color: '#757575' }} />;
};

const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

// ── InfoItem — matches PersonalInfo/OfficialInfo pattern ─────
const InfoItem = ({ icon, label, value, chip, chipColor }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {label}
            </Typography>
            {chip ? (
                <Box sx={{ mt: 0.5 }}><Chip label={value} color={chipColor || 'primary'} size="small" variant="outlined" sx={{ fontWeight: 500 }} /></Box>
            ) : (
                <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>{value || '-'}</Typography>
            )}
        </Box>
    </Box>
);

// ── Upload Dialog ─────────────────────────────────────────────
const UploadDialog = ({ open, onClose, onUploaded, employeeId }) => {
    const [file, setFile]         = useState(null);
    const [docType, setDocType]   = useState('');
    const [docName, setDocName]   = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError]       = useState('');

    const reset = () => { setFile(null); setDocType(''); setDocName(''); setError(''); };
    const handleClose = () => { reset(); onClose(); };

    const handleTypeChange = (e) => {
        setDocType(e.target.value);
        if (!docName) setDocName(e.target.value);
    };

    const handleSubmit = async () => {
        if (!file || !docType) { setError('Please select a file and document type'); return; }
        setUploading(true); setError('');
        try {
            const res = await documentService.uploadEmployeeDocument(employeeId, file, docType, docName || docType);
            if (res?.success) { onUploaded(); handleClose(); }
            else setError(res?.message || 'Upload failed');
        } catch { setError('Upload failed'); }
        finally { setUploading(false); }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField select label="Document Type" value={docType} onChange={handleTypeChange} fullWidth required>
                    {documentService.DOCUMENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                <TextField
                    label="Document Name (optional)" value={docName}
                    onChange={e => setDocName(e.target.value)} fullWidth
                    placeholder="e.g. Aadhar Card - Front & Back"
                />
                <Button variant="outlined" component="label" startIcon={<UploadIcon />} sx={{ justifyContent: 'flex-start', py: 1.5 }}>
                    {file ? file.name : 'Choose File (PDF, JPG, PNG, DOC, DOCX — max 10MB)'}
                    <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={e => setFile(e.target.files[0] || null)} />
                </Button>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={uploading}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={uploading || !file || !docType}
                    startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}>
                    {uploading ? 'Uploading...' : 'Upload'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ── Main Component ────────────────────────────────────────────
const EmployeeDocuments = ({ employeeId, employeeName = '' }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');
    const [uploadOpen, setUploadOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting]   = useState(false);

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await documentService.getEmployeeDocuments(employeeId);
            if (res?.success) setDocuments(Array.isArray(res.data?.documents) ? res.data.documents : []);
            else setError('Failed to load documents');
        } catch { setError('Failed to load documents'); }
        finally { setLoading(false); }
    }, [employeeId]);

    useEffect(() => { load(); }, [load]);

    const handleView = async (doc) => {
        const res = await documentService.serveEmployeeDocument(doc.document_id);
        if (res.success) {
            const url = URL.createObjectURL(res.blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await documentService.deleteEmployeeDocument(deleteTarget.document_id);
            if (res?.success) { setDeleteTarget(null); load(); }
            else setError(res?.message || 'Delete failed');
        } catch { setError('Delete failed'); }
        finally { setDeleting(false); }
    };

    // Group by document_type
    const grouped = documents.reduce((acc, doc) => {
        const key = doc.document_type || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(doc);
        return acc;
    }, {});

    return (
        <Box sx={{ mt: 3 }}>
            {/* Header */}
            <Paper sx={{ p: 4, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {employeeName ? `${employeeName}'s Documents` : 'Employee Documents'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
                        </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setUploadOpen(true)}>
                        Upload Document
                    </Button>
                </Box>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : documents.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <DocIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>No documents uploaded yet</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Upload KYC and identity documents for this employee
                    </Typography>
                    <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setUploadOpen(true)}>
                        Upload First Document
                    </Button>
                </Paper>
            ) : (
                Object.entries(grouped).map(([type, docs]) => (
                    <Paper key={type} sx={{ p: 4, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                            {type} ({docs.length})
                        </Typography>
                        <Grid container spacing={3}>
                            {docs.map(doc => (
                                <Grid size={{ xs: 12, md: 6 }} key={doc.document_id}>
                                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                                        {/* Doc header */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main', display: 'flex' }}>
                                                {fileIcon(doc.file_type)}
                                            </Box>
                                            <Typography variant="subtitle2" fontWeight={600} noWrap title={doc.document_name}>
                                                {doc.document_name}
                                            </Typography>
                                        </Box>

                                        <InfoItem icon={<FolderIcon />} label="Type"        value={doc.document_type} chip chipColor="primary" />
                                        <InfoItem icon={<DateIcon />}   label="Uploaded On" value={fmt(doc.uploaded_at)} />
                                        {doc.file_size && (
                                            <InfoItem icon={<DocIcon />} label="File Size" value={formatSize(doc.file_size)} />
                                        )}
                                        {doc.uploaded_by_name && (
                                            <InfoItem icon={<PersonIcon />} label="Uploaded By" value={doc.uploaded_by_name} />
                                        )}

                                        <Divider sx={{ my: 1.5 }} />

                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button variant="outlined" startIcon={<ViewIcon />} size="small" fullWidth onClick={() => handleView(doc)}>
                                                View
                                            </Button>
                                            <Tooltip title="Delete document">
                                                <IconButton size="small" color="error" onClick={() => setDeleteTarget(doc)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                ))
            )}

            {/* Upload Dialog */}
            <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={load} employeeId={employeeId} />

            {/* Delete Confirm */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
                <DialogTitle>Delete Document</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{deleteTarget?.document_name}"? This cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}>
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmployeeDocuments;
