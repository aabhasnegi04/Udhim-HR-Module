import { useState } from 'react';
import {
    Box,
    Paper,
    Tabs,
    Tab,
    Stack,
} from '@mui/material';
import {
    People as PeopleIcon,
    ManageAccounts as StatusIcon,
} from '@mui/icons-material';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';

// Import employee components
import EmployeeList from './Employees/EmployeeList';
import EmployeeStatusManagement from './Employees/EmployeeStatusManagement';

const Employees = () => {
    const { isHRView } = useProfileSwitching();
    const location = useLocation();
    
    // Check if navigation state has tab
    const navState = location.state || {};
    
    const [activeTab, setActiveTab] = useState(() => {
        // First check navigation state
        if (navState.tab !== undefined) {
            return navState.tab;
        }
        // Then check URL params
        const params = new URLSearchParams(location.search);
        const t = parseInt(params.get('tab'), 10);
        return isNaN(t) ? 0 : t;
    });

    // Different tabs for different views
    const getEmployeeTabs = () => {
        if (isHRView()) {
            // HR view: Employee List + Status Management
            return [
                { label: 'Employee List', icon: <PeopleIcon />, component: EmployeeList },
                { label: 'Status Management', icon: <StatusIcon />, component: EmployeeStatusManagement }
            ];
        } else {
            // Non-HR view: Only Employee List
            return [
                { label: 'Employee List', icon: <PeopleIcon />, component: EmployeeList }
            ];
        }
    };

    const employeeTabs = getEmployeeTabs();

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const ActiveComponent = employeeTabs[activeTab].component;

    return (
        <Box sx={{ p: { xs: 0, sm: 2, md: 3 } }}>
            {/* Navigation Tabs - Only show if HR has multiple tabs */}
            {employeeTabs.length > 1 && (
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
                                minWidth: { xs: 120, sm: 160 }
                            }
                        }}
                    >
                        {employeeTabs.map((tab, index) => (
                            <Tab
                                key={index}
                                label={
                                    <Stack 
                                        direction={{ xs: 'column', sm: 'row' }} 
                                        alignItems="center" 
                                        spacing={{ xs: 0.5, sm: 1 }}
                                    >
                                        {tab.icon}
                                        <span>{tab.label}</span>
                                    </Stack>
                                }
                            />
                        ))}
                    </Tabs>
                </Paper>
            )}

            {/* Active Component */}
            <ErrorBoundary>
                <Box>
                    <ActiveComponent />
                </Box>
            </ErrorBoundary>
        </Box>
    );
};

export default Employees;
