-- Profile Switching Implementation
-- This script implements designation-to-role mapping and updates employee creation

USE [ud_pond_hr]
GO

-- =============================================
-- Step 1: Create designation_role_mapping table
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[designation_role_mapping]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[designation_role_mapping](
        [mapping_id] [int] IDENTITY(1,1) NOT NULL,
        [designation_name] [varchar](100) NOT NULL,
        [role_code] [varchar](50) NOT NULL,
        [is_active] [bit] NOT NULL DEFAULT 1,
        [created_at] [datetime] NOT NULL DEFAULT GETDATE(),
        [updated_at] [datetime] NOT NULL DEFAULT GETDATE(),
        PRIMARY KEY CLUSTERED ([mapping_id] ASC),
        UNIQUE NONCLUSTERED ([designation_name] ASC)
    );
    
    PRINT '✅ Created designation_role_mapping table';
END
ELSE
BEGIN
    PRINT '⚠️ designation_role_mapping table already exists';
END
GO

-- =============================================
-- Step 2: Insert default designation mappings
-- =============================================

-- Clear existing mappings if any
DELETE FROM designation_role_mapping;

-- Default mappings
INSERT INTO designation_role_mapping (designation_name, role_code) VALUES
('HR Manager', 'HR'),
('HR Executive', 'HR'),
('Senior HR Manager', 'HR'),
('HR Specialist', 'HR'),
('HR Coordinator', 'HR'),
('Team Manager', 'MANAGER'),
('Team Lead', 'MANAGER'),
('Project Manager', 'MANAGER'),
('Department Manager', 'MANAGER'),
('Senior Manager', 'MANAGER'),
('Software Engineer', 'EMPLOYEE'),
('Developer', 'EMPLOYEE'),
('Senior Developer', 'EMPLOYEE'),
('Junior Developer', 'EMPLOYEE'),
('Analyst', 'EMPLOYEE'),
('Associate', 'EMPLOYEE'),
('Executive', 'EMPLOYEE'),
('Specialist', 'EMPLOYEE'),
('Coordinator', 'EMPLOYEE'),
('Assistant', 'EMPLOYEE');

PRINT '✅ Inserted default designation-role mappings';
GO

-- =============================================
-- Step 3: Create procedure to manage designation mappings
-- =============================================

IF OBJECT_ID('proc_manage_designation_role_mapping', 'P') IS NOT NULL 
    DROP PROCEDURE proc_manage_designation_role_mapping;
GO

CREATE PROCEDURE [dbo].[proc_manage_designation_role_mapping]
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
GO

PRINT '✅ Created proc_manage_designation_role_mapping procedure';
GO

-- =============================================
-- Step 4: Create updated employee creation procedure
-- =============================================

IF OBJECT_ID('proc_add_employee_with_role_mapping', 'P') IS NOT NULL 
    DROP PROCEDURE proc_add_employee_with_role_mapping;
GO

CREATE PROCEDURE [dbo].[proc_add_employee_with_role_mapping]
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
GO

PRINT '✅ Created proc_add_employee_with_role_mapping procedure';
GO

-- =============================================
-- Step 5: Create procedure to get user profile switching info
-- =============================================

IF OBJECT_ID('proc_get_user_profile_switching_info', 'P') IS NOT NULL 
    DROP PROCEDURE proc_get_user_profile_switching_info;
GO

CREATE PROCEDURE [dbo].[proc_get_user_profile_switching_info]
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
GO

PRINT '✅ Created proc_get_user_profile_switching_info procedure';
GO

-- =============================================
-- Step 6: Test the implementation
-- =============================================

PRINT '';
PRINT '🧪 Testing the implementation...';
PRINT '';

-- Test designation mappings
PRINT 'Available designation-role mappings:';
EXEC proc_manage_designation_role_mapping @action = 'LIST';

PRINT '';
PRINT '✅ Profile switching database implementation completed!';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Use proc_add_employee_with_role_mapping for creating employees';
PRINT '2. Use proc_get_user_profile_switching_info for login response';
PRINT '3. Use proc_manage_designation_role_mapping for admin management';