import { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, CircularProgress, Alert, Divider
} from '@mui/material';
import { Download as DownloadIcon, Visibility as ViewIcon, Description as DocIcon } from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { useProfileSwitching } from '../../context/ProfileSwitchingContext';
import documentService from '../../services/documentService';
import { generateLetterPDF } from '../../utils/generateLetterPDF';

const categoryColors = { Onboarding: 'primary', Offboarding: 'warning', Payroll: 'success', General: 'info', Legal: 'error' };

const MyLetters = () => {
    const { user } = useContext(AuthContext);
    const { currentView } = useProfileSwitching();
    // Only use HR endpoint when actually in HR view — not when HR user is in EMPLOYEE view
    const isHR = user?.role === 'HR' && currentView === 'HR';
    const [letters, setLetters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewLetter, setViewLetter] = useState(null);
    const [downloading, setDownloading] = useState(null);

    const companyName = (() => {
        try { return JSON.parse(sessionStorage.getItem('hrms_user') || '{}').company_name || ''; } catch { return ''; }
    })();

    useEffect(() => { loadLetters(); }, []);

    const loadLetters = async () => {
        setLoading(true);
        const res = isHR
            ? await documentService.getAllLetters()
            : await documentService.getMyLetters();
        if (res?.success) setLetters(Array.isArray(res.data) ? res.data : []);
        else setError('Failed to load documents');
        setLoading(false);
    };

    const handleDownload = async (letter) => {
        setDownloading(letter.letter_id);
        await generateLetterPDF(
            letter.generated_content,
            `${letter.template_name}_${letter.employee_name || user?.name || ''}.pdf`,
            companyName
        );
        setDownloading(null);
    };

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}><CircularProgress /></Box>
            ) : letters.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <DocIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography color="text.secondary">No documents found</Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                {isHR && <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>}
                                <TableCell sx={{ fontWeight: 600 }}>Letter Type</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Generated On</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {letters.map(letter => (
                                <TableRow key={letter.letter_id} hover>
                                    {isHR && (
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{letter.employee_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{letter.employee_code}</Typography>
                                        </TableCell>
                                    )}
                                    <TableCell>{letter.template_name}</TableCell>
                                    <TableCell>
                                        <Chip label={letter.template_category || letter.letter_type} color={categoryColors[letter.template_category] || 'default'} size="small" />
                                    </TableCell>
                                    <TableCell>
                                        {letter.generated_at ? new Date(letter.generated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => setViewLetter(letter)} title="View"><ViewIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" onClick={() => handleDownload(letter)} disabled={downloading === letter.letter_id} title="Download PDF">
                                            {downloading === letter.letter_id ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={!!viewLetter} onClose={() => setViewLetter(null)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DocIcon color="primary" />
                        {viewLetter?.template_name}
                        {viewLetter?.template_category && (
                            <Chip label={viewLetter.template_category} color={categoryColors[viewLetter.template_category] || 'default'} size="small" />
                        )}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                        Generated on {viewLetter?.generated_at ? new Date(viewLetter.generated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 1, whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', fontSize: '0.9rem', lineHeight: 1.9, minHeight: 300 }}>
                        {viewLetter?.generated_content}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewLetter(null)}>Close</Button>
                    <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => { handleDownload(viewLetter); setViewLetter(null); }}>
                        Download PDF
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MyLetters;
