import { useState, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab
} from '@mui/material';
import {
    ExitToApp as ExitIcon,
    Timeline as TimelineIcon,
    QuestionAnswer as InterviewIcon,
    AccountBalance as SettlementIcon,
    Visibility as StatusIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';

// Import Offboarding components
import ExitInitiation from './Offboarding/ExitInitiation';
import ClearanceTracking from './Offboarding/ClearanceTracking';
import ExitInterview from './Offboarding/ExitInterview';
import FinalSettlement from './Offboarding/FinalSettlement';
import ExitStatus from './Offboarding/ExitStatus';

const Offboarding = () => {
    const { user } = useContext(AuthContext);
    const { currentView } = useProfileSwitching();
    const [activeTab, setActiveTab] = useState(0);

    // Define tabs based on current view (not user role)
    const getTabsForRole = () => {
        if (currentView === 'EMPLOYEE') {
            return [
                { label: 'Exit Status', icon: <StatusIcon />, component: <ExitStatus /> }
            ];
        }

        if (currentView === 'MANAGER') {
            return [
                { label: 'Clearance Tracking', icon: <TimelineIcon />, component: <ClearanceTracking /> }
            ];
        }

        if (currentView === 'HR') {
            return [
                { label: 'Exit Initiation', icon: <ExitIcon />, component: <ExitInitiation /> },
                { label: 'Clearance Tracking', icon: <TimelineIcon />, component: <ClearanceTracking /> },
                { label: 'Exit Interview', icon: <InterviewIcon />, component: <ExitInterview /> },
                { label: 'Final Settlement', icon: <SettlementIcon />, component: <FinalSettlement /> }
            ];
        }

        // Default fallback - show employee view
        return [
            { label: 'Exit Status', icon: <StatusIcon />, component: <ExitStatus /> }
        ];
    };

    const tabs = getTabsForRole();

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const ActiveComponent = tabs[activeTab]?.component;

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    mb: 1, 
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } 
                }}>
                    Employee Offboarding
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {currentView === 'HR' ? 
                        'Manage complete employee exit processes and documentation' :
                        currentView === 'MANAGER' ?
                        'Track and approve team member clearances' :
                        'Track your exit process and complete required steps'}
                </Typography>
            </Box>

            {/* Navigation Tabs */}
            <Paper sx={{ mb: { xs: 2, sm: 3 } }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
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
                            px: { xs: 1, sm: 2 }
                        }
                    }}
                >
                    {tabs.map((tab, index) => (
                        <Tab
                            key={index}
                            label={tab.label}
                            icon={tab.icon}
                            iconPosition="start"
                            sx={{
                                '& .MuiTab-iconWrapper': {
                                    mr: { xs: 0.5, sm: 1 }
                                }
                            }}
                        />
                    ))}
                </Tabs>
            </Paper>

            {/* Active Component */}
            <Box>
                {ActiveComponent}
            </Box>
        </Box>
    );
};

export default Offboarding;