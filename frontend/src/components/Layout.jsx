import { useState } from 'react';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMobileClose = () => {
        setMobileOpen(false);
    };

    const handleSidebarCollapse = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Header 
                onMenuClick={handleDrawerToggle}
                onSidebarCollapse={handleSidebarCollapse}
                sidebarCollapsed={sidebarCollapsed}
            />
            <Sidebar 
                mobileOpen={mobileOpen} 
                onMobileClose={handleMobileClose}
                collapsed={sidebarCollapsed}
            />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    minHeight: '100vh',
                    width: { xs: '100%', md: 'auto' }, // Ensure full width on mobile
                    overflow: 'hidden', // Prevent horizontal scroll on mobile
                }}
            >
                <Toolbar />
                <Box sx={{ 
                    height: 'calc(100vh - 64px)', 
                    overflow: 'auto',
                    p: { xs: 0, sm: 0 } // Remove default padding on mobile
                }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default Layout;
