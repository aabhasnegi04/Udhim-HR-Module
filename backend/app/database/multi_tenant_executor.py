"""
Multi-Tenant Stored Procedure Executor
Executes stored procedures on company-specific databases
"""

import pyodbc
import logging
from typing import Dict, Any, Optional
from flask import g
from app.database.multi_tenant_connection import connection_manager
from app.middleware.company_context import get_company_code

logger = logging.getLogger(__name__)


class MultiTenantExecutor:
    """Execute stored procedures on company-specific databases"""
    
    @staticmethod
    def execute_procedure(procedure_name: str, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute a stored procedure on the current company's database
        
        Args:
            procedure_name: Name of the stored procedure
            parameters: Dictionary of parameters
            
        Returns:
            Dictionary with success status and data
        """
        company_code = get_company_code()
        
        if not company_code:
            logger.error("No company context available")
            return {
                "success": False,
                "message": "Company context not set",
                "data": None
            }
        
        conn = None
        try:
            # Get connection for this company
            conn = connection_manager.get_company_connection(company_code)
            cursor = conn.cursor()
            
            # Build and execute query
            if parameters:
                # Build parameter placeholders
                param_names = list(parameters.keys())
                param_values = [parameters[key] for key in param_names]
                param_str = ', '.join([f"@{name}=?" for name in param_names])
                query = f"EXEC {procedure_name} {param_str}"
                
                logger.debug(f"Executing: {query} with params: {param_names}")
                cursor.execute(query, param_values)
            else:
                query = f"EXEC {procedure_name}"
                logger.debug(f"Executing: {query}")
                cursor.execute(query)
            
            # Fetch all result sets (for procedures that return multiple result sets)
            all_results = []
            while True:
                results = []
                if cursor.description:  # Check if there are results
                    columns = [column[0] for column in cursor.description]
                    for row in cursor.fetchall():
                        row_dict = {}
                        for i, value in enumerate(row):
                            row_dict[columns[i]] = value
                        results.append(row_dict)
                all_results.append(results)
                
                # Try to move to next result set
                if not cursor.nextset():
                    break
            
            # If only one result set, return it directly (backward compatibility)
            # If multiple result sets, return them as a list
            if len(all_results) == 1:
                results = all_results[0]
            else:
                results = all_results
            
            # Commit transaction
            conn.commit()
            
            logger.debug(f"Procedure {procedure_name} executed successfully for company {company_code}")
            
            return {
                "success": True,
                "message": "Procedure executed successfully",
                "data": results
            }
            
        except pyodbc.Error as e:
            logger.error(f"Database error executing {procedure_name} for company {company_code}: {str(e)}")
            if conn:
                try:
                    conn.rollback()
                except:
                    pass
            
            # Clean up ODBC error message to extract just the SQL Server message
            error_str = str(e)
            clean_message = error_str
            
            # Try to extract the message after [SQL Server]
            if '[SQL Server]' in error_str:
                parts = error_str.split('[SQL Server]')
                if len(parts) > 1:
                    # Get the message and remove error codes
                    clean_message = parts[-1]
                    # Remove (error_code) patterns
                    import re
                    clean_message = re.sub(r'\s*\(\d+\)\s*', ' ', clean_message)
                    clean_message = re.sub(r'\s*\(SQL\w+\)\s*', '', clean_message)
                    # Remove quotes and extra whitespace
                    clean_message = clean_message.strip('\'"() ')
            
            return {
                "success": False,
                "message": clean_message,
                "data": None
            }
            
        except Exception as e:
            logger.error(f"Error executing {procedure_name} for company {company_code}: {str(e)}")
            if conn:
                try:
                    conn.rollback()
                except:
                    pass
            return {
                "success": False,
                "message": f"Execution error: {str(e)}",
                "data": None
            }
            
        finally:
            # Return connection to pool
            if conn:
                connection_manager.return_connection(company_code, conn)
    
    @staticmethod
    def execute_query(query: str, parameters: Optional[tuple] = None) -> Dict[str, Any]:
        """
        Execute a raw SQL query on the current company's database
        
        Args:
            query: SQL query string
            parameters: Tuple of parameters
            
        Returns:
            Dictionary with success status and data
        """
        company_code = get_company_code()
        
        if not company_code:
            logger.error("No company context available")
            return {
                "success": False,
                "message": "Company context not set",
                "data": None
            }
        
        conn = None
        try:
            # Get connection for this company
            conn = connection_manager.get_company_connection(company_code)
            cursor = conn.cursor()
            
            # Execute query
            if parameters:
                cursor.execute(query, parameters)
            else:
                cursor.execute(query)
            
            # Fetch results
            results = []
            if cursor.description:
                columns = [column[0] for column in cursor.description]
                for row in cursor.fetchall():
                    row_dict = {}
                    for i, value in enumerate(row):
                        row_dict[columns[i]] = value
                    results.append(row_dict)
            
            # Commit transaction
            conn.commit()
            
            return {
                "success": True,
                "message": "Query executed successfully",
                "data": results
            }
            
        except Exception as e:
            logger.error(f"Error executing query for company {company_code}: {str(e)}")
            if conn:
                try:
                    conn.rollback()
                except:
                    pass
            return {
                "success": False,
                "message": f"Query error: {str(e)}",
                "data": None
            }
            
        finally:
            # Return connection to pool
            if conn:
                connection_manager.return_connection(company_code, conn)
