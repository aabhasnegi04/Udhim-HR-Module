import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { ProfileSwitchingProvider } from './context/ProfileSwitchingContext';
import theme from './theme';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ProfileSwitchingProvider>
          <App />
        </ProfileSwitchingProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
