PROCEDURE : [dbo].[proc_add_department]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_add_department]    Script Date: 21-01-2026 12:47:32 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_add_department]
    @department_code VARCHAR(50),
    @department_name VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM departments WHERE department_code = @department_code)
    BEGIN
        SELECT 0 AS success, 'Department code already exists' AS message;
        RETURN;
    END

    INSERT INTO departments (department_code, department_name)
    VALUES (@department_code, @department_name);

    SELECT 1 AS success, 'Department added successfully' AS message;
END;


PROCEDURE : [dbo].[proc_add_designation]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_add_designation]    Script Date: 21-01-2026 12:47:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_add_designation]
    @designation_name VARCHAR(100),
    @designation_level INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO designations (designation_name, designation_level)
    VALUES (@designation_name, @designation_level);

    SELECT 1 AS success, 'Designation added successfully' AS message;
END;


PROCEDURE : [dbo].[proc_add_employee]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_add_employee]    Script Date: 29-01-2026 15:45:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Create new procedure - CORRECTED FOR YOUR SCHEMA
ALTER PROC [dbo].[proc_add_employee]
    @employee_code VARCHAR(50),
    @first_name VARCHAR(100),
    @last_name VARCHAR(100),
    @email VARCHAR(200),
    @phone VARCHAR(20) = NULL,
    @department VARCHAR(100),
    @designation VARCHAR(100),
    @join_date DATE,
    @salary DECIMAL(10,2) = NULL,
    @created_by_user_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @new_employee_id INT;
    DECLARE @new_user_id INT;
    DECLARE @default_password VARCHAR(100) = 'Welcome123!';
    DECLARE @employee_role_id INT;

    -- Basic validations
    IF EXISTS (SELECT 1 FROM employees WHERE employee_code = @employee_code)
    BEGIN
        SELECT 0 AS success, 'Employee code already exists' AS message, NULL AS employee_id, NULL AS user_id, NULL AS default_password;
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM employee_personal WHERE email = @email)
    BEGIN
        SELECT 0 AS success, 'Email already exists' AS message, NULL AS employee_id, NULL AS user_id, NULL AS default_password;
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM users WHERE email = @email)
    BEGIN
        SELECT 0 AS success, 'Email already registered as user' AS message, NULL AS employee_id, NULL AS user_id, NULL AS default_password;
        RETURN;
    END

    -- Get EMPLOYEE role ID
    SELECT @employee_role_id = role_id FROM roles WHERE role_code = 'EMPLOYEE' AND is_active = 1;
    
    IF @employee_role_id IS NULL
    BEGIN
        SELECT 0 AS success, 'EMPLOYEE role not found' AS message, NULL AS employee_id, NULL AS user_id, NULL AS default_password;
        RETURN;
    END

    -- Create user account
    INSERT INTO users (email, password_hash, role_id, is_active, created_at, requires_password_change)
    VALUES (@email, @default_password, @employee_role_id, 1, GETDATE(), 1);
    
    SET @new_user_id = SCOPE_IDENTITY();

    -- Create employee record (using your schema - status instead of is_active)
    INSERT INTO employees (employee_code, user_id, status)
    VALUES (@employee_code, @new_user_id, 'ACTIVE');
    
    SET @new_employee_id = SCOPE_IDENTITY();

    -- Create personal record
    INSERT INTO employee_personal (employee_id, first_name, last_name, email, phone)
    VALUES (@new_employee_id, @first_name, @last_name, @email, @phone);

    -- Create official record (using your schema - date_of_joining instead of join_date)
    INSERT INTO employee_official (employee_id, department, designation, date_of_joining, salary)
    VALUES (@new_employee_id, @department, @designation, @join_date, @salary);

    -- Create reporting record (no manager for now)
    INSERT INTO employee_reporting (employee_id, manager_id)
    VALUES (@new_employee_id, NULL);

    -- Success response
    SELECT 
        1 AS success, 
        'Employee and user account created successfully' AS message, 
        @new_employee_id AS employee_id,
        @new_user_id AS user_id,
        @default_password AS default_password;
END;



PROCEDURE : [dbo].[proc_add_holiday]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_add_holiday]    Script Date: 21-01-2026 12:47:45 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_add_holiday]
    @holiday_date DATE,
    @holiday_name VARCHAR(200),
    @holiday_type VARCHAR(50),
    @calendar_year INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO holiday_calendar
        (holiday_date, holiday_name, holiday_type, calendar_year)
    VALUES
        (@holiday_date, @holiday_name, @holiday_type, @calendar_year);

    SELECT 1 AS success, 'Holiday added successfully' AS message;
END;


PROCEDURE : [dbo].[proc_add_leave_type]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_add_leave_type]    Script Date: 21-01-2026 12:47:49 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_add_leave_type]
    @leave_code VARCHAR(20),
    @leave_name VARCHAR(100),
    @max_days_per_year INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO leave_types (leave_code, leave_name, max_days_per_year)
    VALUES (@leave_code, @leave_name, @max_days_per_year);

    SELECT 1 AS success, 'Leave type added successfully' AS message;
END;


PROCEDURE : [dbo].[proc_add_location]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_add_location]    Script Date: 21-01-2026 13:25:03 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_add_location]
    @location_name VARCHAR(100),
    @city VARCHAR(100),
    @country VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO locations (location_name, city, country)
    VALUES (@location_name, @city, @country);

    SELECT 1 AS success, 'Location added successfully' AS message;
END;


PROCEDURE : [dbo].[proc_add_salary_structure]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_add_salary_structure]    Script Date: 21-01-2026 13:25:15 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_add_salary_structure]
    @structure_name VARCHAR(100),
    @structure_type VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO salary_structures (structure_name, structure_type)
    VALUES (@structure_name, @structure_type);

    SELECT 1 AS success, 'Salary structure added successfully' AS message;
END;


PROCEDURE : [dbo].[proc_adjust_leave_balance]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_adjust_leave_balance]    Script Date: 21-01-2026 13:25:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[proc_adjust_leave_balance]
    @balance_id INT,
    @adjustment DECIMAL(5,2),
    @reason VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @current_allocated DECIMAL(5,2);
        DECLARE @current_used DECIMAL(5,2);
        DECLARE @new_allocated DECIMAL(5,2);
        DECLARE @new_remaining DECIMAL(5,2);
        
        -- Get current balance
        SELECT 
            @current_allocated = total_allocated,
            @current_used = used
        FROM leave_balances
        WHERE balance_id = @balance_id;
        
        IF @current_allocated IS NULL
        BEGIN
            SELECT 0 AS success, 'Leave balance not found' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Calculate new values
        SET @new_allocated = @current_allocated + @adjustment;
        SET @new_remaining = @new_allocated - @current_used;
        
        -- Validate
        IF @new_remaining < 0
        BEGIN
            SELECT 0 AS success, 'Adjustment would result in negative balance' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Update balance
        UPDATE leave_balances
        SET total_allocated = @new_allocated,
            remaining = @new_remaining,
            updated_at = GETDATE()
        WHERE balance_id = @balance_id;
        
        COMMIT TRANSACTION;
        SELECT 1 AS success, 'Leave balance adjusted successfully' AS message;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS success, 'Failed to adjust leave balance: ' + ERROR_MESSAGE() AS message;
    END CATCH
END;

PROCEDURE : [dbo].[proc_allocate_leave_balance]

  
-- Update the leave allocation procedure to include gender validation  
CREATE PROC [dbo].[proc_allocate_leave_balance]  
    @employee_id INT,  
    @leave_type_id INT,  
    @year INT,  
    @total_allocated DECIMAL(5,2)  
AS  
BEGIN  
    SET NOCOUNT ON;  
      
    BEGIN TRY  
        BEGIN TRANSACTION;  
          
        -- Get employee gender and leave type information  
        DECLARE @employee_gender VARCHAR(20);  
        DECLARE @leave_type_name VARCHAR(100);  
          
        SELECT @employee_gender = ep.gender  
        FROM employees e  
        JOIN employee_personal ep ON e.employee_id = ep.employee_id  
        WHERE e.employee_id = @employee_id;  
          
        SELECT @leave_type_name = leave_name  
        FROM leave_types  
        WHERE leave_type_id = @leave_type_id;  
          
        -- Validate gender-based leave types  
        IF @leave_type_name = 'Maternity Leave' AND @employee_gender != 'Female'  
        BEGIN  
            SELECT 0 AS success, 'Maternity Leave can only be allocated to female employees' AS message;  
            ROLLBACK TRANSACTION;  
            RETURN;  
        END  
          
        IF @leave_type_name = 'Paternity Leave' AND @employee_gender != 'Male'  
        BEGIN  
            SELECT 0 AS success, 'Paternity Leave can only be allocated to male employees' AS message;  
            ROLLBACK TRANSACTION;  
            RETURN;  
        END  
          
        -- Check if allocation already exists  
        IF EXISTS (  
            SELECT 1 FROM leave_balances   
            WHERE employee_id = @employee_id   
              AND leave_type_id = @leave_type_id   
              AND year = @year  
        )  
        BEGIN  
            SELECT 0 AS success, 'Leave balance already allocated for this year' AS message;  
            ROLLBACK TRANSACTION;  
            RETURN;  
        END  
          
        -- Insert new balance  
        INSERT INTO leave_balances (  
            employee_id, leave_type_id, year,   
            total_allocated, used, remaining  
        )  
        VALUES (  
            @employee_id, @leave_type_id, @year,  
            @total_allocated, 0, @total_allocated  
        );  
          
        COMMIT TRANSACTION;  
        SELECT 1 AS success, 'Leave balance allocated successfully' AS message;  
          
    END TRY  
    BEGIN CATCH  
        ROLLBACK TRANSACTION;  
        SELECT 0 AS success, 'Failed to allocate leave balance: ' + ERROR_MESSAGE() AS message;  
    END CATCH  
END;  
  
-- Clean up existing incorrect allocations  
-- Remove Maternity Leave from male employees  
DELETE lb  
FROM leave_balances lb  
JOIN employees e ON lb.employee_id = e.employee_id  
JOIN employee_personal ep ON e.employee_id = ep.employee_id  
JOIN leave_types lt ON lb.leave_type_id = lt.leave_type_id  
WHERE lt.leave_name = 'Maternity Leave'   
  AND ep.gender = 'Male';  
  
-- Remove Paternity Leave from female employees  
DELETE lb  
FROM leave_balances lb  
JOIN employees e ON lb.employee_id = e.employee_id  
JOIN employee_personal ep ON e.employee_id = ep.employee_id  
JOIN leave_types lt ON lb.leave_type_id = lt.leave_type_id  
WHERE lt.leave_name = 'Paternity Leave'   
  AND ep.gender = 'Female';  
  
-- Display cleanup results  
SELECT 'Cleanup completed - removed gender-inappropriate leave allocations' AS message;  

PROCEDURE : [dbo].[proc_apply_attendance_regularization]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_apply_attendance_regularization]    Script Date: 21-01-2026 13:28:02 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_apply_attendance_regularization]
    @employee_id INT,
    @attendance_date DATE,
    @requested_status VARCHAR(20),
    @reason VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO attendance_regularization
        (employee_id, attendance_date, requested_status, reason)
    VALUES
        (@employee_id, @attendance_date, @requested_status, @reason);

    SELECT 1 AS success, 'Regularization request submitted' AS message;
END;


PROCEDURE : [dbo].[proc_apply_leave]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_apply_leave]    Script Date: 21-01-2026 13:27:17 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[proc_apply_leave]
    @employee_id INT,
    @leave_type_id INT,
    @start_date DATE,
    @end_date DATE,
    @reason VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @year INT = YEAR(@start_date);
        DECLARE @total_days DECIMAL(5,2);
        DECLARE @available_balance DECIMAL(5,2);
        
        -- Validate dates
        IF @end_date < @start_date
        BEGIN
            SELECT 0 AS success, 'End date cannot be before start date' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Calculate leave days (simple calculation - excluding weekends)
        -- TODO: Enhance to exclude holidays from holiday calendar
        SET @total_days = DATEDIFF(DAY, @start_date, @end_date) + 1;
        
        -- Subtract weekends (Saturday and Sunday)
        DECLARE @weekend_days INT = 0;
        DECLARE @current_date DATE = @start_date;
        
        WHILE @current_date <= @end_date
        BEGIN
            IF DATEPART(WEEKDAY, @current_date) IN (1, 7) -- Sunday=1, Saturday=7
                SET @weekend_days = @weekend_days + 1;
            SET @current_date = DATEADD(DAY, 1, @current_date);
        END
        
        SET @total_days = @total_days - @weekend_days;
        
        IF @total_days <= 0
        BEGIN
            SELECT 0 AS success, 'Leave period contains only weekends' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Check leave balance
        SELECT @available_balance = remaining
        FROM leave_balances
        WHERE employee_id = @employee_id
          AND leave_type_id = @leave_type_id
          AND year = @year;
        
        IF @available_balance IS NULL
        BEGIN
            SELECT 0 AS success, 'No leave balance allocated for this leave type' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @available_balance < @total_days
        BEGIN
            SELECT 0 AS success, 
                   'Insufficient leave balance. Available: ' + CAST(@available_balance AS VARCHAR) + ' days' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Check for overlapping leaves
        IF EXISTS (
            SELECT 1 FROM leave_requests
            WHERE employee_id = @employee_id
              AND status NOT IN ('REJECTED', 'CANCELLED')
              AND (
                  (@start_date BETWEEN start_date AND end_date)
                  OR (@end_date BETWEEN start_date AND end_date)
                  OR (start_date BETWEEN @start_date AND @end_date)
              )
        )
        BEGIN
            SELECT 0 AS success, 'Leave request overlaps with existing leave' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Insert leave request
        INSERT INTO leave_requests (
            employee_id, leave_type_id, start_date, end_date,
            total_days, reason, status
        )
        VALUES (
            @employee_id, @leave_type_id, @start_date, @end_date,
            @total_days, @reason, 'PENDING'
        );
        
        DECLARE @request_id INT = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        SELECT 1 AS success, 
               'Leave request submitted successfully' AS message,
               @request_id AS request_id,
               @total_days AS total_days;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS success, 'Failed to apply leave: ' + ERROR_MESSAGE() AS message;
    END CATCH
END;

PROCEDURE : [dbo].[proc_approve_attendance_regularization]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_approve_attendance_regularization]    Script Date: 21-01-2026 13:27:24 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_approve_attendance_regularization]
    @request_id INT,
    @approved_status VARCHAR(20),
    @approver_comment VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @emp_id INT, @att_date DATE;

    SELECT @emp_id = employee_id, @att_date = attendance_date
    FROM attendance_regularization
    WHERE request_id = @request_id;

    UPDATE attendance_regularization
    SET status = 'APPROVED',
        manager_comment = @approver_comment
    WHERE request_id = @request_id;

    EXEC proc_mark_manual_attendance
        @emp_id, @att_date, @approved_status;

    SELECT 1 AS success, 'Regularization approved' AS message;
END;


PROCEDURE : [dbo].[proc_authenticate_user]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_authenticate_user]    Script Date: 21-01-2026 15:49:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_authenticate_user]
    @email VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get user with password hash, role info, employee_id, and employee status
    SELECT 
        u.user_id,
        u.email,
        u.password_hash,
        u.is_active as user_is_active,
        r.role_code,
        r.role_name,
        e.employee_id,
        e.status as employee_status
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN employees e ON u.user_id = e.user_id
    WHERE u.email = @email 
        AND r.is_active = 1;  -- Only check if role is active, allow inactive users/employees
END;


PROCEDURE : [dbo].[proc_cancel_leave]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_cancel_leave]    Script Date: 21-01-2026 13:27:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[proc_cancel_leave]
    @request_id INT,
    @employee_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @current_status VARCHAR(20);
        DECLARE @request_employee_id INT;
        DECLARE @leave_type_id INT;
        DECLARE @total_days DECIMAL(5,2);
        DECLARE @year INT;
        
        -- Get request details
        SELECT 
            @current_status = status,
            @request_employee_id = employee_id,
            @leave_type_id = leave_type_id,
            @total_days = total_days,
            @year = YEAR(start_date)
        FROM leave_requests
        WHERE request_id = @request_id;
        
        IF @current_status IS NULL
        BEGIN
            SELECT 0 AS success, 'Leave request not found' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Verify employee owns this request
        IF @request_employee_id != @employee_id
        BEGIN
            SELECT 0 AS success, 'You can only cancel your own leave requests' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Cannot cancel rejected or already cancelled leaves
        IF @current_status IN ('REJECTED', 'CANCELLED')
        BEGIN
            SELECT 0 AS success, 'Leave request is already ' + @current_status AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- If HR approved, restore leave balance
        IF @current_status = 'HR_APPROVED'
        BEGIN
            UPDATE leave_balances
            SET used = used - @total_days,
                remaining = remaining + @total_days,
                updated_at = GETDATE()
            WHERE employee_id = @employee_id
              AND leave_type_id = @leave_type_id
              AND year = @year;
        END
        
        -- Update request status
        UPDATE leave_requests
        SET status = 'CANCELLED'
        WHERE request_id = @request_id;
        
        COMMIT TRANSACTION;
        SELECT 1 AS success, 'Leave request cancelled successfully' AS message;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS success, 'Failed to cancel leave: ' + ERROR_MESSAGE() AS message;
    END CATCH
END;

PROCEDURE : [dbo].[proc_change_user_password]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_change_user_password]    Script Date: 21-01-2026 13:29:54 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_change_user_password]
    @user_id INT,
    @new_password_hash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users 
    SET 
        password_hash = @new_password_hash,
        requires_password_change = 0,
        last_password_change = GETDATE()
    WHERE user_id = @user_id AND is_active = 1;
    
    IF @@ROWCOUNT > 0
        SELECT 1 AS success, 'Password updated successfully' AS message;
    ELSE
        SELECT 0 AS success, 'Failed to update password' AS message;
END;


PROCEDURE : [dbo].[proc_check_attendance_exists]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_check_attendance_exists]    Script Date: 21-01-2026 13:29:57 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_check_attendance_exists]
    @employee_id INT,
    @attendance_date DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) AS record_exists
    FROM attendance_daily
    WHERE employee_id = @employee_id 
        AND attendance_date = @attendance_date;
END;


PROCEDURE : [dbo].[proc_check_face_registration_status]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_check_face_registration_status]    Script Date: 21-01-2026 13:30:01 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_check_face_registration_status]
    @employee_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        @employee_id AS employee_id,
        CASE 
            WHEN p.face_encoding_json IS NOT NULL THEN 1 
            ELSE 0 
        END AS is_registered,
        p.face_registered_at AS registered_at,
        p.photo_path
    FROM employee_personal p
    WHERE p.employee_id = @employee_id;
END;


PROCEDURE : [dbo].[proc_check_password_change_required]


USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_check_password_change_required]    Script Date: 21-01-2026 13:30:04 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_check_password_change_required]
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ISNULL(requires_password_change, 0) AS requires_password_change,
        created_at,
        last_password_change
    FROM users 
    WHERE user_id = @user_id AND is_active = 1;
END;


PROCEDURE : [dbo].[proc_create_user]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_create_user]    Script Date: 21-01-2026 13:30:56 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_create_user]
    @email VARCHAR(255),
    @password_hash VARCHAR(255),
    @role_code VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM users WHERE email = @email)
    BEGIN
        SELECT 0 AS success, 'User already exists' AS message;
        RETURN;
    END

    DECLARE @role_id INT;
    SELECT @role_id = role_id FROM roles WHERE role_code = @role_code AND is_active = 1;

    IF @role_id IS NULL
    BEGIN
        SELECT 0 AS success, 'Invalid role' AS message;
        RETURN;
    END

    INSERT INTO users (email, password_hash, role_id)
    VALUES (@email, @password_hash, @role_id);

    SELECT 1 AS success, 'User created successfully' AS message;
END;


PROCEDURE : [dbo].[proc_delete_holiday]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_delete_holiday]    Script Date: 21-01-2026 13:31:01 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[proc_delete_holiday]
    @holiday_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if holiday exists
    IF NOT EXISTS (SELECT 1 FROM holidays WHERE holiday_id = @holiday_id)
    BEGIN
        SELECT 0 AS success, 'Holiday not found' AS message;
        RETURN;
    END

    -- Delete holiday
    DELETE FROM holidays WHERE holiday_id = @holiday_id;

    SELECT 1 AS success, 'Holiday deleted successfully' AS message;
END;

PROCEDURE : [dbo].[proc_generate_daily_attendance]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_generate_daily_attendance]    Script Date: 21-01-2026 13:31:07 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_generate_daily_attendance]
    @attendance_date DATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO attendance_daily (
        employee_id,
        attendance_date,
        first_check_in,
        last_check_out,
        working_minutes,
        status,
        is_holiday
    )
    SELECT
        e.employee_id,
        @attendance_date,
        MIN(r.log_time),
        MAX(r.log_time),
        DATEDIFF(MINUTE, MIN(r.log_time), MAX(r.log_time)),
        CASE 
            WHEN h.holiday_date IS NOT NULL THEN 'HOLIDAY'
            WHEN COUNT(r.log_id) = 0 THEN 'ABSENT'
            ELSE 'PRESENT'
        END,
        CASE WHEN h.holiday_date IS NOT NULL THEN 1 ELSE 0 END
    FROM employees e
    LEFT JOIN attendance_raw_logs r
        ON e.employee_id = r.employee_id
       AND CAST(r.log_time AS DATE) = @attendance_date
    LEFT JOIN holiday_calendar h
        ON h.holiday_date = @attendance_date
       AND h.is_active = 1
    WHERE NOT EXISTS (
        SELECT 1 FROM attendance_daily d
        WHERE d.employee_id = e.employee_id
          AND d.attendance_date = @attendance_date
    )
    GROUP BY e.employee_id, h.holiday_date;

    SELECT 1 AS success, 'Daily attendance generated' AS message;
END;



PROCEDURE : [dbo].[proc_get_all_active_face_encodings]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_all_active_face_encodings]    Script Date: 21-01-2026 13:31:11 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_get_all_active_face_encodings]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        e.employee_id,
        e.employee_code,
        p.first_name + ' ' + p.last_name AS employee_name,
        p.face_encoding_json,
        p.photo_path,
        p.face_registered_at
    FROM employees e
    JOIN employee_personal p ON e.employee_id = p.employee_id
    WHERE e.status = 'ACTIVE'
      AND p.face_encoding_json IS NOT NULL
    ORDER BY p.first_name;
END;


PROCEDURE : [dbo].[proc_get_attendance_by_date_range]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_attendance_by_date_range]    Script Date: 21-01-2026 13:32:02 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Update proc_get_attendance_by_date_range to sort by date DESC
ALTER PROC [dbo].[proc_get_attendance_by_date_range]
    @start_date DATE,
    @end_date DATE,
    @employee_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        ad.attendance_date,
        ad.employee_id,
        ep.first_name + ' ' + ep.last_name AS employee_name,
        ad.first_check_in,
        ad.last_check_out,
        ad.working_minutes,
        ad.status,
        ad.is_holiday
    FROM attendance_daily ad
    JOIN employees e ON ad.employee_id = e.employee_id
    JOIN employee_personal ep ON e.employee_id = ep.employee_id
    WHERE ad.attendance_date BETWEEN @start_date AND @end_date
      AND (@employee_id IS NULL OR ad.employee_id = @employee_id)
    ORDER BY ad.attendance_date DESC, ep.first_name;  -- Changed to DESC for latest first
END;


PROCEDURE : [dbo].[proc_get_attendance_by_employee]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_attendance_by_employee]    Script Date: 21-01-2026 13:32:11 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_get_attendance_by_employee]
    @employee_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT attendance_date, status, first_check_in, last_check_out, working_minutes
    FROM attendance_daily
    WHERE employee_id = @employee_id
    ORDER BY attendance_date DESC;
END;


PROCEDURE : [dbo].[proc_get_attendance_dashboard_data]

  
CREATE PROC [dbo].[proc_get_attendance_dashboard_data]  
    @attendance_date DATE = NULL,  
    @employee_id INT = NULL  
AS  
BEGIN  
    SET NOCOUNT ON;  
  
    IF @attendance_date IS NULL  
        SET @attendance_date = CAST(GETDATE() AS DATE);  
  
    -- 1. TODAY'S SUMMARY  
    IF @employee_id IS NULL  
    BEGIN  
        -- HR/Manager view - all employees  
        SELECT   
            COUNT(CASE WHEN status = 'PRESENT' OR status = 'LATE' THEN 1 END) AS total_present,  
            COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) AS total_absent,  
            COUNT(CASE WHEN status = 'LATE' THEN 1 END) AS total_late,  
            COUNT(CASE WHEN status = 'WFH' THEN 1 END) AS total_wfh,  
            COUNT(CASE WHEN is_holiday = 1 THEN 1 END) AS total_on_leave,  
            COUNT(*) AS total_employees  
        FROM attendance_daily  
        WHERE attendance_date = @attendance_date;  
    END  
    ELSE  
    BEGIN  
        -- Employee view - only their data  
        SELECT   
            COUNT(CASE WHEN status = 'PRESENT' OR status = 'LATE' THEN 1 END) AS total_present,  
            COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) AS total_absent,  
            COUNT(CASE WHEN status = 'LATE' THEN 1 END) AS total_late,  
            COUNT(CASE WHEN status = 'WFH' THEN 1 END) AS total_wfh,  
            COUNT(CASE WHEN is_holiday = 1 THEN 1 END) AS total_on_leave,  
            COUNT(*) AS total_employees  
        FROM attendance_daily  
        WHERE attendance_date = @attendance_date  
          AND employee_id = @employee_id;  
    END  
  
    -- 2. DEPARTMENT-WISE STATS (Only for HR/Manager)  
    IF @employee_id IS NULL  
    BEGIN  
        SELECT   
            eo.department,  
            COUNT(*) AS total,  
            COUNT(CASE WHEN ad.status = 'PRESENT' OR ad.status = 'LATE' THEN 1 END) AS present,  
            CAST(ROUND(  
                CASE   
                    WHEN COUNT(*) = 0 THEN 0  
                    ELSE CAST(COUNT(CASE WHEN ad.status = 'PRESENT' OR ad.status = 'LATE' THEN 1 END) AS FLOAT) /   
                         CAST(COUNT(*) AS FLOAT) * 100  
                END, 0  
            ) AS INT) AS percentage  
        FROM attendance_daily ad  
        JOIN employees e ON ad.employee_id = e.employee_id  
        JOIN employee_official eo ON e.employee_id = eo.employee_id  
        WHERE ad.attendance_date = @attendance_date  
        GROUP BY eo.department  
        ORDER BY percentage DESC;  
    END  
    ELSE  
    BEGIN  
        -- Return empty result set for employees  
        SELECT   
            '' AS department,  
            0 AS total,  
            0 AS present,  
            0 AS percentage  
        WHERE 1 = 0;  
    END  
  
    -- 3. RECENT ACTIVITY  
    IF @employee_id IS NULL  
    BEGIN  
        -- HR/Manager view - all employees  
        SELECT TOP 10  
            ep.first_name + ' ' + ep.last_name AS employee_name,  
            CASE   
                WHEN ad.last_check_out IS NOT NULL THEN 'Check-out'  
                ELSE 'Check-in'  
            END AS action,  
            CASE   
                WHEN ad.last_check_out IS NOT NULL THEN   
                    FORMAT(CAST(ad.last_check_out AS DATETIME), 'hh:mm tt')  
                ELSE   
                    FORMAT(CAST(ad.first_check_in AS DATETIME), 'hh:mm tt')  
            END AS time,  
            ad.status  
        FROM attendance_daily ad  
        JOIN employees e ON ad.employee_id = e.employee_id  
        JOIN employee_personal ep ON e.employee_id = ep.employee_id  
        WHERE ad.attendance_date = @attendance_date  
          AND (ad.first_check_in IS NOT NULL OR ad.last_check_out IS NOT NULL)  
        ORDER BY   
            CASE   
                WHEN ad.last_check_out IS NOT NULL THEN ad.last_check_out  
                ELSE ad.first_check_in  
            END DESC;  
    END  
    ELSE  
    BEGIN  
        -- Employee view - only their activity  
        SELECT TOP 10  
            ep.first_name + ' ' + ep.last_name AS employee_name,  
            CASE   
                WHEN ad.last_check_out IS NOT NULL THEN 'Check-out'  
                ELSE 'Check-in'  
            END AS action,  
            CASE   
                WHEN ad.last_check_out IS NOT NULL THEN   
                    FORMAT(CAST(ad.last_check_out AS DATETIME), 'hh:mm tt')  
                ELSE   
                    FORMAT(CAST(ad.first_check_in AS DATETIME), 'hh:mm tt')  
            END AS time,  
            ad.status  
        FROM attendance_daily ad  
        JOIN employees e ON ad.employee_id = e.employee_id  
        JOIN employee_personal ep ON e.employee_id = ep.employee_id  
        WHERE ad.attendance_date = @attendance_date  
          AND ad.employee_id = @employee_id  
          AND (ad.first_check_in IS NOT NULL OR ad.last_check_out IS NOT NULL)  
        ORDER BY   
            CASE   
                WHEN ad.last_check_out IS NOT NULL THEN ad.last_check_out  
                ELSE ad.first_check_in  
            END DESC;  
    END  
  
    -- 4. WEEKLY TREND (Last 7 days including today) - FIXED TO HANDLE EMPTY DATA  
    -- Create a date range table first, then LEFT JOIN with attendance data  
    ;WITH DateRange AS (  
        SELECT DATEADD(DAY, number, DATEADD(DAY, -6, @attendance_date)) AS date_val  
        FROM master.dbo.spt_values   
        WHERE type = 'P' AND number BETWEEN 0 AND 6  
    )  
    SELECT   
        DATENAME(WEEKDAY, dr.date_val) AS day_name,  
        FORMAT(dr.date_val, 'ddd') AS day,  
        ISNULL(SUM(CASE WHEN ad.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END), 0) AS present,  
        ISNULL(SUM(CASE WHEN ad.status = 'ABSENT' THEN 1 ELSE 0 END), 0) AS absent  
    FROM DateRange dr  
    LEFT JOIN attendance_daily ad ON dr.date_val = ad.attendance_date  
        AND (@employee_id IS NULL OR ad.employee_id = @employee_id)  
    GROUP BY dr.date_val, DATENAME(WEEKDAY, dr.date_val)  
    ORDER BY dr.date_val;  
END;  


PROCEDURE : [dbo].[proc_get_employee_by_user]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_employee_by_user]    Script Date: 21-01-2026 13:32:20 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_get_employee_by_user]
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        e.employee_id,
        e.employee_code,
        e.status,
        p.first_name,
        p.last_name,
        p.email,
        o.department,
        o.designation
    FROM employees e
    JOIN employee_personal p ON e.employee_id = p.employee_id
    JOIN employee_official o ON e.employee_id = o.employee_id
    WHERE e.user_id = @user_id AND e.status = 'ACTIVE';
END;


PROCEDURE : [dbo].[proc_get_employee_face_encoding]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_employee_face_encoding]    Script Date: 21-01-2026 13:33:13 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_get_employee_face_encoding]
    @employee_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        p.employee_id,
        p.face_encoding_json,
        p.photo_path,
        p.face_registered_at,
        p.first_name + ' ' + p.last_name AS employee_name
    FROM employee_personal p
    WHERE p.employee_id = @employee_id
      AND p.face_encoding_json IS NOT NULL;
END;


PROCEDURE : [dbo].[proc_get_employee_id_by_user_id]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_employee_id_by_user_id]    Script Date: 21-01-2026 13:33:19 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_get_employee_id_by_user_id]
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


PROCEDURE : [dbo].[proc_get_employee_list]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_employee_list]    Script Date: 21-01-2026 13:33:23 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_get_employee_list]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.employee_id,
        e.employee_code,
        p.first_name + ' ' + p.last_name AS employee_name,
        o.department,
        o.designation,
        e.status,
        e.created_at,
        p.email
    FROM employees e
    JOIN employee_personal p ON e.employee_id = p.employee_id
    JOIN employee_official o ON e.employee_id = o.employee_id
    ORDER BY e.created_at DESC; -- Default to newest first
END;



PROCEDURE : [dbo].[proc_get_employee_profile]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_employee_profile]    Script Date: 21-01-2026 13:33:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_get_employee_profile]
    @employee_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.employee_id,
        e.employee_code,
        e.status,
        p.first_name,
        p.last_name,
        p.dob,
        p.gender,
        p.phone,
        p.email,
        p.address,
        p.emergency_contact,
        p.photo_path,
        p.face_registered_at,
        o.date_of_joining,
        o.department,
        o.designation,
        o.employment_type,
        o.work_location,
        r.manager_id
    FROM employees e
    JOIN employee_personal p ON e.employee_id = p.employee_id
    JOIN employee_official o ON e.employee_id = o.employee_id
    LEFT JOIN employee_reporting r ON e.employee_id = r.employee_id
    WHERE e.employee_id = @employee_id;
END;


PROCEDURE : [dbo].[proc_get_leave_balances_by_employee]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_leave_balances_by_employee]    Script Date: 21-01-2026 13:35:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[proc_get_leave_balances_by_employee]
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
        lt.leave_name,
        lt.leave_code,
        lb.year,
        lb.total_allocated,
        lb.used,
        lb.remaining,
        lb.created_at,
        lb.updated_at
    FROM leave_balances lb
    JOIN leave_types lt ON lb.leave_type_id = lt.leave_type_id
    WHERE lb.employee_id = @employee_id
      AND lb.year = @year
    ORDER BY lt.leave_name;
END;


PROCEDURE : [dbo].[proc_get_leave_register]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_leave_register]    Script Date: 21-01-2026 13:36:03 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[proc_get_leave_register]
    @start_date DATE = NULL,
    @end_date DATE = NULL,
    @status VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @start_date IS NULL
        SET @start_date = DATEFROMPARTS(YEAR(GETDATE()), 1, 1);
    
    IF @end_date IS NULL
        SET @end_date = DATEFROMPARTS(YEAR(GETDATE()), 12, 31);
    
    SELECT 
        lr.request_id,
        lr.employee_id,
        e.employee_code,
        ep.first_name + ' ' + ep.last_name AS employee_name,
        eo.department,
        eo.designation,
        lr.leave_type_id,
        lt.leave_name,
        lt.leave_code,
        lr.start_date,
        lr.end_date,
        lr.total_days,
        lr.reason,
        lr.status,
        lr.applied_at
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.employee_id
    JOIN employee_personal ep ON e.employee_id = ep.employee_id
    JOIN employee_official eo ON e.employee_id = eo.employee_id
    JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
    WHERE lr.start_date >= @start_date
      AND lr.end_date <= @end_date
      AND (@status IS NULL OR lr.status = @status)
    ORDER BY lr.applied_at DESC;
END;

PROCEDURE : [dbo].[proc_get_leaves_by_department]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_leaves_by_department]    Script Date: 21-01-2026 13:36:09 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[proc_get_leaves_by_department]
    @department VARCHAR(100),
    @year INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @year IS NULL
        SET @year = YEAR(GETDATE());
    
    SELECT 
        lr.request_id,
        lr.employee_id,
        ep.first_name + ' ' + ep.last_name AS employee_name,
        eo.department,
        lr.leave_type_id,
        lt.leave_name,
        lr.start_date,
        lr.end_date,
        lr.total_days,
        lr.reason,
        lr.status,
        lr.applied_at
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.employee_id
    JOIN employee_personal ep ON e.employee_id = ep.employee_id
    JOIN employee_official eo ON e.employee_id = eo.employee_id
    JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
    WHERE eo.department = @department
      AND YEAR(lr.start_date) = @year
    ORDER BY lr.applied_at DESC;
END;

PROCEDURE : [dbo].[proc_get_leaves_by_employee]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_leaves_by_employee]    Script Date: 21-01-2026 13:36:23 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[proc_get_leaves_by_employee]
    @employee_id INT,
    @year INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @year IS NULL
        SET @year = YEAR(GETDATE());
    
    SELECT 
        lr.request_id,
        lr.employee_id,
        ep.first_name + ' ' + ep.last_name AS employee_name,
        lr.leave_type_id,
        lt.leave_name,
        lt.leave_code,
        lr.start_date,
        lr.end_date,
        lr.total_days,
        lr.reason,
        lr.status,
        lr.applied_at
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.employee_id
    JOIN employee_personal ep ON e.employee_id = ep.employee_id
    JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
    WHERE lr.employee_id = @employee_id
      AND YEAR(lr.start_date) = @year
    ORDER BY lr.applied_at DESC;
END;

PROCEDURE : [dbo].[proc_get_monthly_attendance_summary]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_monthly_attendance_summary]    Script Date: 21-01-2026 13:45:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_get_monthly_attendance_summary]
    @year INT,
    @month INT,
    @employee_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        ad.employee_id,
        ep.first_name + ' ' + ep.last_name AS employee_name,
        eo.department,
        COUNT(CASE WHEN ad.status = 'PRESENT' THEN 1 END) AS present_days,
        COUNT(CASE WHEN ad.status = 'ABSENT' THEN 1 END) AS absent_days,
        COUNT(CASE WHEN ad.status = 'LATE' THEN 1 END) AS late_days,
        COUNT(CASE WHEN ad.status = 'WFH' THEN 1 END) AS wfh_days,
        COUNT(CASE WHEN ad.is_holiday = 1 THEN 1 END) AS holiday_days,
        COUNT(*) AS total_days
    FROM attendance_daily ad
    JOIN employees e ON ad.employee_id = e.employee_id
    JOIN employee_personal ep ON e.employee_id = ep.employee_id
    JOIN employee_official eo ON e.employee_id = eo.employee_id
    WHERE YEAR(ad.attendance_date) = @year
      AND MONTH(ad.attendance_date) = @month
      AND (@employee_id IS NULL OR ad.employee_id = @employee_id)
    GROUP BY ad.employee_id, ep.first_name, ep.last_name, eo.department
    ORDER BY ep.first_name;
END;


PROCEDURE : [dbo].[proc_get_next_employee_code]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_next_employee_code]    Script Date: 21-01-2026 13:45:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_get_next_employee_code]
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @next_number INT;
    DECLARE @next_code VARCHAR(50);
    DECLARE @max_number INT;
    
    -- Get the highest employee number from VALID codes (EMP001, EMP002, etc.)
    -- Only consider codes with 3-digit numbers (EMP001-EMP999)
    SELECT @max_number = MAX(CAST(SUBSTRING(employee_code, 4, 3) AS INT))
    FROM employees 
    WHERE employee_code LIKE 'EMP[0-9][0-9][0-9]'  -- Only EMP + exactly 3 digits
      AND LEN(employee_code) = 6;  -- Exactly 6 characters total
    
    -- Set next number
    IF @max_number IS NOT NULL
    BEGIN
        SET @next_number = @max_number + 1;
    END
    ELSE
    BEGIN
        SET @next_number = 1;  -- Start from 1 if no valid codes found
    END
    
    -- Format as EMP001, EMP002, etc. (always 3 digits)
    SET @next_code = 'EMP' + RIGHT('000' + CAST(@next_number AS VARCHAR(10)), 3);
    
    SELECT @next_code AS next_employee_code;
END;


PROCEDURE : [dbo].[proc_get_pending_leaves]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_pending_leaves]    Script Date: 21-01-2026 13:45:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[proc_get_pending_leaves]
    @approver_role VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        lr.request_id,
        lr.employee_id,
        e.employee_code,
        ep.first_name + ' ' + ep.last_name AS employee_name,
        eo.department,
        lr.leave_type_id,
        lt.leave_name,
        lr.start_date,
        lr.end_date,
        lr.total_days,
        lr.reason,
        lr.status,
        lr.applied_at
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.employee_id
    JOIN employee_personal ep ON e.employee_id = ep.employee_id
    JOIN employee_official eo ON e.employee_id = eo.employee_id
    JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
    WHERE 
        (@approver_role = 'MANAGER' AND lr.status = 'PENDING')
        OR (@approver_role = 'HR' AND lr.status IN ('PENDING', 'MANAGER_APPROVED'))
        OR (@approver_role IS NULL AND lr.status IN ('PENDING', 'MANAGER_APPROVED'))
    ORDER BY lr.applied_at ASC;
END;

PROCEDURE : [dbo].[proc_get_pending_regularizations]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_pending_regularizations]    Script Date: 21-01-2026 13:45:54 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_get_pending_regularizations]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        ar.request_id,
        ar.employee_id,
        ep.first_name + ' ' + ep.last_name AS employee_name,
        ar.attendance_date,
        ar.requested_status,
        ar.reason,
        ar.status,
        ar.created_at
    FROM attendance_regularization ar
    JOIN employees e ON ar.employee_id = e.employee_id
    JOIN employee_personal ep ON e.employee_id = ep.employee_id
    WHERE ar.status = 'PENDING'
    ORDER BY ar.created_at DESC;
END;


PROCEDURE : [dbo].[proc_get_today_attendance_status]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_today_attendance_status]    Script Date: 21-01-2026 13:55:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_get_today_attendance_status]
    @employee_id INT,
    @attendance_date DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @attendance_date IS NULL
        SET @attendance_date = CAST(GETDATE() AS DATE);

    SELECT 
        @employee_id AS employee_id,
        @attendance_date AS attendance_date,
        MIN(r.log_time) AS first_check_in,
        MAX(r.log_time) AS last_check_out,
        COUNT(r.log_id) AS total_logs,
        CASE 
            WHEN COUNT(r.log_id) = 0 THEN 0
            WHEN COUNT(r.log_id) = 1 THEN 1
            ELSE 2
        END AS status_code  -- 0=not checked in, 1=checked in only, 2=checked in and out
    FROM attendance_raw_logs r
    WHERE r.employee_id = @employee_id
      AND CAST(r.log_time AS DATE) = @attendance_date
    GROUP BY r.employee_id;
    
    -- If no records, return default values
    IF @@ROWCOUNT = 0
    BEGIN
        SELECT 
            @employee_id AS employee_id,
            @attendance_date AS attendance_date,
            NULL AS first_check_in,
            NULL AS last_check_out,
            0 AS total_logs,
            0 AS status_code;
    END
END;


PROCEDURE : [dbo].[proc_get_user_by_email]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_user_by_email]    Script Date: 21-01-2026 13:55:57 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_get_user_by_email]
    @email VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        u.user_id,
        u.email,
        r.role_code,
        r.role_name,
        u.is_active
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE u.email = @email;
END;


PROCEDURE : [dbo].[proc_get_user_by_id]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_user_by_id]    Script Date: 29-01-2026 15:45:03 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

        ALTER PROC [dbo].[proc_get_user_by_id]
            @user_id INT
        AS
        BEGIN
            SET NOCOUNT ON;

            SELECT 
                u.user_id,
                u.email,
                u.password_hash,
                r.role_code,
                r.role_name,
                u.is_active
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.user_id = @user_id;
        END
    


PROCEDURE : [dbo].[proc_get_valid_employee_ids]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_valid_employee_ids]    Script Date: 21-01-2026 13:56:08 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_get_valid_employee_ids]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT employee_id 
    FROM employees
    WHERE status = 'ACTIVE';
END;


PROCEDURE : [dbo].[proc_hr_approve_leave]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_hr_approve_leave]    Script Date: 21-01-2026 13:58:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[proc_hr_approve_leave]
    @request_id INT,
    @approver_id INT,
    @comment VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @current_status VARCHAR(20);
        DECLARE @employee_id INT;
        DECLARE @leave_type_id INT;
        DECLARE @total_days DECIMAL(5,2);
        DECLARE @year INT;
        
        -- Get request details
        SELECT 
            @current_status = status,
            @employee_id = employee_id,
            @leave_type_id = leave_type_id,
            @total_days = total_days,
            @year = YEAR(start_date)
        FROM leave_requests
        WHERE request_id = @request_id;
        
        IF @current_status IS NULL
        BEGIN
            SELECT 0 AS success, 'Leave request not found' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- HR can approve from PENDING or MANAGER_APPROVED
        IF @current_status NOT IN ('PENDING', 'MANAGER_APPROVED')
        BEGIN
            SELECT 0 AS success, 'Leave request cannot be approved in current state' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Update leave balance
        UPDATE leave_balances
        SET used = used + @total_days,
            remaining = remaining - @total_days,
            updated_at = GETDATE()
        WHERE employee_id = @employee_id
          AND leave_type_id = @leave_type_id
          AND year = @year;
        
        -- Update request status
        UPDATE leave_requests
        SET status = 'HR_APPROVED'
        WHERE request_id = @request_id;
        
        -- Record approval
        INSERT INTO leave_approvals (
            request_id, approver_role, approver_id, action, comment
        )
        VALUES (
            @request_id, 'HR', @approver_id, 'APPROVED', @comment
        );
        
        COMMIT TRANSACTION;
        SELECT 1 AS success, 'Leave approved by HR. Leave balance updated.' AS message;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS success, 'Failed to approve leave: ' + ERROR_MESSAGE() AS message;
    END CATCH
END;


PROCEDURE : [dbo].[proc_list_departments]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_list_departments]    Script Date: 21-01-2026 13:58:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_list_departments]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT department_id, department_code, department_name, is_active
    FROM departments
    ORDER BY department_name;
END;


PROCEDURE : [dbo].[proc_list_designations]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_list_designations]    Script Date: 21-01-2026 13:58:57 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_list_designations]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT designation_id, designation_name, designation_level, is_active
    FROM designations
    ORDER BY designation_level;
END;


PROCEDURE : [dbo].[proc_list_holidays_by_year]


USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_list_holidays_by_year]    Script Date: 21-01-2026 13:59:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_list_holidays_by_year]
    @calendar_year INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT holiday_date, holiday_name, holiday_type
    FROM holiday_calendar
    WHERE calendar_year = @calendar_year
      AND is_active = 1
    ORDER BY holiday_date;
END;


PROCEDURE : [dbo].[proc_list_leave_types]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_list_leave_types]    Script Date: 21-01-2026 13:59:56 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_list_leave_types]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT leave_type_id, leave_code, leave_name, max_days_per_year, is_active
    FROM leave_types
    ORDER BY leave_name;
END;


PROCEDURE : [dbo].[proc_list_locations]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_list_locations]    Script Date: 21-01-2026 14:00:02 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_list_locations]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT location_id, location_name, city, country, is_active
    FROM locations
    ORDER BY location_name;
END;


PROCEDURE : [dbo].[proc_list_salary_structures]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_list_salary_structures]    Script Date: 21-01-2026 14:00:05 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_list_salary_structures]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT structure_id, structure_name, structure_type, is_active
    FROM salary_structures
    ORDER BY structure_name;
END;


PROCEDURE : [dbo].[proc_log_user_session]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_log_user_session]    Script Date: 21-01-2026 14:00:09 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_log_user_session]
    @user_id INT,
    @ip_address VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO user_sessions (user_id, ip_address)
    VALUES (@user_id, @ip_address);

    SELECT 1 AS success, 'Session logged' AS message;
END;


PROCEDURE : [dbo].[proc_login_user]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_login_user]    Script Date: 21-01-2026 14:00:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_login_user]
    @email VARCHAR(255),
    @password_hash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        u.user_id,
        u.email,
        r.role_code,
        r.role_name
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE u.email = @email
      AND u.password_hash = @password_hash
      AND u.is_active = 1
      AND r.is_active = 1;

    IF @@ROWCOUNT = 0
    BEGIN
        SELECT 0 AS success, 'Invalid credentials or inactive user' AS message;
        RETURN;
    END

    SELECT 1 AS success, 'Login successful' AS message;
END;


PROCEDURE : [dbo].[proc_manager_approve_leave]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_manager_approve_leave]    Script Date: 21-01-2026 14:00:57 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[proc_manager_approve_leave]
    @request_id INT,
    @approver_id INT,
    @comment VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @current_status VARCHAR(20);
        
        -- Get current status
        SELECT @current_status = status
        FROM leave_requests
        WHERE request_id = @request_id;
        
        IF @current_status IS NULL
        BEGIN
            SELECT 0 AS success, 'Leave request not found' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @current_status != 'PENDING'
        BEGIN
            SELECT 0 AS success, 'Leave request is not in pending state' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Update request status
        UPDATE leave_requests
        SET status = 'MANAGER_APPROVED'
        WHERE request_id = @request_id;
        
        -- Record approval
        INSERT INTO leave_approvals (
            request_id, approver_role, approver_id, action, comment
        )
        VALUES (
            @request_id, 'MANAGER', @approver_id, 'APPROVED', @comment
        );
        
        COMMIT TRANSACTION;
        SELECT 1 AS success, 'Leave approved by manager. Pending HR approval.' AS message;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS success, 'Failed to approve leave: ' + ERROR_MESSAGE() AS message;
    END CATCH
END;

PROCEDURE : [dbo].[proc_mark_attendance_raw]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_mark_attendance_raw]    Script Date: 21-01-2026 15:12:11 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_mark_attendance_raw]
    @employee_id INT,
    @log_time DATETIME,
    @source VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if employee is active
    IF NOT EXISTS (
        SELECT 1 FROM employees 
        WHERE employee_id = @employee_id AND status = 'ACTIVE'
    )
    BEGIN
        SELECT 0 AS success, 'Cannot mark attendance for inactive employee' AS message;
        RETURN;
    END

    INSERT INTO attendance_raw_logs (employee_id, log_time, source)
    VALUES (@employee_id, @log_time, @source);

    SELECT 1 AS success, 'Raw attendance logged' AS message;
END;



PROCEDURE : [dbo].[proc_mark_attendance_with_face]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_mark_attendance_with_face]    Script Date: 21-01-2026 15:12:18 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_mark_attendance_with_face]
    @employee_id INT,
    @log_time DATETIME,
    @confidence DECIMAL(5,2),
    @image_path VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if employee is active
    IF NOT EXISTS (
        SELECT 1 FROM employees 
        WHERE employee_id = @employee_id AND status = 'ACTIVE'
    )
    BEGIN
        SELECT 0 AS success, 'Cannot mark attendance for inactive employee' AS message;
        RETURN;
    END

    INSERT INTO attendance_raw_logs (employee_id, log_time, source, confidence, image_path)
    VALUES (@employee_id, @log_time, 'FACE', @confidence, @image_path);

    DECLARE @log_id INT = SCOPE_IDENTITY();

    SELECT 1 AS success, 'Face attendance logged' AS message, @log_id AS log_id;
END;



PROCEDURE : [dbo].[proc_mark_manual_attendance]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_mark_manual_attendance]    Script Date: 21-01-2026 17:21:54 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Update manual attendance procedure to check for active employees
ALTER PROCEDURE [dbo].[proc_mark_manual_attendance]
    @employee_id INT,
    @attendance_date DATE,
    @status VARCHAR(20),
    @check_in_time TIME = NULL,
    @check_out_time TIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if employee is active
    IF NOT EXISTS (
        SELECT 1 FROM employees 
        WHERE employee_id = @employee_id AND status = 'ACTIVE'
    )
    BEGIN
        SELECT 0 AS success, 'Cannot mark attendance for inactive employee' AS message;
        RETURN;
    END

    DECLARE @working_mins INT = NULL;
    
    -- Calculate working minutes if both times provided
    IF @check_in_time IS NOT NULL AND @check_out_time IS NOT NULL
    BEGIN
        SET @working_mins = DATEDIFF(MINUTE, @check_in_time, @check_out_time);
    END

    -- Update existing record
    IF EXISTS (
        SELECT 1 FROM attendance_daily
        WHERE employee_id = @employee_id
          AND attendance_date = @attendance_date
    )
    BEGIN
        UPDATE attendance_daily
        SET status = @status,
            first_check_in = COALESCE(@check_in_time, first_check_in),
            last_check_out = COALESCE(@check_out_time, last_check_out),
            working_minutes = COALESCE(@working_mins, working_minutes),
            is_holiday = CASE WHEN @status = 'HOLIDAY' THEN 1 ELSE 0 END
        WHERE employee_id = @employee_id
          AND attendance_date = @attendance_date;
    END
    ELSE
    BEGIN
        -- Insert new record
        INSERT INTO attendance_daily
            (employee_id, attendance_date, status, first_check_in, last_check_out, working_minutes, is_holiday)
        VALUES
            (@employee_id, @attendance_date, @status, @check_in_time, @check_out_time, @working_mins,
             CASE WHEN @status = 'HOLIDAY' THEN 1 ELSE 0 END);
    END

    SELECT 1 AS success, 'Manual attendance updated' AS message;
END;



PROCEDURE : [dbo].[proc_register_employee_face]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_register_employee_face]    Script Date: 21-01-2026 14:02:12 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_register_employee_face]
    @employee_id INT,
    @face_encoding_json NVARCHAR(MAX),
    @photo_path VARCHAR(500) = NULL,
    @registered_by VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if employee exists
    IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = @employee_id)
    BEGIN
        SELECT 0 AS success, 'Employee not found' AS message;
        RETURN;
    END

    -- If face_encoding_json is NULL, we're clearing the face data
    IF @face_encoding_json IS NULL
    BEGIN
        UPDATE employee_personal
        SET face_encoding_json = NULL,
            photo_path = @photo_path,
            face_registered_at = NULL,
            face_registered_by = NULL
        WHERE employee_id = @employee_id;
        
        SELECT 1 AS success, 'Face data cleared successfully' AS message, @employee_id AS employee_id;
    END
    ELSE
    BEGIN
        -- Register/update face data
        UPDATE employee_personal
        SET face_encoding_json = @face_encoding_json,
            photo_path = COALESCE(@photo_path, photo_path),  -- Keep existing if not provided
            face_registered_at = GETDATE(),
            face_registered_by = @registered_by
        WHERE employee_id = @employee_id;
        
        SELECT 1 AS success, 'Face registered successfully' AS message, @employee_id AS employee_id;
    END
END;


PROCEDURE : [dbo].[proc_reject_attendance_regularization]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_reject_attendance_regularization]    Script Date: 21-01-2026 14:02:16 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_reject_attendance_regularization]
    @request_id INT,
    @comment VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE attendance_regularization
    SET status = 'REJECTED',
        manager_comment = @comment
    WHERE request_id = @request_id;

    SELECT 1 AS success, 'Regularization rejected' AS message;
END;


PROCEDURE : [dbo].[proc_reject_leave]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_reject_leave]    Script Date: 21-01-2026 14:02:22 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[proc_reject_leave]
    @request_id INT,
    @approver_id INT,
    @approver_role VARCHAR(20),
    @comment VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @current_status VARCHAR(20);
        
        -- Get current status
        SELECT @current_status = status
        FROM leave_requests
        WHERE request_id = @request_id;
        
        IF @current_status IS NULL
        BEGIN
            SELECT 0 AS success, 'Leave request not found' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @current_status NOT IN ('PENDING', 'MANAGER_APPROVED')
        BEGIN
            SELECT 0 AS success, 'Leave request cannot be rejected in current state' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Update request status
        UPDATE leave_requests
        SET status = 'REJECTED'
        WHERE request_id = @request_id;
        
        -- Record rejection
        INSERT INTO leave_approvals (
            request_id, approver_role, approver_id, action, comment
        )
        VALUES (
            @request_id, @approver_role, @approver_id, 'REJECTED', @comment
        );
        
        COMMIT TRANSACTION;
        SELECT 1 AS success, 'Leave request rejected' AS message;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS success, 'Failed to reject leave: ' + ERROR_MESSAGE() AS message;
    END CATCH
END;

PROCEDURE : [dbo].[proc_update_employee]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_update_employee]    Script Date: 21-01-2026 15:13:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_update_employee]
    -- Personal Information
    @employee_id INT,
    @first_name VARCHAR(100),
    @last_name VARCHAR(100),
    @email VARCHAR(255),
    @phone VARCHAR(20) = NULL,
    @dob DATE = NULL,
    @gender VARCHAR(20) = NULL,
    @address VARCHAR(500) = NULL,
    @emergency_contact VARCHAR(20) = NULL,
    
    -- Official Information
    @department VARCHAR(100),
    @designation VARCHAR(100),
    @date_of_joining DATE = NULL,
    @employment_type VARCHAR(50) = NULL,
    @work_location VARCHAR(100) = NULL,
    
    -- Reporting
    @manager_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if employee exists
    IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = @employee_id)
    BEGIN
        SELECT 0 AS success, 'Employee not found' AS message;
        RETURN;
    END
    
    -- Check if employee is active (can only edit active employees)
    IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = @employee_id AND status = 'ACTIVE')
    BEGIN
        SELECT 0 AS success, 'Cannot edit inactive employee. Please reactivate the employee first.' AS message;
        RETURN;
    END

    -- Check if email is being changed to one that already exists
    IF EXISTS (
        SELECT 1 FROM employee_personal 
        WHERE email = @email 
        AND employee_id != @employee_id
    )
    BEGIN
        SELECT 0 AS success, 'Email already exists for another employee' AS message;
        RETURN;
    END

    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Update employee_personal table
        UPDATE employee_personal
        SET 
            first_name = @first_name,
            last_name = @last_name,
            email = @email,
            phone = @phone,
            dob = @dob,
            gender = @gender,
            address = @address,
            emergency_contact = @emergency_contact
        WHERE employee_id = @employee_id;

        -- Update employee_official table
        UPDATE employee_official
        SET 
            department = @department,
            designation = @designation,
            date_of_joining = @date_of_joining,
            employment_type = @employment_type,
            work_location = @work_location
        WHERE employee_id = @employee_id;

        -- Update employee_reporting table
        UPDATE employee_reporting
        SET manager_id = @manager_id
        WHERE employee_id = @employee_id;

        COMMIT TRANSACTION;
        
        SELECT 1 AS success, 'Employee updated successfully' AS message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SELECT 0 AS success, 'Failed to update employee: ' + ERROR_MESSAGE() AS message;
    END CATCH
END;



PROCEDURE : [dbo].[proc_update_employee_photo]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_update_employee_photo]    Script Date: 21-01-2026 14:04:29 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_update_employee_photo]
    @employee_id INT,
    @photo_path VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if employee exists
    IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = @employee_id)
    BEGIN
        SELECT 0 AS success, 'Employee not found' AS message;
        RETURN;
    END

    -- Update photo path
    UPDATE employee_personal
    SET photo_path = @photo_path
    WHERE employee_id = @employee_id;

    SELECT 1 AS success, 'Employee photo updated successfully' AS message;
END;


PROCEDURE : [dbo].[proc_update_holiday]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_update_holiday]    Script Date: 21-01-2026 14:04:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROC [dbo].[proc_update_holiday]
    @holiday_id INT,
    @holiday_date DATE,
    @holiday_name VARCHAR(200),
    @holiday_type VARCHAR(50),
    @calendar_year INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if holiday exists
    IF NOT EXISTS (SELECT 1 FROM holidays WHERE holiday_id = @holiday_id)
    BEGIN
        SELECT 0 AS success, 'Holiday not found' AS message;
        RETURN;
    END

    -- Update holiday
    UPDATE holidays
    SET holiday_date = @holiday_date,
        holiday_name = @holiday_name,
        holiday_type = @holiday_type,
        calendar_year = @calendar_year
    WHERE holiday_id = @holiday_id;

    SELECT 1 AS success, 'Holiday updated successfully' AS message;
END;

PROCEDURE : [dbo].[proc_upsert_attendance_record]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_upsert_attendance_record]    Script Date: 21-01-2026 14:04:41 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_upsert_attendance_record]
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


PROCEDURE : [dbo].[proc_validate_user_status]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_validate_user_status]    Script Date: 21-01-2026 14:05:33 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROC [dbo].[proc_validate_user_status]
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1 FROM users
        WHERE user_id = @user_id AND is_active = 1
    )
        SELECT 1 AS success, 'User active' AS message;
    ELSE
        SELECT 0 AS success, 'User inactive or not found' AS message;
END;


PROCEDURE : [dbo].[proc_deactivate_employee]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_deactivate_employee]    Script Date: 21-01-2026 15:14:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_deactivate_employee]
    @employee_id INT,
    @deactivated_by_user_id INT,
    @reason VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if employee exists and is currently active
        IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = @employee_id)
        BEGIN
            SELECT 0 AS success, 'Employee not found' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        DECLARE @current_status VARCHAR(20);
        SELECT @current_status = status FROM employees WHERE employee_id = @employee_id;
        
        IF @current_status = 'INACTIVE'
        BEGIN
            SELECT 0 AS success, 'Employee is already inactive' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Update employee status to INACTIVE
        UPDATE employees 
        SET status = 'INACTIVE'
        WHERE employee_id = @employee_id;
        
        -- Deactivate associated user account
        UPDATE users 
        SET is_active = 0
        WHERE user_id = (SELECT user_id FROM employees WHERE employee_id = @employee_id);
        
        -- Log the deactivation action
        INSERT INTO employee_audit_log (
            employee_id, 
            action_type, 
            action_details, 
            created_by_user_id
        )
        VALUES (
            @employee_id, 
            'DEACTIVATED', 
            COALESCE(@reason, 'Employee deactivated'), 
            @deactivated_by_user_id
        );
        
        COMMIT TRANSACTION;
        SELECT 1 AS success, 'Employee deactivated successfully' AS message;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS success, 'Failed to deactivate employee: ' + ERROR_MESSAGE() AS message;
    END CATCH
END;


PROCEDURE : [dbo].[proc_reactivate_employee]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_reactivate_employee]    Script Date: 21-01-2026 15:14:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_reactivate_employee]
    @employee_id INT,
    @reactivated_by_user_id INT,
    @reason VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if employee exists and is currently inactive
        IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = @employee_id)
        BEGIN
            SELECT 0 AS success, 'Employee not found' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        DECLARE @current_status VARCHAR(20);
        SELECT @current_status = status FROM employees WHERE employee_id = @employee_id;
        
        IF @current_status = 'ACTIVE'
        BEGIN
            SELECT 0 AS success, 'Employee is already active' AS message;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Update employee status to ACTIVE
        UPDATE employees 
        SET status = 'ACTIVE'
        WHERE employee_id = @employee_id;
        
        -- Reactivate associated user account
        UPDATE users 
        SET is_active = 1
        WHERE user_id = (SELECT user_id FROM employees WHERE employee_id = @employee_id);
        
        -- Log the reactivation action
        INSERT INTO employee_audit_log (
            employee_id, 
            action_type, 
            action_details, 
            created_by_user_id
        )
        VALUES (
            @employee_id, 
            'REACTIVATED', 
            COALESCE(@reason, 'Employee reactivated'), 
            @reactivated_by_user_id
        );
        
        COMMIT TRANSACTION;
        SELECT 1 AS success, 'Employee reactivated successfully' AS message;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS success, 'Failed to reactivate employee: ' + ERROR_MESSAGE() AS message;
    END CATCH
END;


PROCEDURE : [dbo].[proc_get_employee_status_history]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_employee_status_history]    Script Date: 21-01-2026 15:15:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_get_employee_status_history]
    @employee_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        eal.log_id,
        eal.action_type,
        eal.action_details,
        eal.created_at,
        u.email as created_by_email
    FROM employee_audit_log eal
    LEFT JOIN users u ON eal.created_by_user_id = u.user_id
    WHERE eal.employee_id = @employee_id
      AND eal.action_type IN ('ACTIVATED', 'DEACTIVATED', 'REACTIVATED')
    ORDER BY eal.created_at DESC;
END;


PROCEDURE : [dbo].[proc_get_active_employees_for_attendance]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_active_employees_for_attendance]    Script Date: 21-01-2026 17:19:23 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_get_active_employees_for_attendance]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.employee_id,
        e.employee_code,
        p.first_name + ' ' + p.last_name AS employee_name,
        o.department,
        o.designation,
        e.status,
        e.created_at,
        p.email
    FROM employees e
    JOIN employee_personal p ON e.employee_id = p.employee_id
    JOIN employee_official o ON e.employee_id = o.employee_id
    WHERE e.status = 'ACTIVE'  -- Only active employees
    ORDER BY p.first_name, p.last_name;
END;


PROCEDURE : [dbo].[proc_get_employee_list_with_status]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_employee_list_with_status]    Script Date: 21-01-2026 17:20:23 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_get_employee_list_with_status]
    @status_filter VARCHAR(20) = NULL  -- NULL = all, 'ACTIVE' = active only, 'INACTIVE' = inactive only
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.employee_id,
        e.employee_code,
        p.first_name + ' ' + p.last_name AS employee_name,
        o.department,
        o.designation,
        e.status,
        e.created_at,
        p.email
    FROM employees e
    JOIN employee_personal p ON e.employee_id = p.employee_id
    JOIN employee_official o ON e.employee_id = o.employee_id
    WHERE (@status_filter IS NULL OR e.status = @status_filter)
    ORDER BY e.created_at DESC; -- Default to newest first
END;


PROCEDURE : [dbo].[proc_get_employee_id_by_user_id_for_leave_view]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_employee_id_by_user_id_for_leave_view]    Script Date: 21-01-2026 17:35:28 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_get_employee_id_by_user_id_for_leave_view]
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Allow both ACTIVE and INACTIVE employees to view their leave history
    SELECT 
        e.employee_id,
        e.employee_code,
        ep.first_name + ' ' + ep.last_name AS employee_name,
        e.status
    FROM employees e
    JOIN employee_personal ep ON e.employee_id = ep.employee_id
    WHERE e.user_id = @user_id;  -- No status filter for leave viewing
END;


PROCEDURE : [dbo].[proc_get_admin_dashboard_stats]


USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_admin_dashboard_stats]    Script Date: 29-01-2026 13:45:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[proc_get_admin_dashboard_stats]
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @total_employees INT = 0;
    DECLARE @active_employees INT = 0;
    DECLARE @total_departments INT = 0;
    DECLARE @pending_actions INT = 0;
    
    -- Get employee counts (using correct column name 'status')
    SELECT 
        @total_employees = COUNT(*),
        @active_employees = SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END)
    FROM employees;
    
    -- Get department count
    SELECT @total_departments = COUNT(*) FROM departments WHERE is_active = 1;
    
    -- Get pending actions (example: pending leave requests)
    SELECT @pending_actions = COUNT(*) FROM leave_requests WHERE status = 'PENDING';
    
    SELECT 
        @total_employees as total_employees,
        @active_employees as active_employees,
        @total_departments as total_departments,
        @pending_actions as pending_actions,
        CAST(@active_employees AS FLOAT) / NULLIF(@total_employees, 0) * 100 as active_rate;
END;


PROCEDURE : [dbo].[proc_generate_system_report]


USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_generate_system_report]    Script Date: 29-01-2026 13:46:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[proc_generate_system_report]
    @report_type NVARCHAR(50),
    @date_from DATE = NULL,
    @date_to DATE = NULL,
    @department_filter NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @report_type = 'employee-master'
    BEGIN
        SELECT 
            e.employee_id,
            e.employee_code,
            ep.first_name,
            ep.last_name,
            ep.email,
            ep.phone,
            eo.department,
            eo.designation,
            eo.date_of_joining,
            e.status,
            eo.work_location,
            ep.gender,
            ep.dob as date_of_birth,
            e.created_at
        FROM employees e
        LEFT JOIN employee_personal ep ON e.employee_id = ep.employee_id
        LEFT JOIN employee_official eo ON e.employee_id = eo.employee_id
        WHERE (@department_filter IS NULL OR eo.department = @department_filter)
        ORDER BY e.employee_code;
    END
    ELSE IF @report_type = 'attendance-summary'
    BEGIN
        SELECT 
            e.employee_code,
            ep.first_name + ' ' + ep.last_name as employee_name,
            eo.department,
            COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as present_days,
            COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as absent_days,
            COUNT(CASE WHEN a.status = 'LATE' THEN 1 END) as late_days,
            COUNT(CASE WHEN a.status = 'WFH' THEN 1 END) as wfh_days,
            COUNT(*) as total_days
        FROM employees e
        LEFT JOIN employee_personal ep ON e.employee_id = ep.employee_id
        LEFT JOIN employee_official eo ON e.employee_id = eo.employee_id
        LEFT JOIN attendance_daily a ON e.employee_id = a.employee_id
        WHERE (@date_from IS NULL OR a.attendance_date >= @date_from)
          AND (@date_to IS NULL OR a.attendance_date <= @date_to)
          AND (@department_filter IS NULL OR eo.department = @department_filter)
          AND e.status = 'ACTIVE'
        GROUP BY e.employee_code, ep.first_name, ep.last_name, eo.department
        ORDER BY e.employee_code;
    END
    ELSE IF @report_type = 'leave-summary'
    BEGIN
        SELECT 
            e.employee_code,
            ep.first_name + ' ' + ep.last_name as employee_name,
            eo.department,
            lt.leave_name,
            lb.total_allocated,
            lb.used,
            lb.remaining,
            COUNT(lr.request_id) as total_requests,
            COUNT(CASE WHEN lr.status = 'HR_APPROVED' THEN 1 END) as approved_requests,
            COUNT(CASE WHEN lr.status = 'PENDING' THEN 1 END) as pending_requests
        FROM employees e
        LEFT JOIN employee_personal ep ON e.employee_id = ep.employee_id
        LEFT JOIN employee_official eo ON e.employee_id = eo.employee_id
        LEFT JOIN leave_balances lb ON e.employee_id = lb.employee_id
        LEFT JOIN leave_types lt ON lb.leave_type_id = lt.leave_type_id
        LEFT JOIN leave_requests lr ON e.employee_id = lr.employee_id AND lr.leave_type_id = lt.leave_type_id
        WHERE (@department_filter IS NULL OR eo.department = @department_filter)
          AND e.status = 'ACTIVE'
        GROUP BY e.employee_code, ep.first_name, ep.last_name, eo.department, 
                 lt.leave_name, lb.total_allocated, lb.used, lb.remaining
        ORDER BY e.employee_code, lt.leave_name;
    END
    ELSE
    BEGIN
        SELECT 'Invalid report type' as error_message;
    END
END;


PROCEDURE : [dbo].[proc_list_letter_templates]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_list_letter_templates]    Script Date: 29-01-2026 13:46:12 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_list_letter_templates]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        template_id,
        template_name,
        template_category,
        template_content,
        description,
        is_active,
        created_date,
        modified_date,
        CASE 
            WHEN is_active = 1 THEN 'Active'
            ELSE 'Inactive'
        END as status
    FROM letter_templates
    ORDER BY template_category, template_name;
END;



PROCEDURE : [dbo].[proc_add_letter_template]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_add_letter_template]    Script Date: 29-01-2026 13:46:25 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_add_letter_template]
    @template_name NVARCHAR(255),
    @template_category NVARCHAR(100),
    @template_content NVARCHAR(MAX),
    @description NVARCHAR(500) = NULL,
    @is_active BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @template_id INT;
    
    -- Check if template name already exists
    IF EXISTS (SELECT 1 FROM letter_templates WHERE template_name = @template_name AND is_active = 1)
    BEGIN
        SELECT 0 as success, 'Template name already exists' as message;
        RETURN;
    END
    
    INSERT INTO letter_templates (
        template_name, template_category, template_content, 
        description, is_active, created_date, modified_date
    )
    VALUES (
        @template_name, @template_category, @template_content,
        @description, @is_active, GETDATE(), GETDATE()
    );
    
    SET @template_id = SCOPE_IDENTITY();
    
    SELECT 1 as success, 'Letter template added successfully' as message, @template_id as template_id;
END;


PROCEDURE : [dbo].[proc_update_letter_template]


USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_update_letter_template]    Script Date: 29-01-2026 13:48:07 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_update_letter_template]
    @template_id INT,
    @template_name NVARCHAR(255),
    @template_category NVARCHAR(100),
    @template_content NVARCHAR(MAX),
    @description NVARCHAR(500) = NULL,
    @is_active BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if template exists
    IF NOT EXISTS (SELECT 1 FROM letter_templates WHERE template_id = @template_id)
    BEGIN
        SELECT 0 as success, 'Template not found' as message;
        RETURN;
    END
    
    -- Check if template name already exists for other templates
    IF EXISTS (SELECT 1 FROM letter_templates WHERE template_name = @template_name AND template_id != @template_id AND is_active = 1)
    BEGIN
        SELECT 0 as success, 'Template name already exists' as message;
        RETURN;
    END
    
    UPDATE letter_templates 
    SET 
        template_name = @template_name,
        template_category = @template_category,
        template_content = @template_content,
        description = @description,
        is_active = @is_active,
        modified_date = GETDATE()
    WHERE template_id = @template_id;
    
    SELECT 1 as success, 'Letter template updated successfully' as message;
END;


PROCEDURE : [dbo].[proc_delete_letter_template]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_delete_letter_template]    Script Date: 29-01-2026 13:48:48 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_delete_letter_template]
    @template_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if template exists
    IF NOT EXISTS (SELECT 1 FROM letter_templates WHERE template_id = @template_id)
    BEGIN
        SELECT 0 as success, 'Template not found' as message;
        RETURN;
    END
    
    -- Soft delete by setting is_active = 0
    UPDATE letter_templates 
    SET is_active = 0, modified_date = GETDATE()
    WHERE template_id = @template_id;
    
    SELECT 1 as success, 'Letter template deleted successfully' as message;
END;


PROCEDURE : [dbo].[proc_list_company_policies]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_list_company_policies]    Script Date: 29-01-2026 13:49:15 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_list_company_policies]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        policy_id,
        policy_title,
        policy_category,
        policy_description,
        policy_version,
        effective_date,
        policy_status,
        visibility_settings,
        file_path,
        file_size,
        created_date,
        modified_date
    FROM company_policies
    ORDER BY policy_category, policy_title;
END;


PROCEDURE : [dbo].[proc_add_company_policy]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_add_company_policy]    Script Date: 29-01-2026 13:49:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_add_company_policy]
    @policy_title NVARCHAR(255),
    @policy_category NVARCHAR(100),
    @policy_description NVARCHAR(1000),
    @policy_version NVARCHAR(20) = '1.0',
    @effective_date DATE = NULL,
    @policy_status NVARCHAR(20) = 'Active',
    @visibility_settings NVARCHAR(MAX) = NULL,
    @file_path NVARCHAR(500) = NULL,
    @file_size NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @policy_id INT;
    
    -- Check if policy title already exists
    IF EXISTS (SELECT 1 FROM company_policies WHERE policy_title = @policy_title)
    BEGIN
        SELECT 0 as success, 'Policy title already exists' as message;
        RETURN;
    END
    
    INSERT INTO company_policies (
        policy_title, policy_category, policy_description, policy_version,
        effective_date, policy_status, visibility_settings, file_path, file_size,
        created_date, modified_date
    )
    VALUES (
        @policy_title, @policy_category, @policy_description, @policy_version,
        @effective_date, @policy_status, @visibility_settings, @file_path, @file_size,
        GETDATE(), GETDATE()
    );
    
    SET @policy_id = SCOPE_IDENTITY();
    
    SELECT 1 as success, 'Company policy added successfully' as message, @policy_id as policy_id;
END;


PROCEDURE : [dbo].[proc_upgrade_password_hash]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_upgrade_password_hash]    Script Date: 29-01-2026 15:20:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

        ALTER PROCEDURE [dbo].[proc_upgrade_password_hash]
            @user_id INT,
            @new_password_hash VARCHAR(255)
        AS
        BEGIN
            SET NOCOUNT ON;
            
            -- Only update the password hash, keep requires_password_change as is
            UPDATE users 
            SET password_hash = @new_password_hash
            WHERE user_id = @user_id AND is_active = 1;
            
            IF @@ROWCOUNT > 0
                SELECT 1 AS success, 'Password hash upgraded successfully' AS message;
            ELSE
                SELECT 0 AS success, 'Failed to upgrade password hash' AS message;
        END
    

    PROCEDURE : [dbo].[proc_upgrade_password_hash]

    USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_upgrade_password_hash]    Script Date: 29-01-2026 15:44:09 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

        ALTER PROCEDURE [dbo].[proc_upgrade_password_hash]
            @user_id INT,
            @new_password_hash VARCHAR(255)
        AS
        BEGIN
            SET NOCOUNT ON;
            
            -- Only update the password hash, keep requires_password_change as is
            UPDATE users 
            SET password_hash = @new_password_hash
            WHERE user_id = @user_id AND is_active = 1;
            
            IF @@ROWCOUNT > 0
                SELECT 1 AS success, 'Password hash upgraded successfully' AS message;
            ELSE
                SELECT 0 AS success, 'Failed to upgrade password hash' AS message;
        END
    

PROCEDURE : [dbo].[proc_update_daily_attendance]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_update_daily_attendance]    Script Date: 05-02-2026 14:58:34 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_update_daily_attendance]
    @employee_id INT,
    @attendance_date DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @first_check_in DATETIME;
    DECLARE @last_check_out DATETIME;
    DECLARE @working_minutes INT;
    DECLARE @log_count INT;
    
    -- Get attendance data from raw logs for this employee and date
    SELECT 
        @first_check_in = MIN(log_time),
        @last_check_out = MAX(log_time),
        @log_count = COUNT(*)
    FROM attendance_raw_logs
    WHERE employee_id = @employee_id
      AND CAST(log_time AS DATE) = @attendance_date;
    
    -- Calculate working minutes only if we have both check-in and check-out
    IF @log_count >= 2
    BEGIN
        SET @working_minutes = DATEDIFF(MINUTE, @first_check_in, @last_check_out);
    END
    ELSE
    BEGIN
        SET @working_minutes = 0;
        -- If only one log, don't set last_check_out
        IF @log_count = 1
            SET @last_check_out = NULL;
    END
    
    -- Check if record exists
    IF EXISTS (
        SELECT 1 FROM attendance_daily 
        WHERE employee_id = @employee_id 
          AND attendance_date = @attendance_date
    )
    BEGIN
        -- Update existing record
        UPDATE attendance_daily
        SET first_check_in = @first_check_in,
            last_check_out = @last_check_out,
            working_minutes = @working_minutes,
            status = CASE 
                WHEN @log_count = 0 THEN 'ABSENT'
                WHEN @log_count >= 1 THEN 'PRESENT'
                ELSE status
            END
        WHERE employee_id = @employee_id
          AND attendance_date = @attendance_date;
    END
    ELSE
    BEGIN
        -- Insert new record
        INSERT INTO attendance_daily (
            employee_id,
            attendance_date,
            first_check_in,
            last_check_out,
            working_minutes,
            status,
            is_holiday
        )
        VALUES (
            @employee_id,
            @attendance_date,
            @first_check_in,
            @last_check_out,
            @working_minutes,
            CASE 
                WHEN @log_count = 0 THEN 'ABSENT'
                WHEN @log_count >= 1 THEN 'PRESENT'
                ELSE 'PRESENT'
            END,
            0  -- Default not holiday
        );
    END
    
    SELECT 1 AS success, 'Daily attendance updated successfully' AS message;
END


PROCEDURE : [dbo].[proc_manage_designation_role_mapping]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_manage_designation_role_mapping]    Script Date: 03-02-2026 14:50:27 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_manage_designation_role_mapping]
    @action VARCHAR(20), -- 'ADD', 'UPDATE', 'DELETE', 'LIST'
    @mapping_id INT = NULL,
    @designation_name VARCHAR(100) = NULL,
    @role_code VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @action = 'LIST'
    BEGIN
        SELECT 
            drm.mapping_id,
            drm.designation_name,
            drm.role_code,
            r.role_name,
            drm.is_active,
            drm.created_at,
            drm.updated_at
        FROM designation_role_mapping drm
        LEFT JOIN roles r ON drm.role_code = r.role_code
        WHERE drm.is_active = 1
        ORDER BY drm.designation_name;
    END
    ELSE IF @action = 'ADD'
    BEGIN
        -- Validate role exists
        IF NOT EXISTS (SELECT 1 FROM roles WHERE role_code = @role_code AND is_active = 1)
        BEGIN
            SELECT 0 AS success, 'Invalid role code' AS message;
            RETURN;
        END
        
        -- Check if designation already exists
        IF EXISTS (SELECT 1 FROM designation_role_mapping WHERE designation_name = @designation_name AND is_active = 1)
        BEGIN
            SELECT 0 AS success, 'Designation mapping already exists' AS message;
            RETURN;
        END
        
        INSERT INTO designation_role_mapping (designation_name, role_code)
        VALUES (@designation_name, @role_code);
        
        SELECT 1 AS success, 'Designation mapping added successfully' AS message;
    END
    ELSE IF @action = 'UPDATE'
    BEGIN
        -- Validate role exists
        IF NOT EXISTS (SELECT 1 FROM roles WHERE role_code = @role_code AND is_active = 1)
        BEGIN
            SELECT 0 AS success, 'Invalid role code' AS message;
            RETURN;
        END
        
        UPDATE designation_role_mapping
        SET role_code = @role_code,
            updated_at = GETDATE()
        WHERE mapping_id = @mapping_id AND is_active = 1;
        
        IF @@ROWCOUNT > 0
            SELECT 1 AS success, 'Designation mapping updated successfully' AS message;
        ELSE
            SELECT 0 AS success, 'Designation mapping not found' AS message;
    END
    ELSE IF @action = 'DELETE'
    BEGIN
        UPDATE designation_role_mapping
        SET is_active = 0,
            updated_at = GETDATE()
        WHERE mapping_id = @mapping_id;
        
        IF @@ROWCOUNT > 0
            SELECT 1 AS success, 'Designation mapping deleted successfully' AS message;
        ELSE
            SELECT 0 AS success, 'Designation mapping not found' AS message;
    END
    ELSE
    BEGIN
        SELECT 0 AS success, 'Invalid action. Use ADD, UPDATE, DELETE, or LIST' AS message;
    END
END;


PROCEDURE : [dbo].[proc_add_employee_with_role_mapping]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_add_employee_with_role_mapping]    Script Date: 03-02-2026 14:51:10 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_add_employee_with_role_mapping]
    @employee_code VARCHAR(50),
    @first_name VARCHAR(100),
    @last_name VARCHAR(100),
    @email VARCHAR(200),
    @phone VARCHAR(20) = NULL,
    @department VARCHAR(100),
    @designation VARCHAR(100),
    @join_date DATE,
    @salary DECIMAL(10,2) = NULL,
    @created_by_user_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @new_employee_id INT;
    DECLARE @new_user_id INT;
    DECLARE @default_password VARCHAR(100) = 'Welcome123!';
    DECLARE @role_code VARCHAR(50);
    DECLARE @role_id INT;

    -- Basic validations
    IF EXISTS (SELECT 1 FROM employees WHERE employee_code = @employee_code)
    BEGIN
        SELECT 0 AS success, 'Employee code already exists' AS message, NULL AS employee_id, NULL AS user_id, NULL AS default_password, NULL AS assigned_role;
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM employee_personal WHERE email = @email)
    BEGIN
        SELECT 0 AS success, 'Email already exists' AS message, NULL AS employee_id, NULL AS user_id, NULL AS default_password, NULL AS assigned_role;
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM users WHERE email = @email)
    BEGIN
        SELECT 0 AS success, 'Email already registered as user' AS message, NULL AS employee_id, NULL AS user_id, NULL AS default_password, NULL AS assigned_role;
        RETURN;
    END

    -- Get role based on designation mapping
    SELECT @role_code = role_code 
    FROM designation_role_mapping 
    WHERE designation_name = @designation AND is_active = 1;
    
    -- If no specific mapping found, default to EMPLOYEE
    IF @role_code IS NULL
        SET @role_code = 'EMPLOYEE';
    
    -- Get role_id
    SELECT @role_id = role_id FROM roles WHERE role_code = @role_code AND is_active = 1;
    
    IF @role_id IS NULL
    BEGIN
        SELECT 0 AS success, 'Role not found: ' + @role_code AS message, NULL AS employee_id, NULL AS user_id, NULL AS default_password, NULL AS assigned_role;
        RETURN;
    END

    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Create user account with mapped role
        INSERT INTO users (email, password_hash, role_id, is_active, created_at, requires_password_change)
        VALUES (@email, @default_password, @role_id, 1, GETDATE(), 1);
        
        SET @new_user_id = SCOPE_IDENTITY();

        -- Create employee record
        INSERT INTO employees (employee_code, user_id, status)
        VALUES (@employee_code, @new_user_id, 'ACTIVE');
        
        SET @new_employee_id = SCOPE_IDENTITY();

        -- Create personal record
        INSERT INTO employee_personal (employee_id, first_name, last_name, email, phone)
        VALUES (@new_employee_id, @first_name, @last_name, @email, @phone);

        -- Create official record
        INSERT INTO employee_official (employee_id, department, designation, date_of_joining, salary)
        VALUES (@new_employee_id, @department, @designation, @join_date, @salary);

        -- Create reporting record (no manager for now)
        INSERT INTO employee_reporting (employee_id, manager_id)
        VALUES (@new_employee_id, NULL);

        COMMIT TRANSACTION;
        
        -- Success response with role information
        SELECT 
            1 AS success, 
            'Employee and user account created successfully' AS message, 
            @new_employee_id AS employee_id,
            @new_user_id AS user_id,
            @default_password AS default_password,
            @role_code AS assigned_role;
            
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS success, 'Failed to create employee: ' + ERROR_MESSAGE() AS message, NULL AS employee_id, NULL AS user_id, NULL AS default_password, NULL AS assigned_role;
    END CATCH
END;


PROCEDURE : [dbo].[proc_get_user_profile_switching_info]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_user_profile_switching_info]    Script Date: 03-02-2026 14:51:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_get_user_profile_switching_info]
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.user_id,
        u.email,
        r.role_code,
        r.role_name,
        e.employee_id,
        e.employee_code,
        e.status as employee_status,
        ep.first_name,
        ep.last_name,
        ep.first_name + ' ' + ep.last_name AS full_name,
        eo.department,
        eo.designation,
        -- Available views based on role
        CASE 
            WHEN r.role_code = 'HR' THEN 'EMPLOYEE,HR'
            WHEN r.role_code = 'MANAGER' THEN 'EMPLOYEE,MANAGER'
            ELSE 'EMPLOYEE'
        END AS available_views,
        -- Default view (always EMPLOYEE first)
        'EMPLOYEE' AS default_view
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN employees e ON u.user_id = e.user_id
    LEFT JOIN employee_personal ep ON e.employee_id = ep.employee_id
    LEFT JOIN employee_official eo ON e.employee_id = eo.employee_id
    WHERE u.user_id = @user_id AND u.is_active = 1;
END;


PROCEDURE: [dbo].[proc_create_kiosk]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_create_kiosk]    Script Date: 05-02-2026 14:59:22 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_create_kiosk]
    @kiosk_name VARCHAR(100),
    @kiosk_location VARCHAR(200),
    @kiosk_pin VARCHAR(100)  -- Should be hashed before passing
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if kiosk name already exists
    IF EXISTS (SELECT 1 FROM kiosk_settings WHERE kiosk_name = @kiosk_name)
    BEGIN
        SELECT 0 AS success, 'Kiosk name already exists' AS message, NULL AS kiosk_id;
        RETURN;
    END
    
    INSERT INTO kiosk_settings (kiosk_name, kiosk_location, kiosk_pin)
    VALUES (@kiosk_name, @kiosk_location, @kiosk_pin);
    
    DECLARE @new_kiosk_id INT = SCOPE_IDENTITY();
    
    SELECT 1 AS success, 'Kiosk created successfully' AS message, @new_kiosk_id AS kiosk_id;
END

PROCEDURE : [dbo].[proc_verify_kiosk_pin]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_verify_kiosk_pin]    Script Date: 05-02-2026 15:00:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_verify_kiosk_pin]
    @kiosk_id INT,
    @kiosk_pin VARCHAR(100)  -- Hashed PIN
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @stored_pin VARCHAR(100);
    DECLARE @kiosk_name VARCHAR(100);
    DECLARE @kiosk_location VARCHAR(200);
    DECLARE @is_active BIT;
    
    SELECT 
        @stored_pin = kiosk_pin,
        @kiosk_name = kiosk_name,
        @kiosk_location = kiosk_location,
        @is_active = is_active
    FROM kiosk_settings
    WHERE kiosk_id = @kiosk_id;
    
    IF @stored_pin IS NULL
    BEGIN
        SELECT 0 AS success, 'Kiosk not found' AS message;
        RETURN;
    END
    
    IF @is_active = 0
    BEGIN
        SELECT 0 AS success, 'Kiosk is inactive' AS message;
        RETURN;
    END
    
    IF @stored_pin = @kiosk_pin
    BEGIN
        SELECT 
            1 AS success, 
            'PIN verified successfully' AS message,
            @kiosk_id AS kiosk_id,
            @kiosk_name AS kiosk_name,
            @kiosk_location AS kiosk_location;
    END
    ELSE
    BEGIN
        SELECT 0 AS success, 'Invalid PIN' AS message;
    END
END


PROCEDURE : [dbo].[proc_get_kiosk_settings]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_kiosk_settings]    Script Date: 05-02-2026 15:00:54 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_get_kiosk_settings]
    @kiosk_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        kiosk_id,
        kiosk_name,
        kiosk_location,
        is_active,
        created_at,
        updated_at
    FROM kiosk_settings
    WHERE kiosk_id = @kiosk_id;
END



PROCEDURE : [dbo].[proc_list_all_kiosks]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_list_all_kiosks]    Script Date: 05-02-2026 15:01:15 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_list_all_kiosks]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        kiosk_id,
        kiosk_name,
        kiosk_location,
        is_active,
        created_at,
        updated_at
    FROM kiosk_settings
    ORDER BY kiosk_name;
END



PROCEDURE : [dbo].[proc_update_kiosk_settings]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_update_kiosk_settings]    Script Date: 05-02-2026 15:01:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_update_kiosk_settings]
    @kiosk_id INT,
    @kiosk_name VARCHAR(100),
    @kiosk_location VARCHAR(200),
    @kiosk_pin VARCHAR(100) = NULL  -- Optional, only if changing PIN
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NOT EXISTS (SELECT 1 FROM kiosk_settings WHERE kiosk_id = @kiosk_id)
    BEGIN
        SELECT 0 AS success, 'Kiosk not found' AS message;
        RETURN;
    END
    
    -- Check if new name conflicts with existing kiosk
    IF EXISTS (SELECT 1 FROM kiosk_settings WHERE kiosk_name = @kiosk_name AND kiosk_id != @kiosk_id)
    BEGIN
        SELECT 0 AS success, 'Kiosk name already exists' AS message;
        RETURN;
    END
    
    IF @kiosk_pin IS NOT NULL
    BEGIN
        UPDATE kiosk_settings
        SET kiosk_name = @kiosk_name,
            kiosk_location = @kiosk_location,
            kiosk_pin = @kiosk_pin,
            updated_at = GETDATE()
        WHERE kiosk_id = @kiosk_id;
    END
    ELSE
    BEGIN
        UPDATE kiosk_settings
        SET kiosk_name = @kiosk_name,
            kiosk_location = @kiosk_location,
            updated_at = GETDATE()
        WHERE kiosk_id = @kiosk_id;
    END
    
    SELECT 1 AS success, 'Kiosk settings updated successfully' AS message;
END


PROCEDURE : [dbo].[proc_log_kiosk_attendance]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_log_kiosk_attendance]    Script Date: 05-02-2026 15:02:49 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_log_kiosk_attendance]
    @kiosk_id INT,
    @employee_id INT,
    @log_time DATETIME,
    @log_type VARCHAR(20),
    @confidence DECIMAL(5,2) = NULL,
    @status VARCHAR(20),
    @error_message VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO kiosk_attendance_logs (
        kiosk_id, employee_id, log_time, log_type, 
        confidence, status, error_message
    )
    VALUES (
        @kiosk_id, @employee_id, @log_time, @log_type,
        @confidence, @status, @error_message
    );
    
    SELECT 1 AS success, 'Kiosk attendance logged' AS message, SCOPE_IDENTITY() AS log_id;
END


PROCEDURE : [dbo].[proc_get_kiosk_today_logs]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_get_kiosk_today_logs]    Script Date: 05-02-2026 15:03:05 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_get_kiosk_today_logs]
    @kiosk_id INT,
    @log_date DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @log_date IS NULL
        SET @log_date = CAST(GETDATE() AS DATE);
    
    SELECT 
        kal.log_id,
        kal.employee_id,
        e.employee_code,
        ep.first_name + ' ' + ep.last_name AS employee_name,
        kal.log_time,
        kal.log_type,
        kal.confidence,
        kal.status,
        kal.error_message
    FROM kiosk_attendance_logs kal
    JOIN employees e ON kal.employee_id = e.employee_id
    JOIN employee_personal ep ON e.employee_id = ep.employee_id
    WHERE kal.kiosk_id = @kiosk_id
      AND CAST(kal.log_time AS DATE) = @log_date
    ORDER BY kal.log_time DESC;
END


PROCEDURE : [dbo].[proc_mark_kiosk_attendance]

USE [ud_pond_hr]
GO
/****** Object:  StoredProcedure [dbo].[proc_mark_kiosk_attendance]    Script Date: 05-02-2026 15:03:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[proc_mark_kiosk_attendance]
    @kiosk_id INT,
    @employee_id INT,
    @confidence DECIMAL(5,2),
    @log_time DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @log_time IS NULL
        SET @log_time = GETDATE();
    
    DECLARE @today DATE = CAST(@log_time AS DATE);
    DECLARE @first_check_in DATETIME;
    DECLARE @last_check_out DATETIME;
    DECLARE @log_type VARCHAR(20);
    DECLARE @time_diff_minutes INT;
    DECLARE @employee_name VARCHAR(200);
    
    -- Get employee name
    SELECT @employee_name = first_name + ' ' + last_name
    FROM employee_personal
    WHERE employee_id = @employee_id;
    
    -- Check today's attendance status
    SELECT 
        @first_check_in = first_check_in,
        @last_check_out = last_check_out
    FROM attendance_daily
    WHERE employee_id = @employee_id
      AND attendance_date = @today;
    
    -- Determine if this is check-in or check-out
    IF @first_check_in IS NULL
    BEGIN
        -- No check-in yet, this is CHECK_IN
        SET @log_type = 'CHECK_IN';
    END
    ELSE
    BEGIN
        -- Already checked in, check time difference
        SET @time_diff_minutes = DATEDIFF(MINUTE, @first_check_in, @log_time);
        
        IF @time_diff_minutes < 30
        BEGIN
            -- Less than 30 minutes, reject
            -- Log the attempt
            INSERT INTO kiosk_attendance_logs (
                kiosk_id, employee_id, log_time, log_type, 
                confidence, status, error_message
            )
            VALUES (
                @kiosk_id, @employee_id, @log_time, 'CHECK_OUT',
                @confidence, 'FAILED', 'Already checked in at ' + FORMAT(@first_check_in, 'hh:mm tt')
            );
            
            SELECT 
                0 AS success, 
                'Already checked in at ' + FORMAT(@first_check_in, 'hh:mm tt') AS message,
                @employee_name AS employee_name,
                @first_check_in AS check_in_time;
            RETURN;
        END
        ELSE
        BEGIN
            -- More than 30 minutes, this is CHECK_OUT
            SET @log_type = 'CHECK_OUT';
        END
    END
    
    -- Mark attendance in raw logs
    INSERT INTO attendance_raw_logs (employee_id, log_time, source, confidence)
    VALUES (@employee_id, @log_time, 'KIOSK', @confidence);
    
    -- Update daily attendance
    EXEC proc_update_daily_attendance @employee_id, @today;
    
    -- Log in kiosk logs
    INSERT INTO kiosk_attendance_logs (
        kiosk_id, employee_id, log_time, log_type, 
        confidence, status
    )
    VALUES (
        @kiosk_id, @employee_id, @log_time, @log_type,
        @confidence, 'SUCCESS'
    );
    
    -- Return success
    SELECT 
        1 AS success,
        CASE 
            WHEN @log_type = 'CHECK_IN' THEN 'Checked in successfully'
            ELSE 'Checked out successfully'
        END AS message,
        @employee_name AS employee_name,
        @log_type AS log_type,
        FORMAT(@log_time, 'hh:mm tt') AS log_time_formatted,
        @confidence AS confidence;
END
