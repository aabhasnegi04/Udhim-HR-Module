"""
Master Database Connection Manager
Handles connections to the UDHIMTECH master database for multi-tenant operations
"""

import pyodbc
import logging
import threading
from typing import Optional, Dict, Any
from app.config import Config

logger = logging.getLogger(__name__)


class MasterDatabase:
    """Thread-safe master database connection manager"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(MasterDatabase, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize master database connection manager"""
        if not hasattr(self, '_initialized'):
            self._config = Config()
            self._connection_string = self._config.MASTER_DATABASE_CONNECTION_STRING
            self._initialized = True
    
    def _create_connection(self):
        """Create a new database connection"""
        try:
            connection = pyodbc.connect(self._connection_string, autocommit=True)
            logger.debug("New master database connection created")
            return connection
        except Exception as e:
            logger.error(f"Failed to create master database connection: {str(e)}")
            raise
    
    def _is_connection_alive(self, connection) -> bool:
        """Check if connection is still alive"""
        try:
            cursor = connection.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            return True
        except:
            return False
    
    def execute_procedure(self, proc_name: str, params: Dict[str, Any] = None) -> list:
        """
        Execute a stored procedure in master database
        Uses a new connection for each request to avoid concurrency issues
        
        Args:
            proc_name: Name of the stored procedure
            params: Dictionary of parameters
            
        Returns:
            List of result rows
        """
        connection = None
        cursor = None
        try:
            # Create a new connection for this request
            connection = self._create_connection()
            cursor = connection.cursor()
            
            if params:
                # Build parameter string
                param_str = ', '.join([f"@{key}=?" for key in params.keys()])
                query = f"EXEC {proc_name} {param_str}"
                cursor.execute(query, list(params.values()))
            else:
                cursor.execute(f"EXEC {proc_name}")
            
            # Fetch all results
            results = []
            if cursor.description:  # Check if there are results
                columns = [column[0] for column in cursor.description]
                for row in cursor.fetchall():
                    results.append(dict(zip(columns, row)))
            
            return results
            
        except Exception as e:
            logger.error(f"Error executing procedure {proc_name}: {str(e)}")
            raise
        finally:
            # Always clean up resources
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if connection:
                try:
                    connection.close()
                except:
                    pass
    
    def get_company_connection_info(self, company_code: str) -> Optional[Dict[str, Any]]:
        """
        Get database connection information for a company
        
        Args:
            company_code: Company code identifier
            
        Returns:
            Dictionary with connection details or None if not found
        """
        try:
            results = self.execute_procedure(
                'proc_mt_get_company_connection',
                {'company_code': company_code}
            )
            
            if results and len(results) > 0:
                return results[0]
            return None
            
        except Exception as e:
            logger.error(f"Error getting company connection info: {str(e)}")
            return None
    
    def add_company(self, company_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add a new company to the master database
        
        Args:
            company_data: Dictionary with company information
            
        Returns:
            Result dictionary with success status and company_id
        """
        try:
            results = self.execute_procedure('proc_mt_add_company', company_data)
            if results and len(results) > 0:
                return results[0]
            return {'success': 0, 'message': 'No response from database'}
            
        except Exception as e:
            logger.error(f"Error adding company: {str(e)}")
            return {'success': 0, 'message': str(e)}
    
    def get_all_companies(self, status_filter: str = None, page: int = 1, page_size: int = 50) -> list:
        """
        Get list of all companies
        
        Args:
            status_filter: Optional status filter (ACTIVE, INACTIVE, etc.)
            page: Page number
            page_size: Number of results per page
            
        Returns:
            List of company dictionaries
        """
        try:
            params = {
                'status_filter': status_filter,
                'page_number': page,
                'page_size': page_size
            }
            return self.execute_procedure('proc_mt_get_all_companies', params)
            
        except Exception as e:
            logger.error(f"Error getting companies: {str(e)}")
            return []
    
    def update_company_status(self, company_id: int, new_status: str, updated_by: int = None, reason: str = None) -> Dict[str, Any]:
        """
        Update company status
        
        Args:
            company_id: Company ID
            new_status: New status (ACTIVE, INACTIVE, SUSPENDED, etc.)
            updated_by: Admin ID who made the change
            reason: Reason for status change
            
        Returns:
            Result dictionary with success status
        """
        try:
            params = {
                'company_id': company_id,
                'new_status': new_status,
                'updated_by': updated_by,
                'reason': reason
            }
            results = self.execute_procedure('proc_mt_update_company_status', params)
            if results and len(results) > 0:
                return results[0]
            return {'success': 0, 'message': 'No response from database'}
            
        except Exception as e:
            logger.error(f"Error updating company status: {str(e)}")
            return {'success': 0, 'message': str(e)}
    
    def log_audit(self, audit_data: Dict[str, Any]):
        """
        Log an audit entry
        
        Args:
            audit_data: Dictionary with audit information
        """
        try:
            self.execute_procedure('proc_mt_log_audit', audit_data)
        except Exception as e:
            logger.error(f"Error logging audit: {str(e)}")
    
    def close(self):
        """Close method for compatibility - connections are now per-request"""
        logger.info("Master database using per-request connections - no persistent connection to close")


# Singleton instance
master_db = MasterDatabase()
