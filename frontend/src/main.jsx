import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { ProfileSwitchingProvider } from './context/ProfileSwitchingContext';
import theme from './theme';
import App from './App.jsx';

// ── Dynamic favicon based on VITE_COMPANY_LOGO ────────────────────────────
const companyLogo = import.meta.env.VITE_COMPANY_LOGO;
if (companyLogo) {
  // Remove all existing favicon links
  document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon'], link[rel='manifest']")
    .forEach(el => el.remove());

  // Set the company logo as favicon
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = companyLogo.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  link.href = companyLogo;
  document.head.appendChild(link);

  // Also set apple-touch-icon
  const apple = document.createElement('link');
  apple.rel = 'apple-touch-icon';
  apple.href = companyLogo;
  document.head.appendChild(apple);
}
// ─────────────────────────────────────────────────────────────────────────

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
