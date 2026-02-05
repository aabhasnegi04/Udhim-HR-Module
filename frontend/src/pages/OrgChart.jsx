import { useState, useRef, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Avatar,
    TextField,
    InputAdornment,
    Chip,
    IconButton,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Search as SearchIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import orgChartService from '../services/orgChartService';

const EmployeeCard = ({ employee, searchTerm, isExpanded, onToggleExpand, hasReports, cardRef }) => {
    const navigate = useNavigate();

    const isHighlighted = searchTerm && (
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewProfile = () => {
        navigate(`/employees/${employee.id}`);
    };

    const getLevelStyles = (level) => {
        switch (level) {
            case 0: // CEO
                return { 
                    bg: 'error.light', 
                    text: 'error.contrastText',
                    width: 280,
                    height: 180,
                    avatarSize: 56,
                    nameSize: '1rem',
                    designationSize: '0.875rem',
                    buttonSize: 'medium'
                };
            case 1: // VP
                return { 
                    bg: 'warning.light', 
                    text: 'warning.contrastText',
                    width: 240,
                    height: 160,
                    avatarSize: 48,
                    nameSize: '0.875rem',
                    designationSize: '0.75rem',
                    buttonSize: 'small'
                };
            case 2: // Manager
                return { 
                    bg: 'info.light', 
                    text: 'info.contrastText',
                    width: 200,
                    height: 140,
                    avatarSize: 40,
                    nameSize: '0.75rem',
                    designationSize: '0.65rem',
                    buttonSize: 'small'
                };
            default: // Employee
                return { 
                    bg: 'success.light', 
                    text: 'success.contrastText',
                    width: 160,
                    height: 120,
                    avatarSize: 32,
                    nameSize: '0.65rem',
                    designationSize: '0.6rem',
                    buttonSize: 'small'
                };
        }
    };

    const styles = getLevelStyles(employee.level);

    return (
        <Card 
            ref={cardRef}
            sx={{ 
                width: styles.width,
                height: styles.height,
                boxShadow: isHighlighted ? 6 : 2,
                border: isHighlighted ? 2 : 1,
                borderColor: isHighlighted ? 'primary.main' : 'divider',
                transition: 'all 0.3s ease',
                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                bgcolor: styles.bg,
                color: styles.text,
                position: 'relative'
            }}
        >
            <CardContent sx={{ p: 1.5, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                    <Avatar
                        sx={{
                            width: styles.avatarSize,
                            height: styles.avatarSize,
                            mx: 'auto',
                            mb: 1,
                            bgcolor: 'rgba(255,255,255,0.9)',
                            color: 'text.primary',
                            fontSize: `${styles.avatarSize * 0.4}px`,
                            fontWeight: 600
                        }}
                    >
                        {employee.name.charAt(0)}
                    </Avatar>
                    
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: styles.nameSize, lineHeight: 1.2 }}>
                        {employee.name}
                    </Typography>
                    
                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: styles.designationSize, lineHeight: 1.1, display: 'block' }}>
                        {employee.designation}
                    </Typography>
                    
                    {employee.level <= 1 && (
                        <Typography variant="caption" sx={{ opacity: 0.8, fontSize: styles.designationSize, lineHeight: 1.1, display: 'block', mt: 0.5 }}>
                            {employee.department}
                        </Typography>
                    )}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                    <Button
                        variant="contained"
                        size={styles.buttonSize}
                        onClick={handleViewProfile}
                        sx={{ 
                            fontSize: styles.designationSize,
                            minWidth: 'auto',
                            px: employee.level === 0 ? 2 : 1,
                            py: employee.level === 0 ? 0.5 : 0.25,
                            bgcolor: 'rgba(255,255,255,0.9)',
                            color: 'text.primary',
                            '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                        }}
                    >
                        View
                    </Button>
                    {hasReports && (
                        <IconButton
                            onClick={onToggleExpand}
                            size={styles.buttonSize}
                            sx={{ 
                                bgcolor: 'rgba(255,255,255,0.9)',
                                color: 'text.primary',
                                width: employee.level === 0 ? 32 : 24,
                                height: employee.level === 0 ? 32 : 24,
                                '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                            }}
                        >
                            {isExpanded ? <ExpandLessIcon sx={{ fontSize: employee.level === 0 ? 20 : 16 }} /> : <ExpandMoreIcon sx={{ fontSize: employee.level === 0 ? 20 : 16 }} />}
                        </IconButton>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

const OrgChart = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [orgData, setOrgData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [cardPositions, setCardPositions] = useState({});
    const cardRefs = useRef({});
    const containerRef = useRef(null);

    useEffect(() => {
        loadOrganizationData();
    }, []);

    const loadOrganizationData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await orgChartService.getOrganizationHierarchy();
            
            if (result.success) {
                setOrgData(result.data || []);
                
                // Auto-expand top 2 levels
                const topLevelNodes = result.data
                    .filter(emp => emp.level <= 1)
                    .map(emp => emp.id);
                setExpandedNodes(new Set(topLevelNodes));
            } else {
                setError(result.error || 'Failed to load organization data');
            }
        } catch (err) {
            setError('Failed to load organization data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (employeeId) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(employeeId)) {
            newExpanded.delete(employeeId);
        } else {
            newExpanded.add(employeeId);
        }
        setExpandedNodes(newExpanded);
    };

    const getEmployeeById = (id) => orgData.find(emp => emp.id === id);
    
    const getVisibleEmployees = () => {
        if (orgData.length === 0) return [];
        
        // Find top-level employees (level 0 or those with no manager)
        const topLevel = orgData.filter(emp => emp.level === 0 || emp.manager_id === null);
        
        // If no clear top level, show all employees grouped by level
        if (topLevel.length === 0) {
            return orgData;
        }
        
        const visible = new Set(topLevel.map(emp => emp.id));
        
        const addVisibleReports = (employeeId) => {
            const employee = getEmployeeById(employeeId);
            if (employee && expandedNodes.has(employeeId)) {
                employee.reports.forEach(reportId => {
                    visible.add(reportId);
                    addVisibleReports(reportId);
                });
            }
        };
        
        topLevel.forEach(emp => addVisibleReports(emp.id));
        return Array.from(visible).map(id => getEmployeeById(id)).filter(Boolean);
    };

    const visibleEmployees = getVisibleEmployees();
    const employeesByLevel = visibleEmployees.reduce((acc, emp) => {
        if (!acc[emp.level]) acc[emp.level] = [];
        acc[emp.level].push(emp);
        return acc;
    }, {});

    // Calculate card positions after render
    useEffect(() => {
        const updatePositions = () => {
            if (!containerRef.current) return;
            
            const containerRect = containerRef.current.getBoundingClientRect();
            const positions = {};
            
            Object.keys(cardRefs.current).forEach(employeeId => {
                const cardElement = cardRefs.current[employeeId];
                if (cardElement) {
                    const cardRect = cardElement.getBoundingClientRect();
                    positions[employeeId] = {
                        x: cardRect.left - containerRect.left + cardRect.width / 2,
                        y: cardRect.top - containerRect.top,
                        bottom: cardRect.bottom - containerRect.top,
                        centerX: cardRect.left - containerRect.left + cardRect.width / 2,
                        centerY: cardRect.top - containerRect.top + cardRect.height / 2
                    };
                }
            });
            
            setCardPositions(positions);
        };

        // Multiple attempts to ensure positions are calculated correctly
        const timeouts = [
            setTimeout(updatePositions, 50),
            setTimeout(updatePositions, 150),
            setTimeout(updatePositions, 300)
        ];
        
        // Also update on window resize
        window.addEventListener('resize', updatePositions);
        
        return () => {
            timeouts.forEach(clearTimeout);
            window.removeEventListener('resize', updatePositions);
        };
    }, [expandedNodes, visibleEmployees.length]);

    // Conditional rendering AFTER all hooks
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Box>
        );
    }

    if (orgData.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">
                    No organization data available. Please add employees with manager relationships.
                </Alert>
            </Box>
        );
    }

    // Generate connection lines based on actual positions
    const generateConnectionLines = () => {
        const lines = [];
        
        // Only generate lines if we have position data
        if (Object.keys(cardPositions).length === 0) return lines;
        
        Object.keys(employeesByLevel).forEach(level => {
            const levelEmployees = employeesByLevel[level];
            
            levelEmployees.forEach(manager => {
                if (manager.reports.length === 0 || !expandedNodes.has(manager.id)) return;
                
                const visibleReports = manager.reports.filter(reportId => 
                    visibleEmployees.some(emp => emp.id === reportId)
                );
                
                if (visibleReports.length === 0) return;
                
                const managerPos = cardPositions[manager.id];
                if (!managerPos) return;
                
                const reportPositions = visibleReports
                    .map(reportId => ({ id: reportId, pos: cardPositions[reportId] }))
                    .filter(report => report.pos);
                
                if (reportPositions.length === 0) return;
                
                // Calculate the vertical distance between manager and reports
                const firstReportY = reportPositions[0].pos.y;
                const connectionHeight = firstReportY - managerPos.bottom;
                const midPoint = managerPos.bottom + connectionHeight / 2;
                
                // Vertical line down from manager to midpoint
                lines.push(
                    <Box
                        key={`manager-down-${manager.id}`}
                        sx={{
                            position: 'absolute',
                            left: managerPos.centerX - 1,
                            top: managerPos.bottom,
                            width: 2,
                            height: connectionHeight / 2,
                            bgcolor: 'primary.main',
                            opacity: 0.8,
                            zIndex: 1
                        }}
                    />
                );
                
                if (reportPositions.length > 1) {
                    // Horizontal line connecting reports at midpoint
                    const leftmostX = Math.min(...reportPositions.map(r => r.pos.centerX));
                    const rightmostX = Math.max(...reportPositions.map(r => r.pos.centerX));
                    
                    lines.push(
                        <Box
                            key={`horizontal-${manager.id}`}
                            sx={{
                                position: 'absolute',
                                left: leftmostX - 1,
                                top: midPoint - 1,
                                width: rightmostX - leftmostX + 2,
                                height: 2,
                                bgcolor: 'primary.main',
                                opacity: 0.8,
                                zIndex: 1
                            }}
                        />
                    );
                } else {
                    // For single report, draw a horizontal stub from manager
                    const reportX = reportPositions[0].pos.centerX;
                    const stubLength = 20;
                    const startX = Math.min(managerPos.centerX, reportX) - stubLength / 2;
                    const endX = Math.max(managerPos.centerX, reportX) + stubLength / 2;
                    
                    lines.push(
                        <Box
                            key={`horizontal-stub-${manager.id}`}
                            sx={{
                                position: 'absolute',
                                left: startX - 1,
                                top: midPoint - 1,
                                width: endX - startX + 2,
                                height: 2,
                                bgcolor: 'primary.main',
                                opacity: 0.8,
                                zIndex: 1
                            }}
                        />
                    );
                }
                
                // Vertical lines from midpoint down to each report
                reportPositions.forEach(report => {
                    lines.push(
                        <Box
                            key={`report-up-${report.id}`}
                            sx={{
                                position: 'absolute',
                                left: report.pos.centerX - 1,
                                top: midPoint,
                                width: 2,
                                height: report.pos.y - midPoint,
                                bgcolor: 'primary.main',
                                opacity: 0.8,
                                zIndex: 1
                            }}
                        />
                    );
                });
            });
        });
        
        return lines;
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                    Organization Chart
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Interactive organizational structure - click expand buttons to explore teams
                </Typography>
            </Box>

            {/* Search */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <TextField
                    fullWidth
                    placeholder="Search employees by name, designation, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Paper>

            {/* Organization Chart */}
            <Paper sx={{ 
                p: 4, 
                overflow: 'auto',
                minHeight: 500,
                bgcolor: 'grey.50',
                position: 'relative'
            }}>
                <Box 
                    ref={containerRef}
                    sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                        minWidth: 800,
                        position: 'relative',
                        py: 4
                    }}
                >
                    {/* Connection Lines */}
                    {generateConnectionLines()}
                    
                    {/* Employee Cards by Level */}
                    {Object.keys(employeesByLevel).sort().map((level) => {
                        const levelEmployees = employeesByLevel[level];
                        
                        return (
                            <Box 
                                key={level}
                                sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'center',
                                    gap: 4,
                                    flexWrap: 'wrap',
                                    width: '100%',
                                    position: 'relative',
                                    zIndex: 2
                                }}
                            >
                                {levelEmployees.map((employee) => (
                                    <EmployeeCard
                                        key={employee.id}
                                        employee={employee}
                                        searchTerm={searchTerm}
                                        isExpanded={expandedNodes.has(employee.id)}
                                        onToggleExpand={() => toggleExpand(employee.id)}
                                        hasReports={employee.reports.length > 0}
                                        cardRef={(el) => {
                                            if (el) {
                                                cardRefs.current[employee.id] = el;
                                            }
                                        }}
                                    />
                                ))}
                            </Box>
                        );
                    })}
                </Box>
            </Paper>

            {/* Legend */}
            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Organization Levels
                </Typography>
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                    gap: 2 
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, bgcolor: 'error.light', borderRadius: 1 }} />
                        <Typography variant="body2">CEO Level</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, bgcolor: 'warning.light', borderRadius: 1 }} />
                        <Typography variant="body2">VP Level</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, bgcolor: 'info.light', borderRadius: 1 }} />
                        <Typography variant="body2">Manager Level</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, bgcolor: 'success.light', borderRadius: 1 }} />
                        <Typography variant="body2">Employee Level</Typography>
                    </Box>
                </Box>
                
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                    💡 Click the expand/collapse buttons to show or hide team members. Use search to highlight specific employees.
                </Typography>
            </Paper>
        </Box>
    );
};

export default OrgChart;