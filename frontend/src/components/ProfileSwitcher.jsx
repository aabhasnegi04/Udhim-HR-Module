import React, { useState } from 'react';
import {
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useProfileSwitching } from '../context/ProfileSwitchingContext';
import { useNavigate } from 'react-router-dom';

const ProfileSwitcher = () => {
  const { user, logout } = useAuth();
  const { 
    currentView, 
    profileInfo, 
    switchView, 
    getViewDisplayName, 
    canSwitchViews,
    getAvailableViews 
  } = useProfileSwitching();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Debug logging
  // console.log('ProfileSwitcher Debug:', {
  //   user: user,
  //   profileInfo: profileInfo,
  //   currentView: currentView,
  //   canSwitchViews: canSwitchViews(),
  //   availableViews: getAvailableViews()
  // });

  const handleClick = (event) => {
    // console.log('Profile button clicked');
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewSwitch = (newView) => {
    console.log(`Switching from ${currentView} to ${newView}`);
    switchView(newView);
    handleClose();
    
    // Navigate to appropriate dashboard based on current URL and new view
    const currentPath = window.location.pathname;
    console.log('Current path:', currentPath);
    
    if (newView === 'HR') {
      // Always navigate to admin dashboard for HR view
      if (!currentPath.startsWith('/admin')) {
        console.log('Navigating to HR dashboard');
        navigate('/admin/dashboard');
      }
    } else if (newView === 'EMPLOYEE') {
      // Navigate to employee dashboard if currently on admin pages
      if (currentPath.startsWith('/admin')) {
        console.log('Navigating to Employee dashboard');
        navigate('/dashboard');
      }
    } else if (newView === 'MANAGER') {
      // Navigate to manager dashboard (could be separate in future)
      if (currentPath.startsWith('/admin')) {
        console.log('Navigating to Manager dashboard');
        navigate('/dashboard');
      }
    }
  };

  const handleLogout = () => {
    // console.log('Logout clicked');
    logout();
    handleClose();
  };

  const handleSettings = () => {
    handleClose();
    navigate('/profile/settings');
  };

  if (!user) {
    return null;
  }

  // Show basic profile even if profileInfo is not available
  const displayName = profileInfo?.full_name || user.email;
  const firstName = displayName.split(' ')[0];
  
  const getViewIcon = (view) => {
    switch (view) {
      case 'HR':
        return <BusinessIcon fontSize="small" />;
      case 'MANAGER':
        return <GroupIcon fontSize="small" />;
      case 'EMPLOYEE':
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  const getViewColor = (view) => {
    switch (view) {
      case 'HR':
        return 'primary';
      case 'MANAGER':
        return 'secondary';
      case 'EMPLOYEE':
      default:
        return 'default';
    }
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderRadius: 2,
          '&:hover': {
            bgcolor: 'action.hover',
          }
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            fontSize: '0.875rem'
          }}
        >
          {firstName.charAt(0).toUpperCase()}
        </Avatar>
        
        {!isMobile && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
              {firstName}
            </Typography>
            {canSwitchViews() && (
              <Chip
                icon={getViewIcon(currentView)}
                label={currentView}
                size="small"
                color={getViewColor(currentView)}
                sx={{ 
                  height: 16, 
                  fontSize: '0.625rem',
                  '& .MuiChip-label': { px: 0.5 },
                  '& .MuiChip-icon': { fontSize: '0.75rem' }
                }}
              />
            )}
          </Box>
        )}
        
        <ArrowDownIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 280,
            mt: 1,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
            }
          }
        }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
          {profileInfo?.employee_code && (
            <Typography variant="caption" color="text.secondary" display="block">
              {profileInfo.employee_code} • {profileInfo.designation}
            </Typography>
          )}
        </Box>

        {/* View Switching Options */}
        {canSwitchViews() && [
          <Box key="switch-header" sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
              Switch View
            </Typography>
          </Box>,
          ...getAvailableViews().map((view) => (
            <MenuItem
              key={view}
              onClick={() => handleViewSwitch(view)}
              selected={currentView === view}
              sx={{
                bgcolor: currentView === view ? 'action.selected' : 'transparent',
              }}
            >
              <ListItemIcon>
                {getViewIcon(view)}
              </ListItemIcon>
              <ListItemText 
                primary={view === 'HR' ? 'HR View' : view === 'MANAGER' ? 'Manager View' : 'Employee View'}
              />
              {currentView === view && (
                <CheckIcon fontSize="small" color="primary" />
              )}
            </MenuItem>
          )),
          <Divider key="divider" />
        ]}

        {/* Settings & Logout */}
        <MenuItem onClick={handleSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>

        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProfileSwitcher;