import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Box,
    Chip
} from '@mui/material';

const EarningsTable = ({ earnings, showTotals = true }) => {
    const earningsData = [
        { label: 'Basic Salary', value: earnings.basic || 0, description: 'Base salary component' },
        { label: 'HRA', value: earnings.hra || 0, description: 'House Rent Allowance' },
        { label: 'Special Allowance', value: earnings.specialAllowance || 0, description: 'Additional allowances' },
        { label: 'Bonus', value: earnings.bonus || 0, description: 'Performance bonus' },
        { label: 'Overtime', value: earnings.overtime || 0, description: 'Overtime payments' },
        { label: 'Incentives', value: earnings.incentives || 0, description: 'Performance incentives' }
    ];

    const totalEarnings = earningsData.reduce((sum, item) => sum + item.value, 0);

    return (
        <TableContainer>
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ bgcolor: 'success.light' }}>
                        <TableCell sx={{ fontWeight: 600, color: 'success.contrastText' }}>
                            Earnings Component
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'success.contrastText' }} align="right">
                            Amount
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {earningsData.map((item, index) => (
                        item.value > 0 && (
                            <TableRow key={index} hover>
                                <TableCell>
                                    <Box>
                                        <Typography variant="body2" fontWeight={500}>
                                            {item.label}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {item.description}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600}>
                                        ₹{item.value.toLocaleString('en-IN')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )
                    ))}
                    {showTotals && (
                        <TableRow sx={{ bgcolor: 'success.light' }}>
                            <TableCell sx={{ fontWeight: 700, color: 'success.contrastText' }}>
                                Total Earnings
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: 'success.contrastText' }}>
                                ₹{totalEarnings.toLocaleString('en-IN')}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default EarningsTable;