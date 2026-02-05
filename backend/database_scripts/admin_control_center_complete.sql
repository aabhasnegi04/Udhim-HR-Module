-- =============================================
-- Admin Control Center - Complete Setup
-- =============================================

USE [ud_pond_hr];
GO

-- =============================================
-- Letter Templates Management
-- =============================================
IF OBJECT_ID('letter_templates', 'U') IS NULL
BEGIN
    CREATE TABLE letter_templates (
        template_id INT IDENTITY(1,1) PRIMARY KEY,
        template_name NVARCHAR(255) NOT NULL,
        template_category NVARCHAR(100) NOT NULL,
        template_content NVARCHAR(MAX) NOT NULL,
        description NVARCHAR(500),
        is_active BIT DEFAULT 1,
        created_date DATETIME DEFAULT GETDATE(),
        created_by INT,
        modified_date DATETIME DEFAULT GETDATE(),
        modified_by INT,
        CONSTRAINT FK_letter_templates_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),
        CONSTRAINT FK_letter_templates_modified_by FOREIGN KEY (modified_by) REFERENCES users(user_id)
    );
END;
GO

-- =============================================
-- Company Policies Management
-- =============================================
IF OBJECT_ID('company_policies', 'U') IS NULL
BEGIN
    CREATE TABLE company_policies (
        policy_id INT IDENTITY(1,1) PRIMARY KEY,
        policy_title NVARCHAR(255) NOT NULL,
        policy_category NVARCHAR(100) NOT NULL,
        policy_description NVARCHAR(1000),
        policy_version NVARCHAR(20) DEFAULT '1.0',
        effective_date DATE,
        policy_status NVARCHAR(20) DEFAULT 'Active',
        visibility_settings NVARCHAR(MAX), -- JSON array of roles
        file_path NVARCHAR(500),
        file_size NVARCHAR(50),
        created_date DATETIME DEFAULT GETDATE(),
        created_by INT,
        modified_date DATETIME DEFAULT GETDATE(),
        modified_by INT,
        CONSTRAINT FK_company_policies_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),
        CONSTRAINT FK_company_policies_modified_by FOREIGN KEY (modified_by) REFERENCES users(user_id)
    );
END;
GO

-- =============================================
-- Admin Dashboard Statistics (FIXED)
-- =============================================
IF OBJECT_ID('proc_get_admin_dashboard_stats', 'P') IS NOT NULL
    DROP PROCEDURE proc_get_admin_dashboard_stats;
GO

CREATE PROCEDURE proc_get_admin_dashboard_stats
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
GO

-- =============================================
-- System Reports Generation (FIXED)
-- =============================================
IF OBJECT_ID('proc_generate_system_report', 'P') IS NOT NULL
    DROP PROCEDURE proc_generate_system_report;
GO

CREATE PROCEDURE proc_generate_system_report
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
GO

-- List Letter Templates
IF OBJECT_ID('proc_list_letter_templates', 'P') IS NOT NULL
    DROP PROCEDURE proc_list_letter_templates;
GO

CREATE PROCEDURE proc_list_letter_templates
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
GO

-- Add Letter Template
IF OBJECT_ID('proc_add_letter_template', 'P') IS NOT NULL
    DROP PROCEDURE proc_add_letter_template;
GO

CREATE PROCEDURE proc_add_letter_template
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
GO

-- Update Letter Template
IF OBJECT_ID('proc_update_letter_template', 'P') IS NOT NULL
    DROP PROCEDURE proc_update_letter_template;
GO

CREATE PROCEDURE proc_update_letter_template
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
GO

-- Delete Letter Template
IF OBJECT_ID('proc_delete_letter_template', 'P') IS NOT NULL
    DROP PROCEDURE proc_delete_letter_template;
GO

CREATE PROCEDURE proc_delete_letter_template
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
GO

-- List Company Policies
IF OBJECT_ID('proc_list_company_policies', 'P') IS NOT NULL
    DROP PROCEDURE proc_list_company_policies;
GO

CREATE PROCEDURE proc_list_company_policies
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
GO

-- Add Company Policy
IF OBJECT_ID('proc_add_company_policy', 'P') IS NOT NULL
    DROP PROCEDURE proc_add_company_policy;
GO

CREATE PROCEDURE proc_add_company_policy
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
GO

-- =============================================
-- Insert Sample Letter Templates
-- =============================================
IF NOT EXISTS (SELECT 1 FROM letter_templates WHERE template_name = 'Offer Letter')
BEGIN
    INSERT INTO letter_templates (template_name, template_category, template_content, description)
    VALUES (
        'Offer Letter',
        'Onboarding',
        'Dear {{EmployeeName}},

We are pleased to offer you the position of {{Designation}} at {{CompanyName}}.

Your employment will commence on {{DOJ}} with an annual salary of {{AnnualSalary}}.

Please confirm your acceptance by {{ResponseDate}}.

Best regards,
HR Team',
        'Standard offer letter template for new hires'
    );
END;

IF NOT EXISTS (SELECT 1 FROM letter_templates WHERE template_name = 'Appointment Letter')
BEGIN
    INSERT INTO letter_templates (template_name, template_category, template_content, description)
    VALUES (
        'Appointment Letter',
        'Onboarding',
        'Dear {{EmployeeName}},

This letter confirms your appointment as {{Designation}} in the {{Department}} department.

Your employee ID is {{EmployeeID}} and your reporting date is {{DOJ}}.

Welcome to {{CompanyName}}!

Sincerely,
HR Department',
        'Official appointment confirmation letter'
    );
END;

IF NOT EXISTS (SELECT 1 FROM letter_templates WHERE template_name = 'Salary Certificate')
BEGIN
    INSERT INTO letter_templates (template_name, template_category, template_content, description)
    VALUES (
        'Salary Certificate',
        'General',
        'TO WHOM IT MAY CONCERN

This is to certify that {{EmployeeName}} (Employee ID: {{EmployeeID}}) is employed with {{CompanyName}} as {{Designation}}.

Current monthly salary: {{MonthlySalary}}
Annual CTC: {{AnnualCTC}}

This certificate is issued on {{IssueDate}}.

HR Manager
{{CompanyName}}',
        'Employee salary certificate template'
    );
END;

-- =============================================
-- Insert Sample Company Policies
-- =============================================
IF NOT EXISTS (SELECT 1 FROM company_policies WHERE policy_title = 'Employee Code of Conduct')
BEGIN
    INSERT INTO company_policies (policy_title, policy_category, policy_description, visibility_settings)
    VALUES (
        'Employee Code of Conduct',
        'HR Policy',
        'Guidelines for professional behavior and workplace ethics',
        '["Employee", "Manager"]'
    );
END;

IF NOT EXISTS (SELECT 1 FROM company_policies WHERE policy_title = 'Remote Work Policy')
BEGIN
    INSERT INTO company_policies (policy_title, policy_category, policy_description, visibility_settings)
    VALUES (
        'Remote Work Policy',
        'HR Policy',
        'Guidelines and requirements for remote work arrangements',
        '["Employee", "Manager"]'
    );
END;

IF NOT EXISTS (SELECT 1 FROM company_policies WHERE policy_title = 'Leave and Attendance Policy')
BEGIN
    INSERT INTO company_policies (policy_title, policy_category, policy_description, visibility_settings)
    VALUES (
        'Leave and Attendance Policy',
        'Leave Policy',
        'Comprehensive leave types, eligibility, and attendance requirements',
        '["Employee", "Manager"]'
    );
END;

PRINT 'Admin Control Center setup completed successfully!';