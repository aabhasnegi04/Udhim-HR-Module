import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Tabs, Tab, Stepper, Step,
    StepLabel, Chip, LinearProgress
} from '@mui/material';
import {
    ExitToApp as ExitIcon,
    Timeline as TimelineIcon,
    QuestionAnswer as InterviewIcon,
    AccountBalance as SettlementIcon,
    Visibility as StatusIcon,
    CheckCircle as CheckIcon,
    RadioButtonUnchecked as EmptyIcon
} from '@mui/icons-material';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';
import offboardingService from '../services/offboardingService';

import ExitInitiation from './Offboarding/ExitInitiation';
import ClearanceTracking from './Offboarding/ClearanceTracking';
import ExitInterview from './Offboarding/ExitInterview';
import FinalSettlement from './Offboarding/FinalSettlement';
import ExitStatus from './Offboarding/ExitStatus';

const FLOW_STEPS = [
    { key: 'INITIATED',  label: 'Initiated' },
    { key: 'CLEARANCE',  label: 'Clearance' },
    { key: 'INTERVIEW',  label: 'Interview' },
    { key: 'SETTLEMENT', label: 'Settlement' },
    { key: 'COMPLETED',  label: 'Completed' },
];
const STATUS_ORDER = ['INITIATED', 'CLEARANCE', 'INTERVIEW', 'SETTLEMENT', 'COMPLETED'];
const TAB_MIN_STATUS = ['INITIATED', 'CLEARANCE', 'INTERVIEW', 'SETTLEMENT'];

const Offboarding = () => {
    const { currentView } = useProfileSwitching();
    const [activeTab, setActiveTab] = useState(0);
    const [latestExit, setLatestExit] = useState(null);

    const loadLatestExit = () => {
        if (currentView !== 'HR') return;
        offboardingService.getAllExits().then(res => {
            if (res.success && res.data?.length) {
                const active = res.data.find(e => e.status !== 'COMPLETED') || res.data[0];
                setLatestExit(active);
            } else {
                setLatestExit(null);
            }
        }).catch(() => {});
    };

    useEffect(() => { loadLatestExit(); }, [currentView]);

    const currentStatusIndex = latestExit ? STATUS_ORDER.indexOf(latestExit.status) : -1;

    const isTabLocked = (tabIndex) => {
        if (tabIndex === 0) return false;
        if (!latestExit) return true;
        const minIndex = STATUS_ORDER.indexOf(TAB_MIN_STATUS[tabIndex]);
        return currentStatusIndex < minIndex;
    };

    if (currentView === 'EMPLOYEE') {
        return (
            <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} mb={0.5}>Employee Offboarding</Typography>
                    <Typography variant="body2" color="text.secondary">Track your exit process and complete required steps</Typography>
                </Box>
                <ExitStatus />
            </Box>
        );
    }

    if (currentView === 'MANAGER') {
        return (
            <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} mb={0.5}>Employee Offboarding</Typography>
                    <Typography variant="body2" color="text.secondary">Track and approve team member clearances</Typography>
                </Box>
                <ClearanceTracking />
            </Box>
        );
    }

    const hrTabs = [
        { label: 'Exit Initiation',    icon: <ExitIcon />,       component: <ExitInitiation onExitChange={loadLatestExit} /> },
        { label: 'Clearance Tracking', icon: <TimelineIcon />,   component: <ClearanceTracking onClearanceChange={loadLatestExit} /> },
        { label: 'Exit Interview',     icon: <InterviewIcon />,  component: <ExitInterview onInterviewSaved={loadLatestExit} /> },
        { label: 'Final Settlement',   icon: <SettlementIcon />, component: <FinalSettlement onSettlementChange={loadLatestExit} /> },
    ];

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700} mb={0.5}>Employee Offboarding</Typography>
                <Typography variant="body2" color="text.secondary">Manage complete employee exit processes and documentation</Typography>
            </Box>

            {/* Progress Stepper */}
            {latestExit && (
                <Paper sx={{ p: 2.5, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                            Active Exit: {latestExit.employee_name}
                        </Typography>
                        <Chip
                            label={latestExit.status}
                            size="small"
                            color={latestExit.status === 'COMPLETED' ? 'success' : 'warning'}
                        />
                    </Box>
                    <Stepper activeStep={currentStatusIndex} alternativeLabel>
                        {FLOW_STEPS.map((step, i) => (
                            <Step key={step.key} completed={i < currentStatusIndex}>
                                <StepLabel
                                    StepIconComponent={
                                        i < currentStatusIndex
                                            ? () => <CheckIcon color="success" sx={{ fontSize: 22 }} />
                                            : i === currentStatusIndex
                                                ? undefined
                                                : () => <EmptyIcon sx={{ fontSize: 22, color: 'text.disabled' }} />
                                    }
                                >
                                    <Typography variant="caption">{step.label}</Typography>
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    <LinearProgress
                        variant="determinate"
                        value={currentStatusIndex >= 0 ? Math.round((currentStatusIndex / (STATUS_ORDER.length - 1)) * 100) : 0}
                        sx={{ mt: 2, height: 5, borderRadius: 3 }}
                    />
                </Paper>
            )}

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => { if (!isTabLocked(v)) setActiveTab(v); }}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            minHeight: { xs: 56, sm: 64 },
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            minWidth: { xs: 120, sm: 160 },
                        }
                    }}
                >
                    {hrTabs.map((tab, index) => (
                        <Tab
                            key={index}
                            label={tab.label}
                            icon={tab.icon}
                            iconPosition="start"
                            disabled={isTabLocked(index)}
                            sx={{ opacity: isTabLocked(index) ? 0.45 : 1 }}
                        />
                    ))}
                </Tabs>
            </Paper>

            <Box>{hrTabs[activeTab]?.component}</Box>
        </Box>
    );
};

export default Offboarding;
