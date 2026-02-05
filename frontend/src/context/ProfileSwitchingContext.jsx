import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ProfileSwitchingContext = createContext();

export const useProfileSwitching = () => {
  const context = useContext(ProfileSwitchingContext);
  if (!context) {
    throw new Error('useProfileSwitching must be used within a ProfileSwitchingProvider');
  }
  return context;
};

export const ProfileSwitchingProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('EMPLOYEE');
  const [profileInfo, setProfileInfo] = useState(null);

  // Initialize profile switching info from user data
  useEffect(() => {
    if (user?.profile_switching) {
      setProfileInfo(user.profile_switching);
      
      const defaultView = user.profile_switching.default_view || 'EMPLOYEE';
      setCurrentView(defaultView);
      
      // Store initial preference in localStorage
      localStorage.setItem('preferred_view', defaultView);
    }
  }, [user]);

  const switchView = (newView) => {
    if (profileInfo?.available_views?.includes(newView)) {
      setCurrentView(newView);
      
      // Store preference in localStorage for API service access
      localStorage.setItem('preferred_view', newView);
      console.log(`🔄 Switched to ${newView} view`);
      
    } else {
      console.warn(`⚠️ Cannot switch to ${newView} - not available for this user`);
    }
  };

  const getViewDisplayName = (view) => {
    const viewNames = {
      'EMPLOYEE': '👤 Employee View',
      'HR': '🏢 HR View',
      'MANAGER': '👥 Manager View'
    };
    return viewNames[view] || view;
  };

  const getViewIcon = (view) => {
    const viewIcons = {
      'EMPLOYEE': '👤',
      'HR': '🏢',
      'MANAGER': '👥'
    };
    return viewIcons[view] || '👤';
  };

  const canSwitchViews = () => {
    return profileInfo?.can_switch && profileInfo?.available_views?.length > 1;
  };

  const getAvailableViews = () => {
    return profileInfo?.available_views || ['EMPLOYEE'];
  };

  const getCurrentViewPermissions = () => {
    const permissions = {
      'EMPLOYEE': {
        canViewOwnData: true,
        canEditOwnProfile: true,
        canApplyLeave: true,
        canViewOwnAttendance: true,
        canMarkAttendance: true
      },
      'HR': {
        canManageEmployees: true,
        canApproveLeaves: true,
        canViewAllAttendance: true,
        canGenerateReports: true,
        canManageSystem: true,
        canViewDashboard: true,
        cannotApproveOwnLeave: true // Special restriction
      },
      'MANAGER': {
        canViewTeamData: true,
        canApproveTeamLeaves: true,
        canViewTeamAttendance: true,
        canGenerateTeamReports: true,
        cannotEditTeamProfiles: true // Special restriction
      }
    };

    return permissions[currentView] || permissions['EMPLOYEE'];
  };

  const value = {
    currentView,
    profileInfo,
    switchView,
    getViewDisplayName,
    getViewIcon,
    canSwitchViews,
    getAvailableViews,
    getCurrentViewPermissions,
    
    // Helper methods
    isEmployeeView: () => currentView === 'EMPLOYEE',
    isHRView: () => currentView === 'HR',
    isManagerView: () => currentView === 'MANAGER'
  };

  return (
    <ProfileSwitchingContext.Provider value={value}>
      {children}
    </ProfileSwitchingContext.Provider>
  );
};