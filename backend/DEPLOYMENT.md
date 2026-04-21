# Backend Deployment Guide

## Server Details
- **Server:** RDC Server (160.187.80.75)
- **Location:** `veneersoft/backend_new`
- **Service Name:** FaceBackend
- **Port:** 5000

## Pre-Deployment Checklist

- [ ] All database procedures updated (factory attendance, summary report)
- [ ] Code tested locally
- [ ] .env file configured correctly
- [ ] Backup plan ready

## Deployment Steps

### 1. Connect to RDC Server
```powershell
# Use Remote Desktop Connection
mstsc /v:160.187.80.75
```

### 2. Stop the Backend Service
```powershell
# Open PowerShell as Administrator on RDC server
Stop-Service FaceBackend

# Verify service stopped
Get-Service FaceBackend
```

### 3. Backup Current Code
```powershell
# Navigate to veneersoft folder
cd C:/veneersoft/backend_new

# Create backup with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item -Path "app" -Destination "app_backup_$timestamp" -Recurse

# Verify backup created
dir app_backup_*
```

### 4. Upload New Code

**Option A: Using File Transfer**
- Copy the entire `backend/app` folder from your local machine
- Paste it to `C:\veneersoft/backend_newapp` on RDC server (replace existing)

**Option B: Using Git (if repository is set up)**
```powershell
cd C:\veneersoft/backend_new
git pull origin main
```

### 5. Verify Configuration

Check that `.env` file exists and has correct values:
```powershell
cd C:\veneersoft/backend_new
notepad .env
```

Required variables:
```
MASTER_DB_SERVER=your_server
MASTER_DB_NAME=UDHIMTECH
MASTER_DB_USER=your_user
MASTER_DB_PASSWORD=your_password
JWT_SECRET_KEY=your_secret_key
FLASK_ENV=production
```

### 6. Install New Dependencies (if any)
```powershell
cd C:\veneersoft/backend_new
pip install -r requirements.txt
```

### 7. Start the Backend Service
```powershell
Start-Service FaceBackend

# Verify service started
Get-Service FaceBackend

# Check service status
Get-Service FaceBackend | Select-Object Status, StartType
```

### 8. Test the Deployment

**Test 1: Health Check**
```powershell
# From RDC server
curl http://localhost:5000/health
```

**Test 2: From Frontend**
- Open hr.udhim.com
- Login
- Navigate to Attendance > Reports > Factory Reports
- Select Monthly Summary for March 2026
- Click "Excel" button
- Verify grid format with HD showing correctly

**Test 3: Check Logs**
```powershell
# View recent logs
cd C:\veneersoft/backend_new\logs
Get-Content -Path "app.log" -Tail 50
```

## Rollback Plan (if needed)

If something goes wrong:

```powershell
# Stop service
Stop-Service FaceBackend

# Remove new code
Remove-Item -Path "C:\veneersoft/backend_new\app" -Recurse -Force

# Restore backup (use the timestamp from step 3)
Copy-Item -Path "C:\veneersoft/backend_new\app_backup_YYYYMMDD_HHMMSS" -Destination "C:\veneersoft/backend_new\app" -Recurse

# Start service
Start-Service FaceBackend
```

## Post-Deployment Verification

- [ ] Service running: `Get-Service FaceBackend`
- [ ] Health endpoint responding: `curl http://localhost:5000/health`
- [ ] Frontend can connect and login
- [ ] Factory reports export correctly with grid format
- [ ] Half-day logic working (HD shows for late check-ins)
- [ ] No errors in logs

## New Features Deployed

1. **Factory Grid Excel Export**
   - Beautiful formatted Excel with colors and borders
   - Works for both Monthly Summary and Date Range reports
   - Color-coded attendance values (Green=hours, Red=absent, Yellow=half day)

2. **Half-Day Logic Fix**
   - Late check-in (after grace period) = automatic HALF DAY
   - Shows "HD" in reports instead of hours worked
   - 50% pay regardless of total hours

3. **Updated Stored Procedures**
   - `proc_generate_factory_attendance` - new half-day logic
   - `proc_get_attendance_summary_report` - HD display fix

## Troubleshooting

### Service won't start
```powershell
# Check Windows Event Viewer
eventvwr.msc
# Look under Windows Logs > Application

# Check if port is in use
netstat -ano | findstr :5000
```

### Import errors
```powershell
# Reinstall dependencies
cd C:\veneersoft
pip install -r requirements.txt --force-reinstall
```

### Database connection issues
- Verify .env has correct database credentials
- Test connection from server to SQL Server
- Check firewall rules

## Contact

If issues persist:
- Check logs: `C:\veneersoft\logs\app.log`
- Review service status: `Get-Service FaceBackend`
- Contact: [Your contact info]
