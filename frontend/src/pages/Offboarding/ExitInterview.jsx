import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Avatar,
    IconButton,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Rating,
    Divider,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    QuestionAnswer as InterviewIcon,
    Refresh as RefreshIcon,
    Save as SaveIcon
} from '@mui/icons-material';

// Mock exit interview data
const mockInterviewData = [
    {
        id: 1,
        employeeId: 'EMP001',
        employeeName: 'John Smith',
        department: 'Engineering',
        exitDate: '2025-01-15',
        interviewDate: '2025-01-10',
        interviewedBy: 'HR Manager',
        status: 'Completed',
        responses: {
            reasonForLeaving: 'Better career opportunity',
            jobSatisfaction: 4,
            workEnvironment: 3,
            management: 4,
            compensation: 3,
            workLifeBalance: 2,
            feedback: 'Great team and learning opportunities. Would like better work-life balance.',
            suggestions: 'Consider flexible working hours and remote work options.',
            wouldRecommend: 'Yes',
            wouldRejoin: 'Maybe'
        },
        privateNotes: 'Good performer, left for 40% salary hike. Consider counter-offer for similar profiles.'
    },
    {
        id: 2,
        employeeId: 'EMP005',
        employeeName: 'David Wilson',
        department: 'Sales',
        exitDate: '2024-12-31',
        interviewDate: '2024-12-28',
        interviewedBy: 'HR Manager',
        status: 'Completed',
        responses: {
            reasonForLeaving: 'Performance issues',
            jobSatisfaction: 2,
            workEnvironment: 2,
            management: 1,
            compensation: 3,
            workLifeBalance: 3,
            feedback: 'Felt unsupported by management. Unclear expectations.',
            suggestions: 'Better onboarding and regular feedback sessions.',
            wouldRecommend: 'No',
            wouldRejoin: 'No'
        },
        privateNotes: 'Performance concerns were valid. Need to improve management training.'
    }
];

const ExitInterview = () => {
    const [interviews, setInterviews] = useState(mockInterviewData);
    const [showInterviewDialog, setShowInterviewDialog] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isNewInterview, setIsNewInterview] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: '',
        interviewDate: '',
        reasonForLeaving: '',
        jobSatisfaction: 0,
        workEnvironment: 0,
        management: 0,
        compensation: 0,
        workLifeBalance: 0,
        feedback: '',
        suggestions: '',
        wouldRecommend: '',
        wouldRejoin: '',
        privateNotes: ''
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNewInterview = () => {
        setIsNewInterview(true);
        setSelectedEmployee(null);
        resetForm();
        setShowInterviewDialog(true);
    };

    const handleViewInterview = (interview) => {
        setIsNewInterview(false);
        setSelectedEmployee(interview);
        setFormData({
            employeeId: interview.employeeId,
            interviewDate: interview.interviewDate,
            reasonForLeaving: interview.responses.reasonForLeaving,
            jobSatisfaction: interview.responses.jobSatisfaction,
            workEnvironment: interview.responses.workEnvironment,
            management: interview.responses.management,
            compensation: interview.responses.compensation,
            workLifeBalance: interview.responses.workLifeBalance,
            feedback: interview.responses.feedback,
            suggestions: interview.responses.suggestions,
            wouldRecommend: interview.responses.wouldRecommend,
            wouldRejoin: interview.responses.wouldRejoin,
            privateNotes: interview.privateNotes
        });
        setShowInterviewDialog(true);
    };

    const handleSaveInterview = () => {
        if (isNewInterview) {
            const newInterview = {
                id: interviews.length + 1,
                employeeId: formData.employeeId,
                employeeName: 'Selected Employee', // In real app, fetch from employee ID
                department: 'Department',
                exitDate: '2025-01-31',
                interviewDate: formData.interviewDate,
                interviewedBy: 'HR Manager',
                status: 'Completed',
                responses: {
                    reasonForLeaving: formData.reasonForLeaving,
                    jobSatisfaction: formData.jobSatisfaction,
                    workEnvironment: formData.workEnvironment,
                    management: formData.management,
                    compensation: formData.compensation,
                    workLifeBalance: formData.workLifeBalance,
                    feedback: formData.feedback,
                    suggestions: formData.suggestions,
                    wouldRecommend: formData.wouldRecommend,
                    wouldRejoin: formData.wouldRejoin
                },
                privateNotes: formData.privateNotes
            };
            setInterviews(prev => [...prev, newInterview]);
        } else {
            // Update existing interview
            setInterviews(prev => prev.map(interview => 
                interview.id === selectedEmployee.id 
                    ? {
                        ...interview,
                        responses: {
                            reasonForLeaving: formData.reasonForLeaving,
                            jobSatisfaction: formData.jobSatisfaction,
                            workEnvironment: formData.workEnvironment,
                            management: formData.management,
                            compensation: formData.compensation,
                            workLifeBalance: formData.workLifeBalance,
                            feedback: formData.feedback,
                            suggestions: formData.suggestions,
                            wouldRecommend: formData.wouldRecommend,
                            wouldRejoin: formData.wouldRejoin
                        },
                        privateNotes: formData.privateNotes
                    }
                    : interview
            ));
        }
        setShowInterviewDialog(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            employeeId: '',
            interviewDate: '',
            reasonForLeaving: '',
            jobSatisfaction: 0,
            workEnvironment: 0,
            management: 0,
            compensation: 0,
            workLifeBalance: 0,
            feedback: '',
            suggestions: '',
            wouldRecommend: '',
            wouldRejoin: '',
            privateNotes: ''
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'Scheduled': return 'info';
            case 'Pending': return 'warning';
            default: return 'default';
        }
    };

    const getAverageRating = (responses) => {
        const ratings = [
            responses.jobSatisfaction,
            responses.workEnvironment,
            responses.management,
            responses.compensation,
            responses.workLifeBalance
        ];
        return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Quick Info */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Exit Interview Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Conduct and manage exit interviews to gather valuable feedback
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => setInterviews(mockInterviewData)}
                            size="small"
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleNewInterview}
                        >
                            New Interview
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                            {interviews.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Interviews
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                            {interviews.filter(i => i.status === 'Completed').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Completed
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                            {interviews.length > 0 ? getAverageRating(interviews[0].responses).toFixed(1) : '0.0'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Avg Satisfaction
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Interviews Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Exit Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Interview Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Interviewed By</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Avg Rating</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {interviews.map((interview) => (
                            <TableRow key={interview.id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                                            {interview.employeeName.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {interview.employeeName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {interview.employeeId} • {interview.department}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {new Date(interview.exitDate).toLocaleDateString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {new Date(interview.interviewDate).toLocaleDateString('en-IN')}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {interview.interviewedBy}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Rating
                                            value={getAverageRating(interview.responses)}
                                            readOnly
                                            size="small"
                                            precision={0.1}
                                        />
                                        <Typography variant="body2" sx={{ ml: 1 }}>
                                            {getAverageRating(interview.responses).toFixed(1)}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={interview.status}
                                        color={getStatusColor(interview.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton size="small" onClick={() => handleViewInterview(interview)}>
                                            <ViewIcon />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleViewInterview(interview)}>
                                            <EditIcon />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Interview Dialog */}
            <Dialog open={showInterviewDialog} onClose={() => setShowInterviewDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InterviewIcon />
                        {isNewInterview ? 'New Exit Interview' : `Exit Interview - ${selectedEmployee?.employeeName}`}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        {/* Basic Information */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Interview Details
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                {isNewInterview && (
                                    <FormControl fullWidth>
                                        <InputLabel>Select Employee</InputLabel>
                                        <Select
                                            value={formData.employeeId}
                                            label="Select Employee"
                                            onChange={(e) => handleInputChange('employeeId', e.target.value)}
                                        >
                                            <MenuItem value="EMP001">John Smith (EMP001)</MenuItem>
                                            <MenuItem value="EMP002">Sarah Johnson (EMP002)</MenuItem>
                                            <MenuItem value="EMP003">Michael Chen (EMP003)</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                                <TextField
                                    fullWidth
                                    label="Interview Date"
                                    type="date"
                                    value={formData.interviewDate}
                                    onChange={(e) => handleInputChange('interviewDate', e.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Box>
                        </Box>

                        <Divider />

                        {/* Exit Reason */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Exit Information
                            </Typography>
                            <TextField
                                fullWidth
                                label="Primary Reason for Leaving"
                                value={formData.reasonForLeaving}
                                onChange={(e) => handleInputChange('reasonForLeaving', e.target.value)}
                                multiline
                                rows={2}
                            />
                        </Box>

                        <Divider />

                        {/* Ratings */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Satisfaction Ratings
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {[
                                    { key: 'jobSatisfaction', label: 'Overall Job Satisfaction' },
                                    { key: 'workEnvironment', label: 'Work Environment' },
                                    { key: 'management', label: 'Management Support' },
                                    { key: 'compensation', label: 'Compensation & Benefits' },
                                    { key: 'workLifeBalance', label: 'Work-Life Balance' }
                                ].map((item) => (
                                    <Box key={item.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ minWidth: 200 }}>
                                            {item.label}
                                        </Typography>
                                        <Rating
                                            value={formData[item.key]}
                                            onChange={(event, newValue) => handleInputChange(item.key, newValue)}
                                            size="large"
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Box>

                        <Divider />

                        {/* Feedback */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Detailed Feedback
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="What did you like most about working here?"
                                    value={formData.feedback}
                                    onChange={(e) => handleInputChange('feedback', e.target.value)}
                                    multiline
                                    rows={3}
                                />
                                <TextField
                                    fullWidth
                                    label="What suggestions do you have for improvement?"
                                    value={formData.suggestions}
                                    onChange={(e) => handleInputChange('suggestions', e.target.value)}
                                    multiline
                                    rows={3}
                                />
                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Would you recommend this company?</InputLabel>
                                        <Select
                                            value={formData.wouldRecommend}
                                            label="Would you recommend this company?"
                                            onChange={(e) => handleInputChange('wouldRecommend', e.target.value)}
                                        >
                                            <MenuItem value="Yes">Yes</MenuItem>
                                            <MenuItem value="No">No</MenuItem>
                                            <MenuItem value="Maybe">Maybe</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth>
                                        <InputLabel>Would you consider rejoining?</InputLabel>
                                        <Select
                                            value={formData.wouldRejoin}
                                            label="Would you consider rejoining?"
                                            onChange={(e) => handleInputChange('wouldRejoin', e.target.value)}
                                        >
                                            <MenuItem value="Yes">Yes</MenuItem>
                                            <MenuItem value="No">No</MenuItem>
                                            <MenuItem value="Maybe">Maybe</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>
                        </Box>

                        <Divider />

                        {/* Private Notes */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                HR Private Notes
                            </Typography>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                These notes are confidential and only visible to HR team.
                            </Alert>
                            <TextField
                                fullWidth
                                label="Internal Notes & Observations"
                                value={formData.privateNotes}
                                onChange={(e) => handleInputChange('privateNotes', e.target.value)}
                                multiline
                                rows={3}
                                placeholder="Add any internal observations, follow-up actions, or confidential notes..."
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowInterviewDialog(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSaveInterview}
                        startIcon={<SaveIcon />}
                    >
                        Save Interview
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ExitInterview;