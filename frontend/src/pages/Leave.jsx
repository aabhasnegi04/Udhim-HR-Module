import { useState, useContext } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Alert } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';
import { useLocation } from 'react-router-dom';

// Import Leave components
import LeaveDashboard from './Leave/LeaveDashboard';
import ApplyLeave from './Leave/ApplyLeave';
import LeaveList from './Leave/LeaveList';
import LeaveApproval from './Leave/LeaveApproval';
import LeaveCalendar from './Leave/LeaveCalendar';
import LeaveReports from './Leave/LeaveReports';
import LeaveManagement from './Leave/LeaveManagement';

const Leave = () => {
    const { user, isEmployeeActive } = useContext(AuthContext);
    const { currentView } = useProfileSwitching();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(location.search);
        const t = parseInt(params.get('tab'), 10);
        return isNaN(t) ? 0 : t;
    });

    // Define tabs based on current view (not user role)
    const getTabsForRole = () => {
        const employeeActive = isEmployeeActive();
        
        if (currentView === 'EMPLOYEE') {
            // For inactive employees, only show view-only tabs
            if (!employeeActive) {
                return [
                    { label: 'My Leaves', component: <LeaveList /> },
                    { label: 'Calendar', component: <LeaveCalendar /> }
                ];
            }
            
            // For active employees, show all tabs
            return [
                { label: 'Dashboard', component: <LeaveDashboard /> },
                { label: 'Apply Leave', component: <ApplyLeave /> },
                { label: 'My Leaves', component: <LeaveList /> },
                { label: 'Calendar', component: <LeaveCalendar /> }
            ];
        }

        if (currentView === 'MANAGER') {
            return [
                { label: 'Dashboard', component: <LeaveDashboard /> },
                { label: 'Approvals', component: <LeaveApproval /> },
                { label: 'Team Leaves', component: <LeaveList /> },
                { label: 'Calendar', component: <LeaveCalendar /> }
            ];
        }

        if (currentView === 'HR') {
            return [
                { label: 'Balance Management', component: <LeaveManagement /> },
                { label: 'All Leaves', component: <LeaveList /> },
                { label: 'Approvals', component: <LeaveApproval /> },
                { label: 'Calendar', component: <LeaveCalendar /> },
                { label: 'Reports', component: <LeaveReports /> }
            ];
        }

        // Default fallback - show employee view
        return [
            { label: 'Dashboard', component: <LeaveDashboard /> }
        ];
    };

    const tabs = getTabsForRole();

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Inactive Employee Alert */}
            {currentView === 'EMPLOYEE' && !isEmployeeActive() && (
                <Alert 
                    severity="warning" 
                    icon={<WarningIcon />}
                    sx={{ mb: 3 }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Account Inactive - Limited Access
                    </Typography>
                    <Typography variant="body2">
                        Your employee account is inactive. You cannot apply for leave. You can only view your historical leave records.
                    </Typography>
                </Alert>
            )}

            {/* Header */}
            <Box sx={{ mb: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    mb: 1, 
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } 
                }}>
                    Leave Management
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Complete leave application, approval, and tracking system
                </Typography>
            </Box>

            <Paper sx={{ mb: { xs: 2, sm: 3 } }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                            minWidth: { xs: 80, sm: 100, md: 120 },
                            px: { xs: 1.5, sm: 2, md: 3 },
                            py: { xs: 1.5, sm: 2 }
                        }
                    }}
                >
                    {tabs.map((tab, index) => (
                        <Tab key={index} label={tab.label} />
                    ))}
                </Tabs>
            </Paper>

            <Box>
                {tabs[activeTab]?.component}
            </Box>
        </Box>
    );
};

export default Leave;