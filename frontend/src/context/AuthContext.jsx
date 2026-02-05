import { createContext, useContext, useState, useEffect, useRef } from 'react';
import authService from '../services/authService';
import SessionTimeoutWarning from '../components/SessionTimeoutWarning';

const AuthContext = createContext(null);

// Role-based permissions configuration
const ROLE_PERMISSIONS = {
    HR: ['dashboard', 'employees', 'org-chart', 'attendance', 'leave', 'payroll', 'offboarding', 'admin', 'setup'],
    MANAGER: ['dashboard', 'attendance', 'leave', 'offboarding', 'setup'],
    EMPLOYEE: ['dashboard', 'attendance', 'leave', 'offboarding', 'setup'],
};

// Session timeout: 15 minutes in milliseconds
const SESSION_TIMEOUT = 15 * 60 * 1000;
// Warning time: 1 minute before timeout
const WARNING_TIME = 1 * 60 * 1000;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showWarning, setShowWarning] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(60);
    const timeoutRef = useRef(null);
    const warningTimeoutRef = useRef(null);
    const countdownRef = useRef(null);
    const sessionStorageKey = 'hrms_session_active';

    // Reset inactivity timer
    const resetInactivityTimer = () => {
        // Clear existing timeouts
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
        }

        // Hide warning if showing
        setShowWarning(false);

        // Set warning timeout (14 minutes)
        warningTimeoutRef.current = setTimeout(() => {
            setShowWarning(true);
            setRemainingSeconds(60);
            
            // Start countdown
            countdownRef.current = setInterval(() => {
                setRemainingSeconds(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, SESSION_TIMEOUT - WARNING_TIME);

        // Set logout timeout (15 minutes)
        timeoutRef.current = setTimeout(() => {
            console.log('Session expired due to inactivity');
            logout();
        }, SESSION_TIMEOUT);
    };

    // Handle extend session
    const handleExtendSession = () => {
        setShowWarning(false);
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
        }
        resetInactivityTimer();
    };

    // Track user activity
    useEffect(() => {
        if (!user) return;

        // Events that indicate user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        const handleActivity = () => {
            if (!showWarning) {
                resetInactivityTimer();
            }
        };

        // Add event listeners
        events.forEach(event => {
            document.addEventListener(event, handleActivity);
        });

        // Start the timer
        resetInactivityTimer();

        // Cleanup
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (warningTimeoutRef.current) {
                clearTimeout(warningTimeoutRef.current);
            }
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
        };
    }, [user, showWarning]);

    // sessionStorage automatically clears when tab closes
    // Mark session as active when component mounts
    useEffect(() => {
        if (user) {
            sessionStorage.setItem(sessionStorageKey, 'true');
        }
    }, [user]);

    // Check for existing session on mount
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                if (authService.isAuthenticated()) {
                    const storedUser = authService.getStoredUser();
                    if (storedUser) {
                        // Verify token is still valid by calling /auth/me
                        const result = await authService.getCurrentUser();
                        if (result.success) {
                            setUser(storedUser);
                            // Mark session as active
                            sessionStorage.setItem(sessionStorageKey, 'true');
                        } else {
                            // Token is invalid, clear storage
                            await authService.logout();
                        }
                    }
                } else {
                    // No authentication found, ensure clean state
                    await authService.logout();
                }
            } catch (error) {
                console.error('Auth initialization failed:', error);
                await authService.logout();
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (email, password, role) => {
        try {
            setLoading(true);
            const result = await authService.login(email, password, role);
            
            if (result.success) {
                // Check if password change is required BEFORE setting user
                if (result.requires_password_change) {
                    return { 
                        success: true, 
                        requires_password_change: true,
                        user: result.user
                    };
                }
                
                // Only set user and session if password change is NOT required
                setUser(result.user);
                // Mark session as active
                sessionStorage.setItem(sessionStorageKey, 'true');
                
                return { success: true };
            }
            
            return { success: false, error: result.error };
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            await authService.logout();
            setUser(null);
            // Clear session storage
            sessionStorage.removeItem(sessionStorageKey);
            // Clear all timers
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (warningTimeoutRef.current) {
                clearTimeout(warningTimeoutRef.current);
            }
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
            setShowWarning(false);
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (page) => {
        if (!user) return false;
        return ROLE_PERMISSIONS[user.role]?.includes(page) || false;
    };

    const getMenuItems = () => {
        if (!user) return [];
        return ROLE_PERMISSIONS[user.role] || [];
    };

    const isEmployeeActive = () => {
        if (!user) return false;
        // For HR users, always active (they manage employee status)
        if (user.role === 'HR') return true;
        // For employees and managers, check their employee status
        return user.employee_status === 'ACTIVE';
    };

    const isUserActive = () => {
        if (!user) return false;
        return user.user_is_active === 1 || user.user_is_active === true;
    };

    const changePassword = async (currentPassword, newPassword, confirmPassword) => {
        try {
            const result = await authService.changePassword(currentPassword, newPassword, confirmPassword);
            return result;
        } catch (error) {
            console.error('Password change failed:', error);
            return { success: false, error: 'Password change failed. Please try again.' };
        }
    };

    const setUserAfterPasswordChange = (userData) => {
        setUser(userData);
        sessionStorage.setItem(sessionStorageKey, 'true');
    };

    const value = {
        user,
        login,
        logout,
        hasPermission,
        getMenuItems,
        changePassword,
        setUserAfterPasswordChange,
        loading,
        isEmployeeActive,
        isUserActive,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
            <SessionTimeoutWarning
                open={showWarning}
                remainingSeconds={remainingSeconds}
                onExtend={handleExtendSession}
                onLogout={logout}
            />
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Export the AuthContext for direct use in components
export { AuthContext };
