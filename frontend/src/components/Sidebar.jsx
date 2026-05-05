import { useState } from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Box,
    IconButton,
    Typography,
    useMediaQuery,
    useTheme,
    Divider,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    EventAvailable as AttendanceIcon,
    BeachAccess as LeaveIcon,
    AccountBalance as PayrollIcon,
    Factory as FactoryIcon,
    ExitToApp as ExitToAppIcon,
    AdminPanelSettings as AdminIcon,
    Settings as SetupIcon,
    AccountTree as OrgChartIcon,
    ChevronLeft as ChevronLeftIcon,
    Close as CloseIcon,
    Description as DocumentsIcon,
    Policy as PolicyIcon,
    Assessment as ReportsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';

const drawerWidth = 240;
const mobileDrawerWidth = 280;
const collapsedWidth = 64;

// Define menu items for different views
const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { id: 'employees', label: 'Employees', icon: <PeopleIcon />, path: '/employees' },
    { id: 'org-chart', label: 'Org Chart', icon: <OrgChartIcon />, path: '/org-chart' },
    { id: 'attendance', label: 'Attendance', icon: <AttendanceIcon />, path: '/attendance' },
    { id: 'leave', label: 'Leave', icon: <LeaveIcon />, path: '/leave' },
    { id: 'payroll', label: 'Payroll', icon: <PayrollIcon />, path: '/payroll' },
    { id: 'offboarding', label: 'Offboarding', icon: <ExitToAppIcon />, path: '/offboarding' },
    { id: 'setup', label: 'Setup', icon: <SetupIcon />, path: '/setup' },
    { id: 'admin', label: 'Admin', icon: <AdminIcon />, path: '/admin' },
];

// Menu items for different views
const employeeMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { id: 'attendance', label: 'My Attendance', icon: <AttendanceIcon />, path: '/attendance' },
    { id: 'leave', label: 'My Leaves', icon: <LeaveIcon />, path: '/leave' },
    { id: 'payroll', label: 'My Payroll', icon: <PayrollIcon />, path: '/payroll' },
    { id: 'documents', label: 'Documents', icon: <DocumentsIcon />, path: '/documents' },
    { id: 'policies', label: 'Company Policies', icon: <PolicyIcon />, path: '/policies' },
];

const hrMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { id: 'employees', label: 'Employees', icon: <PeopleIcon />, path: '/employees' },
    { id: 'org-chart', label: 'Org Chart', icon: <OrgChartIcon />, path: '/org-chart' },
    { id: 'attendance', label: 'Attendance', icon: <AttendanceIcon />, path: '/attendance' },
    { id: 'leave', label: 'Leave', icon: <LeaveIcon />, path: '/leave' },
    { id: 'payroll', label: 'Payroll', icon: <PayrollIcon />, path: '/payroll' },
    { id: 'offboarding', label: 'Offboarding', icon: <ExitToAppIcon />, path: '/offboarding' },
    { id: 'documents', label: 'Documents', icon: <DocumentsIcon />, path: '/documents' },
    { id: 'setup', label: 'Setup', icon: <SetupIcon />, path: '/setup' },
    { id: 'admin', label: 'Admin', icon: <AdminIcon />, path: '/admin' },
    { id: 'reports', label: 'Reports', icon: <ReportsIcon />, path: '/reports' },
];

const managerMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { id: 'employees', label: 'Team Members', icon: <PeopleIcon />, path: '/employees' },
    { id: 'org-chart', label: 'Org Chart', icon: <OrgChartIcon />, path: '/org-chart' },
    { id: 'attendance', label: 'Team Attendance', icon: <AttendanceIcon />, path: '/attendance' },
    { id: 'leave', label: 'Leave Approvals', icon: <LeaveIcon />, path: '/leave' },
    { id: 'documents', label: 'Documents', icon: <DocumentsIcon />, path: '/documents' },
];

const Sidebar = ({ mobileOpen, onMobileClose, collapsed = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { getMenuItems, user } = useAuth();
    const { currentView, isHRView, isManagerView, isEmployeeView } = useProfileSwitching();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Get menu items based on current view
    const getMenuItemsForCurrentView = () => {
        if (isHRView()) {
            return hrMenuItems;
        } else if (isManagerView()) {
            return managerMenuItems;
        } else {
            // Employee view - always show employee menu regardless of user's actual role
            return employeeMenuItems;
        }
    };

    // For profile switching, we use the view-specific menu items directly
    // The user's role permissions are already handled by the backend role guard
    const filteredMenuItems = getMenuItemsForCurrentView();

    const handleNavigate = (path) => {
        navigate(path);
        if (isMobile) {
            onMobileClose();
        }
    };

    const mobileDrawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Mobile Header */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                p: 2,
                borderBottom: 1,
                borderColor: 'divider'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <img
                        src={import.meta.env.VITE_COMPANY_LOGO || "https://www.udhim.com/logo.png"}
                        alt={import.meta.env.VITE_COMPANY_NAME || 'HRMS'}
                        style={{
                            height: '40px',
                            width: 'auto',
                            objectFit: 'contain',
                        }}
                    />
                </Box>
                <IconButton onClick={onMobileClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* User Info */}
            <Box sx={{ p: 2, bgcolor: 'primary.50' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {user?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {currentView === 'HR' ? 'HR View' : currentView === 'MANAGER' ? 'Manager View' : 'Employee View'}
                </Typography>
            </Box>

            <Divider />

            {/* Navigation Menu */}
            <List sx={{ px: 2, py: 1, flex: 1 }}>
                {filteredMenuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                onClick={() => handleNavigate(item.path)}
                                sx={{
                                    borderRadius: 2,
                                    minHeight: 48,
                                    px: 2,
                                    bgcolor: isActive ? 'primary.main' : 'transparent',
                                    color: isActive ? 'primary.contrastText' : 'text.primary',
                                    '&:hover': {
                                        bgcolor: isActive ? 'primary.dark' : 'action.hover',
                                    },
                                    transition: 'all 0.2s',
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 40,
                                        color: isActive ? 'primary.contrastText' : 'text.secondary',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontSize: '0.875rem',
                                        fontWeight: isActive ? 600 : 500,
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    const desktopDrawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar />

            <List sx={{ px: 1, mt: 1 }}>
                {filteredMenuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                onClick={() => handleNavigate(item.path)}
                                sx={{
                                    borderRadius: 2,
                                    minHeight: 48,
                                    justifyContent: collapsed ? 'center' : 'initial',
                                    px: 2.5,
                                    bgcolor: isActive ? 'primary.main' : 'transparent',
                                    color: isActive ? 'primary.contrastText' : 'text.primary',
                                    '&:hover': {
                                        bgcolor: isActive ? 'primary.dark' : 'action.hover',
                                    },
                                    transition: 'all 0.2s',
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: collapsed ? 0 : 3,
                                        justifyContent: 'center',
                                        color: isActive ? 'primary.contrastText' : 'text.secondary',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                {!collapsed && (
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontSize: '0.875rem',
                                            fontWeight: isActive ? 600 : 500,
                                        }}
                                    />
                                )}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    return (
        <Box
            component="nav"
            sx={{
                width: { md: collapsed ? collapsedWidth : drawerWidth },
                flexShrink: { md: 0 },
            }}
        >
            {/* Mobile drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onMobileClose}
                ModalProps={{
                    keepMounted: true, // Better mobile performance
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: mobileDrawerWidth,
                        maxWidth: '85vw', // Ensure it doesn't take full screen width
                    },
                }}
            >
                {mobileDrawer}
            </Drawer>

            {/* Desktop drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: collapsed ? collapsedWidth : drawerWidth,
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        overflowX: 'hidden',
                    },
                }}
                open
            >
                {desktopDrawer}
            </Drawer>
        </Box>
    );
};

export default Sidebar;
