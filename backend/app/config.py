import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration"""
    
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 28800)))  # Default 8 hours
    JWT_ALGORITHM = 'HS256'
    
    # Master Database (Multi-Tenant Control)
    MASTER_DB_SERVER = os.environ.get('MASTER_DB_SERVER')
    MASTER_DB_PORT = os.environ.get('MASTER_DB_PORT')
    MASTER_DB_NAME = os.environ.get('MASTER_DB_NAME')
    MASTER_DB_USERNAME = os.environ.get('MASTER_DB_USERNAME')
    MASTER_DB_PASSWORD = os.environ.get('MASTER_DB_PASSWORD')
    MASTER_DB_DRIVER = os.environ.get('MASTER_DB_DRIVER', 'ODBC Driver 18 for SQL Server')

    # Company Database (Legacy - for backward compatibility)
    DB_SERVER = os.environ.get('DB_SERVER')
    DB_NAME = os.environ.get('DB_NAME')
    DB_USERNAME = os.environ.get('DB_USERNAME')
    DB_PASSWORD = os.environ.get('DB_PASSWORD')
    DB_DRIVER = os.environ.get('DB_DRIVER', 'ODBC Driver 18 for SQL Server')
    
    # Multi-Tenant Settings
    MAX_CONNECTIONS_PER_COMPANY = int(os.environ.get('MAX_CONNECTIONS_PER_COMPANY', 10))
    CONNECTION_POOL_TIMEOUT = int(os.environ.get('CONNECTION_POOL_TIMEOUT', 30))
    COMPANY_CACHE_TTL = int(os.environ.get('COMPANY_CACHE_TTL', 300))  # 5 minutes
    
    @property
    def MASTER_DATABASE_CONNECTION_STRING(self):
        """Build master database connection string"""
        server = f"{self.MASTER_DB_SERVER},{self.MASTER_DB_PORT}" if self.MASTER_DB_PORT else self.MASTER_DB_SERVER
        return (
            f"DRIVER={{{self.MASTER_DB_DRIVER}}};"
            f"SERVER={server};"
            f"DATABASE={self.MASTER_DB_NAME};"
            f"UID={self.MASTER_DB_USERNAME};"
            f"PWD={self.MASTER_DB_PASSWORD};"
            "TrustServerCertificate=yes;"
            "Encrypt=no;"
            "Connection Timeout=30;"
        )
    
    @property
    def DATABASE_CONNECTION_STRING(self):
        """Build MSSQL connection string (legacy)"""
        return (
            f"DRIVER={{{self.DB_DRIVER}}};"
            f"SERVER={self.DB_SERVER};"
            f"DATABASE={self.DB_NAME};"
            f"UID={self.DB_USERNAME};"
            f"PWD={self.DB_PASSWORD};"
            "TrustServerCertificate=yes;"
            "Encrypt=no;"
            "Connection Timeout=15;"
            "LoginTimeout=15;"
        )
    
    @staticmethod
    def build_company_connection_string(db_server, db_port, db_name, db_username, db_password, db_driver=None):
        """Build connection string for a specific company database"""
        if db_driver is None:
            db_driver = Config.DB_DRIVER
        
        server = f"{db_server},{db_port}" if db_port and db_port != 1433 else db_server
        
        return (
            f"DRIVER={{{db_driver}}};"
            f"SERVER={server};"
            f"DATABASE={db_name};"
            f"UID={db_username};"
            f"PWD={db_password};"
            "TrustServerCertificate=yes;"
            "Encrypt=no;"
            "Connection Timeout=30;"
            "Command Timeout=120;"
        )