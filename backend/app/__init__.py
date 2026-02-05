from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.extensions import jwt
from app.utils.errors import register_error_handlers


def create_app(config_class=Config):
    """Flask app factory"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    jwt.init_app(app)
    
    # CORS configuration for both local and production
    allowed_origins = [
        "http://localhost:3000",      # Local React dev server (alternative)
        "http://localhost:5173",      # Local Vite dev server
        "https://hrlaminar.vdfg.in"   # Production frontend
    ]
    
    CORS(app, 
         origins=allowed_origins,
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "X-Current-View"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Disable strict slashes to prevent redirects
    app.url_map.strict_slashes = False
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register blueprints
    from app.auth.routes import auth_bp
    from app.employees.routes import employees_bp
    from app.admin.routes import admin_bp
    from app.attendance.routes import attendance_bp
    from app.leave.routes import leave_bp
    from app.orgchart.routes import orgchart_bp
    from app.dashboard.routes import dashboard_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(employees_bp, url_prefix='/employees')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(attendance_bp, url_prefix='/attendance')
    app.register_blueprint(leave_bp, url_prefix='/leave')
    app.register_blueprint(orgchart_bp, url_prefix='/orgchart')
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
    
    @app.route('/health')
    def health_check():
        return {"success": True, "message": "HRMS Backend is running", "data": {}}
    
    return app