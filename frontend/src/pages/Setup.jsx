import { useState, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab
} from '@mui/material';
import {
    Policy as PolicyIcon,
    Business as CompanyIcon,
    Event as HolidayIcon,
    BeachAccess as LeaveIcon,
    Storage as MasterDataIcon,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';

// Import Setup components
import CompanyPolicies from './Setup/CompanyPolicies';
import CompanySettings from './Setup/CompanySettings';
import HolidayCalendar from './Admin/HolidayCalendar';
import LeaveTypes from './Setup/LeaveTypes';
import MasterData from './Admin/MasterData';

const Setup = () => {
    const { user } = useContext(AuthContext);
    const { currentView } = useProfileSwitching();
    const [activeTab, setActiveTab] = useState(0);

    const getTabsForRole = () => {
        if (currentView === 'EMPLOYEE' || currentView === 'MANAGER') {
            return [
                { label: 'Company Policies', icon: <PolicyIcon />, component: <CompanyPolicies /> }
            ];
        }

        if (currentView === 'HR') {
            return [
                { label: 'Company Settings',  icon: <CompanyIcon />,     component: <CompanySettings /> },
                { label: 'Master Data',       icon: <MasterDataIcon />,  component: <MasterData /> },
                { label: 'Leave Types',       icon: <LeaveIcon />,       component: <LeaveTypes /> },
                { label: 'Holiday Calendar',  icon: <HolidayIcon />,     component: <HolidayCalendar /> },
                { label: 'Company Policies',  icon: <PolicyIcon />,      component: <CompanyPolicies /> },
            ];
        }

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
            <Box sx={{ mb: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
                    Setup & Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {currentView === 'HR' ? 'Configure company settings, master data, leave types, holidays, and policies' : 'View company policies'}
                </Typography>
            </Box>

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
                        <Tab key={index} label={tab.label} icon={tab.icon} iconPosition="start"
                            sx={{ '& .MuiTab-iconWrapper': { mr: { xs: 0.5, sm: 1 } } }}
                        />
                    ))}
                </Tabs>
            </Paper>

            <Box>{ActiveComponent}</Box>
        </Box>
    );
};

export default Setup;