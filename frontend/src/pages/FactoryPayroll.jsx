import { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import FactoryIcon from '@mui/icons-material/Factory';
import RateManagement from '../components/FactoryPayroll/RateManagement';
import PayrollPeriods from '../components/FactoryPayroll/PayrollPeriods';
import PayrollConfig from '../components/FactoryPayroll/PayrollConfig';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: '24px' }}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function FactoryPayroll() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FactoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Factory Payroll
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage daily wage payroll for factory workers
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Rate Management" />
          <Tab label="Payroll Periods" />
          <Tab label="Configuration" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={currentTab} index={0}>
        <RateManagement />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <PayrollPeriods />
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <PayrollConfig />
      </TabPanel>
    </Box>
  );
}
