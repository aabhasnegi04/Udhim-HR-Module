import {
    Box,
    Typography,
    Divider,
    Grid,
    Paper
} from '@mui/material';
import EarningsTable from './EarningsTable';
import DeductionTable from './DeductionTable';

const PayslipPreview = ({ payslipData }) => {
    if (!payslipData) return null;

    const {
        employeeName,
        employeeId,
        month,
        department,
        designation,
        earnings,
        deductions,
        grossSalary,
        netSalary
    } = payslipData;

    return (
        <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            {/* Company Header */}
            <Box sx={{ textAlign: 'center', mb: 3, pb: 2, borderBottom: 2, borderColor: 'primary.main' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                    UDHIM TECHNOLOGIES
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    SALARY SLIP
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    For the month of {new Date(month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Typography>
            </Box>

            {/* Employee Details */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Employee Name</Typography>
                    <Typography variant="body1" fontWeight={600}>{employeeName}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Employee ID</Typography>
                    <Typography variant="body1" fontWeight={600}>{employeeId}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Department</Typography>
                    <Typography variant="body1" fontWeight={600}>{department}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Designation</Typography>
                    <Typography variant="body1" fontWeight={600}>{designation}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Pay Period</Typography>
                    <Typography variant="body1" fontWeight={600}>
                        {new Date(month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Pay Date</Typography>
                    <Typography variant="body1" fontWeight={600}>
                        {new Date().toLocaleDateString('en-IN')}
                    </Typography>
                </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Earnings and Deductions */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Earnings */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
                        Earnings
                    </Typography>
                    <EarningsTable earnings={earnings} showTotals={true} />
                </Grid>

                {/* Deductions */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>
                        Deductions
                    </Typography>
                    <DeductionTable deductions={deductions} showTotals={true} />
                </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Summary */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="body2" color="text.secondary">Gross Salary</Typography>
                    <Typography variant="h6" fontWeight={600}>
                        ₹{grossSalary.toLocaleString('en-IN')}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Total Deductions</Typography>
                    <Typography variant="h6" fontWeight={600} color="error.main">
                        ₹{Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0).toLocaleString('en-IN')}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">Net Salary</Typography>
                    <Typography variant="h6" fontWeight={600} color="success.main">
                        ₹{netSalary.toLocaleString('en-IN')}
                    </Typography>
                </Box>
            </Box>

            {/* Net Salary Highlight */}
            <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'primary.light', borderRadius: 2, mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.contrastText', mb: 1 }}>
                    NET SALARY
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.contrastText' }}>
                    ₹{netSalary.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'primary.contrastText', mt: 1 }}>
                    (Rupees {convertNumberToWords(netSalary)} Only)
                </Typography>
            </Box>

            {/* Footer */}
            <Box sx={{ textAlign: 'center', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                    This is a computer-generated payslip and does not require a signature.
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                    Generated on: {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}
                </Typography>
            </Box>
        </Paper>
    );
};

// Helper function to convert number to words (simplified)
const convertNumberToWords = (num) => {
    // This is a simplified version - in real implementation, use a proper number-to-words library
    if (num < 1000) return `${num}`;
    if (num < 100000) return `${Math.floor(num / 1000)} Thousand ${num % 1000 > 0 ? `${num % 1000}` : ''}`;
    if (num < 10000000) return `${Math.floor(num / 100000)} Lakh ${num % 100000 > 0 ? convertNumberToWords(num % 100000) : ''}`;
    return `${Math.floor(num / 10000000)} Crore ${num % 10000000 > 0 ? convertNumberToWords(num % 10000000) : ''}`;
};

export default PayslipPreview;