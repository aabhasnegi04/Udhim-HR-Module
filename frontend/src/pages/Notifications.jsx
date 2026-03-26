import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, List, ListItem, ListItemText, Chip,
    Button, Divider, CircularProgress, Alert, IconButton, Tooltip
} from '@mui/material';
import {
    Payment as PayrollIcon, BeachAccess as LeaveIcon,
    Description as DocIcon, Notifications as BellIcon,
    DoneAll as ReadAllIcon, OpenInNew as OpenIcon,
} from '@mui/icons-material';
import notificationService from '../services/notificationService';

const MODULE_META = {
    PAYROLL:    { color: 'success', icon: <PayrollIcon />, label: 'Payroll',     path: '/payroll'    },
    LEAVE:      { color: 'warning', icon: <LeaveIcon   />, label: 'Leave',       path: '/leave'      },
    DOCUMENTS:  { color: 'info',    icon: <DocIcon     />, label: 'Documents',   path: '/documents'  },
    ATTENDANCE: { color: 'primary', icon: <BellIcon    />, label: 'Attendance',  path: '/attendance' },
    GENERAL:    { color: 'default', icon: <BellIcon    />, label: 'General',     path: null          },
};

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        const res = await notificationService.getAll();
        if (res?.success) setNotifications(Array.isArray(res.data) ? res.data : []);
        else setError('Failed to load notifications');
        setLoading(false);
    };

    const handleMarkRead = async (n) => {
        if (n.is_read) return;
        await notificationService.markRead(n.notification_id);
        setNotifications(prev => prev.map(x => x.notification_id === n.notification_id ? { ...x, is_read: true } : x));
    };

    const handleMarkAll = async () => {
        await notificationService.markAllRead();
        setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
    };

    const unread = notifications.filter(n => !n.is_read).length;

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 720, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>Notifications</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {unread > 0 ? `${unread} unread` : 'All caught up'}
                    </Typography>
                </Box>
                {unread > 0 && (
                    <Button variant="outlined" size="small" startIcon={<ReadAllIcon />} onClick={handleMarkAll}>
                        Mark all read
                    </Button>
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}><CircularProgress /></Box>
            ) : notifications.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <BellIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                    <Typography color="text.secondary">No notifications yet</Typography>
                </Paper>
            ) : (
                <Paper>
                    <List disablePadding>
                        {notifications.map((n, i) => {
                            const meta = MODULE_META[n.module] || MODULE_META.GENERAL;
                            return (
                                <Box key={n.notification_id}>
                                    <ListItem
                                        onClick={() => handleMarkRead(n)}
                                        sx={{
                                            bgcolor: n.is_read ? 'transparent' : 'action.hover',
                                            cursor: n.is_read ? 'default' : 'pointer',
                                            '&:hover': { bgcolor: 'action.selected' },
                                            py: 2,
                                        }}
                                        secondaryAction={
                                            meta.path && (
                                                <Tooltip title={`Go to ${meta.label}`}>
                                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(meta.path); }}>
                                                        <OpenIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )
                                        }
                                    >
                                        <Box sx={{ mr: 2, color: `${meta.color}.main`, display: 'flex', alignItems: 'center' }}>
                                            {meta.icon}
                                        </Box>
                                        <ListItemText
                                            disableTypography
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                                                    <Typography variant="body1" fontWeight={n.is_read ? 400 : 600}>{n.title}</Typography>
                                                    <Chip label={meta.label} color={meta.color} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                                                    {!n.is_read && <Chip label="New" color="primary" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />}
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary" component="div">{n.message}</Typography>
                                                    <Typography variant="caption" color="text.disabled" component="div">{timeAgo(n.created_at)}</Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {i < notifications.length - 1 && <Divider />}
                                </Box>
                            );
                        })}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default Notifications;
