# Backend Deployment Script for RDC Server
# Run this script ON THE RDC SERVER (160.187.80.75) as Administrator

param(
    [switch]$Backup = $true,
    [switch]$SkipServiceStop = $false
)

$ErrorActionPreference = "Stop"
$VeneersoftPath = "C:\veneersoft"
$ServiceName = "FaceBackend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Step 1: Stop Service
if (-not $SkipServiceStop) {
    Write-Host "[1/6] Stopping $ServiceName service..." -ForegroundColor Yellow
    try {
        Stop-Service $ServiceName -ErrorAction Stop
        Start-Sleep -Seconds 3
        $status = (Get-Service $ServiceName).Status
        Write-Host "Service status: $status" -ForegroundColor Green
    } catch {
        Write-Host "WARNING: Could not stop service: $_" -ForegroundColor Red
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne 'y') { exit 1 }
    }
} else {
    Write-Host "[1/6] Skipping service stop (SkipServiceStop flag set)" -ForegroundColor Yellow
}

# Step 2: Backup
if ($Backup) {
    Write-Host "[2/6] Creating backup..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupPath = "$VeneersoftPath\app_backup_$timestamp"
    
    if (Test-Path "$VeneersoftPath\app") {
        Copy-Item -Path "$VeneersoftPath\app" -Destination $backupPath -Recurse
        Write-Host "Backup created: $backupPath" -ForegroundColor Green
    } else {
        Write-Host "WARNING: No existing app folder found to backup" -ForegroundColor Yellow
    }
} else {
    Write-Host "[2/6] Skipping backup" -ForegroundColor Yellow
}

# Step 3: Verify new code exists
Write-Host "[3/6] Verifying new code..." -ForegroundColor Yellow
$currentPath = Get-Location
$newAppPath = Join-Path $currentPath "app"

if (-not (Test-Path $newAppPath)) {
    Write-Host "ERROR: New app folder not found at: $newAppPath" -ForegroundColor Red
    Write-Host "Please run this script from the backend directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "New code found at: $newAppPath" -ForegroundColor Green

# Step 4: Deploy new code
Write-Host "[4/6] Deploying new code..." -ForegroundColor Yellow
$deployPath = "$VeneersoftPath\app"

if (Test-Path $deployPath) {
    Write-Host "Removing old app folder..." -ForegroundColor Yellow
    Remove-Item -Path $deployPath -Recurse -Force
}

Write-Host "Copying new app folder..." -ForegroundColor Yellow
Copy-Item -Path $newAppPath -Destination $deployPath -Recurse
Write-Host "Code deployed successfully!" -ForegroundColor Green

# Step 5: Verify .env
Write-Host "[5/6] Checking .env file..." -ForegroundColor Yellow
$envPath = "$VeneersoftPath\.env"

if (Test-Path $envPath) {
    Write-Host ".env file exists" -ForegroundColor Green
} else {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file at: $envPath" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') { exit 1 }
}

# Step 6: Start Service
Write-Host "[6/6] Starting $ServiceName service..." -ForegroundColor Yellow
try {
    Start-Service $ServiceName -ErrorAction Stop
    Start-Sleep -Seconds 5
    $status = (Get-Service $ServiceName).Status
    Write-Host "Service status: $status" -ForegroundColor Green
    
    if ($status -eq "Running") {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "Deployment Successful!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Service is not running!" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Could not start service: $_" -ForegroundColor Red
    Write-Host "Check logs at: $VeneersoftPath\logs\app.log" -ForegroundColor Yellow
    exit 1
}

# Test endpoint
Write-Host ""
Write-Host "Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 10
    Write-Host "Health check: OK (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Health check failed: $_" -ForegroundColor Red
    Write-Host "Service may still be starting up..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test from frontend: hr.udhim.com" -ForegroundColor White
Write-Host "2. Check Factory Reports > Monthly Summary" -ForegroundColor White
Write-Host "3. Verify Excel export with grid format" -ForegroundColor White
Write-Host "4. Check logs if any issues: $VeneersoftPath\logs\app.log" -ForegroundColor White
Write-Host ""
