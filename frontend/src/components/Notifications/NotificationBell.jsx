import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconButton, Badge, Popover, Box, Typography, List, ListItem,
    ListItemText, Divider, Button, Chip, CircularProgress
} from '@mui/material';
import {
    Notifications as BellIcon,
    Payment as PayrollIcon,
    BeachAccess as LeaveIcon,
    Description as DocIcon,
    Circle as DotIcon,
    DoneAll as ReadAllIcon,
} from '@mui/icons-material';
import notificationService from '../../services/notificationService';
import { useProfileSwitching } from '../../context/ProfileSwitchingContext';

const MODULE_META = {
    PAYROLL:    { color: 'success', icon: <PayrollIcon fontSize="small" />, path: '/payroll'    },
    LEAVE:      { color: 'warning', icon: <LeaveIcon   fontSize="small" />, path: '/leave'      },
    DOCUMENTS:  { color: 'info',    icon: <DocIcon     fontSize="small" />, path: '/documents'  },
    ATTENDANCE: { color: 'primary', icon: <BellIcon    fontSize="small" />, path: '/attendance' },
    GENERAL:    { color: 'default', icon: <BellIcon    fontSize="small" />, path: null          },
};

// Returns the best URL to navigate to based on notification + current view
const getNavTarget = (n, currentView) => {
    const title = n.title || '';
    const isHR = currentView === 'HR';

    switch (n.module) {
        case 'LEAVE':
            if (isHR) {
                // HR: "New Leave Request" or "Leave Cancelled" → go to Approvals tab (index 2)
                if (title.includes('New Leave') || title.includes('Cancelled')) return '/leave?tab=2';
                return '/leave';
            } else {
                // Employee: "Leave Approved/Rejected" → My Leaves tab (index 2)
                // "Leave Request Submitted" → My Leaves tab (index 2)
                // "Leave Cancelled" → My Leaves tab (index 2)
                return '/leave?tab=2';
            }

        case 'PAYROLL':
            if (isHR) return '/payroll?tab=4'; // Process Payroll tab
            return '/payroll?tab=0'; // My Payslips

        case 'DOCUMENTS':
            return '/documents';

        case 'ATTENDANCE':
            if (isHR) {
                // HR: "Regularization Request" → Corrections tab (index 4)
                return '/attendance?tab=4';
            } else {
                // Employee: "Regularization Approved/Rejected" → Corrections tab (index 3)
                return '/attendance?tab=3';
            }

        default:
            return null;
    }
};

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

const NotificationBell = () => {
    const navigate = useNavigate();
    const { currentView } = useProfileSwitching();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const pollRef = useRef(null);

    const fetchCount = async () => {
        const res = await notificationService.getUnreadCount();
        if (res?.success) setUnreadCount(res.data?.unread_count ?? 0);
    };

    const fetchAll = async () => {
        setLoading(true);
        const res = await notificationService.getAll();
        if (res?.success) setNotifications(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
    };

    useEffect(() => {
        fetchCount();
        pollRef.current = setInterval(fetchCount, 30000); // poll every 30s
        return () => clearInterval(pollRef.current);
    }, []);

    const handleOpen = (e) => {
        setAnchorEl(e.currentTarget);
        fetchAll();
    };

    const handleClose = () => setAnchorEl(null);

    const handleClick = async (n) => {
        if (!n.is_read) {
            await notificationService.markRead(n.notification_id);
            setNotifications(prev => prev.map(x => x.notification_id === n.notification_id ? { ...x, is_read: true } : x));
            setUnreadCount(c => Math.max(0, c - 1));
        }
        const target = getNavTarget(n, currentView);
        if (target) { handleClose(); navigate(target); }
    };

    const handleMarkAll = async () => {
        await notificationService.markAllRead();
        setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
        setUnreadCount(0);
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <IconButton onClick={handleOpen} size="small" sx={{ color: 'inherit' }}>
                <Badge badgeContent={unreadCount || null} color="error" max={99}>
                    <BellIcon />
                </Badge>
            </IconButton>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { width: 360, maxHeight: 480, display: 'flex', flexDirection: 'column' } }}
            >
                {/* Header */}
                <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        Notifications {unreadCount > 0 && <Chip label={unreadCount} size="small" color="error" sx={{ ml: 1, height: 18, fontSize: '0.7rem' }} />}
                    </Typography>
                    {unreadCount > 0 && (
                        <Button size="small" startIcon={<ReadAllIcon />} onClick={handleMarkAll} sx={{ fontSize: '0.75rem' }}>
                            Mark all read
                        </Button>
                    )}
                </Box>

                {/* List */}
                <Box sx={{ overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} /></Box>
                    ) : notifications.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <BellIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {notifications.map((n, i) => {
                                const meta = MODULE_META[n.module] || MODULE_META.GENERAL;
                                return (
                                    <Box key={n.notification_id}>
                                        <ListItem
                                            onClick={() => handleClick(n)}
                                            sx={{
                                                cursor: 'pointer',
                                                bgcolor: n.is_read ? 'transparent' : 'action.hover',
                                                '&:hover': { bgcolor: 'action.selected' },
                                                alignItems: 'flex-start',
                                                py: 1.5,
                                            }}
                                        >
                                            <Box sx={{ mr: 1.5, mt: 0.5, color: `${meta.color}.main` }}>{meta.icon}</Box>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {!n.is_read && <DotIcon sx={{ fontSize: 8, color: 'primary.main' }} />}
                                                        <Typography variant="body2" fontWeight={n.is_read ? 400 : 600}>{n.title}</Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography variant="caption" color="text.secondary" display="block">{n.message}</Typography>
                                                        <Typography variant="caption" color="text.disabled">{timeAgo(n.created_at)}</Typography>
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                        {i < notifications.length - 1 && <Divider />}
                                    </Box>
                                );
                            })}
                        </List>
                    )}
                </Box>

                {/* Footer */}
                <Box sx={{ borderTop: 1, borderColor: 'divider', p: 1, textAlign: 'center' }}>
                    <Button size="small" onClick={() => { handleClose(); navigate('/notifications'); }}>
                        View all notifications
                    </Button>
                </Box>
            </Popover>
        </>
    );
};

export default NotificationBell;
