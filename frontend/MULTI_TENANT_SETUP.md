# Multi-Tenant Frontend Setup Guide

## Overview

Each client gets their own frontend build with customized branding and configuration.

## Environment Variables

All client-specific configuration is managed through environment variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_BASE` | Backend API URL | `https://veneersoft.in` |
| `VITE_COMPANY_CODE` | Tenant identifier | `udhim`, `finewood` |
| `VITE_COMPANY_NAME` | Company display name | `Udhim Technology`, `Fine Wood Products` |
| `VITE_COMPANY_LOGO` | Logo URL | `https://www.udhim.com/logo.png` |

## Where These Variables Are Used

### 1. Browser Title (`index.html`)
```html
<title><%- title %> HRMS</title>
```
- Uses `VITE_COMPANY_NAME`
- Example: "Udhim Technology HRMS"

### 2. Header Component (`src/components/Header.jsx`)
```jsx
<img src={import.meta.env.VITE_COMPANY_LOGO} 
     alt={import.meta.env.VITE_COMPANY_NAME} />
```
- Displays company logo and name

### 3. Sidebar Component (`src/components/Sidebar.jsx`)
```jsx
<img src={import.meta.env.VITE_COMPANY_LOGO} 
     alt={import.meta.env.VITE_COMPANY_NAME} />
```
- Displays company logo in collapsed/expanded sidebar

### 4. API Calls (All Services)
```javascript
headers: {
  'X-Company-Code': import.meta.env.VITE_COMPANY_CODE
}
```
- Identifies which tenant database to use
- Used in every API request

### 5. Employee Photos
```javascript
`${VITE_API_BASE}/employees/${id}/photo?company=${VITE_COMPANY_CODE}`
```
- Company-specific photo storage

## Setting Up a New Client

### Step 1: Create Environment File

Create `.env.production` in the `frontend` folder:

```env
VITE_API_BASE=https://veneersoft.in
VITE_COMPANY_CODE=clientcode
VITE_COMPANY_NAME=Client Company Name
VITE_COMPANY_LOGO=https://www.client.com/logo.png
```

### Step 2: Build for Production

```bash
cd frontend
npm run build
```

This creates a `dist` folder with the compiled application.

### Step 3: Deploy to Plesk

1. Upload `dist` folder contents to client's domain folder
2. Configure domain in Plesk (e.g., `hr.client.com`)
3. Set up SSL certificate
4. Test the deployment

## Example Configurations

### UDHIM Technology
```env
VITE_API_BASE=https://veneersoft.in
VITE_COMPANY_CODE=udhim
VITE_COMPANY_NAME=Udhim Technology
VITE_COMPANY_LOGO=https://www.udhim.com/logo.png
```
**Domain:** hr.udhim.com

### Fine Wood Products
```env
VITE_API_BASE=https://veneersoft.in
VITE_COMPANY_CODE=finewood
VITE_COMPANY_NAME=Fine Wood Products
VITE_COMPANY_LOGO=https://www.finewood.com/logo.png
```
**Domain:** hr.finewood.com

### Laminar Composites
```env
VITE_API_BASE=https://veneersoft.in
VITE_COMPANY_CODE=laminar
VITE_COMPANY_NAME=Laminar Composites
VITE_COMPANY_LOGO=https://www.laminar.com/logo.png
```
**Domain:** hrlaminar.vdfg.in

## Development vs Production

### Development (`.env.local`)
- Uses `http://localhost:5000` for API
- Hot reload enabled
- Debug mode active

### Production (`.env.production`)
- Uses production API URL
- Optimized build
- No debug information

## Troubleshooting

### Logo Not Showing
- Check `VITE_COMPANY_LOGO` URL is accessible
- Verify CORS settings on logo host
- Check browser console for errors

### Wrong Company Data
- Verify `VITE_COMPANY_CODE` matches database tenant
- Check backend logs for company code in requests
- Ensure `.env.production` is used for build

### Title Not Updating
- Rebuild the application: `npm run build`
- Clear browser cache
- Check `vite.config.js` has HTML plugin configured

## Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## File Checklist

Before deploying a new client, ensure:

- [ ] `.env.production` created with correct values
- [ ] Company logo URL is accessible
- [ ] Company code exists in master database
- [ ] Tenant database created and configured
- [ ] Domain configured in Plesk
- [ ] SSL certificate installed
- [ ] Build completed successfully
- [ ] Deployment tested

## Security Notes

- Never commit `.env.local` or `.env.production` to git
- Keep `.env.example` updated as template
- Company codes should be lowercase, no spaces
- Logo URLs should use HTTPS
- API base URL must use HTTPS in production
