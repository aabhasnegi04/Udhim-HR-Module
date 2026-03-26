import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Stack
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Upload as BulkUploadIcon,
    Assessment as ReportIcon,
} from '@mui/icons-material';

// Import admin components
import AdminDashboard from './Admin/AdminDashboard';
import BulkUploads from './Admin/BulkUploads';
import SystemReports from './Admin/SystemReports';

const Admin = () => {
    const [activeTab, setActiveTab] = useState(0);

    const adminTabs = [
        { label: 'Overview',      icon: <DashboardIcon />,  component: AdminDashboard },
        { label: 'Bulk Uploads',  icon: <BulkUploadIcon />, component: BulkUploads },
        { label: 'System Reports',icon: <ReportIcon />,     component: SystemReports },
    ];

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const ActiveComponent = adminTabs[activeTab].component;

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    mb: 1, 
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } 
                }}>
                    Admin Control Center
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage bulk operations and generate system reports
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
                            minWidth: { xs: 120, sm: 160 }
                        }
                    }}
                >
                    {adminTabs.map((tab, index) => (
                        <Tab
                            key={index}
                            label={
                                <Stack 
                                    direction={{ xs: 'column', sm: 'row' }} 
                                    alignItems="center" 
                                    spacing={{ xs: 0.5, sm: 1 }}
                                >
                                    {tab.icon}
                                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                        {tab.label}
                                    </Typography>
                                </Stack>
                            }
                        />
                    ))}
                </Tabs>
            </Paper>

            {/* Active Component */}
            <Box>
                <ActiveComponent />
            </Box>
        </Box>
    );
};

export default Admin;
