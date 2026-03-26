import { useState, useContext, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    AccountBalance as PayrollIcon,
    Assignment as StructureIcon,
    PersonAdd as AssignIcon,
    People as PeopleIcon,
    PlayArrow as ProcessIcon,
    Receipt as PayslipIcon,
    Gavel as ComplianceIcon,
    Assessment as ReportIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';

// Import Payroll components
import PayrollDashboard from '../components/Payroll/PayrollDashboard';
import SalaryStructures from './Payroll/SalaryStructures';
import EmployeeSalaries from './Payroll/EmployeeSalaries';
import AssignSalary from './Payroll/AssignSalary';
import PayrollProcessing from './Payroll/PayrollProcessing';
import Payslips from './Payroll/Payslips';
import Compliance from './Payroll/Compliance';
import PayrollReports from './Payroll/PayrollReports';
import PayrollSummary from './Payroll/PayrollSummary';
import BankAdvice from './Payroll/BankAdvice';

const Payroll = () => {
    const { user } = useContext(AuthContext);
    const { currentView } = useProfileSwitching();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);

    // Read tab from URL query parameter
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        if (tabParam !== null) {
            const tabIndex = parseInt(tabParam, 10);
            if (!isNaN(tabIndex) && tabIndex >= 0) {
                setActiveTab(tabIndex);
            }
        }
    }, [location.search]);

    // Define tabs based on current view (not user role)
    const getTabsForRole = () => {
        if (currentView === 'EMPLOYEE') {
            return [
                { label: 'My Payslips', icon: <PayslipIcon />, component: <Payslips /> }
            ];
        }

        if (currentView === 'HR') {
            return [
                { label: 'Dashboard', icon: <DashboardIcon />, component: <PayrollDashboard /> },
                { label: 'Salary Templates', icon: <StructureIcon />, component: <SalaryStructures /> },
                { label: 'Employee Salaries', icon: <PeopleIcon />, component: <EmployeeSalaries /> },
                { label: 'Assign Salary', icon: <AssignIcon />, component: <AssignSalary /> },
                { label: 'Process Payroll', icon: <ProcessIcon />, component: <PayrollProcessing /> },
                { label: 'Summary', icon: <ReportIcon />, component: <PayrollSummary /> },
                { label: 'Payslips', icon: <PayslipIcon />, component: <Payslips /> },
                { label: 'Bank Advice', icon: <PayrollIcon />, component: <BankAdvice /> },
                { label: 'Compliance', icon: <ComplianceIcon />, component: <Compliance /> },
                { label: 'Reports', icon: <ReportIcon />, component: <PayrollReports /> }
            ];
        }

        // Default fallback - show employee view
        return [
            { label: 'Payslips', icon: <PayslipIcon />, component: <Payslips /> }
        ];
    };

    const tabs = getTabsForRole();

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        navigate(`/payroll?tab=${newValue}`);
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
                    Payroll Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Complete salary management, payroll processing, and compliance system
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

export default Payroll;
