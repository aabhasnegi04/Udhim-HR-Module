Project Name: Enterprise HRMS – Phase 1 (Authentication & Role-Based UI)

🔧 TECH STACK (STRICT – DO NOT CHANGE)

Framework: React JS

Language: JavaScript (ES6+)

UI Library: Material UI (MUI v5)

Routing: React Router

State Management: React Context (AuthContext)

Styling: Material UI theming only

Backend: NOT REQUIRED (Frontend UI only)

🎯 OBJECTIVE

Create a modern, professional, beautiful HRMS web application that works perfectly on both desktop and mobile.

The app must look:

Enterprise-grade

Clean and minimal

Premium SaaS-style

HR-friendly & easy to use

This phase focuses ONLY on:

Login

Role-based UI

App layout

Navigation

Responsiveness

❌ No backend logic
❌ No API integration
❌ Use mock/dummy data only

👤 USER ROLES (VERY IMPORTANT)

HR Admin

Manager

Employee

UI and navigation must change based on role.

🧩 CORE FEATURES TO BUILD (PHASE 1 ONLY)
1️⃣ AUTHENTICATION (UI ONLY)
Login Page

Clean, centered layout

Professional HRMS branding

Fields:

Email

Password

Role selector (HR / Manager / Employee)

Login button

No validation logic

On login:

Store user + role in AuthContext

Redirect to Dashboard

✨ Must look premium and modern

2️⃣ GLOBAL APP LAYOUT
Header (Top Bar)

App title / logo

Global employee search (dummy)

Notification icon

Profile avatar dropdown:

Name

Role

Logout

Sidebar (Left Navigation)

Collapsible

Icon + label

Smooth animations

Visible items depend on role

3️⃣ ROLE-BASED SIDEBAR NAVIGATION

Use this configuration exactly:

Menu	HR	Manager	Employee
Dashboard	✅	✅	✅
Employees	✅	❌	❌
Attendance	✅	✅	❌
Leave	✅	✅	✅
Payroll	✅	❌	❌
Admin	✅	❌	❌
Setup	✅	❌	❌

Sidebar should automatically hide unauthorized links.

4️⃣ ROUTING & ACCESS CONTROL
Routes:

/login (public)

/dashboard

/employees

/attendance

/leave

/payroll

/admin

/setup

Route Rules:

Non-logged users → redirect to /login

Users cannot access pages they are not authorized for

Even direct URL access must be blocked (UI level)

5️⃣ DASHBOARD (ROLE-WISE)

Create three different dashboards:

HR Dashboard

Total employees

Attendance summary

Pending approvals

Quick access cards

Manager Dashboard

Team attendance

Pending approvals

Leave requests

Employee Dashboard

Attendance status

Leave balance

Profile shortcut

Dashboards should use:

Cards

Icons

Charts (simple UI placeholders)

Professional spacing

📐 RESPONSIVENESS (VERY IMPORTANT)

Desktop first

Mobile responsive:

Sidebar becomes drawer

Header adapts

Cards stack vertically

No horizontal scrolling

Touch-friendly UI

🎨 DESIGN GUIDELINES (MANDATORY)
Visual Style

Corporate SaaS look

Neutral color palette

Primary accent color

Rounded cards & buttons

Clear typography hierarchy

UX

Clean spacing

Material UI components only

Status chips (Active, Pending, Approved)

Loading skeletons (UI only)

Empty states

📁 REQUIRED FOLDER STRUCTURE
src/
│── context/
│   └── AuthContext.jsx
│
│── routes/
│   └── ProtectedRoute.jsx
│
│── components/
│   ├── Sidebar.jsx
│   ├── Header.jsx
│   └── Layout.jsx
│
│── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Employees.jsx
│   ├── Attendance.jsx
│   ├── Leave.jsx
│   ├── Payroll.jsx
│   ├── Admin.jsx
│   └── Setup.jsx
│
│── App.jsx
│── main.jsx

🎁 EXPECTED OUTPUT

Fully working React frontend

Professional UI

Role-based navigation

Clean, scalable architecture

Mobile & desktop responsive

Ready for backend integration later

🚫 DO NOT DO

No backend logic

No authentication API

No database

No business logic

Build this as PHASE 1 only.
Future modules (Employee, Attendance, Payroll logic) will come later.



NOW PHASE 2

Phase 2 (Employee Directory & Profile)

🔧 TECH STACK (STRICT – SAME AS PHASE 1)

Framework: React JS

Language: JavaScript (ES6+)

UI Library: Material UI (MUI v5)

Routing: React Router

State Management: React Context (reuse AuthContext)

Backend: NOT REQUIRED (mock data only)

🎯 OBJECTIVE

Build a professional, enterprise-grade Employee Management UI that:

Feels like a real HR product

Is fast, clean, and elegant

Works perfectly on desktop + mobile

Becomes the central hub for attendance, leave, payroll later

This phase focuses ONLY on:

Employee Directory

Employee Profile (full 360° view)

Org Chart (basic)

👤 ROLE ACCESS (IMPORTANT)
Feature	HR	Manager	Employee
Employee Directory	✅	❌	❌
View Employee Profile	✅	✅ (team only UI)	❌
View Own Profile	❌	❌	✅
Edit Employee Info	UI only (HR)	❌	❌
🧩 MODULES TO BUILD (PHASE 2 ONLY)
1️⃣ EMPLOYEE DIRECTORY
UI REQUIREMENTS

Professional table layout

Clean spacing & typography

Search + filters at top

Table Columns

Employee ID

Name (avatar + name)

Department

Designation

Reporting Manager

Status (Active / Inactive)

Action (View)

Functional UI

Search by:

Name

Employee ID

Filter by:

Department

Status

Pagination

Row click → open Employee Profile

✨ Must look like an enterprise HR dashboard

2️⃣ EMPLOYEE PROFILE (CORE SCREEN)

This screen is the heart of HRMS

Profile Header

Employee avatar

Name

Designation

Department

Employee ID

Status badge

Quick actions (Edit, Download Docs – UI only)

TAB-BASED LAYOUT (MANDATORY)

Use Material UI Tabs with smooth transitions.

🟦 TAB 1: Personal Information

Name

Date of Birth

Gender

Phone

Email

Address

Emergency Contact

👉 Read-only UI

🟦 TAB 2: Official Information

Employee ID

Date of Joining

Department

Designation

Reporting Manager

Employment Type

Work Location

🟦 TAB 3: Attendance (Preview)

Monthly attendance summary

Present / Absent / Late count

Mini table (last 7 days)

“View Full Attendance” CTA (future)

🟦 TAB 4: Leave

Leave balance cards

Leave history table

Status chips (Approved / Pending / Rejected)

🟦 TAB 5: Salary (Read-only UI)

Salary structure summary

Earnings vs deductions cards

Payslip list (dummy)

🟦 TAB 6: Documents

Uploaded documents list

File type icon

Download button (UI)

🟦 TAB 7: Letters

Offer letter

Appointment letter

Relieving letter

Download icons

3️⃣ ORGANIZATION CHART
UI REQUIREMENTS

Clean org tree layout

CEO → Managers → Employees

Expand / collapse nodes

Search employee → highlight position

Clicking node opens employee profile

✨ Keep simple but visually clean

4️⃣ RESPONSIVENESS (MANDATORY)
Desktop

Two-column profile layout

Tabs horizontal

Table view for lists

Mobile

Tabs become scrollable

Tables become cards

Profile header stacked

Org chart collapses to vertical

No horizontal scrolling ❌
Touch-friendly UI ✅

🎨 DESIGN GUIDELINES
Look & Feel

Enterprise SaaS

Minimal but rich

White/neutral background

Subtle shadows

Rounded corners

Professional icons

UX

Loading skeletons

Empty states

Clear typography hierarchy

Status chips and badges

📁 REQUIRED FOLDER STRUCTURE (PHASE 2)
src/
│── pages/
│   ├── Employees/
│   │   ├── EmployeeList.jsx
│   │   ├── EmployeeProfile.jsx
│   │
│   └── OrgChart.jsx
│
│── components/
│   ├── Employee/
│   │   ├── ProfileHeader.jsx
│   │   ├── PersonalInfo.jsx
│   │   ├── OfficialInfo.jsx
│   │   ├── AttendancePreview.jsx
│   │   ├── LeavePreview.jsx
│   │   ├── SalaryPreview.jsx
│   │   ├── DocumentsTab.jsx
│   │   └── LettersTab.jsx

🚫 OUT OF SCOPE

No backend API

No CRUD logic

No permissions logic beyond UI

No real data persistence

🎁 EXPECTED OUTPUT

Enterprise-grade Employee Directory

Beautiful Employee Profile page

Fully responsive layout

Clean React component structure

Ready for Attendance, Leave & Payroll integration

🔥 STRONG ADVICE (IMPORTANT)

Spend maximum polish on Employee Profile UI.
This page will be used daily by HR and defines product quality.


NOW PHASE 3

Phase 3 (Attendance Management)

🔧 TECH STACK (STRICT – SAME AS PREVIOUS PHASES)

Framework: React JS

Language: JavaScript (ES6+)

UI Library: Material UI (MUI v5)

Routing: React Router

State Management: React Context

Charts (UI only): Any lightweight chart (MUI-compatible)

Backend: NOT REQUIRED (use mock data & placeholders)

🎯 OBJECTIVE

Build a professional, enterprise-grade Attendance Management UI that:

Feels reliable and HR-friendly

Scales visually for hundreds of employees

Works perfectly on desktop & mobile

Is ready to integrate with face-recognition attendance APIs later

This phase focuses ONLY on Attendance UI & flows.

👤 ROLE ACCESS (MANDATORY)
Feature	                 HR  Manager Employee
Attendance Dashboard	 ✅	  ✅	  ❌
Bulk Attendance Upload	 ✅	  ❌	  ❌
Manual Attendance Mark	 ✅	  ✅	  ❌
Attendance Regularization✅	  ✅	  ✅
View Own Attendance	     ❌	  ❌	  ✅
Attendance Reports	     ✅	  ✅	  ❌
Holiday Management	     ✅	  ❌	  ❌

🧩 MODULES TO BUILD (PHASE 3 ONLY)
1️⃣ ATTENDANCE DASHBOARD
UI REQUIREMENTS

Clean dashboard layout

Summary cards at top:

Total Present Today

Absent

Late

On Leave

Date selector

Department filter

Visuals

Status chips (Present, Absent, Late, Leave)

Small charts (UI only)

2️⃣ BULK ATTENDANCE UPLOAD (HR ONLY)
UI FLOW

Upload Excel file UI

Show column mapping preview:

Employee ID

Date

Check-in

Check-out

Status

Validation result modal:

Successful rows

Failed rows with error reason

Final “Confirm Upload” button (UI only)

✨ Must look reliable and enterprise-safe

3️⃣ MANUAL ATTENDANCE MARKING
UI FEATURES

Search employee by:

Name

Employee ID

Attendance form:

Date picker

Status selector:

Present

Absent

Half Day

Work From Home

Check-in / Check-out time pickers

Notes field

Save button (UI only)

4️⃣ ATTENDANCE TABLE (CORE SCREEN)
Table Views

Day-wise view

Month-wise view

Employee-wise view

Table Columns

Employee Name

Date

Check-in

Check-out

Working Hours

Status

Action (Edit)

UX

Status badges

Sticky headers

Pagination

Mobile → card view

5️⃣ ATTENDANCE REGULARIZATION
Employee UI

Apply attendance correction:

Date

Issue type (Missed punch, Wrong status)

Reason

View request status:

Pending

Approved

Rejected

Manager / HR UI

Approval screen

Timeline view:

Employee → Manager → HR

Approve / Reject buttons

HR override option

6️⃣ HOLIDAY LIST MANAGEMENT (HR)
UI FEATURES

Upload annual holiday calendar (Excel UI)

Holiday list table:

Date

Holiday name

Type (National / Optional)

Holiday badge auto-shown in attendance table

7️⃣ ATTENDANCE REPORTS
Reports UI

Monthly attendance summary

Late coming report

Absentee report

Department-wise report

Export Options (UI only)

Excel

PDF

8️⃣ EMPLOYEE ATTENDANCE VIEW (EMPLOYEE PORTAL)
UI FEATURES

Monthly calendar view

Color-coded attendance

Summary cards:

Present days

Leaves

Absents

Regularization request CTA

📐 RESPONSIVENESS (MANDATORY)
Desktop & Mobile

Tables & dashboards

Side-by-side filters

Hover tooltips

Mobile

Tables → cards

Filters → bottom sheet

Floating action buttons for “Mark Attendance”

No horizontal scrolling ❌

🎨 DESIGN GUIDELINES
Look & Feel

Enterprise SaaS design

Trust-focused UI (HR confidence)

Subtle shadows

Rounded cards

Consistent spacing

UX Enhancements

Loading skeletons

Empty states

Status color consistency

Clear form validation UI (visual only)

📁 REQUIRED FOLDER STRUCTURE (PHASE 3)
src/
│── pages/
│   └── Attendance/
│       ├── AttendanceDashboard.jsx
│       ├── AttendanceTable.jsx
│       ├── BulkUpload.jsx
│       ├── ManualAttendance.jsx
│       ├── Regularization.jsx
│       ├── HolidayManagement.jsx
│       └── AttendanceReports.jsx
│
│── components/
│   └── Attendance/
│       ├── AttendanceCard.jsx
│       ├── StatusChip.jsx
│       ├── AttendanceCalendar.jsx
│       └── RegularizationTimeline.jsx

🚫 OUT OF SCOPE

No backend API calls

No Excel parsing logic

No face recognition logic

No business rules

🎁 EXPECTED OUTPUT

Full attendance module UI

Professional dashboards

HR-ready bulk upload screens

Clean regularization workflow

Fully responsive design

Ready for Flask backend integration

🔥 VERY IMPORTANT ADVICE

Design attendance UI assuming:

500+ employees

Daily HR usage

Zero tolerance for confusion

Attendance screens must feel robust and trustworthy.


NOW TIME FOR PHASE 4 

Phase 4 (Leave Management)

🔧 TECH STACK (STRICT – SAME AS PREVIOUS PHASES)

Framework: React JS

Language: JavaScript (ES6+)

UI Library: Material UI (MUI v5)

Routing: React Router

State Management: React Context

Charts (UI only): Lightweight charts or MUI-compatible

Backend: NOT REQUIRED (mock data only)

🎯 OBJECTIVE

Build a clean, intuitive, enterprise-grade Leave Management UI that:

Is easy for employees to apply leave

Is efficient for managers & HR to approve

Clearly shows balances & statuses

Works seamlessly on desktop and mobile

This phase focuses ONLY on Leave UI & workflows.

👤 ROLE ACCESS (MANDATORY)
Feature	                    HR	Manager	Employee
View Leave Dashboard	      ✅	  ✅	    ✅
Apply Leave	                ❌	  ❌	    ✅
Approve / Reject Leave	    ✅	  ✅	    ❌
HR Override Leave	          ✅	  ❌	    ❌
Edit / Cancel Leave	        ✅	  ❌	    ✅ (own)
Leave Reports	              ✅	  ❌	    ❌
Leave Balance Adjustment	  ✅	  ❌	    ❌


🧩 MODULES TO BUILD (PHASE 4 ONLY)
1️⃣ LEAVE DASHBOARD
UI REQUIREMENTS

Role-aware dashboard layout

Employee Dashboard

Leave balance cards:

Casual Leave

Sick Leave

Earned Leave

Upcoming approved leaves

“Apply Leave” primary CTA

Recent leave requests with status

Manager Dashboard

Pending approvals list

Team leave calendar (mini)

Leave summary stats

HR Dashboard

Total leave requests

Pending / Approved / Rejected counts

Department-wise leave load

2️⃣ APPLY LEAVE (EMPLOYEE PORTAL)
UI FORM

Leave type selector

Date range picker

Auto-calculated number of days

Reason textarea

Attachment upload (optional UI)

Submit button

UX BEHAVIOR (UI ONLY)

Show available balance per leave type

Warning UI if balance is low

Confirmation modal before submission

3️⃣ LEAVE REQUEST LIST
TABLE/CARD VIEW

Leave Type

From → To

Total Days

Applied On

Status (Pending / Approved / Rejected / Cancelled)

Action:

View

Edit

Cancel (rules UI-only)

MOBILE

Card-based layout

Status color indicators

4️⃣ LEAVE APPROVAL WORKFLOW (MANAGER + HR)
APPROVAL SCREEN

List of pending requests

Filter by:

Employee

Department

Date

Request detail drawer:

Employee info

Leave details

Reason

Leave balance snapshot

ACTIONS

Approve

Reject (mandatory comment)

Forward to HR (manager → HR)

STATUS FLOW UI
Applied → Manager Approved → HR Approved → Final


HR should have:

Override controls

Manual status update UI

5️⃣ EDIT / CANCEL LEAVE
EMPLOYEE

Edit pending leave

Withdraw leave request

Confirmation prompt

HR

Modify dates

Change leave type

Adjust status manually

Update leave balance UI

6️⃣ LEAVE CALENDAR VIEW
UI FEATURES

Monthly calendar view

Color-coded leave types

Team view (Manager)

Department view (HR)

Clicking a date:

Shows employees on leave

Leave details popup

7️⃣ LEAVE REPORTS (HR)
REPORT TYPES

Leave Register

Leave Balance Report

Monthly Leave Summary

Department-wise Leave Usage

UI

Filters:

Date range

Department

Leave type

Export buttons:

Excel

PDF (UI only)

📐 RESPONSIVENESS (MANDATORY)
Desktop

Tables + filters

Side drawers for details

Calendar month view

Mobile

Cards instead of tables

Bottom sheets for filters

Floating “Apply Leave” button

Swipe-friendly calendar

No horizontal scroll ❌
Touch-first UI ✅

🎨 DESIGN GUIDELINES
Visual Style

Calm & human-centric design

Soft colors for leave types

Clear status chips:

Pending (Amber)

Approved (Green)

Rejected (Red)

Minimal clutter

UX DETAILS

Loading skeletons

Empty states (“No leaves applied”)

Clear feedback after actions

Consistent typography & spacing

📁 REQUIRED FOLDER STRUCTURE (PHASE 4)
src/
│── pages/
│   └── Leave/
│       ├── LeaveDashboard.jsx
│       ├── ApplyLeave.jsx
│       ├── LeaveList.jsx
│       ├── LeaveApproval.jsx
│       ├── LeaveCalendar.jsx
│       └── LeaveReports.jsx
│
│── components/
│   └── Leave/
│       ├── LeaveBalanceCard.jsx
│       ├── LeaveStatusChip.jsx
│       ├── LeaveForm.jsx
│       ├── ApprovalTimeline.jsx
│       └── LeaveCalendarView.jsx

🚫 OUT OF SCOPE

No backend validation

No business logic for balances

No real approval APIs

No notifications logic

🎁 EXPECTED OUTPUT

Fully usable Leave Management UI

Clear approval workflows

Employee-friendly apply experience

Manager & HR approval efficiency

Beautiful & responsive design

🔥 PRODUCT ADVICE (IMPORTANT)

Leave UX should feel:

Simple for employees

Fast for managers

Powerful for HR

If leave feels confusing, payroll will fail later.

DO IT LIKE THE SAME WAY HOW WE DID THE ATTENDANCE SYSTEM



NOW PHASE 5

Phase 5 (Payroll & Salary Management)

🔧 TECH STACK (STRICT – SAME AS PREVIOUS PHASES)

Framework: React JS

Language: JavaScript (ES6+)

UI Library: Material UI (MUI v5)

Routing: React Router

State Management: React Context

Charts: MUI-compatible charts (UI only)

Backend: NOT REQUIRED (mock / dummy data only)

🎯 OBJECTIVE

Build a secure, professional, enterprise-grade Payroll UI that:

Feels trustworthy and compliant

Is easy for HR to manage

Clearly separates earnings vs deductions

Is fully responsive (desktop + mobile)

Is ready to connect to real payroll logic later

This phase focuses ONLY on Payroll UI & workflows.

👤 ROLE ACCESS (MANDATORY)
Feature	                HR	Manager	Employee
Salary Structure Setup	✅	❌	  ❌
Assign Salary	        ✅	❌	  ❌
Payroll Processing	    ✅	❌	  ❌
View Payslip	        ❌	❌	  ✅
Payroll Reports	        ✅	❌	  ❌
Compliance Screens	    ✅	❌	  ❌

Payroll is HR + Employee only.

🧩 MODULES TO BUILD (PHASE 5 ONLY)
1️⃣ SALARY STRUCTURE MANAGEMENT (HR)
UI FEATURES

Salary structure list:

Structure Name

CTC / Monthly

Applicable Grade / Role

Create / Edit structure form:

Structure name

Monthly or CTC toggle

Earnings:

Basic

HRA

Special Allowance

Bonus

Deductions:

PF

ESI

PT

TDS

Loans

Percentage / fixed amount input UI

Preview total CTC / Net Pay

✨ Must feel financially precise

2️⃣ ASSIGN SALARY TO EMPLOYEE (HR)
UI FLOW

Search employee

Select salary structure

Custom override option:

Add/remove components

Variable pay

Effective from date

Save & preview summary screen

3️⃣ PAYROLL PROCESSING (CORE HR SCREEN)
PROCESS FLOW UI

Select payroll month

Preview data sources:

Attendance summary

Leave summary

Payroll summary table:

Employee

Gross

Deductions

Net Pay

Manual adjustment modal:

Bonus

Incentive

Loss of Pay

Lock payroll UI state

Generate payroll (UI only)

⚠️ Locked payroll must appear read-only

4️⃣ PAYSLIP GENERATION & VIEW
HR VIEW

Payslip preview modal

PDF layout UI

Payslip archive list (month-wise)

EMPLOYEE VIEW

Payslip list

Monthly download button

Detailed earnings & deductions

Net pay highlighted

5️⃣ COMPLIANCE & STATUTORY UI (HR)
SCREENS TO BUILD

PF Summary

ESI Summary

Professional Tax

TDS Summary

Form 16 Preview UI

UI ELEMENTS

Cards with totals

Month selectors

Download buttons (UI only)

Compliance status badges

6️⃣ BANK ADVICE & PAYROLL REPORTS
BANK ADVICE UI

Salary transfer advice sheet layout

Employee Name

Bank Account (masked)

Net Pay

Total payout summary

PAYROLL REPORTS

Salary Register

Earnings vs Deductions

CTC Comparison

Department-wise payroll cost

📐 RESPONSIVENESS (MANDATORY)
Desktop

Large tables

Side panels

Modal previews

Mobile

Sensitive data masked

Card layouts

Step-by-step payroll flow

Download actions clearly visible

No clutter ❌
High readability ✅

🎨 DESIGN GUIDELINES (VERY IMPORTANT)
Look & Feel

Serious & compliant

Neutral colors (gray, blue, white)

Minimal animations

Clear monetary formatting

Consistent fonts

UX PRINCIPLES

No accidental actions

Confirmation dialogs for:

Payroll lock

Salary changes

Skeleton loaders

Empty states

Payroll UI must feel safe and reliable.

📁 REQUIRED FOLDER STRUCTURE (PHASE 5)
src/
│── pages/
│   └── Payroll/
│       ├── SalaryStructures.jsx
│       ├── AssignSalary.jsx
│       ├── PayrollProcessing.jsx
│       ├── Payslips.jsx
│       ├── Compliance.jsx
│       └── PayrollReports.jsx
│
│── components/
│   └── Payroll/
│       ├── SalaryForm.jsx
│       ├── EarningsTable.jsx
│       ├── DeductionTable.jsx
│       ├── PayslipPreview.jsx
│       ├── PayrollSummaryTable.jsx
│       └── ComplianceCard.jsx

🚫 OUT OF SCOPE

No actual payroll calculations

No government API integrations

No tax logic

No real document generation

🎁 EXPECTED OUTPUT

Enterprise-grade Payroll UI

Secure-feeling workflows

Clean payslip layouts

HR-ready payroll processing screens

Employee-friendly payslip access

Fully responsive design

🔥 VERY IMPORTANT PRODUCT NOTE

If payroll UI feels:

Confusing ❌

Risky ❌

Messy ❌

HR will never trust the system.

This phase must feel the most polished.
ALSO DO IT THE SAME WAY HOW WE DID ATTENDANCE AND LEAVE MANAGEMENT


NOW PHASE 6

Phase 6 (Offboarding & Setup)

🔧 TECH STACK (STRICT – SAME AS ALL PREVIOUS PHASES)

Framework: React JS

Language: JavaScript (ES6+)

UI Library: Material UI (MUI v5)

Routing: React Router

State Management: React Context

Backend: NOT REQUIRED (UI-only, mock data)

🎯 OBJECTIVE

Build final HRMS modules that handle:

Employee exits (Offboarding)

Clearance workflows

Relieving & exit documentation

System configuration (letters, policies)

This phase must feel:

Formal

Auditable

Professional

Enterprise-compliant

👤 ROLE ACCESS (MANDATORY)
Feature	                    HR	Manager	Employee
Initiate Offboarding	    ✅	❌	   ❌
Clearance Approval	        ✅	✅	   ❌
Exit Interview Notes	    ✅	❌	   ❌
Generate Relieving Letter	✅	❌	   ❌
View Exit Status	        ❌	❌	   ✅
Letter Template Setup	    ✅	❌	   ❌
Company Policies Upload	    ✅	❌	   ❌
View Policies	            ❌	❌	   ✅

🧩 MODULES TO BUILD (PHASE 6 ONLY)
1️⃣ OFFBOARDING / EXIT MANAGEMENT (HR)
EXIT INITIATION UI

Select employee

Last working day (date picker)

Exit type:

Resignation

Termination

Absconded

Retirement

Exit reason dropdown + notes

Submit exit initiation

2️⃣ CLEARANCE WORKFLOW
CLEARANCE SECTIONS

Create a checklist-based UI with status tracking:

IT Clearance

Laptop returned

Email deactivated

HR Clearance

Documents collected

Policy acknowledgment

Admin / Finance Clearance

Advances settled

Assets cleared

FEATURES

Status chips:

Pending

Approved

Rejected

Manager / HR approval toggle

Timeline view of clearances

3️⃣ EXIT INTERVIEW (HR)
UI FEATURES

Structured form:

Reason for leaving

Job satisfaction rating

Feedback text

Private notes section (HR-only)

Save & archive UI

4️⃣ RELIEVING LETTER & EXIT DOCUMENTS
UI FEATURES

Select letter template

Auto-filled employee data preview

Generate documents:

Relieving Letter

Experience Letter

Download PDF UI (mock)

Store under employee profile → Letters tab

⚠️ Must feel official & document-grade

5️⃣ FINAL SETTLEMENT SUMMARY (UI)
SUMMARY SCREEN

Last working day

Payable days

Pending leave encashment

Deductions (if any)

Net settlement amount (display only)

No calculation logic — summary UI only

6️⃣ EMPLOYEE EXIT STATUS (EMPLOYEE VIEW)
UI FEATURES

Exit status timeline

Clearance progress

Documents available for download

Contact HR message (UI only)

7️⃣ SETUP MODULE – LETTER TEMPLATE MANAGEMENT (HR)
TEMPLATE MANAGEMENT UI

Upload templates (Offer, Appointment, Relieving)

Placeholder preview:

{{EmployeeName}}

{{DOJ}}

{{Designation}}

Template list:

Preview

Edit

Activate / Deactivate

8️⃣ SETUP MODULE – COMPANY POLICIES
POLICY MANAGEMENT (HR)

Upload policy documents

Categorize:

HR Policy

Leave Policy

IT Policy

Set visibility (Employee / Manager)

EMPLOYEE POLICY VIEW

Policy list

Document preview / download

Acknowledgement checkbox (UI only)

📐 RESPONSIVENESS (MANDATORY)
Desktop

Stepper-based offboarding flow

Side drawers for details

Table + checklist layout

Mobile

Vertical stepper

Card-based clearance checklist

Sticky action buttons

Clean document viewer

No clutter ❌
Formal & readable ✅

🎨 DESIGN GUIDELINES
Visual Style

Formal, HR-compliant design

Neutral color palette

Clear dividers & sections

Minimal animations

UX PRINCIPLES

Confirmation dialogs (exit actions)

Read-only states after completion

Status timeline clarity

Skeleton loaders & empty states

📁 REQUIRED FOLDER STRUCTURE (PHASE 6)
src/
│── pages/
│   └── Offboarding/
│       ├── ExitInitiation.jsx
│       ├── ClearanceTracking.jsx
│       ├── ExitInterview.jsx
│       ├── FinalSettlement.jsx
│       └── ExitStatus.jsx
│
│── pages/
│   └── Setup/
│       ├── LetterTemplates.jsx
│       ├── CompanyPolicies.jsx
│
│── components/
│   └── Offboarding/
│       ├── ClearanceChecklist.jsx
│       ├── ExitTimeline.jsx
│       └── DocumentPreview.jsx

🚫 OUT OF SCOPE

No actual document generation

No payroll settlement calculations

No email triggers

No backend APIs

🎁 EXPECTED OUTPUT

Complete offboarding UI

Clearance & exit workflows

Relieving & experience letter UI

HR setup screens

Employee exit visibility

Fully responsive & professional

🏁 HRMS FRONTEND = COMPLETE 🎉

After Phase 6, your HRMS frontend has:

✅ Auth & roles

✅ Employee core

✅ Attendance

✅ Leave

✅ Payroll

✅ Offboarding & setup

This is enterprise-complete UI.
MAKE IT/REFER SAME AS HOW WE DID OTHER SYSTEMS ATTENDANCEM,LEAVE, PAYROLL


NOW NEXT PHASE    

Admin as System Control (Frontend Only)

🧠 CORE PRINCIPLE (VERY IMPORTANT)

Design the HRMS such that:

ADMIN CONFIGURES → OTHER MODULES CONSUME

Admin is the single source of truth.
Attendance, Leave, Payroll, Onboarding must never duplicate admin configuration screens.

🔧 TECH STACK (STRICT)

Framework: React JS

Language: JavaScript (ES6+)

UI Library: Material UI (MUI v5)

Routing: React Router

State Management: React Context

Backend: NOT REQUIRED (mock data only)

🎯 OBJECTIVE

Build a professional, enterprise-grade Admin Module that:

Centrally manages all system configuration

Feeds data to other modules (read-only there)

Prevents duplication & inconsistency

Feels powerful, safe, and authoritative

Works flawlessly on desktop and mobile

👤 ROLE ACCESS (STRICT)

Only HR / System Admin can access /admin

Manager & Employee must NOT see admin routes or actions

🧱 OWNERSHIP MODEL (MANDATORY)
🟤 ADMIN OWNS (CREATE / EDIT / DELETE)

These features must exist ONLY inside /admin:

Departments

Designations / Grades

Locations / Branches

Holiday Calendar

Leave Types & Policies

Letter Templates

Company Policies

Salary Structures

Bulk Employee Upload

System Reports

🟡 OTHER MODULES CONSUME (READ-ONLY)

Other modules use Admin data but never edit it:

Module	Consumes From Admin
Employees	Dept, Role, Location
Attendance	Holiday Calendar
Leave	Leave Types & Policy
Payroll	Salary Structures
Onboarding	Dept, Designation
Offboarding	Letter Templates

Display informational banners like:

“Managed from Admin Settings”

🧭 SIDEBAR STRUCTURE (BEST PRACTICE)
Dashboard
Employees
Attendance
Leave
Payroll
Admin
  ├── Admin Dashboard
  ├── Masters
  │     ├── Departments
  │     ├── Designations
  │     ├── Locations
  ├── Holiday Calendar
  ├── Bulk Uploads
  ├── Letter Templates
  ├── Company Policies
  ├── Salary Structures
  ├── Reports
Setup (optional branding/settings only)

🧩 MODULES TO BUILD (ADMIN ONLY)
1️⃣ ADMIN DASHBOARD

Overview cards:

Total Employees

Active Employees

Departments

Pending Config Actions

Quick actions:

Bulk Upload Employees

Upload Holiday Calendar

Manage Templates

Recent admin activity list (UI only)

2️⃣ MASTER DATA MANAGEMENT
Departments

List, add, edit, disable

Assign department head (UI only)

Designations / Grades

Designation name

Grade / Level

Map to department

Locations

Branch name

City / Country

Work mode (Office / Hybrid / Remote)

3️⃣ HOLIDAY CALENDAR (SYSTEM-WIDE)

Upload holiday list (Excel UI)

Year selector

Holiday type:

National

Optional

Activate / deactivate year

⚠️ Attendance module must only display holidays, not edit

4️⃣ BULK UPLOADS (SYSTEM ENTRY POINT)
Employee Master Upload

Excel upload UI

Column mapping preview

Validation result:

Success rows

Failed rows with reason

Auto-generated Employee ID preview

⚠️ Onboarding must not re-upload employees

5️⃣ LETTER & DOCUMENT TEMPLATES

Upload templates:

Offer

Appointment

Salary

Relieving

Placeholder preview:

{{EmployeeName}}

{{DOJ}}

{{Designation}}

Activate / deactivate templates

Used later by:

Onboarding

Offboarding

Payroll

6️⃣ COMPANY POLICIES

Upload policy documents

Categorize:

HR Policy

IT Policy

Leave Policy

Set visibility:

Employee

Manager

Employee side: read-only viewer

7️⃣ SALARY STRUCTURE CONFIG (SYSTEM LEVEL)

Define salary structures here

Payroll module only assigns & processes

No salary structure creation outside Admin

8️⃣ SYSTEM REPORTS

Employee Master

Attendance Summary

Leave Summary

Payroll Summary

Filters:

Date

Department

Export buttons (UI only)

📐 RESPONSIVENESS (MANDATORY)
Desktop

Tables & dashboards

Side drawers

Clear hierarchy

Mobile

Card layouts

Bottom sheet forms

Sticky primary actions

No clutter

Admin UI must feel deliberate and safe, not fast-clicky.

🎨 DESIGN GUIDELINES
Look & Feel

Enterprise SaaS

Neutral corporate colors

Clear dividers & spacing

Minimal animations

UX RULES

Confirmation for destructive actions

Disabled actions when not allowed

Read-only indicators in other modules

Skeleton loaders & empty states

🚫 DO NOT DO (CRITICAL)

❌ Do NOT duplicate admin pages inside other modules

❌ Do NOT allow editing of config outside admin

❌ Do NOT mix daily operations with system setup

❌ Do NOT create multiple sources of truth

🏁 EXPECTED OUTPUT

Clear Admin Control Center

Single source of system configuration

Clean separation of concerns

Enterprise-grade UX

Scalable frontend architecture

🧠 FINAL GOLDEN RULE

Admin controls the system
Modules operate within those rules

If this rule is followed, your HRMS will scale cleanly.


BACKEND PHASE 0 

Backend Phase 0.5 (Application Structure & Auth Plumbing)

🔧 TECH STACK (STRICT – DO NOT CHANGE)

Backend Framework: Python – Flask

Database: Microsoft SQL Server

DB Access Pattern: Stored Procedures ONLY

DB Driver: pyodbc

Auth: JWT (Access Token)

Architecture: DB-First, Procedure-Driven, Multi-Tenant Ready

Deployment Ready: Yes (Linux / Plesk)

🧠 CORE PRINCIPLE (CRITICAL)

Database owns business logic
Stored procedures execute all operations
Flask only orchestrates, validates, secures, and responds

🚫 No direct table access from Flask
🚫 No HR business logic in this phase
✅ One API = one stored procedure call

🎯 OBJECTIVE (PHASE 0.5)

Build the backend application skeleton that will support:

Authentication

Role-based access control

Stored procedure execution

Multi-tenant database switching (foundation only)

Clean, scalable API architecture

This phase must be completed before implementing any HRMS business modules.

🧩 SCOPE OF PHASE 0.5
✅ INCLUDED

Flask app factory

Final folder structure

MSSQL connection management

Central stored-procedure executor

Authentication APIs

JWT generation & validation

Role-based middleware

Standard API response format

End-to-end login flow (Frontend → Flask → SQL)

❌ NOT INCLUDED

Employee APIs

Attendance

Leave

Payroll

Admin masters

Client provisioning logic

🗂️ REQUIRED BACKEND PROJECT STRUCTURE (MANDATORY)
backend/
│── app/
│   ├── __init__.py          # Flask app factory
│   ├── config.py            # Environment config
│   ├── extensions.py        # JWT, CORS
│
│   ├── database/
│   │   ├── connection.py    # MSSQL connection & DB switch
│   │   └── executor.py      # Stored procedure executor
│
│   ├── auth/
│   │   ├── routes.py        # /auth APIs
│   │   └── service.py       # Calls DB procedures
│
│   ├── middleware/
│   │   ├── jwt_required.py  # Token validation
│   │   └── role_guard.py    # Role-based protection
│
│   ├── utils/
│   │   ├── response.py      # Standard responses
│   │   └── errors.py        # Central error handling
│
│── run.py
│── requirements.txt
│── .env


This structure must not be changed in future phases.

🔌 DATABASE CONNECTION RULES

Flask must never assume a database

DB name must be passed dynamically

Default DB (for now): ud_pond_hr (template DB)

All database access must flow through:

database/connection.py
database/executor.py

🔁 STORED PROCEDURE EXECUTION STANDARD

Create a single reusable executor that:

Accepts procedure name + parameters

Executes via pyodbc

Safely handles:

Multiple result sets

Success/failure responses

Returns Python-friendly data

🚫 No inline SQL
🚫 No SELECT statements in Flask

🔐 AUTHENTICATION IMPLEMENTATION (PHASE 0.5)
APIs TO BUILD
POST /auth/login
GET  /auth/me
POST /auth/logout   (optional)

LOGIN FLOW

Receive email + password

Hash password (Flask layer)

Call:

proc_login_user


If successful:

Generate JWT

Embed:

user_id
role


Return token to frontend

🧱 JWT & ROLE HANDLING
JWT PAYLOAD
{
  "user_id": 1,
  "role": "HR",
  "exp": <expiry>
}

MIDDLEWARE RULES

Every non-auth route must require JWT

Role guard decorator must support:

@role_required("HR")

📡 API RESPONSE STANDARD (MANDATORY)

All APIs must respond in this format:

{
  "success": true,
  "message": "",
  "data": {}
}


Centralize response creation.

🧪 ERROR HANDLING RULES

Central error handler

No raw stack traces in response

Clean messages for:

Invalid credentials

Unauthorized access

Expired token

DB execution failure

🔐 SECURITY REQUIREMENTS

Password hashing in Flask only

JWT expiry enforced

Secrets loaded from .env

CORS controlled

No hardcoded credentials

No database credentials in code

🧪 TESTING CHECKLIST (PHASE 0.5)

✔ Flask server starts
✔ DB connection established
✔ /auth/login works
✔ JWT token returned
✔ /auth/me returns user + role
✔ Role middleware blocks unauthorized access
✔ Stored procedure executor handles result sets

🏁 EXPECTED OUTPUT (PHASE 0.5)

Stable Flask backend skeleton

Auth fully wired to SQL procedures

JWT + role protection functional

Ready for DB Phase 1 (Employee Master)

No refactoring required later

NOW PHASE 1
EMPLOYEE MASTER (DB ONLY)

📌 Database: ud_pond_hr (TEMPLATE DB)
📌 Approach: Normalized tables + stored procedures
📌 Rule: NO frontend logic, NO Flask logic here

🎯 PURPOSE OF PHASE 1

Create a single, authoritative employee system that supports:

Employee Directory

Employee Profile (360°)

Reporting hierarchy

Future Attendance / Leave / Payroll links

🗂️ TABLE DESIGN (PHASE 1)

Identity first → details second → relations third

1️⃣ employees (CORE IDENTITY)
IF OBJECT_ID('employees', 'U') IS NOT NULL DROP TABLE employees;
GO

CREATE TABLE employees (
    employee_id INT IDENTITY(1,1) PRIMARY KEY,
    employee_code VARCHAR(50) NOT NULL UNIQUE,   -- EMP001
    user_id INT NULL,                            -- FK to users (login)
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE / INACTIVE / EXITED
    created_at DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT fk_employees_users
        FOREIGN KEY (user_id) REFERENCES users(user_id)
);
GO


📌 Why separate from users?
Not all employees log in. Not all users are employees.

2️⃣ employee_personal
IF OBJECT_ID('employee_personal', 'U') IS NOT NULL DROP TABLE employee_personal;
GO

CREATE TABLE employee_personal (
    employee_id INT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    dob DATE,
    gender VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    address VARCHAR(500),
    emergency_contact VARCHAR(20),

    CONSTRAINT fk_emp_personal
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);
GO

3️⃣ employee_official
IF OBJECT_ID('employee_official', 'U') IS NOT NULL DROP TABLE employee_official;
GO

CREATE TABLE employee_official (
    employee_id INT PRIMARY KEY,
    date_of_joining DATE,
    department VARCHAR(100),
    designation VARCHAR(100),
    employment_type VARCHAR(50),  -- Full-Time / Contract
    work_location VARCHAR(100),

    CONSTRAINT fk_emp_official
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);
GO


📌 Departments/designations will later be FK → Admin masters
(for now keep VARCHAR to move fast).

4️⃣ employee_reporting (MANAGER RELATION)
IF OBJECT_ID('employee_reporting', 'U') IS NOT NULL DROP TABLE employee_reporting;
GO

CREATE TABLE employee_reporting (
    employee_id INT PRIMARY KEY,
    manager_id INT NULL,

    CONSTRAINT fk_emp_reporting_emp
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id),

    CONSTRAINT fk_emp_reporting_manager
        FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
);
GO


📌 Enables:

Org chart

Manager approvals

Reporting hierarchy

🔁 STORED PROCEDURES (PHASE 1)
🔹 proc_add_employee
IF OBJECT_ID('proc_add_employee') IS NOT NULL DROP PROC proc_add_employee;
GO

CREATE PROC proc_add_employee
    @employee_code VARCHAR(50),
    @first_name VARCHAR(100),
    @last_name VARCHAR(100),
    @email VARCHAR(255),
    @department VARCHAR(100),
    @designation VARCHAR(100),
    @manager_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM employees WHERE employee_code = @employee_code)
    BEGIN
        SELECT 0 AS success, 'Employee code already exists' AS message;
        RETURN;
    END

    INSERT INTO employees (employee_code)
    VALUES (@employee_code);

    DECLARE @emp_id INT = SCOPE_IDENTITY();

    INSERT INTO employee_personal (employee_id, first_name, last_name, email)
    VALUES (@emp_id, @first_name, @last_name, @email);

    INSERT INTO employee_official (employee_id, department, designation)
    VALUES (@emp_id, @department, @designation);

    INSERT INTO employee_reporting (employee_id, manager_id)
    VALUES (@emp_id, @manager_id);

    SELECT 1 AS success, 'Employee added successfully' AS message, @emp_id AS employee_id;
END;
GO

🔹 proc_update_employee
IF OBJECT_ID('proc_update_employee') IS NOT NULL DROP PROC proc_update_employee;
GO

CREATE PROC proc_update_employee
    @employee_id INT,
    @phone VARCHAR(20),
    @address VARCHAR(500),
    @department VARCHAR(100),
    @designation VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE employee_personal
    SET phone = @phone,
        address = @address
    WHERE employee_id = @employee_id;

    UPDATE employee_official
    SET department = @department,
        designation = @designation
    WHERE employee_id = @employee_id;

    SELECT 1 AS success, 'Employee updated successfully' AS message;
END;
GO

🔹 proc_get_employee_list (DIRECTORY)
IF OBJECT_ID('proc_get_employee_list') IS NOT NULL DROP PROC proc_get_employee_list;
GO

CREATE PROC proc_get_employee_list
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.employee_id,
        e.employee_code,
        p.first_name + ' ' + p.last_name AS employee_name,
        o.department,
        o.designation,
        e.status
    FROM employees e
    JOIN employee_personal p ON e.employee_id = p.employee_id
    JOIN employee_official o ON e.employee_id = o.employee_id
    ORDER BY p.first_name;
END;
GO

🔹 proc_get_employee_profile (360 VIEW)
IF OBJECT_ID('proc_get_employee_profile') IS NOT NULL DROP PROC proc_get_employee_profile;
GO

CREATE PROC proc_get_employee_profile
    @employee_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.employee_id,
        e.employee_code,
        e.status,
        p.*,
        o.*,
        r.manager_id
    FROM employees e
    JOIN employee_personal p ON e.employee_id = p.employee_id
    JOIN employee_official o ON e.employee_id = o.employee_id
    LEFT JOIN employee_reporting r ON e.employee_id = r.employee_id
    WHERE e.employee_id = @employee_id;
END;
GO

🧪 TEST IN SSMS (DO THIS NOW)
EXEC proc_add_employee
    @employee_code = 'EMP001',
    @first_name = 'Aabhas',
    @last_name = 'Negi',
    @email = 'aabhas@company.com',
    @department = 'Engineering',
    @designation = 'Software Engineer',
    @manager_id = NULL;

EXEC proc_get_employee_list;

EXEC proc_get_employee_profile @employee_id = 1;


If this works → Phase 1 DB is DONE ✅




Backend Phase 1.5 (Employee Master APIs)

🔧 TECH STACK (STRICT – DO NOT CHANGE)

Backend Framework: Python – Flask

Database: Microsoft SQL Server

DB Access: Stored Procedures ONLY

DB Driver: pyodbc

Auth: JWT (already implemented in Phase 0.5)

Architecture: DB-First, Procedure-Driven, Multi-Tenant Ready

🧠 CORE ARCHITECTURE RULE (MANDATORY)

❌ Flask must NEVER directly query tables
✅ Every API must call EXACTLY ONE stored procedure
✅ Business rules live inside SQL procedures
✅ Flask only validates, secures, orchestrates, and responds

🎯 OBJECTIVE (PHASE 1.5)

Make Employee Directory & Employee Profile work end-to-end:

Frontend (Employee screens)
→ Flask APIs
→ SQL Stored Procedures
→ MSSQL


This phase turns your UI into a real HRMS.

🧩 SCOPE OF THIS PHASE
✅ INCLUDED

Employee creation API

Employee listing (directory)

Employee profile API (360 view)

Employee update API

Role-based access enforcement

Manager vs HR vs Employee access rules

Multi-tenant safe DB calls

❌ NOT INCLUDED

Attendance

Leave

Payroll

Admin masters (will come next)

Bulk uploads

👤 ROLE-BASED ACCESS (MANDATORY)
API	HR	Manager	Employee
Create Employee	✅	❌	❌
View Employee List	✅	❌	❌
View Employee Profile	✅	✅ (reportees)	✅ (self)
Update Employee	✅	❌	❌

Role enforcement must happen via middleware.

🔌 REQUIRED APIs TO BUILD
POST   /employees
GET    /employees
GET    /employees/{employee_id}
PUT    /employees/{employee_id}

🔁 STORED PROCEDURES TO USE (ALREADY EXIST)
proc_add_employee
proc_get_employee_list
proc_get_employee_profile
proc_update_employee


Flask must ONLY call these.

🧭 API BEHAVIOR SPECIFICATION
1️⃣ POST /employees

Purpose: Create new employee (HR only)

Flow:

Validate JWT

Validate role = HR

Validate request body

Call proc_add_employee

Return employee_id

Input (JSON):

{
  "employee_code": "EMP002",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@company.com",
  "department": "HR",
  "designation": "Executive",
  "manager_id": 1
}

2️⃣ GET /employees

Purpose: Employee directory (HR only)

Flow:

Validate JWT

Validate role = HR

Call proc_get_employee_list

Return list

3️⃣ GET /employees/{employee_id}

Purpose: Employee profile (360 view)

Access Rules:

HR → any employee

Manager → only reportees

Employee → self only

Flow:

Validate JWT

Check permission

Call proc_get_employee_profile

Return profile

4️⃣ PUT /employees/{employee_id}

Purpose: Update employee (HR only)

Input (JSON):

{
  "phone": "9876543210",
  "address": "New Delhi",
  "department": "Engineering",
  "designation": "Senior Engineer"
}

🔐 AUTH & SECURITY RULES

JWT mandatory for all routes

Role guard used everywhere

Never trust frontend role flags

Employee self-access validated by user_id → employee_id mapping

🔁 MULTI-TENANT DB RULE

Flask must obtain DB name from:

JWT claim (future)

Or config (temporary)

Procedure executor must accept DB name

Procedures run ONLY inside that DB

📦 STANDARD API RESPONSE FORMAT

All endpoints must return:

{
  "success": true,
  "message": "",
  "data": {}
}

🧪 ERROR HANDLING

Centralized error handling required for:

Unauthorized access

Invalid payload

Procedure failure

Empty result sets

Invalid employee_id

🧪 TESTING CHECKLIST (MANDATORY)

✔ HR creates employee
✔ HR sees employee list
✔ HR views any employee profile
✔ Employee views own profile only
✔ Manager blocked from non-reportee
✔ Update employee works
✔ Stored procedures executed correctly

🏁 EXPECTED OUTPUT

Employee Directory frontend shows real data

Employee Profile frontend fully populated

HRMS now has a working core

Future modules can safely attach


PHASE 2 

BACKEND PHASE 2 – ADMIN MASTERS (DB + APIs)

This phase turns your system from “working HR app” into a configurable SaaS HRMS.

Below is a FULLY FLEDGED, COPY-PASTE READY AI PROMPT, exactly like your earlier ones.

🎯 AI PROMPT – BACKEND PHASE 2 (ADMIN MASTERS)

Project Name: Enterprise HRMS – Backend Phase 2 (Admin Masters)

🔧 TECH STACK (STRICT – DO NOT CHANGE)

Backend Framework: Python – Flask

Database: Microsoft SQL Server

DB Access: Stored Procedures ONLY

DB Driver: pyodbc

Auth: JWT (already implemented)

Architecture: DB-First, Procedure-Driven, Multi-Tenant Ready

🧠 CORE ARCHITECTURE RULE (MANDATORY)

✅ Admin tables are the single source of truth
❌ No module (Attendance, Leave, Payroll) may write to master tables
✅ Flask must ONLY call stored procedures
❌ No inline SQL in Flask

🎯 OBJECTIVE (PHASE 2)

Build system-wide master data that:

Is managed ONLY by HR/Admin

Is consumed by all other modules

Eliminates hard-coded values (departments, designations, etc.)

Enables multi-client SaaS scalability

🧩 SCOPE OF THIS PHASE
✅ INCLUDED

Departments

Designations

Locations

Holiday Calendar

Leave Types

Salary Structures (system-level only)

Admin APIs (CRUD)

Role enforcement (HR only)

❌ NOT INCLUDED

Attendance logic

Leave application logic

Payroll run logic

Bulk uploads

Offboarding

👤 ROLE ACCESS (STRICT)
Feature	HR
Manage Masters	✅
Read Masters	❌ (done via other modules)

🚫 Managers & Employees must NEVER access these APIs

🗂️ DATABASE TABLES TO CREATE (PHASE 2)
1️⃣ departments
department_id (PK)
department_code
department_name
is_active
created_at

2️⃣ designations
designation_id (PK)
designation_name
level
is_active
created_at

3️⃣ locations
location_id (PK)
location_name
city
country
is_active
created_at

4️⃣ holiday_calendar
holiday_id (PK)
holiday_date
holiday_name
holiday_type   -- National / Optional
year
is_active

5️⃣ leave_types
leave_type_id (PK)
leave_code
leave_name
max_days_per_year
is_active

6️⃣ salary_structures (SYSTEM LEVEL ONLY)
structure_id (PK)
structure_name
structure_type  -- Monthly / CTC
is_active
created_at

🔁 STORED PROCEDURES TO BUILD (MANDATORY)
Departments
proc_add_department
proc_update_department
proc_list_departments

Designations
proc_add_designation
proc_update_designation
proc_list_designations

Locations
proc_add_location
proc_list_locations

Holidays
proc_add_holiday
proc_list_holidays_by_year

Leave Types
proc_add_leave_type
proc_list_leave_types

Salary Structures (SYSTEM ONLY)
proc_add_salary_structure
proc_list_salary_structures


🚫 No DELETE procedures
🚫 Use is_active = 0 for soft delete

🔌 REQUIRED ADMIN APIs (FLASK)
POST   /admin/departments
GET    /admin/departments

POST   /admin/designations
GET    /admin/designations

POST   /admin/locations
GET    /admin/locations

POST   /admin/holidays
GET    /admin/holidays?year=2026

POST   /admin/leave-types
GET    /admin/leave-types

POST   /admin/salary-structures
GET    /admin/salary-structures

🧭 API RULES (IMPORTANT)

JWT required

Role must be HR

Validate request payload

Call exactly ONE procedure

Return standard response

Never expose internal IDs unnecessarily

📦 STANDARD RESPONSE FORMAT
{
  "success": true,
  "message": "",
  "data": {}
}

🔐 SECURITY & DATA RULES

Soft delete only

No cascading deletes

No updates allowed if entity is in use (future-proof)

Multi-tenant DB isolation enforced via connection layer

🧪 TESTING CHECKLIST (MANDATORY)

✔ HR adds departments
✔ HR lists departments
✔ HR adds designations
✔ HR adds holidays
✔ Attendance module can READ holidays later
✔ Leave module can READ leave types later
✔ Payroll module can READ salary structures later
✔ Managers cannot access admin APIs
✔ Employees cannot access admin APIs

🏁 EXPECTED OUTPUT

Fully functional Admin Masters backend

No hard-coded values left

Attendance / Leave / Payroll ready to attach

Multi-tenant safe

Clean separation of concerns

🚀 NEXT PHASE AFTER THIS

➡ BACKEND PHASE 3 – ATTENDANCE (Face Recognition + Manual + Regularization)

This will be the first heavy business-logic phase.

🧠 FINAL GOLDEN RULE

If Admin Masters are clean, your HRMS never becomes messy.

check #scripts.md for scripts


PHASE 2.5

Perfect — based on where you are right now, the correct next phase is:

🔵 BACKEND PHASE 2.5 – ADMIN MASTER APIs (FLASK)

You’ve already:

Built Admin master tables + procedures ✅

Locked stored-procedure ownership ✅

Finished Employee APIs ✅

So now we expose Admin Masters safely to the frontend.

Below is a FULLY-FLEDGED, COPY-PASTE READY AI PROMPT, exactly like all your earlier ones.

🎯 AI PROMPT – BACKEND PHASE 2.5 (ADMIN MASTER APIs)

Project Name: Enterprise HRMS – Backend Phase 2.5 (Admin Master APIs)

🔧 TECH STACK (STRICT – DO NOT CHANGE)

Backend Framework: Python – Flask

Database: Microsoft SQL Server

DB Access: Stored Procedures ONLY

DB Driver: pyodbc

Auth: JWT (Phase 0.5 complete)

Architecture: DB-First, Procedure-Driven, Multi-Tenant Ready

🧠 CORE ARCHITECTURE RULE (MANDATORY)

❌ Flask must NEVER query tables
✅ Flask must call EXACTLY ONE stored procedure per API
✅ Admin is the SINGLE SOURCE OF TRUTH
❌ Attendance / Leave / Payroll must NOT manage masters

🎯 OBJECTIVE (PHASE 2.5)

Expose Admin-owned master data securely via APIs so that:

Admin UI can manage configuration

Other modules can consume masters (read-only)

No hard-coded values remain in the system

🧩 SCOPE OF THIS PHASE
✅ INCLUDED

Admin master APIs (CRUD-lite)

HR-only route protection

Stored-procedure orchestration

Clean response standard

❌ NOT INCLUDED

Attendance APIs

Leave application APIs

Payroll APIs

Bulk upload APIs (later)

👤 ROLE ACCESS (STRICT)
Role	Access
HR	✅ Full
Manager	❌ None
Employee	❌ None

Any non-HR request must return 403 Forbidden.

🔌 ADMIN APIS TO BUILD
Departments
POST /admin/departments
GET  /admin/departments

Designations
POST /admin/designations
GET  /admin/designations

Locations
POST /admin/locations
GET  /admin/locations

Holidays
POST /admin/holidays
GET  /admin/holidays?year=YYYY

Leave Types
POST /admin/leave-types
GET  /admin/leave-types

Salary Structures (System-level)
POST /admin/salary-structures
GET  /admin/salary-structures

🔁 STORED PROCEDURES TO USE (ALREADY CREATED)
proc_add_department
proc_update_department
proc_list_departments

proc_add_designation
proc_list_designations

proc_add_location
proc_list_locations

proc_add_holiday
proc_list_holidays_by_year

proc_add_leave_type
proc_list_leave_types

proc_add_salary_structure
proc_list_salary_structures


⚠️ Flask must NOT implement business rules — SQL already does.

🧭 API BEHAVIOR RULES

For ALL admin routes:

Validate JWT

Validate role == HR

Validate request body

Call one stored procedure

Return standard response

📦 STANDARD RESPONSE FORMAT (MANDATORY)
{
  "success": true,
  "message": "",
  "data": {}
}

🔐 SECURITY & DESIGN RULES

Soft delete only (is_active)

No DELETE endpoints

No edits if entity is in use (future-safe)

Multi-tenant DB isolation via connection layer

Never expose raw SQL errors

🧪 TESTING CHECKLIST (MANDATORY)

✔ HR can add department
✔ HR can list departments
✔ HR can add leave type
✔ HR can add holiday for year
✔ Non-HR blocked from all admin APIs
✔ Attendance module can later READ holidays
✔ Leave module can later READ leave types
✔ Payroll module can later READ salary structures

🏁 EXPECTED OUTPUT

Fully working /admin backend

Admin UI becomes functional

Configuration centralized

System ready for heavy business logic modules

🚀 NEXT PHASE AFTER THIS (IMPORTANT)

➡ BACKEND PHASE 3 – ATTENDANCE

This will introduce:

Face recognition logs

Daily attendance generation

Regularization workflows

Manager approvals

HR overrides

This is the first complex logic phase.

🧠 FINAL GOLDEN RULE

Admin configures the rules.
Attendance, Leave & Payroll only follow them.




NOW PHASE 3

PHASE 3 – ATTENDANCE (DB + STORED PROCEDURES)

This is where your HRMS becomes operational, and it directly integrates with your existing face-recognition system later.

Below is a FULLY-FLEDGED, COPY-PASTE READY AI PROMPT, written exactly like your previous phases.

🎯 AI PROMPT – BACKEND PHASE 3 (ATTENDANCE MANAGEMENT)

Project Name: Enterprise HRMS – Backend Phase 3 (Attendance)

🔧 TECH STACK (STRICT – DO NOT CHANGE)

Backend Framework: Python – Flask

Database: Microsoft SQL Server

DB Access: Stored Procedures ONLY

DB Driver: pyodbc

Auth: JWT (already implemented)

Architecture: DB-First, Procedure-Driven, Multi-Tenant Ready

🧠 CORE ARCHITECTURE RULE (MANDATORY)

❌ Flask must NEVER calculate attendance
❌ Flask must NEVER update attendance tables directly
✅ Attendance logic lives ENTIRELY inside SQL procedures
✅ Flask only triggers procedures and enforces permissions

🎯 OBJECTIVE (PHASE 3)

Build a robust attendance system backend that supports:

Face-recognition attendance

Manual attendance marking

Daily attendance consolidation

Regularization workflow

Manager + HR approvals

Holiday awareness (Admin-owned)

This phase will power:

Attendance Dashboard

Attendance Reports

Attendance Calendar

Payroll (later)

🧩 SCOPE OF THIS PHASE
✅ INCLUDED

Attendance raw logs

Daily attendance records

Manual attendance

Regularization requests

Approval workflow

Holiday integration (read-only)

Attendance reports foundation

❌ NOT INCLUDED

Leave logic

Payroll logic

Shift rules (optional later)

Overtime calculations

👤 ROLE-BASED ACCESS (MANDATORY)
Feature                 HR	Manager	Employee
Face Attendance Log  	✅	❌	  ❌
Manual Attendance	    ✅	✅	  ❌
View Attendance     	✅	✅	  ✅ (self)
Apply Regularization	❌	❌	  ✅
Approve Regularization	✅	✅	  ❌
Holiday Edit	        ❌	❌	  ❌ (Admin only)
🗂️ DATABASE TABLES TO CREATE (PHASE 3)
1️⃣ attendance_raw_logs

(Face recognition writes here)

attendance_raw_logs
- log_id (PK)
- employee_id (FK)
- log_time
- source         -- FACE / MANUAL
- created_at

2️⃣ attendance_daily

(Final daily attendance record)

attendance_daily
- attendance_id (PK)
- employee_id
- attendance_date
- first_check_in
- last_check_out
- working_minutes
- status          -- PRESENT / ABSENT / LATE / WFH / HOLIDAY
- is_holiday

3️⃣ attendance_regularization
attendance_regularization
- request_id (PK)
- employee_id
- attendance_date
- requested_status
- reason
- status            -- PENDING / APPROVED / REJECTED
- manager_comment
- hr_comment
- created_at

🔁 STORED PROCEDURES TO BUILD (MANDATORY)
🔹 FACE / RAW LOGGING
proc_mark_attendance_raw


Inserts raw attendance

Used by face-recognition system

🔹 DAILY ATTENDANCE GENERATION
proc_generate_daily_attendance


Aggregates raw logs

Checks holiday calendar

Marks PRESENT / ABSENT

Idempotent (safe to rerun)

🔹 MANUAL ATTENDANCE
proc_mark_manual_attendance


HR/Manager override

Writes directly to daily table

🔹 VIEW ATTENDANCE
proc_get_attendance_by_employee
proc_get_attendance_by_date_range

🔹 REGULARIZATION FLOW
proc_apply_attendance_regularization
proc_approve_attendance_regularization
proc_reject_attendance_regularization

🧭 STORED PROCEDURE RULES (VERY IMPORTANT)

Attendance calculation = SQL only

All updates must be transactional

Regularization approval:

Updates attendance_daily

Logs approver

Holidays come from:

holiday_calendar (Admin-owned)

🔌 FLASK API CONTRACT (FOR NEXT PHASE)

(Do NOT implement now, just design for it)

POST /attendance/face-log
POST /attendance/manual
GET  /attendance/my
GET  /attendance/team
POST /attendance/regularize
PUT  /attendance/approve

🔐 SECURITY RULES

JWT required on all routes

Employee can only see self attendance

Manager can see reportees

HR can see everyone

Attendance tables cannot be edited without procedures

📦 STANDARD RESPONSE FORMAT
{
  "success": true,
  "message": "",
  "data": {}
}

🧪 TESTING CHECKLIST (MANDATORY)

✔ Face log inserted
✔ Daily attendance generated
✔ Holiday auto-marked
✔ Manual override works
✔ Employee applies regularization
✔ Manager approves
✔ HR overrides
✔ Attendance dashboard data valid

🏁 EXPECTED OUTPUT

Production-ready attendance backend

Face recognition plug-in ready

Regularization workflow stable

Payroll-safe attendance data

🚀 NEXT PHASE AFTER THIS

➡ BACKEND PHASE 3.5 – ATTENDANCE APIs (FLASK)
➡ Then BACKEND PHASE 4 – LEAVE MANAGEMENT

🧠 FINAL GOLDEN RULE

If attendance is wrong, payroll is wrong.
This phase must be bullet-proof.

CHECK SCRIPTS.MD FOR THE SCRIPTS



Backend Phase 4 (Leave Management)

🔧 TECH STACK (STRICT – DO NOT CHANGE)

Backend Framework: Python – Flask

Database: Microsoft SQL Server

DB Access Pattern: Stored Procedures ONLY

DB Driver: pyodbc

Auth: JWT (already implemented)

Architecture: DB-First, Procedure-Driven, Multi-Tenant Ready

🧠 CORE ARCHITECTURE RULE (MANDATORY)

❌ Flask must NEVER calculate leave balances
❌ Flask must NEVER update leave tables directly
✅ All leave logic must live in SQL stored procedures
✅ Flask only triggers procedures and enforces permissions

Attendance, payroll, and compliance depend on this correctness.

🎯 OBJECTIVE (PHASE 4)

Build a complete Leave Management backend that supports:

Leave balance allocation

Leave application by employees

Multi-level approval workflow (Manager → HR)

HR override rights

Leave cancellation & modification

Leave reports for payroll & audits

🧩 SCOPE OF THIS PHASE
✅ INCLUDED

Leave balance management

Leave application

Approval & rejection flow

HR override & manual adjustments

Leave cancellation

Leave reporting foundation

❌ NOT INCLUDED

Payroll deduction logic

Comp-off generation

Encashment (future phase)

👤 ROLE-BASED ACCESS RULES
Action	HR	Manager	Employee
Allocate Leave Balance	✅	❌	❌
Apply Leave	❌	❌	✅
Approve Leave	✅	✅	❌
HR Override	✅	❌	❌
View Team Leaves	✅	✅	❌
View Own Leaves	❌	❌	✅
🗂️ DATABASE TABLES TO CREATE (PHASE 4)
1️⃣ leave_balances

(One row per employee × leave type × year)

leave_balances
- balance_id (PK)
- employee_id (FK)
- leave_type_id (FK)
- year
- total_allocated
- used
- remaining
- created_at

2️⃣ leave_requests
leave_requests
- request_id (PK)
- employee_id (FK)
- leave_type_id (FK)
- start_date
- end_date
- total_days
- reason
- status              -- PENDING / MANAGER_APPROVED / HR_APPROVED / REJECTED / CANCELLED
- applied_at

3️⃣ leave_approvals
leave_approvals
- approval_id (PK)
- request_id (FK)
- approver_role        -- MANAGER / HR
- approver_id
- action              -- APPROVED / REJECTED
- comment
- action_at

🔁 STORED PROCEDURES TO BUILD (MANDATORY)
🔹 LEAVE BALANCE (HR ONLY)
proc_allocate_leave_balance
proc_adjust_leave_balance
proc_get_leave_balances_by_employee


Rules:

Auto-calculate remaining

One record per employee + leave type + year

🔹 LEAVE APPLICATION (EMPLOYEE)
proc_apply_leave


Rules:

Validate leave balance

Validate overlapping leaves

Calculate leave days (excluding holidays)

Insert leave request (PENDING)

🔹 APPROVAL WORKFLOW
proc_manager_approve_leave
proc_hr_approve_leave
proc_reject_leave


Rules:

Manager approval → HR approval mandatory

HR has final authority

On HR approval:

Update leave balance

Lock leave request

🔹 CANCEL / MODIFY LEAVE
proc_cancel_leave


Rules:

Allowed before HR approval

Revert leave balance if approved already

🔹 REPORTING
proc_get_leaves_by_employee
proc_get_leaves_by_department
proc_get_leave_register

🧭 STORED PROCEDURE RULES (CRITICAL)

All updates must be transactional

No negative leave balances allowed

Leave balance consistency must be guaranteed

Attendance integration comes later (read-only for now)

Holiday calendar is READ-ONLY (Admin-owned)

🔌 FLASK API CONTRACT (NEXT PHASE – NOT NOW)
POST /leaves/apply
PUT  /leaves/approve
PUT  /leaves/reject
PUT  /leaves/cancel
GET  /leaves/my
GET  /leaves/team

🔐 SECURITY RULES

JWT mandatory on all routes

Employees can only apply/view own leaves

Managers can only act on reportees

HR can access all leave data

No SQL executed outside stored procedures

📦 STANDARD API RESPONSE FORMAT
{
  "success": true,
  "message": "",
  "data": {}
}

🧪 TESTING CHECKLIST (MANDATORY)

✔ HR allocates leave balance
✔ Employee applies leave
✔ Overlapping leave blocked
✔ Insufficient balance blocked
✔ Manager approves
✔ HR approves
✔ Leave balance reduced
✔ Leave cancelled restores balance
✔ Leave report generates

🏁 EXPECTED OUTPUT

Fully working leave engine

Accurate balances year-wise

Approval workflow stable

Payroll-safe leave data

Attendance-ready leave info

🚀 NEXT PHASE AFTER THIS

➡ BACKEND PHASE 4.5 – LEAVE APIs (FLASK)
➡ Then BACKEND PHASE 5 – PAYROLL

🧠 FINAL GOLDEN RULE

If leave balances are wrong, employees lose trust.
This phase must be accurate and auditable.