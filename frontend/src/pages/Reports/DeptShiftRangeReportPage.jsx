import { Box, IconButton, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DeptShiftRangeReport from '../Attendance/DeptShiftRangeReport';

const DeptShiftRangeReportPage = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <IconButton
                    onClick={() => navigate('/reports')}
                    sx={{ color: 'primary.main', '&:hover': { backgroundColor: 'primary.light' } }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight={600}>
                    Department Shift Range Report
                </Typography>
            </Box>
            <DeptShiftRangeReport />
        </Box>
    );
};

export default DeptShiftRangeReportPage;
