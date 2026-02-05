-- =============================================
-- FACE RECOGNITION ATTENDANCE KIOSK SYSTEM
-- Database Schema and Stored Procedures
-- =============================================

USE [ud_pond_hr]
GO

-- =============================================
-- TABLE: kiosk_settings
-- Stores configuration for each kiosk device
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[kiosk_settings]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[kiosk_settings](
        [kiosk_id] [int] IDENTITY(1,1) NOT NULL,
        [kiosk_name] [varchar](100) NOT NULL,
        [kiosk_location] [varchar](200) NOT NULL,
        [kiosk_pin] [varchar](100) NOT NULL,  -- Hashed PIN
        [is_active] [bit] NOT NULL DEFAULT 1,
        [created_at] [datetime] NOT NULL DEFAULT GETDATE(),
        [updated_at] [datetime] NOT NULL DEFAULT GETDATE(),
        PRIMARY KEY CLUSTERED ([kiosk_id] ASC)
    );
    
    PRINT 'Table kiosk_settings created successfully';
END
ELSE
BEGIN
    PRINT 'Table kiosk_settings already exists';
END
GO

-- =============================================
-- TABLE: kiosk_attendance_logs
-- Stores kiosk-specific attendance logs for audit
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[kiosk_attendance_logs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[kiosk_attendance_logs](
        [log_id] [int] IDENTITY(1,1) NOT NULL,
        [kiosk_id] [int] NOT NULL,
        [employee_id] [int] NOT NULL,
        [log_time] [datetime] NOT NULL,
        [log_type] [varchar](20) NOT NULL,  -- 'CHECK_IN' or 'CHECK_OUT'
        [confidence] [decimal](5, 2) NULL,
        [status] [varchar](20) NOT NULL,  -- 'SUCCESS', 'FAILED', 'LOW_CONFIDENCE'
        [error_message] [varchar](500) NULL,
        [created_at] [datetime] NOT NULL DEFAULT GETDATE(),
        PRIMARY KEY CLUSTERED ([log_id] ASC),
        CONSTRAINT [fk_kiosk_logs_kiosk] FOREIGN KEY([kiosk_id]) REFERENCES [dbo].[kiosk_settings] ([kiosk_id]),
        CONSTRAINT [fk_kiosk_logs_employee] FOREIGN KEY([employee_id]) REFERENCES [dbo].[employees] ([employee_id])
    );
    
    CREATE INDEX [idx_kiosk_logs_date] ON [dbo].[kiosk_attendance_logs]([log_time] DESC);
    CREATE INDEX [idx_kiosk_logs_employee] ON [dbo].[kiosk_attendance_logs]([employee_id]);
    
    PRINT 'Table kiosk_attendance_logs created successfully';
END
ELSE
BEGIN
    PRINT 'Table kiosk_attendance_logs already exists';
END
GO

-- =============================================
-- STORED PROCEDURE: proc_create_kiosk
-- Create a new kiosk configuration
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[proc_create_kiosk]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[proc_create_kiosk]
GO

CREATE PROCEDURE [dbo].[proc_create_kiosk]
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
GO

-- =============================================
-- STORED PROCEDURE: proc_verify_kiosk_pin
-- Verify kiosk PIN for authentication
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[proc_verify_kiosk_pin]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[proc_verify_kiosk_pin]
GO

CREATE PROCEDURE [dbo].[proc_verify_kiosk_pin]
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
GO

-- =============================================
-- STORED PROCEDURE: proc_get_kiosk_settings
-- Get kiosk configuration
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[proc_get_kiosk_settings]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[proc_get_kiosk_settings]
GO

CREATE PROCEDURE [dbo].[proc_get_kiosk_settings]
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
GO

-- =============================================
-- STORED PROCEDURE: proc_list_all_kiosks
-- List all kiosks (for HR admin)
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[proc_list_all_kiosks]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[proc_list_all_kiosks]
GO

CREATE PROCEDURE [dbo].[proc_list_all_kiosks]
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
GO

-- =============================================
-- STORED PROCEDURE: proc_update_kiosk_settings
-- Update kiosk configuration
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[proc_update_kiosk_settings]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[proc_update_kiosk_settings]
GO

CREATE PROCEDURE [dbo].[proc_update_kiosk_settings]
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
GO

-- =============================================
-- STORED PROCEDURE: proc_log_kiosk_attendance
-- Log kiosk attendance attempt
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[proc_log_kiosk_attendance]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[proc_log_kiosk_attendance]
GO

CREATE PROCEDURE [dbo].[proc_log_kiosk_attendance]
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
GO

-- =============================================
-- STORED PROCEDURE: proc_get_kiosk_today_logs
-- Get today's attendance logs for a specific kiosk
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[proc_get_kiosk_today_logs]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[proc_get_kiosk_today_logs]
GO

CREATE PROCEDURE [dbo].[proc_get_kiosk_today_logs]
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
GO

-- =============================================
-- STORED PROCEDURE: proc_mark_kiosk_attendance
-- Mark attendance via kiosk with smart check-in/check-out logic
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[proc_mark_kiosk_attendance]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[proc_mark_kiosk_attendance]
GO

CREATE PROCEDURE [dbo].[proc_mark_kiosk_attendance]
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
    ELSE IF @last_check_out IS NOT NULL
    BEGIN
        -- Already checked out, check time difference from last check-out
        SET @time_diff_minutes = DATEDIFF(MINUTE, @last_check_out, @log_time);
        
        IF @time_diff_minutes < 30
        BEGIN
            -- Less than 30 minutes since last check-out, reject
            INSERT INTO kiosk_attendance_logs (
                kiosk_id, employee_id, log_time, log_type, 
                confidence, status, error_message
            )
            VALUES (
                @kiosk_id, @employee_id, @log_time, 'CHECK_OUT',
                @confidence, 'FAILED', 'Already checked out at ' + FORMAT(@last_check_out, 'hh:mm tt')
            );
            
            SELECT 
                0 AS success, 
                'Already checked out at ' + FORMAT(@last_check_out, 'hh:mm tt') AS message,
                @employee_name AS employee_name,
                @last_check_out AS check_in_time;
            RETURN;
        END
        ELSE
        BEGIN
            -- More than 30 minutes since last check-out, allow new check-in
            SET @log_type = 'CHECK_IN';
        END
    END
    ELSE
    BEGIN
        -- Already checked in but not checked out yet, check time difference from check-in
        SET @time_diff_minutes = DATEDIFF(MINUTE, @first_check_in, @log_time);
        
        IF @time_diff_minutes < 30
        BEGIN
            -- Less than 30 minutes, reject
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
GO

-- =============================================
-- INSERT DEFAULT KIOSK (for testing)
-- =============================================

-- Check if default kiosk exists
IF NOT EXISTS (SELECT 1 FROM kiosk_settings WHERE kiosk_name = 'Main Entrance Kiosk')
BEGIN
    -- Insert default kiosk with PIN '1234' (hashed as plain text for now, should be bcrypt in production)
    INSERT INTO kiosk_settings (kiosk_name, kiosk_location, kiosk_pin)
    VALUES ('Main Entrance Kiosk', 'Main Office Entrance', '1234');
    
    PRINT 'Default kiosk created: Main Entrance Kiosk (PIN: 1234)';
END
ELSE
BEGIN
    PRINT 'Default kiosk already exists';
END
GO

PRINT '========================================';
PRINT 'Kiosk System Setup Complete!';
PRINT '========================================';
PRINT 'Tables Created:';
PRINT '  - kiosk_settings';
PRINT '  - kiosk_attendance_logs';
PRINT '';
PRINT 'Stored Procedures Created:';
PRINT '  - proc_create_kiosk';
PRINT '  - proc_verify_kiosk_pin';
PRINT '  - proc_get_kiosk_settings';
PRINT '  - proc_list_all_kiosks';
PRINT '  - proc_update_kiosk_settings';
PRINT '  - proc_log_kiosk_attendance';
PRINT '  - proc_get_kiosk_today_logs';
PRINT '  - proc_mark_kiosk_attendance';
PRINT '';
PRINT 'Default Kiosk:';
PRINT '  Name: Main Entrance Kiosk';
PRINT '  Location: Main Office Entrance';
PRINT '  PIN: 1234';
PRINT '========================================';
