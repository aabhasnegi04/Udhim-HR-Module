from app import create_app

app = create_app()

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