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
        "http://localhost:3000",        # Local React dev server (alternative)
        "http://localhost:5173",        # Local Vite dev server
        "https://hr.udhim.com",         # UDHIM_HR client frontend
        "https://hrlaminar.vdfg.in",    # ud_pond_hr (Laminar) client frontend
        "https://hrfine.vdfg.in",       # Anup Finewood client frontend
    ]
    
    CORS(app, 
         origins=allowed_origins,
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "X-Current-View", "X-Company-Code"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         automatic_options=True)

    # Explicit OPTIONS handler for all routes (ensures preflight always returns 200)
    @app.before_request
    def handle_options():
        from flask import request, Response, current_app as app_context
        if request.method == 'OPTIONS':
            app_context.logger.info(f"OPTIONS request intercepted for {request.path}")
            res = Response()
            origin = request.headers.get('Origin', '')
            allowed = ['https://hr.udhim.com', 'https://hrlaminar.vdfg.in',
                       'https://hrfine.vdfg.in',
                       'http://localhost:5173', 'http://localhost:3000']
            if origin in allowed:
                res.headers['Access-Control-Allow-Origin'] = origin
            res.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Current-View, X-Company-Code'
            res.headers['Access-Control-Allow-Credentials'] = 'true'
            res.headers['Access-Control-Max-Age'] = '86400'
            return res
    
    # Disable strict slashes to prevent redirects
    app.url_map.strict_slashes = False
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register blueprints
    from app.auth.routes import auth_bp
    from app.auth.multi_tenant_routes import multi_tenant_auth_bp
    from app.employees.routes import employees_bp
    from app.admin.routes import admin_bp
    from app.attendance.routes import attendance_bp
    from app.leave.routes import leave_bp
    from app.orgchart.routes import orgchart_bp
    from app.dashboard.routes import dashboard_bp
    from app.payroll.routes import payroll_bp
    from app.documents.routes import documents_bp
    from app.documents.employee_doc_routes import employee_docs_bp
    from app.notifications.routes import notifications_bp
    from app.offboarding.routes import offboarding_bp
    from app.biometric.routes import biometric_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(multi_tenant_auth_bp, url_prefix='/auth/multi-tenant')
    app.register_blueprint(employees_bp, url_prefix='/employees')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(attendance_bp, url_prefix='/attendance')
    app.register_blueprint(leave_bp, url_prefix='/leave')
    app.register_blueprint(orgchart_bp, url_prefix='/orgchart')
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
    app.register_blueprint(payroll_bp, url_prefix='/payroll')
    app.register_blueprint(documents_bp, url_prefix='/documents')
    app.register_blueprint(employee_docs_bp, url_prefix='/documents')
    app.register_blueprint(notifications_bp, url_prefix='/notifications')
    app.register_blueprint(offboarding_bp, url_prefix='/offboarding')
    app.register_blueprint(biometric_bp, url_prefix='/biometric')
    
    @app.route('/health')
    def health_check():
        return {"success": True, "message": "HRMS Backend is running", "data": {}}
    
    # Catch-all OPTIONS route as fallback (must be LAST)
    @app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
    @app.route('/<path:path>', methods=['OPTIONS'])
    def options_handler(path):
        from flask import request, Response
        res = Response()
        origin = request.headers.get('Origin', '')
        allowed = ['https://hr.udhim.com', 'https://hrlaminar.vdfg.in',
                   'https://hrfine.vdfg.in',
                   'http://localhost:5173', 'http://localhost:3000']
        if origin in allowed:
            res.headers['Access-Control-Allow-Origin'] = origin
        res.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Current-View, X-Company-Code'
        res.headers['Access-Control-Allow-Credentials'] = 'true'
        res.headers['Access-Control-Max-Age'] = '86400'
        res.status_code = 200
        return res
    
    return app