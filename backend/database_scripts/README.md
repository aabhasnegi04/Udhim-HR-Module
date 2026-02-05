# Database Scripts

This directory contains all essential database setup scripts for the HRMS system.

## 🚀 Quick Setup (Recommended)

**For new installations, run this single script:**

### `COMPLETE_DATABASE_SETUP.sql`
- **Purpose**: Complete HRMS database setup in one script
- **Includes**: All systems, procedures, and default data
- **Usage**: Execute in SSMS to set up everything at once

This script sets up:
- ✅ Employee Management System
- ✅ Face Recognition System
- ✅ Attendance System  
- ✅ Leave Management System
- ✅ All stored procedures
- ✅ Default leave types
- ✅ Required table modifications

## 📋 Individual Components

If you need to set up components individually or understand the system better:

### Core Systems
- **`employee_management.sql`** - Employee lifecycle management
- **`face_recognition_integration.sql`** - Face recognition system
- **`leave_management_phase4.sql`** - Leave management system
- **`additional_stored_procedures.sql`** - Utility procedures

### Specific Features
- **`auto_user_creation_corrected.sql`** - Auto user account creation
- **`fix_employee_code_generation_v3.sql`** - Employee code generation
- **`bulk_allocate_leave_balances.sql`** - Bulk leave allocation (optional)

## 🔧 Usage Instructions

### New Installation
1. Open SQL Server Management Studio (SSMS)
2. Connect to your database server
3. Open `COMPLETE_DATABASE_SETUP.sql`
4. Execute the script
5. Verify all procedures were created successfully

### Existing Installation Updates
- Run individual scripts as needed
- Always backup your database before running scripts
- Test in development environment first

## ⚠️ Important Notes

1. **Database Name**: Scripts assume database name `ud_pond_hr`
2. **Backup First**: Always backup before running scripts
3. **Test Environment**: Test scripts in development first
4. **Dependencies**: Some scripts depend on existing tables
5. **Order Matters**: If running individual scripts, follow the order listed

## 🔍 Verification

After running scripts, verify setup:

```sql
-- Check if all procedures exist
SELECT name FROM sys.procedures WHERE name LIKE 'proc_%' ORDER BY name;

-- Check leave types
SELECT * FROM leave_types WHERE is_active = 1;

-- Check employee table structure
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'employees' ORDER BY ORDINAL_POSITION;
```

## 📞 Troubleshooting

### Common Issues
- **Permission Errors**: Ensure you have CREATE PROCEDURE permissions
- **Database Not Found**: Verify database name in USE statement
- **Syntax Errors**: Check SQL Server version compatibility
- **Dependency Errors**: Ensure required tables exist

### Getting Help
1. Check the main README.md for setup instructions
2. Review error messages carefully
3. Verify database connectivity
4. Ensure proper permissions

---

**All scripts are production-tested and ready for use.**