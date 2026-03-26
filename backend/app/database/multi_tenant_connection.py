"""
Multi-Tenant Database Connection Manager
Manages dynamic database connections for multiple companies with connection pooling
"""

import pyodbc
import logging
import threading
from typing import Optional, Dict
from datetime import datetime, timedelta
from app.config import Config
from app.database.master_db import master_db

logger = logging.getLogger(__name__)


class CompanyConnectionPool:
    """Connection pool for a single company"""
    
    def __init__(self, company_code: str, connection_string: str, max_connections: int = 10):
        self.company_code = company_code
        self.connection_string = connection_string
        self.max_connections = max_connections
        self._pool = []
        self._in_use = []
        self._lock = threading.Lock()
        self._last_accessed = datetime.now()
    
    def get_connection(self):
        """Get a connection from the pool"""
        with self._lock:
            self._last_accessed = datetime.now()
            
            # Try to reuse an existing connection
            if self._pool:
                conn = self._pool.pop()
                if self._is_connection_alive(conn):
                    self._in_use.append(conn)
                    return conn
                else:
                    # Connection is dead, create a new one
                    try:
                        conn.close()
                    except:
                        pass
            
            # Create new connection if under limit
            if len(self._in_use) < self.max_connections:
                try:
                    conn = pyodbc.connect(self.connection_string, autocommit=False)
                    self._in_use.append(conn)
                    logger.debug(f"Created new connection for {self.company_code}")
                    return conn
                except Exception as e:
                    logger.error(f"Failed to create connection for {self.company_code}: {str(e)}")
                    raise
            
            # Pool is exhausted
            raise Exception(f"Connection pool exhausted for company {self.company_code}")
    
    def return_connection(self, conn):
        """Return a connection to the pool"""
        with self._lock:
            if conn in self._in_use:
                self._in_use.remove(conn)
                if self._is_connection_alive(conn):
                    self._pool.append(conn)
                else:
                    try:
                        conn.close()
                    except:
                        pass
    
    def _is_connection_alive(self, conn) -> bool:
        """Check if connection is still alive"""
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            return True
        except:
            return False
    
    def close_all(self):
        """Close all connections in the pool"""
        with self._lock:
            for conn in self._pool + self._in_use:
                try:
                    conn.close()
                except:
                    pass
            self._pool.clear()
            self._in_use.clear()
    
    def get_stats(self) -> Dict:
        """Get pool statistics"""
        with self._lock:
            return {
                'company_code': self.company_code,
                'total_connections': len(self._pool) + len(self._in_use),
                'idle_connections': len(self._pool),
                'active_connections': len(self._in_use),
                'max_connections': self.max_connections,
                'last_accessed': self._last_accessed.isoformat()
            }


class MultiTenantConnectionManager:
    """Manages database connections for multiple companies"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(MultiTenantConnectionManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, '_initialized'):
            self._pools: Dict[str, CompanyConnectionPool] = {}
            self._company_cache: Dict[str, Dict] = {}
            self._cache_expiry: Dict[str, datetime] = {}
            self._config = Config()
            self._initialized = True
            logger.info("Multi-tenant connection manager initialized")
    
    def get_company_connection(self, company_code: str):
        """
        Get a database connection for a specific company
        
        Args:
            company_code: Company code identifier
            
        Returns:
            Database connection object
        """
        # Get or create connection pool for this company
        if company_code not in self._pools:
            self._create_pool_for_company(company_code)
        
        pool = self._pools.get(company_code)
        if pool is None:
            raise Exception(f"Failed to create connection pool for company {company_code}")
        
        return pool.get_connection()
    
    def return_connection(self, company_code: str, conn):
        """
        Return a connection to the pool
        
        Args:
            company_code: Company code identifier
            conn: Database connection to return
        """
        pool = self._pools.get(company_code)
        if pool:
            pool.return_connection(conn)
    
    def _create_pool_for_company(self, company_code: str):
        """Create a connection pool for a company"""
        with self._lock:
            # Double-check after acquiring lock
            if company_code in self._pools:
                return
            
            # Get company connection info from master database
            company_info = self._get_company_info(company_code)
            if not company_info:
                raise Exception(f"Company {company_code} not found or inactive")
            
            # Build connection string
            connection_string = Config.build_company_connection_string(
                db_server=company_info['db_server'],
                db_port=company_info.get('db_port', 1433),
                db_name=company_info['db_name'],
                db_username=company_info['db_username'],
                db_password=company_info['db_password']
            )
            
            # Create pool
            pool = CompanyConnectionPool(
                company_code=company_code,
                connection_string=connection_string,
                max_connections=self._config.MAX_CONNECTIONS_PER_COMPANY
            )
            
            self._pools[company_code] = pool
            logger.info(f"Created connection pool for company {company_code}")
    
    def _get_company_info(self, company_code: str) -> Optional[Dict]:
        """
        Get company information with caching
        
        Args:
            company_code: Company code identifier
            
        Returns:
            Company information dictionary or None
        """
        # Check cache
        if company_code in self._company_cache:
            expiry = self._cache_expiry.get(company_code)
            if expiry and datetime.now() < expiry:
                return self._company_cache[company_code]
        
        # Fetch from master database
        company_info = master_db.get_company_connection_info(company_code)
        
        if company_info:
            # Cache the result
            self._company_cache[company_code] = company_info
            self._cache_expiry[company_code] = datetime.now() + timedelta(seconds=self._config.COMPANY_CACHE_TTL)
        
        return company_info
    
    def invalidate_cache(self, company_code: str = None):
        """
        Invalidate company cache
        
        Args:
            company_code: Specific company to invalidate, or None for all
        """
        if company_code:
            self._company_cache.pop(company_code, None)
            self._cache_expiry.pop(company_code, None)
        else:
            self._company_cache.clear()
            self._cache_expiry.clear()
    
    def close_company_pool(self, company_code: str):
        """Close all connections for a specific company"""
        pool = self._pools.pop(company_code, None)
        if pool:
            pool.close_all()
            logger.info(f"Closed connection pool for company {company_code}")
    
    def close_all_pools(self):
        """Close all connection pools"""
        for company_code in list(self._pools.keys()):
            self.close_company_pool(company_code)
    
    def get_all_pool_stats(self) -> list:
        """Get statistics for all connection pools"""
        return [pool.get_stats() for pool in self._pools.values()]
    
    def cleanup_idle_pools(self, idle_timeout_minutes: int = 30):
        """
        Close pools that haven't been used recently
        
        Args:
            idle_timeout_minutes: Minutes of inactivity before closing pool
        """
        cutoff_time = datetime.now() - timedelta(minutes=idle_timeout_minutes)
        pools_to_close = []
        
        for company_code, pool in self._pools.items():
            if pool._last_accessed < cutoff_time:
                pools_to_close.append(company_code)
        
        for company_code in pools_to_close:
            self.close_company_pool(company_code)
            logger.info(f"Closed idle pool for company {company_code}")


# Singleton instance
connection_manager = MultiTenantConnectionManager()
