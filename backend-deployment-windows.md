## HR Management System - Local Development Setup

This guide covers running the project locally after cloning from GitHub, plus production deployment steps for Windows servers.

## Local Development Setup (After GitHub Clone)

### Prerequisites
- Python 3.8+ with pip
- Node.js 16+ with npm
- Visual Studio Build Tools (for face_recognition library)
- SQL Server connection details

### Backend Setup
```powershell
# Navigate to backend directory
cd backend

# Install Visual Studio Build Tools first (required for dlib/face_recognition)
# Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
# Select: C++ build tools + Windows SDK

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your database credentials
@"
DB_SERVER=your_server_ip,1433
DB_NAME=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DRIVER={ODBC Driver 18 for SQL Server}
"@ | Set-Content .env -Encoding UTF8

# Run backend
python app.py
```
Backend will run on `http://localhost:5000`

### Frontend Setup
```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local for development
@"
VITE_API_BASE=http://localhost:5000
"@ | Set-Content .env.local -Encoding UTF8

# Run development server
npm run dev
```
Frontend will run on `http://localhost:5173`

### Quick Start Commands
```powershell
# Terminal 1 - Backend
cd backend
venv\Scripts\activate
python app.py

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

---

## Production Deployment (Windows Server)

This section covers deploying to a Windows data-center host that serves `https://veneersoft.in`.

### Production Prerequisites
- Windows Server with RDP access and administrative PowerShell
- Public DNS: `veneersoft.in` → server IP
- Existing IIS with URL Rewrite + ARR modules
- Source code copied locally (`backend/` directory)
- SQL Server connectivity details (kept in `.env`)

### Production Deployment Steps

#### 1. Clean Up Previous Service/Files
```powershell
# Stop & remove old NSSM service
nssm stop attendance-backend
nssm remove attendance-backend confirm

# Backup and wipe existing site contents (keep .well-known for SSL)
cd C:\inetpub\veneersoft.in
$backup = "C:\inetpub\veneersoft.in.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item .\* $backup -Recurse -Exclude '.well-known'
Remove-Item .\backend, .\.venv, .\web.config -Recurse -Force
```

#### 2. Copy Project & Create Virtualenv
```powershell
# Copy the new backend folder into place
# (done manually via RDP file copy before the next commands)

py -m venv C:\inetpub\veneersoft.in\.venv
C:\inetpub\veneersoft.in\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip wheel
cd C:\inetpub\veneersoft.in\backend
pip install -r requirements.txt
pip install waitress tzdata python-dotenv

# .env with SQL connection info
@"
DB_SERVER=103.127.31.218,1433
DB_NAME=hr_str
DB_USERNAME=hradm
DB_PASSWORD=HrStar#1212
DB_DRIVER={ODBC Driver 18 for SQL Server}
"@ | Set-Content .env -Encoding UTF8
```

#### 3. Smoke Test
```powershell
python app.py   # confirm it starts, then Ctrl+C
```

#### 4. Register Waitress as a Service (NSSM)
```powershell
$nssm = "C:\apps\nssm\nssm-2.24\win64\nssm.exe"
$logs = "C:\inetpub\veneersoft.in\logs"
New-Item $logs -ItemType Directory -Force | Out-Null

& $nssm install FaceBackend "C:\inetpub\veneersoft.in\.venv\Scripts\python.exe" `
  "-m waitress --listen=127.0.0.1:8000 app:app"
& $nssm set FaceBackend AppDirectory "C:\inetpub\veneersoft.in\backend"
& $nssm set FaceBackend AppEnvironmentExtra "PYTHONPATH=C:\inetpub\veneersoft.in\backend"
& $nssm set FaceBackend Start SERVICE_AUTO_START
& $nssm set FaceBackend AppStdout "$logs\stdout.log"
& $nssm set FaceBackend AppStderr "$logs\stderr.log"
& $nssm start FaceBackend
```
Check: `Invoke-WebRequest http://127.0.0.1:8000/persons`.

#### 5. IIS Reverse Proxy to Waitress
```powershell
# web.config
@"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxy" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:8000/{R:1}" />
          <serverVariables>
            <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
            <set name="HTTP_X_FORWARDED_PROTO" value="https" />
          </serverVariables>
        </rule>
      </rules>
      <allowedServerVariables>
        <add name="HTTP_X_FORWARDED_HOST" />
        <add name="HTTP_X_FORWARDED_PROTO" />
      </allowedServerVariables>
    </rewrite>
  </system.webServer>
</configuration>
"@ | Set-Content C:\inetpub\veneersoft.in\web.config -Encoding UTF8

Restart-WebAppPool -Name "veneersoft.in"
Restart-WebItem "IIS:\Sites\veneersoft.in"
```
Verify: `Invoke-WebRequest https://veneersoft.in/persons`.

#### 6. Post-Deployment
- Restrict CORS in `app.py` to `https://hr.stpudhim.in`.
- Restart service: `Restart-Service FaceBackend`.
- Upload the built React frontend to the Plesk host (`https://hr.stpudhim.in`) with `VITE_API_BASE=https://veneersoft.in`.
- Monitor logs under `C:\inetpub\veneersoft.in\logs`.

---

## Operations Cheat Sheet

#### Service Control (NSSM)
```powershell
# Status
Get-Service FaceBackend

# Restart (use after updating code or config)
Restart-Service FaceBackend

# Stop / Start
Stop-Service FaceBackend
Start-Service FaceBackend
```

#### Tail Logs
```powershell
# Most recent entries
Get-Content C:\inetpub\veneersoft.in\logs\stdout.log -Tail 50
Get-Content C:\inetpub\veneersoft.in\logs\stderr.log -Tail 50

# Live tail (Ctrl+C to exit)
Get-Content C:\inetpub\veneersoft.in\logs\stdout.log -Wait
```

#### Health Checks
```powershell
# Through Waitress directly
Invoke-WebRequest http://127.0.0.1:8000/persons | Select-Object StatusCode

# Through IIS/HTTPS (production path)
Invoke-WebRequest https://veneersoft.in/persons | Select-Object StatusCode
```

#### IIS Quick Commands
```powershell
# Restart site / app pool if requests hang
Restart-WebAppPool -Name "veneersoft.in"
Restart-WebItem "IIS:\Sites\veneersoft.in"

# View current bindings
Get-Website -Name "veneersoft.in" | Select-Object Name, Bindings
```

#### Updating Code
```powershell
# from backend folder
git pull                                  # or copy new files
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt           # if dependencies changed
Restart-Service FaceBackend
```

#### Emergency Rollback (from backup created earlier)
```powershell
Stop-Service FaceBackend
Copy-Item C:\inetpub\veneersoft.in.backup_TIMESTAMP\backend\* C:\inetpub\veneersoft.in\backend\ -Recurse -Force
Restart-Service FaceBackend
```

#### Certificate Renewal (win-acme)
```powershell
C:\apps\wacme\wacs.exe --renew
```

Keep firewall ports 80/443 open, back up `registered_faces/` regularly, and rotate credentials stored in `.env` as needed.

