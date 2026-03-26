import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Stepper, Step, StepLabel,
    Chip, LinearProgress, Alert, CircularProgress, Grid
} from '@mui/material';
import { CheckCircle as CheckIcon, ExitToApp as ExitIcon } from '@mui/icons-material';
import offboardingService from '../../services/offboardingService';

const STEPS = [
    { key: 'INITIATED', label: 'Exit Initiated', desc: 'Exit process has been started' },
    { key: 'CLEARANCE', label: 'Department Clearance', desc: 'Clearance from IT, HR, Admin, Finance' },
    { key: 'INTERVIEW', label: 'Exit Interview', desc: 'Exit interview with HR' },
    { key: 'SETTLEMENT', label: 'Final Settlement', desc: 'Salary and dues calculation' },
    { key: 'COMPLETED', label: 'Completed', desc: 'Offboarding process complete' }
];

const STATUS_ORDER = ['INITIATED', 'CLEARANCE', 'INTERVIEW', 'SETTLEMENT', 'COMPLETED'];

const ExitStatus = () => {
    const [exitData, setExitData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await offboardingService.getMyExit();
                if (res.success && res.data) setExitData(res.data);
            } catch { setError('Failed to load exit status'); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const activeStep = exitData ? STATUS_ORDER.indexOf(exitData.status) : 0;
    const progress = exitData ? Math.round((activeStep / (STATUS_ORDER.length - 1)) * 100) : 0;

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

    if (!exitData) {
        return (
            <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
                <Alert severity="info">
                    No active exit process found. If you have submitted a resignation, please contact HR.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>My Exit Status</Typography>
                <Typography variant="body2" color="text.secondary">Track your offboarding progress</Typography>
            </Box>

            {/* Overview Card */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ExitIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                    <Box>
                        <Typography variant="h6" fontWeight={600}>Exit Process — {exitData.exit_type}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Initiated on {exitData.initiated_on ? new Date(exitData.initiated_on).toLocaleDateString('en-IN') : '-'}
                        </Typography>
                    </Box>
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                    Your last working day is scheduled for <strong>{exitData.last_working_day ? new Date(exitData.last_working_day).toLocaleDateString('en-IN') : '-'}</strong>
                </Alert>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Overall Progress</Typography>
                    <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">{progress}% Complete</Typography>
                </Box>

                <Chip label={exitData.status} color={exitData.status === 'COMPLETED' ? 'success' : 'warning'} />
            </Paper>

            {/* Progress Stepper */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Offboarding Steps</Typography>
                <Stepper activeStep={activeStep} orientation="vertical">
                    {STEPS.map((step, index) => (
                        <Step key={step.key} completed={index < activeStep}>
                            <StepLabel
                                icon={index < activeStep ? <CheckIcon color="success" /> : undefined}
                            >
                                <Typography variant="subtitle2" fontWeight={600}>{step.label}</Typography>
                                <Typography variant="body2" color="text.secondary">{step.desc}</Typography>
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Paper>
        </Box>
    );
};

export default ExitStatus;
