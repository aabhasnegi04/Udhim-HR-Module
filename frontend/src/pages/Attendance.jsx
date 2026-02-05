import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Stack,
    Alert
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
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';

// Import attendance components
import AttendanceDashboard from './Attendance/AttendanceDashboard';
import AttendanceTable from './Attendance/AttendanceTable';
import BulkUpload from './Attendance/BulkUpload';
import ManualAttendance from './Attendance/ManualAttendance';
import Regularization from './Attendance/Regularization';
import HolidayManagement from './Attendance/HolidayManagement';
import AttendanceReports from './Attendance/AttendanceReports';
import AttendanceCheckIn from './Attendance/AttendanceCheckIn';
import ErrorBoundary from '../components/ErrorBoundary';

const Attendance = () => {
    const { user, isEmployeeActive } = useAuth();
    const { currentView, isEmployeeView, isHRView, isManagerView } = useProfileSwitching();
    const [activeTab, setActiveTab] = useState(0);

    // Different tabs for different views
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
            // HR view: Full management capabilities
            return [
                { label: 'Overview', icon: <DashboardIcon />, component: AttendanceDashboard },
                { label: 'Records', icon: <CalendarIcon />, component: AttendanceTable },
                { label: 'Mark Attendance', icon: <AddIcon />, component: ManualAttendance },
                { label: 'Bulk Upload', icon: <UploadIcon />, component: BulkUpload },
                { label: 'Corrections', icon: <ScheduleIcon />, component: Regularization },
                { label: 'Holidays', icon: <EventIcon />, component: HolidayManagement },
                { label: 'Reports', icon: <ReportIcon />, component: AttendanceReports }
            ];
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