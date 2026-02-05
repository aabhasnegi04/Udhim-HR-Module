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
    Divider,
} from '@mui/material';
import {
    Description as LetterIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
    CheckCircle as CheckIcon,
    Schedule as PendingIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';

const LetterCard = ({ letter }) => {
    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'issued':
                return <CheckIcon sx={{ color: 'success.main' }} />;
            case 'pending':
                return <PendingIcon sx={{ color: 'warning.main' }} />;
            case 'cancelled':
                return <CancelIcon sx={{ color: 'error.main' }} />;
            default:
                return <LetterIcon sx={{ color: 'primary.main' }} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'issued':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'error';
            default:
                return 'primary';
        }
    };

    return (
        <Card sx={{ height: '100%', '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.3s' }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                        <LetterIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {letter.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {letter.description}
                        </Typography>
                        <Chip 
                            label={letter.status} 
                            color={getStatusColor(letter.status)}
                            size="small"
                            icon={getStatusIcon(letter.status)}
                            sx={{ fontWeight: 500 }}
                        />
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Issue Date: {letter.issueDate}
                    </Typography>
                    {letter.validUntil && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Valid Until: {letter.validUntil}
                        </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Reference: {letter.reference}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        size="small"
                        fullWidth
                        disabled={letter.status.toLowerCase() !== 'issued'}
                    >
                        View
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        size="small"
                        fullWidth
                        disabled={letter.status.toLowerCase() !== 'issued'}
                    >
                        Download
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

const LettersTab = ({ employee }) => {
    if (!employee) return null;

    // Mock letters data
    const letters = [
        {
            id: 1,
            title: 'Offer Letter',
            description: 'Official job offer letter with terms and conditions of employment',
            status: 'Issued',
            issueDate: 'March 10, 2022',
            validUntil: null,
            reference: 'OL-2022-001'
        },
        {
            id: 2,
            title: 'Appointment Letter',
            description: 'Formal appointment confirmation letter',
            status: 'Issued',
            issueDate: 'March 15, 2022',
            validUntil: null,
            reference: 'AL-2022-001'
        },
        {
            id: 3,
            title: 'Salary Certificate',
            description: 'Certificate stating current salary and employment details',
            status: 'Issued',
            issueDate: 'December 1, 2025',
            validUntil: 'December 1, 2026',
            reference: 'SC-2025-045'
        },
        {
            id: 4,
            title: 'Experience Letter',
            description: 'Letter certifying work experience and performance',
            status: 'Pending',
            issueDate: 'Pending approval',
            validUntil: null,
            reference: 'EL-2025-012'
        },
        {
            id: 5,
            title: 'No Objection Certificate',
            description: 'NOC for higher education or other purposes',
            status: 'Issued',
            issueDate: 'November 15, 2025',
            validUntil: 'November 15, 2026',
            reference: 'NOC-2025-089'
        },
        {
            id: 6,
            title: 'Relieving Letter',
            description: 'Letter to be issued upon resignation acceptance',
            status: 'Pending',
            issueDate: 'Not applicable',
            validUntil: null,
            reference: 'RL-PENDING'
        }
    ];

    const issuedLetters = letters.filter(letter => letter.status.toLowerCase() === 'issued');
    const pendingLetters = letters.filter(letter => letter.status.toLowerCase() === 'pending');

    return (
        <Box sx={{ mt: 3 }}>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                            {issuedLetters.length}
                        </Typography>
                        <Typography variant="body2">
                            Issued Letters
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                            {pendingLetters.length}
                        </Typography>
                        <Typography variant="body2">
                            Pending Letters
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                            {letters.length}
                        </Typography>
                        <Typography variant="body2">
                            Total Letters
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Issued Letters */}
            {issuedLetters.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'success.main' }}>
                        Issued Letters ({issuedLetters.length})
                    </Typography>
                    <Grid container spacing={3}>
                        {issuedLetters.map((letter) => (
                            <Grid item xs={12} sm={6} md={4} key={letter.id}>
                                <LetterCard letter={letter} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Pending Letters */}
            {pendingLetters.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'warning.main' }}>
                        Pending Letters ({pendingLetters.length})
                    </Typography>
                    <Grid container spacing={3}>
                        {pendingLetters.map((letter) => (
                            <Grid item xs={12} sm={6} md={4} key={letter.id}>
                                <LetterCard letter={letter} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Empty State */}
            {letters.length === 0 && (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <LetterIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No letters available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Letters will appear here once they are generated
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default LettersTab;