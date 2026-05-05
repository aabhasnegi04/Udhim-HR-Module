import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Alert, CircularProgress,
  Grid, Divider, Stack, Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import factoryPayrollService from '../../services/factoryPayrollService';

// Section Component for consistent styling
const Section = ({ icon, color = '#1976d2', title, subtitle, children }) => (
  <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.5,
      px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50',
    }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
        bgcolor: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle1" fontWeight={600} lineHeight={1.2}>{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </Box>
    </Box>
    <Box sx={{ p: 3 }}>{children}</Box>
  </Paper>
);

export default function PayrollConfig() {
  const [config, setConfig] = useState({
    full_day_hours: 12.0,
    half_day_minimum_hours: 6.0,
    absent_threshold_hours: 6.0,
    hourly_divisor: 8,
    overtime_multiplier: 2.0,
    sunday_bonus_hours: 4.0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await factoryPayrollService.getPayrollConfig();
      if (response.success && response.data) {
        setConfig(response.data);
      }
    } catch (err) {
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
      setHasChanges(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await factoryPayrollService.updatePayrollConfig(config);

      if (response.success) {
        setSuccess('Configuration saved successfully');
        setHasChanges(false);
      } else {
        setError(response.message || 'Failed to update configuration');
      }
    } catch (err) {
      setError('Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig({ ...config, [field]: parseFloat(value) || 0 });
    setHasChanges(true);
    setSuccess('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            Payroll Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure payroll calculation rules for factory workers. These settings affect salary calculations across the system.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {hasChanges && !success && (
            <Chip label="Unsaved changes" color="warning" size="small" variant="outlined" />
          )}
          {success && <Chip icon={<CheckIcon />} label="Saved" color="success" size="small" />}
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchConfig} 
            size="small" 
            disabled={saving}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            Save Changes
          </Button>
        </Stack>
      </Box>

      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Configuration Sections */}
      <Stack spacing={3}>
        {/* Working Hours Configuration */}
        <Section
          icon={<TimeIcon fontSize="small" />}
          color="#2e7d32"
          title="Working Hours"
          subtitle="Define attendance thresholds and working hour rules"
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Full Day Hours"
                type="number"
                value={config.full_day_hours}
                onChange={(e) => handleChange('full_day_hours', e.target.value)}
                helperText="Hours required for full day"
                fullWidth
                inputProps={{ step: 0.5, min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Half Day Minimum Hours"
                type="number"
                value={config.half_day_minimum_hours}
                onChange={(e) => handleChange('half_day_minimum_hours', e.target.value)}
                helperText="Minimum hours for half day"
                fullWidth
                inputProps={{ step: 0.5, min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Absent Threshold Hours"
                type="number"
                value={config.absent_threshold_hours}
                onChange={(e) => handleChange('absent_threshold_hours', e.target.value)}
                helperText="Below this marks absent"
                fullWidth
                inputProps={{ step: 0.5, min: 0 }}
              />
            </Grid>
          </Grid>
        </Section>

        {/* Pay Calculation Configuration */}
        <Section
          icon={<MoneyIcon fontSize="small" />}
          color="#c62828"
          title="Pay Calculation"
          subtitle="Configure salary calculation rules and multipliers"
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Hourly Divisor"
                type="number"
                value={config.hourly_divisor}
                onChange={(e) => handleChange('hourly_divisor', e.target.value)}
                helperText="Daily rate ÷ this = hourly rate"
                fullWidth
                inputProps={{ step: 1, min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Overtime Multiplier"
                type="number"
                value={config.overtime_multiplier}
                onChange={(e) => handleChange('overtime_multiplier', e.target.value)}
                helperText="Overtime pay multiplier"
                fullWidth
                inputProps={{ step: 0.1, min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Sunday Bonus Hours"
                type="number"
                value={config.sunday_bonus_hours}
                onChange={(e) => handleChange('sunday_bonus_hours', e.target.value)}
                helperText="Extra hours on Sundays"
                fullWidth
                inputProps={{ step: 0.5, min: 0 }}
              />
            </Grid>
          </Grid>
        </Section>

        {/* Example Calculation */}
        <Paper 
          elevation={0} 
          sx={{ 
            border: '1px solid', 
            borderColor: 'info.main', 
            borderRadius: 2, 
            bgcolor: 'info.lighter',
            overflow: 'hidden'
          }}
        >
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 3, py: 2, borderBottom: '1px solid', borderColor: 'info.main', bgcolor: 'info.light',
          }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
              bgcolor: 'info.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            }}>
              <InfoIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} lineHeight={1.2}>
                Example Calculation
              </Typography>
              <Typography variant="caption" color="text.secondary">
                See how these settings affect payroll calculation
              </Typography>
            </Box>
          </Box>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Scenario */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider' }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    📋 Scenario
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    A factory worker with daily rate of <strong>₹500</strong> works <strong>14 hours</strong> on a <strong>Sunday</strong>
                  </Typography>
                </Paper>
              </Grid>

              {/* Step 1: Calculate Hourly Rate */}
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Step 1: Hourly Rate
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    ₹{(500 / parseFloat(config.hourly_divisor)).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ₹500 ÷ {config.hourly_divisor}
                  </Typography>
                </Box>
              </Grid>

              {/* Step 2: Add Sunday Bonus */}
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Step 2: Total Hours
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="warning.main">
                    {(14 + parseFloat(config.sunday_bonus_hours)).toFixed(0)} hrs
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    14 hrs + {config.sunday_bonus_hours} (Sunday bonus)
                  </Typography>
                </Box>
              </Grid>

              {/* Step 3: Regular Pay */}
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Step 3: Regular Pay
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    ₹{(parseFloat(config.full_day_hours) * (500 / parseFloat(config.hourly_divisor))).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {config.full_day_hours} hrs × ₹{(500 / parseFloat(config.hourly_divisor)).toFixed(2)}
                  </Typography>
                </Box>
              </Grid>

              {/* Step 4: Overtime Pay */}
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Step 4: Overtime Pay
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="error.main">
                    ₹{(((14 + parseFloat(config.sunday_bonus_hours)) - parseFloat(config.full_day_hours)) * (500 / parseFloat(config.hourly_divisor)) * parseFloat(config.overtime_multiplier)).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {((14 + parseFloat(config.sunday_bonus_hours)) - parseFloat(config.full_day_hours)).toFixed(0)} hrs × ₹{(500 / parseFloat(config.hourly_divisor)).toFixed(2)} × {config.overtime_multiplier}
                  </Typography>
                </Box>
              </Grid>

              {/* Final Total */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2.5, bgcolor: 'success.lighter', border: '2px solid', borderColor: 'success.main' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        💰 Total Pay for the Day
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="success.dark">
                        ₹{(
                          (parseFloat(config.full_day_hours) * (500 / parseFloat(config.hourly_divisor))) +
                          (((14 + parseFloat(config.sunday_bonus_hours)) - parseFloat(config.full_day_hours)) * (500 / parseFloat(config.hourly_divisor)) * parseFloat(config.overtime_multiplier))
                        ).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Regular: ₹{(parseFloat(config.full_day_hours) * (500 / parseFloat(config.hourly_divisor))).toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Overtime: ₹{(((14 + parseFloat(config.sunday_bonus_hours)) - parseFloat(config.full_day_hours)) * (500 / parseFloat(config.hourly_divisor)) * parseFloat(config.overtime_multiplier)).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
