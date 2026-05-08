import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Stack,
    Alert,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import {
    Add as AddIcon,
    Upload as UploadIcon,
    Assessment as ReportIcon,
    CalendarToday as CalendarIcon,
    Schedule as ScheduleIcon,
    Dashboard as DashboardIcon,
    Event as EventIcon,
    Login as CheckInIcon,
    Logout as CheckOutIcon,
    Warning as WarningIcon,
    PendingActions as PendingIcon,
    People as PeopleIcon,
    Business as OfficeIcon,
    Factory as FactoryIcon,
    SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';
import { useLocation } from 'react-router-dom';

// Import attendance components
import AttendanceDashboard from './Attendance/AttendanceDashboard';
import AttendanceTable from './Attendance/AttendanceTable';
import BulkUpload from './Attendance/BulkUpload';
import ManualAttendance from './Attendance/ManualAttendance';
import Regularization from './Attendance/Regularization';
import HolidayManagement from './Attendance/HolidayManagement';
import AttendanceReports from './Attendance/AttendanceReports';
import AttendanceCheckIn from './Attendance/AttendanceCheckIn';
import CurrentlyPresent from './Attendance/CurrentlyPresent';
import DailyDepartmentAssignment from './Attendance/DailyDepartmentAssignment';
import ErrorBoundary from '../components/ErrorBoundary';
import PendingAttendance from './Attendance/PendingAttendance';

const Attendance = () => {
    const { user, isEmployeeActive } = useAuth();
    const { currentView, isEmployeeView, isHRView, isManagerView } = useProfileSwitching();
    const location = useLocation();
    
    // Check if navigation state has attendanceType and tab
    const navState = location.state || {};
    
    const [attendanceType, setAttendanceType] = useState(() => {
        return navState.attendanceType || 'office';
    });
    
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

    const handleAttendanceTypeChange = (event, newType) => {
        if (newType !== null) {
            setAttendanceType(newType);
            setActiveTab(0); // Reset to first tab when switching
        }
    };

    // Different tabs for different views and attendance types
    const getAttendanceTabs = () => {
        const employeeActive = isEmployeeActive();
        
        if (isEmployeeView()) {
            // Employee view: Personal attendance focused
            const baseTabs = [
                { label: 'My Records', icon: <CalendarIcon />, component: AttendanceTable },
            ];

            // Only add Check In/Out tabs for active employees
            if (employeeActive) {
                baseTabs.unshift(
                    { label: 'Check In', icon: <CheckInIcon />, component: () => <AttendanceCheckIn type="checkin" /> },
                    { label: 'Check Out', icon: <CheckOutIcon />, component: () => <AttendanceCheckIn type="checkout" /> }
                );
                baseTabs.push({ label: 'Corrections', icon: <ScheduleIcon />, component: Regularization });
            }

            return baseTabs;
        } else if (isHRView()) {
            // HR view: Different tabs for Office vs Factory
            if (attendanceType === 'office') {
                return [
                    { label: 'Overview', icon: <DashboardIcon />, component: AttendanceDashboard },
                    { label: 'Records', icon: <CalendarIcon />, component: AttendanceTable },
                    { label: 'Mark Attendance', icon: <AddIcon />, component: ManualAttendance },
                    { label: 'Corrections', icon: <ScheduleIcon />, component: Regularization },
                    { label: 'Holidays', icon: <EventIcon />, component: HolidayManagement },
                    { label: 'Reports', icon: <ReportIcon />, component: () => <AttendanceReports attendanceType="office" /> }
                ];
            } else {
                // Factory attendance tabs
                return [
                    { label: 'Overview', icon: <DashboardIcon />, component: AttendanceDashboard },
                    { label: 'Currently Present', icon: <PeopleIcon />, component: CurrentlyPresent },
                    { label: 'Records', icon: <CalendarIcon />, component: AttendanceTable },
                    { label: 'Pending', icon: <PendingIcon />, component: PendingAttendance },
                    { label: 'Daily Department Assignment', icon: <SwapIcon />, component: DailyDepartmentAssignment },
                    { label: 'Bulk Upload', icon: <UploadIcon />, component: BulkUpload },
                    { label: 'Reports', icon: <ReportIcon />, component: () => <AttendanceReports attendanceType="factory" /> }
                ];
            }
        } else if (isManagerView()) {
            // Manager view: Team management focused
            return [
                { label: 'Team Overview', icon: <DashboardIcon />, component: AttendanceDashboard },
                { label: 'Team Records', icon: <CalendarIcon />, component: AttendanceTable },
                { label: 'Mark Attendance', icon: <AddIcon />, component: ManualAttendance },
                { label: 'Team Reports', icon: <ReportIcon />, component: AttendanceReports }
            ];
        } else {
            // Default to employee view
            return [
                { label: 'My Records', icon: <CalendarIcon />, component: AttendanceTable },
            ];
        }
    };

    const attendanceTabs = getAttendanceTabs();

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const ActiveComponent = attendanceTabs[activeTab].component;

    return (
        <Box sx={{ p: { xs: 0, sm: 2, md: 3 } }}>
            {/* Inactive Employee Alert */}
            {isEmployeeView() && !isEmployeeActive() && (
                <Alert 
                    severity="warning" 
                    icon={<WarningIcon />}
                    sx={{ mb: 3 }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Account Inactive - Limited Access
                    </Typography>
                    <Typography variant="body2">
                        Your employee account is inactive. Attendance marking and corrections are disabled. You can only view your historical records.
                    </Typography>
                </Alert>
            )}

            {/* Office/Factory Toggle - Only for HR */}
            {isHRView() && (
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                    <ToggleButtonGroup
                        value={attendanceType}
                        exclusive
                        onChange={handleAttendanceTypeChange}
                        aria-label="attendance type"
                        sx={{
                            '& .MuiToggleButton-root': {
                                px: 4,
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                border: '2px solid',
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '&:hover': {
                                        bgcolor: 'primary.dark',
                                    }
                                }
                            }
                        }}
                    >
                        <ToggleButton value="office" aria-label="office attendance">
                            <Stack direction="row" spacing={1} alignItems="center">
                                <OfficeIcon />
                                <Typography>Office Attendance</Typography>
                            </Stack>
                        </ToggleButton>
                        <ToggleButton value="factory" aria-label="factory attendance">
                            <Stack direction="row" spacing={1} alignItems="center">
                                <FactoryIcon />
                                <Typography>Factory Attendance</Typography>
                            </Stack>
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            )}

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
                            minWidth: { xs: 100, sm: 140 }
                        }
                    }}
                >
                    {attendanceTabs.map((tab, index) => (
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
            <ErrorBoundary>
                <Box>
                    <ActiveComponent />
                </Box>
            </ErrorBoundary>
        </Box>
    );
};

export default Attendance;