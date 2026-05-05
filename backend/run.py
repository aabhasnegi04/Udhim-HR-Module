from app import create_app
import logging

app = create_app()

# Suppress noisy DEBUG logs - only show WARNING and above for internal modules
logging.getLogger('app.database.multi_tenant_executor').setLevel(logging.WARNING)
logging.getLogger('app.database.multi_tenant_connection').setLevel(logging.WARNING)
logging.getLogger('app.database.master_db').setLevel(logging.WARNING)
logging.getLogger('app.middleware.company_context').setLevel(logging.WARNING)

if __name__ == '__main__':
    with app.app_context():
        # Test database connection on startup
        print("Testing database connection...")
        from app.database.connection import DatabaseConnection
        
        if DatabaseConnection.test_connection():
            print("✅ Database connection successful")
        else:
            print("❌ Database connection failed - check your .env configuration")
    
    print("Starting HRMS Backend Server...")
    app.run(host='0.0.0.0', port=5000, debug=True)
    