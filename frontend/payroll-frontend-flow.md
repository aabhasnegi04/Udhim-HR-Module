🧭 FINAL PAYROLL FLOW (UPDATED & CORRECT)

Payroll now has 3 layers of management:

Salary Templates
      ↓
Employee Salaries
      ↓
Payroll Processing

This is how systems like Keka HR, Darwinbox, and Zoho People structure payroll.

🟦 PHASE A — SALARY SETUP

This phase happens when:

system is configured

employee joins

salary changes

1️⃣ Create Salary Templates

Screen:

Payroll → Salary Templates

HR defines templates:

Example:

Software Engineer
Sales Executive
HR Manager

Components:

Basic 40%
HRA 20%
Special 30%
PF 12% of Basic
PT ₹200

Backend:

proc_create_salary_structure
proc_add_structure_component

Tables:

salary_structures
salary_structure_components
2️⃣ Assign Salary To Employee

Screen:

Payroll → Assign Salary

HR selects:

Employee
Salary Template
Monthly CTC
Effective Date

Example:

CTC ₹70,000

Preview shows:

Basic ₹28,000
HRA ₹14,000
Special ₹21,000
PF ₹3,360
PT ₹200

Backend:

proc_assign_salary_template

Tables:

employee_salary_template
employee_salary_structure
⭐ NEW STEP (Important UX Improvement)
3️⃣ Manage Employee Salaries

Screen:

Payroll → Employee Salaries

This becomes the salary management dashboard.

HR can:

View employee salary
Edit salary
Change template
Deactivate salary
View breakdown

Table example:

Employee        Template        CTC        Net        Effective From
--------------------------------------------------------------------
Rahul Sharma    HR Senior       ₹50,000    ₹39,000    01 Apr 2026
Aman Gupta      Sales Exec      ₹70,000    ₹54,200    01 Apr 2026

Actions:

View
Edit
Deactivate
🟦 PHASE B — MONTHLY PAYROLL RUN

This happens every month.

4️⃣ Attendance Collection

Daily attendance recorded:

Table:

attendance_daily

Status examples:

PRESENT
ABSENT
LEAVE
WFH
5️⃣ Payroll Readiness Check

Before payroll:

Screen:

Payroll → Dashboard

System checks:

Employees without salary
Missing attendance
Pending leaves

Example:

⚠ 2 employees missing salary
⚠ 1 employee missing attendance
6️⃣ Create Payroll Period

Screen:

Payroll → Process Payroll

Example:

Month: March 2026
Start: 01-03-2026
End: 31-03-2026
Salary Date: 05-04-2026

Table:

payroll_periods

Status:

DRAFT
7️⃣ Add Adjustments (Optional)

Screen:

Payroll → Adjustments

Examples:

Bonus
Incentive
Penalty
Loan recovery
Reimbursement

Table:

payroll_adjustments
8️⃣ Run Payroll

Button:

Run Payroll

Procedure:

proc_process_bulk_payroll

Internal procedure:

proc_calculate_employee_payroll

Calculation:

Salary Structure
+ Attendance
+ Adjustments
= Earnings
- Deductions
= Net Salary

Tables generated:

payroll_calculations
employee_payroll_summary

Status:

DRAFT → CALCULATED
9️⃣ Review Payroll

Screen:

Payroll → Payroll Summary

Example:

Employee        Gross        Deductions        Net
---------------------------------------------------
Rahul Sharma    ₹70,000      ₹4,200            ₹65,800

HR can:

Add adjustment
Recalculate
Check totals
🔟 Lock Payroll

Button:

Lock Payroll

Procedure:

proc_lock_payroll

Status:

CALCULATED → LOCKED

After lock:

No changes allowed
🟦 PHASE C — POST PAYROLL
1️⃣1️⃣ Generate Bank Advice

Screen:

Payroll → Reports → Bank Advice

Procedure:

proc_get_bank_advice

Output:

Employee
Bank Account
Net Salary

Used for bank transfer.

1️⃣2️⃣ Mark Salary Paid

Button:

Mark Salary Paid

Procedure:

proc_mark_salary_paid

Table update:

employee_payroll_summary.payment_status = PAID
1️⃣3️⃣ Employee Views Payslip

Employee dashboard:

Payslips

Example:

March 2026
Net Salary ₹65,800
Download PDF

Procedure:

proc_get_employee_payslip
📊 FINAL UPDATED FLOW
Create Salary Template
        ↓
Add Template Components
        ↓
Assign Template to Employee
        ↓
Employee Salaries Page (Manage assignments)
        ↓
Attendance collected daily
        ↓
Payroll Readiness Check
        ↓
Create Payroll Period
        ↓
Add Adjustments
        ↓
Run Payroll
        ↓
Review Payroll Summary
        ↓
Lock Payroll
        ↓
Generate Bank Advice
        ↓
Mark Salary Paid
        ↓
Employee downloads Payslip
🎯 FINAL PAYROLL UI STRUCTURE

Your payroll navigation should now be:

Payroll
 ├ Dashboard
 ├ Salary Templates
 ├ Employee Salaries   ← NEW (manage assignments)
 ├ Assign Salary
 ├ Process Payroll
 ├ Payroll Summary
 ├ Adjustments
 ├ Payslips
 ├ Compliance
 ├ Reports
⭐ This Flow Is Now Production-Level

Your system now has:

Salary templates
Employee salary assignment
Salary management
Payroll calculation engine
Adjustments
Payroll locking
Payment tracking
Payslips
Reports

This is 95% of a commercial payroll system.