import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Divider,
    Button, Chip, CircularProgress, Alert,
} from '@mui/material';
import {
    Description as LetterIcon, Download as DownloadIcon,
    Visibility as ViewIcon, CalendarToday as DateIcon,
    Category as CategoryIcon, Badge as RefIcon,
} from '@mui/icons-material';
import documentService from '../../services/documentService';
import { generateLetterPDF } from '../../utils/generateLetterPDF';

const InfoItem = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>{value || '-'}</Typography>
        </Box>
    </Box>
);

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const LettersTab = ({ employee }) => {
    const [letters, setLetters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        if (!employee?.employee_id) return;
        const load = async () => {
            setLoading(true); setError('');
            try {
                const res = await documentService.getAllLetters(employee.employee_id);
                if (res?.success) setLetters(Array.isArray(res.data) ? res.data : []);
                else setError('Failed to load letters');
            } catch { setError('Failed to load letters'); }
            finally { setLoading(false); }
        };
        load();
    }, [employee]);

    const handleView = (letter, download = false) => {
        if (letter.letter_content) {
            generateLetterPDF(letter.letter_content, letter.template_name || 'Letter', download);
        }
    };

    if (!employee) return null;

    return (
        <Box sx={{ mt: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : letters.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <LetterIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>No letters generated yet</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Generate letters from Documents → Generate Letter
                    </Typography>
                </Paper>
            ) : (
                <>
                    {/* Summary */}
                    <Paper sx={{ p: 4, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                            Letters Summary
                        </Typography>
                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <InfoItem icon={<LetterIcon />} label="Total Letters" value={letters.length} />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Letter Cards */}
                    <Paper sx={{ p: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                            All Letters
                        </Typography>
                        <Grid container spacing={3}>
                            {letters.map((letter, i) => (
                                <Grid size={{ xs: 12, md: 6 }} key={letter.letter_id || i}>
                                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main', display: 'flex' }}>
                                                <LetterIcon />
                                            </Box>
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                {letter.template_name || letter.letter_type || 'Letter'}
                                            </Typography>
                                        </Box>

                                        <InfoItem icon={<DateIcon />}     label="Generated On" value={fmt(letter.generated_at || letter.created_at)} />
                                        {letter.template_category && (
                                            <InfoItem icon={<CategoryIcon />} label="Category" value={letter.template_category} />
                                        )}

                                        <Divider sx={{ my: 1.5 }} />

                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="outlined" startIcon={<ViewIcon />} size="small" fullWidth
                                                onClick={() => handleView(letter)}
                                                disabled={!letter.letter_content}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                variant="contained" startIcon={<DownloadIcon />} size="small" fullWidth
                                                onClick={() => handleView(letter, true)}
                                                disabled={!letter.letter_content}
                                            >
                                                Download
                                            </Button>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </>
            )}
        </Box>
    );
};

export default LettersTab;
