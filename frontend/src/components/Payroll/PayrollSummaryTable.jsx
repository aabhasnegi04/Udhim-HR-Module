import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Box,
    Avatar,
    Chip,
    IconButton,
    Stack
} from '@mui/material';
import {
    Edit as EditIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';

const PayrollSummaryTable = ({ 
    payrollData, 
    onEdit, 
    onView, 
    isLocked = false 
}) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Calculated': return 'success';
            case 'Needs Review': return 'warning';
            case 'Adjusted': return 'info';
            case 'Locked': return 'default';
            default: return 'default';
        }
    };

    const totalGross = payrollData.reduce((sum, emp) => sum + emp.grossSalary, 0);
    const totalDeductions = payrollData.reduce((sum, emp) => sum + emp.totalDeductions, 0);
    const totalNet = payrollData.reduce((sum, emp) => sum + emp.netSalary, 0);

    return (
        <Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Gross Salary</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Deductions</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Net Salary</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Days</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payrollData.map((employee) => (
                            <TableRow key={employee.id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                            {employee.employeeName.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {employee.employeeName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {employee.employeeId} • {employee.department}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600}>
                                        ₹{employee.grossSalary.toLocaleString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" color="error.main">
                                        ₹{employee.totalDeductions.toLocaleString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600} color="success.main">
                                        ₹{employee.netSalary.toLocaleString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {employee.attendanceDays}W / {employee.leaveDays}L
                                        {employee.lopDays > 0 && (
                                            <Typography variant="caption" color="error.main" sx={{ display: 'block' }}>
                                                {employee.lopDays} LOP
                                            </Typography>
                                        )}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={employee.status}
                                        color={getStatusColor(employee.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton size="small" onClick={() => onView && onView(employee)}>
                                            <ViewIcon />
                                        </IconButton>
                                        {!isLocked && (
                                            <IconButton 
                                                size="small"
                                                onClick={() => onEdit && onEdit(employee)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        )}
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Summary Footer */}
            <Box sx={{ p: 3, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6">
                        Total Employees: {payrollData.length}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="text.secondary">Gross Total</Typography>
                            <Typography variant="h6" color="primary.main">
                                ₹{totalGross.toLocaleString('en-IN')}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="text.secondary">Deductions</Typography>
                            <Typography variant="h6" color="error.main">
                                ₹{totalDeductions.toLocaleString('en-IN')}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="text.secondary">Net Payable</Typography>
                            <Typography variant="h6" color="success.main">
                                ₹{totalNet.toLocaleString('en-IN')}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default PayrollSummaryTable;