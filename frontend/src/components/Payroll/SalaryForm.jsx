import { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Button,
    Divider,
    InputAdornment,
    Switch,
    FormControlLabel
} from '@mui/material';

const SalaryForm = ({ 
    onSubmit, 
    initialData = {}, 
    isEditing = false 
}) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'Monthly',
        grade: '',
        applicableRoles: '',
        earnings: {
            basic: 0,
            hra: 0,
            specialAllowance: 0,
            bonus: 0
        },
        deductions: {
            pf: 0,
            esi: 0,
            pt: 0,
            tds: 0
        },
        ...initialData
    });

    const handleInputChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const calculateTotals = () => {
        const totalEarnings = Object.values(formData.earnings).reduce((sum, val) => sum + Number(val || 0), 0);
        const totalDeductions = Object.values(formData.deductions).reduce((sum, val) => sum + Number(val || 0), 0);
        const netPay = totalEarnings - totalDeductions;
        const ctc = formData.type === 'CTC' ? totalEarnings * 12 : totalEarnings;
        
        return { totalEarnings, totalDeductions, netPay, ctc };
    };

    const handleSubmit = () => {
        const { totalEarnings, totalDeductions, netPay, ctc } = calculateTotals();
        
        if (onSubmit) {
            onSubmit({
                ...formData,
                ctc,
                monthlySalary: totalEarnings,
                netPay,
                applicableRoles: formData.applicableRoles.split(',').map(role => role.trim())
            });
        }
    };

    const { totalEarnings, totalDeductions, netPay, ctc } = calculateTotals();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Information */}
            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Basic Information
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                        fullWidth
                        label="Structure Name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={formData.type}
                            label="Type"
                            onChange={(e) => handleInputChange('type', e.target.value)}
                        >
                            <MenuItem value="Monthly">Monthly</MenuItem>
                            <MenuItem value="CTC">CTC</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                        fullWidth
                        label="Grade"
                        value={formData.grade}
                        onChange={(e) => handleInputChange('grade', e.target.value)}
                    />
                    <TextField
                        fullWidth
                        label="Applicable Roles (comma separated)"
                        value={formData.applicableRoles}
                        onChange={(e) => handleInputChange('applicableRoles', e.target.value)}
                    />
                </Box>
            </Box>

            <Divider />

            {/* Earnings */}
            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Earnings
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        label="Basic Salary"
                        type="number"
                        value={formData.earnings.basic}
                        onChange={(e) => handleInputChange('earnings.basic', e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                        sx={{ flex: '1 1 200px', minWidth: '200px' }}
                    />
                    <TextField
                        label="HRA"
                        type="number"
                        value={formData.earnings.hra}
                        onChange={(e) => handleInputChange('earnings.hra', e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                        sx={{ flex: '1 1 200px', minWidth: '200px' }}
                    />
                    <TextField
                        label="Special Allowance"
                        type="number"
                        value={formData.earnings.specialAllowance}
                        onChange={(e) => handleInputChange('earnings.specialAllowance', e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                        sx={{ flex: '1 1 200px', minWidth: '200px' }}
                    />
                    <TextField
                        label="Bonus"
                        type="number"
                        value={formData.earnings.bonus}
                        onChange={(e) => handleInputChange('earnings.bonus', e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                        sx={{ flex: '1 1 200px', minWidth: '200px' }}
                    />
                </Box>
            </Box>

            <Divider />

            {/* Deductions */}
            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Deductions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        label="PF"
                        type="number"
                        value={formData.deductions.pf}
                        onChange={(e) => handleInputChange('deductions.pf', e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                        sx={{ flex: '1 1 200px', minWidth: '200px' }}
                    />
                    <TextField
                        label="ESI"
                        type="number"
                        value={formData.deductions.esi}
                        onChange={(e) => handleInputChange('deductions.esi', e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                        sx={{ flex: '1 1 200px', minWidth: '200px' }}
                    />
                    <TextField
                        label="Professional Tax"
                        type="number"
                        value={formData.deductions.pt}
                        onChange={(e) => handleInputChange('deductions.pt', e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                        sx={{ flex: '1 1 200px', minWidth: '200px' }}
                    />
                    <TextField
                        label="TDS"
                        type="number"
                        value={formData.deductions.tds}
                        onChange={(e) => handleInputChange('deductions.tds', e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                        sx={{ flex: '1 1 200px', minWidth: '200px' }}
                    />
                </Box>
            </Box>

            <Divider />

            {/* Summary */}
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Summary
                </Typography>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Total Earnings</Typography>
                        <Typography variant="h6" color="success.main">₹{totalEarnings.toLocaleString('en-IN')}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Total Deductions</Typography>
                        <Typography variant="h6" color="error.main">₹{totalDeductions.toLocaleString('en-IN')}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Net Pay</Typography>
                        <Typography variant="h6" color="primary.main">₹{netPay.toLocaleString('en-IN')}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">CTC</Typography>
                        <Typography variant="h6">₹{(ctc / 100000).toFixed(1)}L</Typography>
                    </Box>
                </Box>
            </Box>

            {/* Submit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined">
                    Cancel
                </Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {isEditing ? 'Update Structure' : 'Create Structure'}
                </Button>
            </Box>
        </Box>
    );
};

export default SalaryForm;