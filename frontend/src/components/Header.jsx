import { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    InputBase,
    Badge,
    Box,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Search as SearchIcon,
    Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import ProfileSwitcher from './ProfileSwitcher';

const Header = ({ onMenuClick }) => {
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
                        '&:hover': {
                            bgcolor: 'action.hover',
                        }
                    }}
                >
                    <MenuIcon />
                </IconButton>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mr: { xs: 2, sm: 4 },
                        py: 1,
                    }}
                >
                    <img
                        src="https://www.udhim.com/logo.png"
                        alt="Udhim Logo"
                        style={{
                            height: isMobile ? '40px' : '56px',
                            width: 'auto',
                            objectFit: 'contain',
                        }}
                    />
                </Box>

                {/* Search Bar */}
                {!isMobile && (
                    <Box
                        sx={{
                            position: 'relative',
                            borderRadius: 1,
                            bgcolor: 'action.hover',
                            '&:hover': {
                                bgcolor: 'action.selected',
                            },
                            mr: 2,
                            ml: 0,
                            width: '100%',
                            maxWidth: 400,
                        }}
                    >
                        <Box
                            sx={{
                                padding: theme.spacing(0, 2),
                                height: '100%',
                                position: 'absolute',
                                pointerEvents: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <SearchIcon color="action" />
                        </Box>
                        <InputBase
                            placeholder="Search employees..."
                            sx={{
                                color: 'inherit',
                                width: '100%',
                                '& .MuiInputBase-input': {
                                    padding: theme.spacing(1, 1, 1, 0),
                                    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
                                    transition: theme.transitions.create('width'),
                                    width: '100%',
                                },
                            }}
                        />
                    </Box>
                )}

                <Box sx={{ flexGrow: 1 }} />

                {/* Right side icons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                    {/* Mobile search icon */}
                    {isMobile && (
                        <IconButton color="inherit" size="small">
                            <SearchIcon />
                        </IconButton>
                    )}
                    
                    <IconButton color="inherit" size={isMobile ? "small" : "medium"}>
                        <Badge badgeContent={3} color="error">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>

                    {/* Profile Switcher Component */}
                    <ProfileSwitcher />
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
