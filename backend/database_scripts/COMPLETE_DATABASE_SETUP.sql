-- ============================================
-- HRMS COMPLETE DATABASE SETUP
-- This file contains all essential database scripts for the HRMS system
-- Run this file in SSMS to set up the complete database
-- ============================================

USE ud_pond_hr;
GO

PRINT '=== HRMS DATABASE SETUP STARTING ===';
PRINT 'Setting up complete HRMS database with all features...';
PRINT '';

-- ============================================
-- 1. EMPLOYEE MANAGEMENT SYSTEM
-- ============================================
PRINT '1. Setting up Employee Management System...';

-- Employee Code Generation
IF OBJECT_ID('proc_get_next_employee_code', 'P') IS NOT NULL DROP PROCEDURE proc_get_next_employee_code;
GO

CREATE PROCEDURE proc_get_next_employee_code
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @next_code VARCHAR(20);
    DECLARE @max_num INT;
    
    -- Get the highest numeric part from existing employee codes
    SELECT @max_num = ISNULL(MAX(CAST(SUBSTRING(employee_code, 4, LEN(employee_code) - 3) AS INT)), 0)
    FROM employees 
    WHERE employee_code LIKE 'EMP%' 
      AND ISNUMERIC(SUBSTRING(employee_code, 4, LEN(employee_code) - 3)) = 1;
    
    -- Generate next code
    SET @next_code = 'EMP' + RIGHT('000' + CAST(@max_num + 1 AS VARCHAR), 3);
    
    SELECT @next_code AS next_employee_code;
END;
GO

-- Enhanced Employee Addition with Auto User Creation
IF OBJECT_ID('proc_add_employee', 'P') IS NOT NULL DROP PROCEDURE proc_add_employee;
GO

CREATE PROCEDURE proc_add_employee
    @first_name VARCHAR(50),
    @last_name VARCHAR(50),
    @email VARCHAR(100),
    @phone VARCHAR(20),
    @date_of_birth DATE,
    @gender VARCHAR(10),
    @address TEXT,
    @department VARCHAR(50),
    @designation VARCHAR(50),
    @salary DECIMAL(10,2),
    @date_of_joining DATE,
    @reporting_manager_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Generate employee code
        DECLARE @employee_code VARCHAR(20);
        EXEC proc_get_next_employee_code;
        SELECT @employee_code = next_employee_code FROM (
            SELECT TOP 1 next_employee_code FROM (
                SELECT 'EMP' + RIGHT('000' + CAST(ISNULL(MAX(CAST(SUBSTRING(employee_code, 4, LEN(employee_code) - 3) AS INT)), 0) + 1 AS VARCHAR), 3) AS next_employee_code
                FROM employees 
                WHERE employee_code LIKE 'EMP%' 
                  AND ISNUMERIC(SUBSTRING(employee_code, 4, LEN(employee_code) - 3)) = 1
            ) AS temp
        ) AS result;
        
        -- Create user account first
        DECLARE @user_id INT;
        DECLARE @default_password VARCHAR(255) = 'Welcome123!';
        
        INSERT INTO users (username, email, password_hash, role, is_active, requires_password_change, last_password_change)
        VALUES (@email, @email, @default_password, 'EMPLOYEE', 1, 1, GETDATE());
        
        SET @user_id = SCOPE_IDENTITY();
        
        -- Insert employee record
        DECLARE @employee_id INT;
        INSERT INTO employees (employee_code, user_id, status)
        VALUES (@employee_code, @user_id, 'ACTIVE');
        
        SET @employee_id = SCOPE_IDENTITY();
        
        -- Insert personal details
        INSERT INTO employee_personal (employee_id, first_name, last_name, email, phone, date_of_birth, gender, address)
        VALUES (@employee_id, @first_name, @last_name, @email, @phone, @date_of_birth, @gender, @address);
        
        -- Insert official details
        INSERT INTO employee_official (employee_id, department, designation, salary, date_of_joining)
        VALUES (@employee_id, @department, @designation, @salary, @date_of_joining);
        
        -- Insert reporting structure
        IF @reporting_manager_id IS NOT NULL
        BEGIN
            INSERT INTO employee_reporting (employee_id, reporting_manager_id, start_date)
            VALUES (@employee_id, @reporting_manager_id, @date_of_joining);
        END
        
        -- Log the creation
        INSERT INTO employee_audit_log (employee_id, action, details, created_at)
        VALUES (@employee_id, 'CREATED', 'Employee created with auto user account', GETDATE());
        
        COMMIT TRANSACTION;
        
        -- Return success with employee details
        SELECT 
            1 AS success,
            'Employee and user account created successfully' AS message,
            @employee_id AS employee_id,
            @employee_code AS employee_code,
            @user_id AS user_id,
            @email AS username,
            @default_password AS default_password;
            
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        SELECT 
            0 AS success,
            ERROR_MESSAGE() AS message,
            NULL AS employee_id,
            NULL AS employee_code,
            NULL AS user_id,
            NULL AS username,
            NULL AS default_password;
    END CATCH
END;
GO

-- Password Management Procedures
IF OBJECT_ID('proc_check_password_change_required', 'P') IS NOT NULL DROP PROCEDURE proc_check_password_change_required;
GO

CREATE PROCEDURE proc_check_password_change_required
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        requires_password_change,
        last_password_change
    FROM users 
    WHERE user_id = @user_id;
END;
GO

IF OBJECT_ID('proc_change_user_password', 'P') IS NOT NULL DROP PROCEDURE proc_change_user_password;
GO

CREATE PROCEDURE proc_change_user_password
    @user_id INT,
    @new_password VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users 
    SET password_hash = @new_password,
        requires_password_change = 0,
        last_password_change = GETDATE()
    WHERE user_id = @user_id;
    
    SELECT 1 AS success, 'Password updated successfully' AS message;
END;
GO

-- Employee Lookup Procedures
IF OBJECT_ID('proc_get_employee_id_by_user_id', 'P') IS NOT NULL DROP PROCEDURE proc_get_employee_id_by_user_id;
GO

CREATE PROCEDURE proc_get_employee_id_by_user_id
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        e.employee_id,
        e.employee_code,
        ep.first_name + ' ' + ep.last_name AS employee_name
    FROM employees e
    JOIN employee_personal ep ON e.employee_id = ep.employee_id
    WHERE e.user_id = @user_id
      AND e.status = 'ACTIVE';
END;
GO

PRINT '✅ Employee Management System setup complete';
PRINT '';

-- ============================================
-- 2. FACE RECOGNITION SYSTEM
-- ============================================
PRINT '2. Setting up Face Recognition System...';

-- Add face recognition columns to employee_personal table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employee_personal') AND name = 'photo_path')
    ALTER TABLE employee_personal ADD photo_path VARCHAR(500) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employee_personal') AND name = 'face_encoding_json')
    ALTER TABLE employee_personal ADD face_encoding_json TEXT NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employee_personal') AND name = 'face_registered_at')
    ALTER TABLE employee_personal ADD face_registered_at DATETIME NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employee_personal') AND name = 'face_registered_by')
    ALTER TABLE employee_personal ADD face_registered_by INT NULL;

-- Add face recognition columns to attendance_raw_logs table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('attendance_raw_logs') AND name = 'confidence')
    ALTER TABLE attendance_raw_logs ADD confidence FLOAT NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('attendance_raw_logs') AND name = 'image_path')
    ALTER TABLE attendance_raw_logs ADD image_path VARCHAR(500) NULL;

-- Face Recognition Procedures
IF OBJECT_ID('proc_register_employee_face', 'P') IS NOT NULL DROP PROCEDURE proc_register_employee_face;
GO

CREATE PROCEDURE proc_register_employee_face
    @employee_id INT,
    @photo_path VARCHAR(500),
    @face_encoding_json TEXT,
    @registered_by INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        UPDATE employee_personal 
        SET photo_path = @photo_path,
            face_encoding_json = @face_encoding_json,
            face_registered_at = GETDATE(),
            face_registered_by = @registered_by
        WHERE employee_id = @employee_id;
        
        IF @@ROWCOUNT > 0
        BEGIN
            SELECT 1 AS success, 'Face registered successfully' AS message;
        END
        ELSE
        BEGIN
            SELECT 0 AS success, 'Employee not found' AS message;
        END
    END TRY
    BEGIN CATCH
        SELECT 0 AS success, ERROR_MESSAGE() AS message;
    END CATCH
END;
GO

IF OBJECT_ID('proc_get_face_encodings', 'P') IS NOT NULL DROP PROCEDURE proc_get_face_encodings;
GO

CREATE PROCEDURE proc_get_face_encodings
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        e.employee_id,
        e.employee_code,
        ep.first_name + ' ' + ep.last_name AS employee_name,
        ep.face_encoding_json
    FROM employees e
    JOIN employee_personal ep ON e.employee_id = ep.employee_id
    WHERE e.status = 'ACTIVE' 
      AND ep.face_encoding_json IS NOT NULL 
      AND ep.face_encoding_json != '';
END;
GO

PRINT '✅ Face Recognition System setup complete';
PRINT '';

-- ============================================
-- 3. ATTENDANCE SYSTEM
-- ============================================
PRINT '3. Setting up Attendance System...';

-- Attendance Procedures
IF OBJECT_ID('proc_mark_attendance_raw', 'P') IS NOT NULL DROP PROCEDURE proc_mark_attendance_raw;
GO

CREATE PROCEDURE proc_mark_attendance_raw
    @employee_id INT,
    @log_time DATETIME,
    @source VARCHAR(20) = 'FACE',
    @confidence FLOAT = NULL,
    @image_path VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        INSERT INTO attendance_raw_logs (employee_id, log_time, source, confidence, image_path)
        VALUES (@employee_id, @log_time, @source, @confidence, @image_path);
        
        SELECT 1 AS success, 'Attendance logged successfully' AS message;
    END TRY
    BEGIN CATCH
        SELECT 0 AS success, ERROR_MESSAGE() AS message;
    END CATCH
END;
GO

IF OBJECT_ID('proc_generate_daily_attendance', 'P') IS NOT NULL DROP PROCEDURE proc_generate_daily_attendance;
GO

CREATE PROCEDURE proc_generate_daily_attendance
    @attendance_date DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @attendance_date IS NULL
        SET @attendance_date = CAST(GETDATE() AS DATE);
    
    BEGIN TRY
        -- Generate daily attendance from raw logs
        MERGE attendance_daily AS target
        USING (
            SELECT 
                employee_id,
                @attendance_date AS attendance_date,
                MIN(log_time) AS first_check_in,
                MAX(log_time) AS last_check_out,
                DATEDIFF(MINUTE, MIN(log_time), MAX(log_time)) AS working_minutes,
                CASE 
                    WHEN COUNT(*) >= 2 THEN 'PRESENT'
                    WHEN COUNT(*) = 1 THEN 'INCOMPLETE'
                    ELSE 'ABSENT'
                END AS status
            FROM attendance_raw_logs
            WHERE CAST(log_time AS DATE) = @attendance_date
            GROUP BY employee_id
        ) AS source ON target.employee_id = source.employee_id AND target.attendance_date = source.attendance_date
        WHEN MATCHED THEN
            UPDATE SET 
                first_check_in = source.first_check_in,
                last_check_out = source.last_check_out,
                working_minutes = source.working_minutes,
                status = source.status
        WHEN NOT MATCHED THEN
            INSERT (employee_id, attendance_date, first_check_in, last_check_out, working_minutes, status)
            VALUES (source.employee_id, source.attendance_date, source.first_check_in, source.last_check_out, source.working_minutes, source.status);
        
        SELECT 1 AS success, 'Daily attendance generated successfully' AS message;
    END TRY
    BEGIN CATCH
        SELECT 0 AS success, ERROR_MESSAGE() AS message;
    END CATCH
END;
GO

-- Attendance Edit Procedure
IF OBJECT_ID('proc_upsert_attendance_record', 'P') IS NOT NULL DROP PROCEDURE proc_upsert_attendance_record;
GO

CREATE PROCEDURE proc_upsert_attendance_record
    @employee_id INT,
    @attendance_date DATE,
    @status VARCHAR(20),
    @check_in_time TIME = NULL,
    @check_out_time TIME = NULL,
    @working_minutes INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @is_holiday BIT = CASE WHEN @status = 'HOLIDAY' THEN 1 ELSE 0 END;
    
    -- Check if record exists
    IF EXISTS (
        SELECT 1 FROM attendance_daily
        WHERE employee_id = @employee_id AND attendance_date = @attendance_date
    )
    BEGIN
        -- Update existing record
        UPDATE attendance_daily
        SET status = @status,
            first_check_in = COALESCE(@check_in_time, first_check_in),
            last_check_out = COALESCE(@check_out_time, last_check_out),
            working_minutes = COALESCE(@working_minutes, working_minutes),
            is_holiday = @is_holiday
        WHERE employee_id = @employee_id AND attendance_date = @attendance_date;
        
        SELECT 1 AS success, 'Attendance record updated' AS message;
    END
    ELSE
    BEGIN
        -- Insert new record
        INSERT INTO attendance_daily (
            employee_id, 
            attendance_date, 
            status, 
            first_check_in, 
            last_check_out, 
            working_minutes, 
            is_holiday
        )
        VALUES (
            @employee_id, 
            @attendance_date, 
            @status, 
            @check_in_time, 
            @check_out_time, 
            @working_minutes, 
            @is_holiday
        );
        
        SELECT 1 AS success, 'Attendance record created' AS message;
    END
END;
GO

PRINT '✅ Attendance System setup complete';
PRINT '';

-- ============================================
-- 4. LEAVE MANAGEMENT SYSTEM
-- ============================================
PRINT '4. Setting up Leave Management System...';

-- Create leave types if not exists
IF NOT EXISTS (SELECT * FROM leave_types WHERE leave_code = 'AL')
    INSERT INTO leave_types (leave_code, leave_name, max_days_per_year, is_active) VALUES ('AL', 'Annual Leave', 21, 1);

IF NOT EXISTS (SELECT * FROM leave_types WHERE leave_code = 'CL')
    INSERT INTO leave_types (leave_code, leave_name, max_days_per_year, is_active) VALUES ('CL', 'Casual Leave', 12, 1);

IF NOT EXISTS (SELECT * FROM leave_types WHERE leave_code = 'SL')
    INSERT INTO leave_types (leave_code, leave_name, max_days_per_year, is_active) VALUES ('SL', 'Sick Leave', 12, 1);

IF NOT EXISTS (SELECT * FROM leave_types WHERE leave_code = 'EL')
    INSERT INTO leave_types (leave_code, leave_name, max_days_per_year, is_active) VALUES ('EL', 'Earned Leave', 21, 1);

IF NOT EXISTS (SELECT * FROM leave_types WHERE leave_code = 'ML')
    INSERT INTO leave_types (leave_code, leave_name, max_days_per_year, is_active) VALUES ('ML', 'Maternity Leave', 180, 1);

IF NOT EXISTS (SELECT * FROM leave_types WHERE leave_code = 'PL')
    INSERT INTO leave_types (leave_code, leave_name, max_days_per_year, is_active) VALUES ('PL', 'Paternity Leave', 15, 1);

IF NOT EXISTS (SELECT * FROM leave_types WHERE leave_code = 'CO')
    INSERT INTO leave_types (leave_code, leave_name, max_days_per_year, is_active) VALUES ('CO', 'Compensatory Off', 12, 1);

-- Leave Management Procedures
IF OBJECT_ID('proc_list_leave_types', 'P') IS NOT NULL DROP PROCEDURE proc_list_leave_types;
GO

CREATE PROCEDURE proc_list_leave_types
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        leave_type_id,
        leave_code,
        leave_name,
        max_days_per_year,
        is_active
    FROM leave_types 
    WHERE is_active = 1
    ORDER BY leave_name;
END;
GO

IF OBJECT_ID('proc_allocate_leave_balance', 'P') IS NOT NULL DROP PROCEDURE proc_allocate_leave_balance;
GO

CREATE PROCEDURE proc_allocate_leave_balance
    @employee_id INT,
    @leave_type_id INT,
    @year INT,
    @total_allocated DECIMAL(5,2)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Check if balance already exists
        IF EXISTS (
            SELECT 1 FROM leave_balances 
            WHERE employee_id = @employee_id 
              AND leave_type_id = @leave_type_id 
              AND year = @year
        )
        BEGIN
            SELECT 0 AS success, 'Leave balance already exists for this employee, leave type, and year' AS message;
            RETURN;
        END
        
        -- Insert new balance
        INSERT INTO leave_balances (employee_id, leave_type_id, year, total_allocated, used, remaining)
        VALUES (@employee_id, @leave_type_id, @year, @total_allocated, 0, @total_allocated);
        
        SELECT 1 AS success, 'Leave balance allocated successfully' AS message;
    END TRY
    BEGIN CATCH
        SELECT 0 AS success, ERROR_MESSAGE() AS message;
    END CATCH
END;
GO

IF OBJECT_ID('proc_get_leave_balances_by_employee', 'P') IS NOT NULL DROP PROCEDURE proc_get_leave_balances_by_employee;
GO

CREATE PROCEDURE proc_get_leave_balances_by_employee
    @employee_id INT,
    @year INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @year IS NULL
        SET @year = YEAR(GETDATE());
    
    SELECT 
        lb.balance_id,
        lb.employee_id,
        lb.leave_type_id,
        lt.leave_code,
        lt.leave_name,
        lb.year,
        lb.total_allocated,
        lb.used,
        lb.remaining
    FROM leave_balances lb
    JOIN leave_types lt ON lb.leave_type_id = lt.leave_type_id
    WHERE lb.employee_id = @employee_id 
      AND lb.year = @year
      AND lt.is_active = 1
    ORDER BY lt.leave_name;
END;
GO

PRINT '✅ Leave Management System setup complete';
PRINT '';

-- ============================================
-- 5. ADDITIONAL UTILITY PROCEDURES
-- ============================================
PRINT '5. Setting up Utility Procedures...';

-- Employee List with Created Date
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('employees') AND name = 'created_at')
    ALTER TABLE employees ADD created_at DATETIME DEFAULT GETDATE();

-- Update existing records
UPDATE employees SET created_at = GETDATE() WHERE created_at IS NULL;

-- Employee List Procedure
IF OBJECT_ID('proc_get_employee_list', 'P') IS NOT NULL DROP PROCEDURE proc_get_employee_list;
GO

CREATE PROCEDURE proc_get_employee_list
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        e.employee_id,
        e.employee_code,
        ep.first_name + ' ' + ep.last_name AS employee_name,
        eo.department,
        eo.designation,
        e.status,
        e.created_at,
        ep.email
    FROM employees e
    JOIN employee_personal ep ON e.employee_id = ep.employee_id
    JOIN employee_official eo ON e.employee_id = eo.employee_id
    WHERE e.status = 'ACTIVE'
    ORDER BY e.created_at DESC;
END;
GO

PRINT '✅ Utility Procedures setup complete';
PRINT '';

-- ============================================
-- SETUP COMPLETE
-- ============================================
PRINT '=== HRMS DATABASE SETUP COMPLETE ===';
PRINT '';
PRINT 'All systems are now ready:';
PRINT '✅ Employee Management System';
PRINT '✅ Face Recognition System';
PRINT '✅ Attendance System';
PRINT '✅ Leave Management System';
PRINT '✅ Utility Procedures';
PRINT '';
PRINT 'You can now start using the HRMS application!';
PRINT '';

GO