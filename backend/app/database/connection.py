import pyodbc
from flask import current_app
from contextlib import contextmanager


class DatabaseConnection:
    """MSSQL Database connection manager"""
    
    @staticmethod
    def get_connection_string(db_name=None):
        """Get connection string for specified database or default"""
        from app.config import Config
        config_instance = Config()
        
        # Use provided db_name or fall back to default
        if db_name and db_name != config_instance.DB_NAME:
            # Custom database name
            return (
                f"DRIVER={{{config_instance.DB_DRIVER}}};"
                f"SERVER={config_instance.DB_SERVER};"
                f"DATABASE={db_name};"
                f"UID={config_instance.DB_USERNAME};"
                f"PWD={config_instance.DB_PASSWORD};"
                "TrustServerCertificate=yes;"
                "Connection Timeout=30;"
                "Command Timeout=60;"
            )
        else:
            # Use the main connection string with timeouts
            return config_instance.DATABASE_CONNECTION_STRING
    
    @staticmethod
    @contextmanager
    def get_connection(db_name=None):
        """Get database connection with automatic cleanup and retry logic"""
        connection = None
        max_retries = 3
        retry_delay = 1
        
        for attempt in range(max_retries):
            try:
                connection_string = DatabaseConnection.get_connection_string(db_name)
                connection = pyodbc.connect(connection_string)
                connection.autocommit = False  # Explicit transaction control
                yield connection
                # If we get here without exception, commit the transaction
                connection.commit()
                break  # Success, exit retry loop
            except pyodbc.Error as e:
                if connection:
                    try:
                        connection.rollback()
                        connection.close()
                    except:
                        pass
                    connection = None
                
                # If this is the last attempt, raise the exception
                if attempt == max_retries - 1:
                    raise Exception(f"Database connection error after {max_retries} attempts: {str(e)}")
                
                # Wait before retrying
                import time
                time.sleep(retry_delay * (attempt + 1))
                
                try:
                    from flask import current_app
                    current_app.logger.warning(f"Database connection attempt {attempt + 1} failed, retrying...")
                except RuntimeError:
                    print(f"Database connection attempt {attempt + 1} failed, retrying...")
            except Exception as e:
                if connection:
                    try:
                        connection.rollback()
                        connection.close()
                    except:
                        pass
                raise e
        
        # Final cleanup
        try:
            if connection:
                connection.close()
        except:
            pass
    
    @staticmethod
    def test_connection(db_name=None):
        """Test database connectivity"""
        try:
            with DatabaseConnection.get_connection(db_name) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                return True
        except Exception as e:
            # Use print instead of current_app.logger when outside app context
            try:
                from flask import current_app
                current_app.logger.error(f"Database connection test failed: {str(e)}")
            except RuntimeError:
                print(f"Database connection test failed: {str(e)}")
            return False