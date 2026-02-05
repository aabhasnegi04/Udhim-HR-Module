# HRMS Backend

A comprehensive Human Resource Management System backend built with Flask and SQL Server.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- SQL Server with ODBC Driver 18
- Required Python packages (see requirements.txt)

### Installation

1. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Database**
   - Update `.env` file with your database credentials
   - Run the complete database setup script in SSMS:
     ```sql
     -- Execute this file in SQL Server Management Studio
     database_scripts/COMPLETE_DATABASE_SETUP.sql
     ```

3. **Install Face Recognition (Optional)**
   - Windows: Run `install_face_recognition.bat`
   - Linux/Mac: Run `install_face_recognition.sh`

4. **Start the Server**
   ```bash
   python run.py
   ```

## 📁 Project Structure

```
backend/
├── app/                          # Main application package
│   ├── admin/                    # Admin management
│   ├── attendance/               # Attendance system
│   ├── auth/                     # Authentication
│   ├── database/                 # Database connections
│   ├── employees/                # Employee management
│   ├── leave/                    # Leave management
│   ├── middleware/               # JWT & role guards
│   ├── orgchart/                 # Organization chart
│   └── utils/                    # Utility functions
├── database_scripts/             # Database setup scripts
├── .env                          # Environment configuration
├── requirements.txt              # Python dependencies
└── run.py                       # Application entry point
```

## 🗄️ Database Setup

### Complete Setup (Recommended)
Run the comprehensive setup script that includes all systems:
```sql
-- In SSMS, execute:
database_scripts/COMPLETE_DATABASE_SETUP.sql
```

This single script sets up:
- ✅ Employee Management System
- ✅ Face Recognition System  
- ✅ Attendance System
- ✅ Leave Management System
- ✅ All required stored procedures

### Individual Components (If needed)
If you need to set up components individually:

- **Employee Management**: `employee_management.sql`
- **Face Recognition**: `face_recognition_integration.sql`
- **Attendance System**: `attendance_phase3.sql`
- **Leave Management**: `leave_management_phase4.sql`
- **Additional Procedures**: `additional_stored_procedures.sql`

## 🔧 Configuration

### Environment Variables (.env)
```env
# Database Configuration
DB_SERVER=your_server_address
DB_NAME=ud_pond_hr
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DRIVER=ODBC Driver 18 for SQL Server

# JWT Configuration
JWT_SECRET_KEY=your-secret-key
JWT_ACCESS_TOKEN_EXPIRES=3600

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
```

## 🎯 Features

### 👥 Employee Management
- Complete employee lifecycle management
- Automatic user account creation
- Employee code generation (EMP001, EMP002, etc.)
- Photo upload and management
- Organizational hierarchy

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (HR, Manager, Employee)
- Password change enforcement
- Secure API endpoints

### 📸 Face Recognition
- Employee photo registration
- Face encoding storage
- Attendance marking via face recognition
- High accuracy face matching

### ⏰ Attendance System
- Multiple attendance marking methods
- Raw log processing
- Daily attendance generation
- Attendance editing (HR only)
- Comprehensive reporting

### 🏖️ Leave Management
- Multiple leave types (AL, CL, SL, EL, ML, PL, CO)
- Automatic leave balance allocation
- Leave application workflow
- Approval system (Manager → HR)
- Balance tracking and reporting

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/change-password` - Change password
- `GET /auth/me` - Get current user info

### Employee Management
- `GET /employees` - List all employees
- `POST /employees` - Create new employee
- `GET /employees/{id}` - Get employee details
- `POST /employees/{id}/photo` - Upload employee photo

### Attendance
- `POST /attendance/face-log` - Mark face attendance
- `GET /attendance/reports/date-range` - Get attendance reports
- `PUT /attendance/edit/{id}` - Edit attendance record (HR only)

### Leave Management
- `GET /leave/types` - Get leave types
- `POST /leave/apply` - Apply for leave
- `GET /leave/balance/employee/{id}` - Get leave balances
- `POST /leave/balance/allocate` - Allocate leave balance (HR only)

## 🛡️ Security Features

- JWT token authentication
- Role-based access control
- Password encryption
- SQL injection prevention (stored procedures only)
- Input validation and sanitization

## 📊 Database Architecture

The system follows a **Database-First Architecture** with:
- All operations through stored procedures
- No direct SQL queries in application code
- Proper transaction management
- Data integrity constraints

## 🚀 Deployment

### Development
```bash
python run.py
```

### Production
Use a production WSGI server like Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

## 📝 Documentation

- **Face Recognition Setup**: `FACE_RECOGNITION_SETUP.md`
- **Leave Balance Management**: Available in root directory
- **Attendance Edit Feature**: Available in root directory

## 🤝 Contributing

1. Follow the existing code structure
2. Use stored procedures for all database operations
3. Implement proper error handling
4. Add appropriate logging
5. Test all endpoints thoroughly

## � Support

For issues and questions:
1. Check the documentation files
2. Review the database setup scripts
3. Ensure all dependencies are installed
4. Verify database connectivity

---

**The HRMS backend is production-ready with comprehensive features for employee management, attendance tracking, and leave management.**