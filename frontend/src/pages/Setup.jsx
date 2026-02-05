import { useState, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab
} from '@mui/material';
import {
    Description as LetterIcon,
    Policy as PolicyIcon,
    Business as CompanyIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';

// Import Setup components
import LetterTemplates from './Setup/LetterTemplates';
import CompanyPolicies from './Setup/CompanyPolicies';
import CompanySettings from './Setup/CompanySettings';

const Setup = () => {
    const { user } = useContext(AuthContext);
    const { currentView } = useProfileSwitching();
    const [activeTab, setActiveTab] = useState(0);

    // Define tabs based on current view (not user role)
    const getTabsForRole = () => {
        if (currentView === 'EMPLOYEE') {
            return [
                { label: 'Company Policies', icon: <PolicyIcon />, component: <CompanyPolicies /> }
            ];
        }

        if (currentView === 'MANAGER') {
            return [
                { label: 'Company Policies', icon: <PolicyIcon />, component: <CompanyPolicies /> }
            ];
        }

        if (currentView === 'HR') {
            return [
                { label: 'Letter Templates', icon: <LetterIcon />, component: <LetterTemplates /> },
                { label: 'Company Policies', icon: <PolicyIcon />, component: <CompanyPolicies /> },
                { label: 'Company Settings', icon: <CompanyIcon />, component: <CompanySettings /> }
            ];
        }

        // Default fallback - show employee view
        return [
            { label: 'Company Policies', icon: <PolicyIcon />, component: <CompanyPolicies /> }
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
                    System Setup & Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {currentView === 'HR' ? 
                        'Configure company settings, templates, and policies' :
                        'Access company policies and important documents'}
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

export default Setup;