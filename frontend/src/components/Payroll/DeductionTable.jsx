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

const DeductionTable = ({ deductions, showTotals = true }) => {
    const deductionsData = [
        { label: 'Provident Fund', value: deductions.pf || 0, description: 'Employee PF contribution (12%)' },
        { label: 'ESI', value: deductions.esi || 0, description: 'Employee State Insurance (0.75%)' },
        { label: 'Professional Tax', value: deductions.pt || 0, description: 'State professional tax' },
        { label: 'TDS', value: deductions.tds || 0, description: 'Tax Deducted at Source' },
        { label: 'Loan EMI', value: deductions.loanEmi || 0, description: 'Employee loan repayment' },
        { label: 'Other Deductions', value: deductions.other || 0, description: 'Miscellaneous deductions' }
    ];

    const totalDeductions = deductionsData.reduce((sum, item) => sum + item.value, 0);

    return (
        <TableContainer>
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ bgcolor: 'error.light' }}>
                        <TableCell sx={{ fontWeight: 600, color: 'error.contrastText' }}>
                            Deduction Component
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'error.contrastText' }} align="right">
                            Amount
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {deductionsData.map((item, index) => (
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
                                    <Typography variant="body2" fontWeight={600} color="error.main">
                                        ₹{item.value.toLocaleString('en-IN')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )
                    ))}
                    {showTotals && (
                        <TableRow sx={{ bgcolor: 'error.light' }}>
                            <TableCell sx={{ fontWeight: 700, color: 'error.contrastText' }}>
                                Total Deductions
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: 'error.contrastText' }}>
                                ₹{totalDeductions.toLocaleString('en-IN')}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default DeductionTable;