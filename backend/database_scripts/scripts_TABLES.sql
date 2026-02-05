TABLE NAME : [dbo].[users]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[users]    Script Date: 21-01-2026 12:30:09 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[users](
	[user_id] [int] IDENTITY(1,1) NOT NULL,
	[email] [varchar](255) NOT NULL,
	[password_hash] [varchar](500) NOT NULL,
	[role_id] [int] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime] NOT NULL,
	[requires_password_change] [bit] NULL,
	[last_password_change] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[users] ADD  DEFAULT ((1)) FOR [is_active]
GO

ALTER TABLE [dbo].[users] ADD  DEFAULT (getdate()) FOR [created_at]
GO

ALTER TABLE [dbo].[users] ADD  DEFAULT ((0)) FOR [requires_password_change]
GO

ALTER TABLE [dbo].[users]  WITH CHECK ADD  CONSTRAINT [fk_users_roles] FOREIGN KEY([role_id])
REFERENCES [dbo].[roles] ([role_id])
GO

ALTER TABLE [dbo].[users] CHECK CONSTRAINT [fk_users_roles]
GO


TABLE NAME : [dbo].[user_sessions]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[user_sessions]    Script Date: 21-01-2026 12:30:51 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[user_sessions](
	[session_id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [int] NOT NULL,
	[login_time] [datetime] NOT NULL,
	[logout_time] [datetime] NULL,
	[ip_address] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[session_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[user_sessions] ADD  DEFAULT (getdate()) FOR [login_time]
GO

ALTER TABLE [dbo].[user_sessions]  WITH CHECK ADD  CONSTRAINT [fk_sessions_users] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO

ALTER TABLE [dbo].[user_sessions] CHECK CONSTRAINT [fk_sessions_users]
GO


TABLE NAME : [dbo].[salary_structures]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[salary_structures]    Script Date: 21-01-2026 12:31:25 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[salary_structures](
	[structure_id] [int] IDENTITY(1,1) NOT NULL,
	[structure_name] [varchar](100) NOT NULL,
	[structure_type] [varchar](50) NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[structure_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[salary_structures] ADD  DEFAULT ((1)) FOR [is_active]
GO

ALTER TABLE [dbo].[salary_structures] ADD  DEFAULT (getdate()) FOR [created_at]
GO


TABLE NAME :[dbo].[roles]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[roles]    Script Date: 21-01-2026 12:31:48 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[roles](
	[role_id] [int] IDENTITY(1,1) NOT NULL,
	[role_code] [varchar](50) NOT NULL,
	[role_name] [varchar](100) NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[role_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[role_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[roles] ADD  DEFAULT ((1)) FOR [is_active]
GO

ALTER TABLE [dbo].[roles] ADD  DEFAULT (getdate()) FOR [created_at]
GO


TABLE NAME :[dbo].[locations]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[locations]    Script Date: 21-01-2026 12:32:11 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[locations](
	[location_id] [int] IDENTITY(1,1) NOT NULL,
	[location_name] [varchar](100) NOT NULL,
	[city] [varchar](100) NULL,
	[country] [varchar](100) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[location_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[locations] ADD  DEFAULT ((1)) FOR [is_active]
GO

ALTER TABLE [dbo].[locations] ADD  DEFAULT (getdate()) FOR [created_at]
GO


TABLE NAME :[dbo].[leave_types]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[leave_types]    Script Date: 21-01-2026 12:32:31 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[leave_types](
	[leave_type_id] [int] IDENTITY(1,1) NOT NULL,
	[leave_code] [varchar](20) NOT NULL,
	[leave_name] [varchar](100) NOT NULL,
	[max_days_per_year] [int] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[leave_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[leave_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[leave_types] ADD  DEFAULT ((1)) FOR [is_active]
GO

ALTER TABLE [dbo].[leave_types] ADD  DEFAULT (getdate()) FOR [created_at]
GO


TABLE NAME : [dbo].[leave_requests]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[leave_requests]    Script Date: 21-01-2026 12:32:57 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[leave_requests](
	[request_id] [int] IDENTITY(1,1) NOT NULL,
	[employee_id] [int] NOT NULL,
	[leave_type_id] [int] NOT NULL,
	[start_date] [date] NOT NULL,
	[end_date] [date] NOT NULL,
	[total_days] [decimal](5, 2) NOT NULL,
	[reason] [varchar](500) NULL,
	[status] [varchar](20) NOT NULL,
	[applied_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[request_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[leave_requests] ADD  DEFAULT ('PENDING') FOR [status]
GO

ALTER TABLE [dbo].[leave_requests] ADD  DEFAULT (getdate()) FOR [applied_at]
GO

ALTER TABLE [dbo].[leave_requests]  WITH CHECK ADD  CONSTRAINT [fk_leave_request_employee] FOREIGN KEY([employee_id])
REFERENCES [dbo].[employees] ([employee_id])
GO

ALTER TABLE [dbo].[leave_requests] CHECK CONSTRAINT [fk_leave_request_employee]
GO

ALTER TABLE [dbo].[leave_requests]  WITH CHECK ADD  CONSTRAINT [fk_leave_request_type] FOREIGN KEY([leave_type_id])
REFERENCES [dbo].[leave_types] ([leave_type_id])
GO

ALTER TABLE [dbo].[leave_requests] CHECK CONSTRAINT [fk_leave_request_type]
GO

ALTER TABLE [dbo].[leave_requests]  WITH CHECK ADD  CONSTRAINT [chk_leave_dates] CHECK  (([end_date]>=[start_date]))
GO

ALTER TABLE [dbo].[leave_requests] CHECK CONSTRAINT [chk_leave_dates]
GO

ALTER TABLE [dbo].[leave_requests]  WITH CHECK ADD  CONSTRAINT [chk_leave_status] CHECK  (([status]='CANCELLED' OR [status]='REJECTED' OR [status]='HR_APPROVED' OR [status]='MANAGER_APPROVED' OR [status]='PENDING'))
GO

ALTER TABLE [dbo].[leave_requests] CHECK CONSTRAINT [chk_leave_status]
GO


TABLE NAME : [dbo].[leave_balances]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[leave_balances]    Script Date: 21-01-2026 12:33:16 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[leave_balances](
	[balance_id] [int] IDENTITY(1,1) NOT NULL,
	[employee_id] [int] NOT NULL,
	[leave_type_id] [int] NOT NULL,
	[year] [int] NOT NULL,
	[total_allocated] [decimal](5, 2) NOT NULL,
	[used] [decimal](5, 2) NOT NULL,
	[remaining] [decimal](5, 2) NOT NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[balance_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [uq_leave_balance] UNIQUE NONCLUSTERED 
(
	[employee_id] ASC,
	[leave_type_id] ASC,
	[year] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[leave_balances] ADD  DEFAULT ((0)) FOR [total_allocated]
GO

ALTER TABLE [dbo].[leave_balances] ADD  DEFAULT ((0)) FOR [used]
GO

ALTER TABLE [dbo].[leave_balances] ADD  DEFAULT ((0)) FOR [remaining]
GO

ALTER TABLE [dbo].[leave_balances] ADD  DEFAULT (getdate()) FOR [created_at]
GO

ALTER TABLE [dbo].[leave_balances] ADD  DEFAULT (getdate()) FOR [updated_at]
GO

ALTER TABLE [dbo].[leave_balances]  WITH CHECK ADD  CONSTRAINT [fk_leave_balance_employee] FOREIGN KEY([employee_id])
REFERENCES [dbo].[employees] ([employee_id])
GO

ALTER TABLE [dbo].[leave_balances] CHECK CONSTRAINT [fk_leave_balance_employee]
GO

ALTER TABLE [dbo].[leave_balances]  WITH CHECK ADD  CONSTRAINT [fk_leave_balance_type] FOREIGN KEY([leave_type_id])
REFERENCES [dbo].[leave_types] ([leave_type_id])
GO

ALTER TABLE [dbo].[leave_balances] CHECK CONSTRAINT [fk_leave_balance_type]
GO

ALTER TABLE [dbo].[leave_balances]  WITH CHECK ADD  CONSTRAINT [chk_leave_balance_positive] CHECK  (([remaining]>=(0)))
GO

ALTER TABLE [dbo].[leave_balances] CHECK CONSTRAINT [chk_leave_balance_positive]
GO


TABLE NAME : [dbo].[leave_approvals]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[leave_approvals]    Script Date: 21-01-2026 12:33:42 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[leave_approvals](
	[approval_id] [int] IDENTITY(1,1) NOT NULL,
	[request_id] [int] NOT NULL,
	[approver_role] [varchar](20) NOT NULL,
	[approver_id] [int] NOT NULL,
	[action] [varchar](20) NOT NULL,
	[comment] [varchar](500) NULL,
	[action_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[approval_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[leave_approvals] ADD  DEFAULT (getdate()) FOR [action_at]
GO

ALTER TABLE [dbo].[leave_approvals]  WITH CHECK ADD  CONSTRAINT [fk_leave_approval_request] FOREIGN KEY([request_id])
REFERENCES [dbo].[leave_requests] ([request_id])
GO

ALTER TABLE [dbo].[leave_approvals] CHECK CONSTRAINT [fk_leave_approval_request]
GO

ALTER TABLE [dbo].[leave_approvals]  WITH CHECK ADD  CONSTRAINT [fk_leave_approval_user] FOREIGN KEY([approver_id])
REFERENCES [dbo].[users] ([user_id])
GO

ALTER TABLE [dbo].[leave_approvals] CHECK CONSTRAINT [fk_leave_approval_user]
GO

ALTER TABLE [dbo].[leave_approvals]  WITH CHECK ADD  CONSTRAINT [chk_approval_action] CHECK  (([action]='REJECTED' OR [action]='APPROVED'))
GO

ALTER TABLE [dbo].[leave_approvals] CHECK CONSTRAINT [chk_approval_action]
GO

ALTER TABLE [dbo].[leave_approvals]  WITH CHECK ADD  CONSTRAINT [chk_approver_role] CHECK  (([approver_role]='HR' OR [approver_role]='MANAGER'))
GO

ALTER TABLE [dbo].[leave_approvals] CHECK CONSTRAINT [chk_approver_role]
GO


TABLE NAME : [dbo].[holiday_calendar]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[holiday_calendar]    Script Date: 21-01-2026 12:34:01 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[holiday_calendar](
	[holiday_id] [int] IDENTITY(1,1) NOT NULL,
	[holiday_date] [date] NOT NULL,
	[holiday_name] [varchar](200) NOT NULL,
	[holiday_type] [varchar](50) NOT NULL,
	[calendar_year] [int] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[holiday_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [uq_holiday] UNIQUE NONCLUSTERED 
(
	[holiday_date] ASC,
	[calendar_year] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[holiday_calendar] ADD  DEFAULT ((1)) FOR [is_active]
GO

ALTER TABLE [dbo].[holiday_calendar] ADD  DEFAULT (getdate()) FOR [created_at]
GO


TABLE NAME : [dbo].[employees]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[employees]    Script Date: 21-01-2026 12:34:29 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[employees](
	[employee_id] [int] IDENTITY(1,1) NOT NULL,
	[employee_code] [varchar](50) NOT NULL,
	[user_id] [int] NULL,
	[status] [varchar](20) NOT NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[employee_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[employee_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[employees] ADD  DEFAULT ('ACTIVE') FOR [status]
GO

ALTER TABLE [dbo].[employees] ADD  DEFAULT (getdate()) FOR [created_at]
GO

ALTER TABLE [dbo].[employees]  WITH CHECK ADD  CONSTRAINT [fk_employees_users] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO

ALTER TABLE [dbo].[employees] CHECK CONSTRAINT [fk_employees_users]
GO


TABLE NAME : [dbo].[employee_reporting]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[employee_reporting]    Script Date: 21-01-2026 12:35:10 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[employee_reporting](
	[employee_id] [int] NOT NULL,
	[manager_id] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[employee_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[employee_reporting]  WITH CHECK ADD  CONSTRAINT [fk_emp_reporting_emp] FOREIGN KEY([employee_id])
REFERENCES [dbo].[employees] ([employee_id])
GO

ALTER TABLE [dbo].[employee_reporting] CHECK CONSTRAINT [fk_emp_reporting_emp]
GO

ALTER TABLE [dbo].[employee_reporting]  WITH CHECK ADD  CONSTRAINT [fk_emp_reporting_manager] FOREIGN KEY([manager_id])
REFERENCES [dbo].[employees] ([employee_id])
GO

ALTER TABLE [dbo].[employee_reporting] CHECK CONSTRAINT [fk_emp_reporting_manager]
GO


TABLE NAME : [dbo].[employee_personal]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[employee_personal]    Script Date: 21-01-2026 12:35:32 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[employee_personal](
	[employee_id] [int] NOT NULL,
	[first_name] [varchar](100) NULL,
	[last_name] [varchar](100) NULL,
	[dob] [date] NULL,
	[gender] [varchar](20) NULL,
	[phone] [varchar](20) NULL,
	[email] [varchar](255) NULL,
	[address] [varchar](500) NULL,
	[emergency_contact] [varchar](20) NULL,
	[photo_path] [varchar](500) NULL,
	[face_encoding_json] [nvarchar](max) NULL,
	[face_registered_at] [datetime] NULL,
	[face_registered_by] [varchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[employee_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[employee_personal]  WITH CHECK ADD  CONSTRAINT [fk_emp_personal] FOREIGN KEY([employee_id])
REFERENCES [dbo].[employees] ([employee_id])
GO

ALTER TABLE [dbo].[employee_personal] CHECK CONSTRAINT [fk_emp_personal]
GO


TABLE NAME : [dbo].[employee_official]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[employee_official]    Script Date: 21-01-2026 12:35:53 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[employee_official](
	[employee_id] [int] NOT NULL,
	[date_of_joining] [date] NULL,
	[department] [varchar](100) NULL,
	[designation] [varchar](100) NULL,
	[employment_type] [varchar](50) NULL,
	[work_location] [varchar](100) NULL,
	[salary] [decimal](10, 2) NULL,
PRIMARY KEY CLUSTERED 
(
	[employee_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[employee_official]  WITH CHECK ADD  CONSTRAINT [fk_emp_official] FOREIGN KEY([employee_id])
REFERENCES [dbo].[employees] ([employee_id])
GO

ALTER TABLE [dbo].[employee_official] CHECK CONSTRAINT [fk_emp_official]
GO


TABLE NAME : [dbo].[employee_audit_log]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[employee_audit_log]    Script Date: 21-01-2026 12:36:13 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[employee_audit_log](
	[log_id] [int] IDENTITY(1,1) NOT NULL,
	[employee_id] [int] NOT NULL,
	[action_type] [varchar](50) NOT NULL,
	[action_details] [text] NULL,
	[created_by_user_id] [int] NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[log_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[employee_audit_log] ADD  DEFAULT (getdate()) FOR [created_at]
GO

ALTER TABLE [dbo].[employee_audit_log]  WITH CHECK ADD FOREIGN KEY([created_by_user_id])
REFERENCES [dbo].[users] ([user_id])
GO

ALTER TABLE [dbo].[employee_audit_log]  WITH CHECK ADD FOREIGN KEY([employee_id])
REFERENCES [dbo].[employees] ([employee_id])
GO


TABLE NAME : [dbo].[designations]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[designations]    Script Date: 21-01-2026 12:39:42 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[designations](
	[designation_id] [int] IDENTITY(1,1) NOT NULL,
	[designation_name] [varchar](100) NOT NULL,
	[designation_level] [int] NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[designation_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[designations] ADD  DEFAULT ((1)) FOR [is_active]
GO

ALTER TABLE [dbo].[designations] ADD  DEFAULT (getdate()) FOR [created_at]
GO


TABLE NAME : [dbo].[departments]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[departments]    Script Date: 21-01-2026 12:40:02 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[departments](
	[department_id] [int] IDENTITY(1,1) NOT NULL,
	[department_code] [varchar](50) NOT NULL,
	[department_name] [varchar](100) NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[department_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[department_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[departments] ADD  DEFAULT ((1)) FOR [is_active]
GO

ALTER TABLE [dbo].[departments] ADD  DEFAULT (getdate()) FOR [created_at]
GO


TABLE NAME : [dbo].[attendance_regularization]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[attendance_regularization]    Script Date: 21-01-2026 12:40:29 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[attendance_regularization](
	[request_id] [int] IDENTITY(1,1) NOT NULL,
	[employee_id] [int] NOT NULL,
	[attendance_date] [date] NOT NULL,
	[requested_status] [varchar](20) NULL,
	[reason] [varchar](500) NULL,
	[status] [varchar](20) NOT NULL,
	[manager_comment] [varchar](500) NULL,
	[hr_comment] [varchar](500) NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[request_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[attendance_regularization] ADD  DEFAULT ('PENDING') FOR [status]
GO

ALTER TABLE [dbo].[attendance_regularization] ADD  DEFAULT (getdate()) FOR [created_at]
GO

ALTER TABLE [dbo].[attendance_regularization]  WITH NOCHECK ADD  CONSTRAINT [fk_reg_emp] FOREIGN KEY([employee_id])
REFERENCES [dbo].[employees] ([employee_id])
GO

ALTER TABLE [dbo].[attendance_regularization] CHECK CONSTRAINT [fk_reg_emp]
GO


TABLE NAME : [dbo].[attendance_raw_logs]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[attendance_raw_logs]    Script Date: 21-01-2026 12:40:48 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[attendance_raw_logs](
	[log_id] [int] IDENTITY(1,1) NOT NULL,
	[employee_id] [int] NOT NULL,
	[log_time] [datetime] NOT NULL,
	[source] [varchar](20) NOT NULL,
	[created_at] [datetime] NOT NULL,
	[confidence] [decimal](5, 2) NULL,
	[image_path] [varchar](500) NULL,
PRIMARY KEY CLUSTERED 
(
	[log_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[attendance_raw_logs] ADD  DEFAULT (getdate()) FOR [created_at]
GO

ALTER TABLE [dbo].[attendance_raw_logs]  WITH CHECK ADD  CONSTRAINT [fk_raw_emp] FOREIGN KEY([employee_id])
REFERENCES [dbo].[employees] ([employee_id])
GO

ALTER TABLE [dbo].[attendance_raw_logs] CHECK CONSTRAINT [fk_raw_emp]
GO


TABLE NAME : [dbo].[attendance_daily]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[attendance_daily]    Script Date: 21-01-2026 12:41:12 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[attendance_daily](
	[attendance_id] [int] IDENTITY(1,1) NOT NULL,
	[employee_id] [int] NOT NULL,
	[attendance_date] [date] NOT NULL,
	[first_check_in] [datetime] NULL,
	[last_check_out] [datetime] NULL,
	[working_minutes] [int] NULL,
	[status] [varchar](20) NOT NULL,
	[is_holiday] [bit] NOT NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[attendance_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [uq_emp_date] UNIQUE NONCLUSTERED 
(
	[employee_id] ASC,
	[attendance_date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[attendance_daily] ADD  DEFAULT ((0)) FOR [working_minutes]
GO

ALTER TABLE [dbo].[attendance_daily] ADD  DEFAULT ((0)) FOR [is_holiday]
GO

ALTER TABLE [dbo].[attendance_daily] ADD  DEFAULT (getdate()) FOR [created_at]
GO

ALTER TABLE [dbo].[attendance_daily]  WITH CHECK ADD  CONSTRAINT [fk_daily_emp] FOREIGN KEY([employee_id])
REFERENCES [dbo].[employees] ([employee_id])
GO

ALTER TABLE [dbo].[attendance_daily] CHECK CONSTRAINT [fk_daily_emp]
GO


TABLE : [dbo].[letter_templates]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[letter_templates]    Script Date: 29-01-2026 13:43:38 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[letter_templates](
	[template_id] [int] IDENTITY(1,1) NOT NULL,
	[template_name] [nvarchar](255) NOT NULL,
	[template_category] [nvarchar](100) NOT NULL,
	[template_content] [nvarchar](max) NOT NULL,
	[description] [nvarchar](500) NULL,
	[is_active] [bit] NULL,
	[created_date] [datetime] NULL,
	[created_by] [int] NULL,
	[modified_date] [datetime] NULL,
	[modified_by] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[template_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[letter_templates] ADD  DEFAULT ((1)) FOR [is_active]
GO

ALTER TABLE [dbo].[letter_templates] ADD  DEFAULT (getdate()) FOR [created_date]
GO

ALTER TABLE [dbo].[letter_templates] ADD  DEFAULT (getdate()) FOR [modified_date]
GO

ALTER TABLE [dbo].[letter_templates]  WITH CHECK ADD  CONSTRAINT [FK_letter_templates_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([user_id])
GO

ALTER TABLE [dbo].[letter_templates] CHECK CONSTRAINT [FK_letter_templates_created_by]
GO

ALTER TABLE [dbo].[letter_templates]  WITH CHECK ADD  CONSTRAINT [FK_letter_templates_modified_by] FOREIGN KEY([modified_by])
REFERENCES [dbo].[users] ([user_id])
GO

ALTER TABLE [dbo].[letter_templates] CHECK CONSTRAINT [FK_letter_templates_modified_by]
GO


TABLE : [dbo].[company_policies]


USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[company_policies]    Script Date: 29-01-2026 13:44:31 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[company_policies](
	[policy_id] [int] IDENTITY(1,1) NOT NULL,
	[policy_title] [nvarchar](255) NOT NULL,
	[policy_category] [nvarchar](100) NOT NULL,
	[policy_description] [nvarchar](1000) NULL,
	[policy_version] [nvarchar](20) NULL,
	[effective_date] [date] NULL,
	[policy_status] [nvarchar](20) NULL,
	[visibility_settings] [nvarchar](max) NULL,
	[file_path] [nvarchar](500) NULL,
	[file_size] [nvarchar](50) NULL,
	[created_date] [datetime] NULL,
	[created_by] [int] NULL,
	[modified_date] [datetime] NULL,
	[modified_by] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[policy_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[company_policies] ADD  DEFAULT ('1.0') FOR [policy_version]
GO

ALTER TABLE [dbo].[company_policies] ADD  DEFAULT ('Active') FOR [policy_status]
GO

ALTER TABLE [dbo].[company_policies] ADD  DEFAULT (getdate()) FOR [created_date]
GO

ALTER TABLE [dbo].[company_policies] ADD  DEFAULT (getdate()) FOR [modified_date]
GO

ALTER TABLE [dbo].[company_policies]  WITH CHECK ADD  CONSTRAINT [FK_company_policies_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([user_id])
GO

ALTER TABLE [dbo].[company_policies] CHECK CONSTRAINT [FK_company_policies_created_by]
GO

ALTER TABLE [dbo].[company_policies]  WITH CHECK ADD  CONSTRAINT [FK_company_policies_modified_by] FOREIGN KEY([modified_by])
REFERENCES [dbo].[users] ([user_id])
GO

ALTER TABLE [dbo].[company_policies] CHECK CONSTRAINT [FK_company_policies_modified_by]
GO


TABLE : [dbo].[designation_role_mapping]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[designation_role_mapping]    Script Date: 03-02-2026 14:52:44 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[designation_role_mapping](
	[mapping_id] [int] IDENTITY(1,1) NOT NULL,
	[designation_name] [varchar](100) NOT NULL,
	[role_code] [varchar](50) NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[mapping_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[designation_name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[designation_role_mapping] ADD  DEFAULT ((1)) FOR [is_active]
GO

ALTER TABLE [dbo].[designation_role_mapping] ADD  DEFAULT (getdate()) FOR [created_at]
GO

ALTER TABLE [dbo].[designation_role_mapping] ADD  DEFAULT (getdate()) FOR [updated_at]
GO


TABLE : [dbo].[kiosk_settings]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[kiosk_settings]    Script Date: 05-02-2026 15:05:39 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[kiosk_settings](
	[kiosk_id] [int] IDENTITY(1,1) NOT NULL,
	[kiosk_name] [varchar](100) NOT NULL,
	[kiosk_location] [varchar](200) NOT NULL,
	[kiosk_pin] [varchar](100) NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[kiosk_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[kiosk_settings] ADD  DEFAULT ((1)) FOR [is_active]
GO

ALTER TABLE [dbo].[kiosk_settings] ADD  DEFAULT (getdate()) FOR [created_at]
GO

ALTER TABLE [dbo].[kiosk_settings] ADD  DEFAULT (getdate()) FOR [updated_at]
GO


TABLE : [dbo].[kiosk_attendance_logs]

USE [ud_pond_hr]
GO

/****** Object:  Table [dbo].[kiosk_attendance_logs]    Script Date: 05-02-2026 15:05:46 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[kiosk_attendance_logs](
	[log_id] [int] IDENTITY(1,1) NOT NULL,
	[kiosk_id] [int] NOT NULL,
	[employee_id] [int] NOT NULL,
	[log_time] [datetime] NOT NULL,
	[log_type] [varchar](20) NOT NULL,
	[confidence] [decimal](5, 2) NULL,
	[status] [varchar](20) NOT NULL,
	[error_message] [varchar](500) NULL,
	[created_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[log_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[kiosk_attendance_logs] ADD  DEFAULT (getdate()) FOR [created_at]
GO

ALTER TABLE [dbo].[kiosk_attendance_logs]  WITH CHECK ADD  CONSTRAINT [fk_kiosk_logs_employee] FOREIGN KEY([employee_id])
REFERENCES [dbo].[employees] ([employee_id])
GO

ALTER TABLE [dbo].[kiosk_attendance_logs] CHECK CONSTRAINT [fk_kiosk_logs_employee]
GO

ALTER TABLE [dbo].[kiosk_attendance_logs]  WITH CHECK ADD  CONSTRAINT [fk_kiosk_logs_kiosk] FOREIGN KEY([kiosk_id])
REFERENCES [dbo].[kiosk_settings] ([kiosk_id])
GO

ALTER TABLE [dbo].[kiosk_attendance_logs] CHECK CONSTRAINT [fk_kiosk_logs_kiosk]
GO


