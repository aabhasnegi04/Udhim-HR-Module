import { useState, useRef, useEffect } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    InputBase,
    Box,
    useMediaQuery,
    useTheme,
    Paper,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    CircularProgress,
    Chip,
    ClickAwayListener,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';
import ProfileSwitcher from './ProfileSwitcher';
import NotificationBell from './Notifications/NotificationBell';
import employeeService from '../services/employeeService';

const Header = ({ onMenuClick }) => {
    const { user } = useAuth();
    const { currentView } = useProfileSwitching();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const debounceRef = useRef(null);

    const canSearch = currentView === 'HR' || currentView === 'MANAGER';

    const handleSearch = (value) => {
        setQuery(value);
        clearTimeout(debounceRef.current);
        if (!value.trim()) { setResults([]); setOpen(false); return; }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            const res = await employeeService.searchEmployees(value);
            if (res.success) {
                setResults((res.data || []).slice(0, 6));
                setOpen(true);
            }
            setLoading(false);
        }, 350);
    };

    const handleSelect = (emp) => {
        navigate(`/employees/${emp.employee_id}`);
        setQuery('');
        setResults([]);
        setOpen(false);
    };

    const handleClickAway = () => { setOpen(false); };

    return (
        <AppBar
            position="fixed"
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                bgcolor: 'background.paper',
                color: 'text.primary',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={onMenuClick}
                    sx={{ 
                        mr: 2, 
                        display: { md: 'none' },
                        p: 1.5,
                        '&:hover': { bgcolor: 'action.hover' }
                    }}
                >
                    <MenuIcon />
                </IconButton>

                <Box sx={{ display: 'flex', alignItems: 'center', mr: { xs: 2, sm: 4 }, py: 1 }}>
                    <img
                        src="https://www.udhim.com/logo.png"
                        alt="Udhim Logo"
                        style={{ height: isMobile ? '40px' : '56px', width: 'auto', objectFit: 'contain' }}
                    />
                </Box>

                {/* Search Bar — HR/Manager only, desktop only */}
                {!isMobile && canSearch && (
                    <ClickAwayListener onClickAway={handleClickAway}>
                        <Box sx={{ position: 'relative', width: '100%', maxWidth: 400, mr: 2 }}>
                            <Box sx={{
                                display: 'flex', alignItems: 'center',
                                borderRadius: 1, bgcolor: 'action.hover',
                                '&:hover': { bgcolor: 'action.selected' },
                                px: 1.5,
                            }}>
                                {loading
                                    ? <CircularProgress size={18} sx={{ mr: 1, flexShrink: 0 }} />
                                    : <SearchIcon color="action" sx={{ mr: 1, flexShrink: 0 }} />
                                }
                                <InputBase
                                    value={query}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    onFocus={() => results.length > 0 && setOpen(true)}
                                    placeholder="Search employees..."
                                    sx={{ width: '100%', py: 0.75 }}
                                />
                            </Box>

                            {/* Dropdown */}
                            {open && results.length > 0 && (
                                <Paper elevation={4} sx={{
                                    position: 'absolute', top: '110%', left: 0, right: 0,
                                    zIndex: 1400, maxHeight: 320, overflowY: 'auto',
                                }}>
                                    <List disablePadding>
                                        {results.map((emp) => (
                                            <ListItem
                                                key={emp.employee_id}
                                                onClick={() => handleSelect(emp)}
                                                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, py: 1 }}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.875rem' }}>
                                                        {emp.employee_name?.charAt(0) || 'E'}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="body2" fontWeight={500}>{emp.employee_name}</Typography>
                                                            <Typography variant="caption" color="text.disabled">{emp.employee_code}</Typography>
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                            <Typography variant="caption" color="text.secondary">{emp.department}</Typography>
                                                            {emp.status && (
                                                                <Chip
                                                                    label={emp.status}
                                                                    size="small"
                                                                    color={emp.status === 'ACTIVE' ? 'success' : 'default'}
                                                                    sx={{ height: 16, fontSize: '0.6rem' }}
                                                                />
                                                            )}
                                                        </Box>
                                                    }
                                                    secondaryTypographyProps={{ component: 'div' }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Paper>
                            )}
                        </Box>
                    </ClickAwayListener>
                )}

                <Box sx={{ flexGrow: 1 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                    <NotificationBell />
                    <ProfileSwitcher />
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
