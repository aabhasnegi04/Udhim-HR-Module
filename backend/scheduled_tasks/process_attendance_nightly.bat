@echo off
:: Nightly Factory Attendance Processor
:: Schedule this in Windows Task Scheduler to run daily at 00:05 AM
:: Action: Run this .bat file
:: Trigger: Daily at 00:05

curl -s -X POST http://127.0.0.1:5000/attendance/factory/process-yesterday ^
     -H "X-Gateway-Secret: %GATEWAY_SECRET%" ^
     -H "Content-Type: application/json" ^
     >> "%~dp0nightly_log.txt" 2>&1

echo [%date% %time%] Nightly attendance processing triggered >> "%~dp0nightly_log.txt"
