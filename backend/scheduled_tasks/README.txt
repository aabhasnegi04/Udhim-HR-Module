NIGHTLY ATTENDANCE PROCESSING - SETUP INSTRUCTIONS
===================================================

This runs automatically every night to process factory attendance.

SETUP (one time, done by IT):
1. Open Windows Task Scheduler
2. Create Basic Task
3. Name: "HRMS Nightly Attendance"
4. Trigger: Daily at 00:05 AM
5. Action: Start a program
6. Program: C:\path\to\backend\scheduled_tasks\process_attendance_nightly.bat
7. Set environment variable GATEWAY_SECRET to match your .env value

That's it. HR doesn't need to do anything after this is set up.
Logs are saved to: scheduled_tasks/nightly_log.txt
