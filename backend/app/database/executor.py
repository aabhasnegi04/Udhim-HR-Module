import pyodbc
from flask import current_app
from app.database.connection import DatabaseConnection


class StoredProcedureExecutor:
    """Central stored procedure executor for all database operations"""
    
    @staticmethod
    def execute_procedure(procedure_name, parameters=None, db_name=None):
        """
        Execute stored procedure with parameters
        
        Args:
            procedure_name (str): Name of the stored procedure
            parameters (dict): Parameters to pass to the procedure
            db_name (str): Optional database name (defaults to config DB_NAME)
            
        Returns:
            dict: Standardized response with success, message, and data
        """
        try:
            with DatabaseConnection.get_connection(db_name) as conn:
                cursor = conn.cursor()
                
                # Build procedure call
                if parameters:
                    # Create parameter placeholders
                    param_placeholders = ', '.join(['?' for _ in parameters.values()])
                    call_statement = f"EXEC {procedure_name} {param_placeholders}"
                    
                    # Execute with parameters
                    cursor.execute(call_statement, list(parameters.values()))
                else:
                    # Execute without parameters
                    cursor.execute(f"EXEC {procedure_name}")
                
                # Handle multiple result sets
                results = []
                
                # Get first result set
                if cursor.description:
                    columns = [column[0] for column in cursor.description]
                    rows = cursor.fetchall()
                    
                    # Convert to list of dictionaries
                    result_data = []
                    for row in rows:
                        result_data.append(dict(zip(columns, row)))
                    
                    results.append(result_data)
                
                # Check for additional result sets
                while cursor.nextset():
                    if cursor.description:
                        columns = [column[0] for column in cursor.description]
                        rows = cursor.fetchall()
                        
                        result_data = []
                        for row in rows:
                            result_data.append(dict(zip(columns, row)))
                        
                        results.append(result_data)
                
                # Commit transaction
                conn.commit()
                
                # Return standardized response
                return {
                    "success": True,
                    "message": "Procedure executed successfully",
                    "data": results[0] if len(results) == 1 else results
                }
                
        except pyodbc.Error as e:
            current_app.logger.error(f"Database error in {procedure_name}: {str(e)}")
            return {
                "success": False,
                "message": "Database operation failed",
                "data": None
            }
        except Exception as e:
            current_app.logger.error(f"Unexpected error in {procedure_name}: {str(e)}")
            return {
                "success": False,
                "message": "An unexpected error occurred",
                "data": None
            }
    
    @staticmethod
    def execute_scalar_procedure(procedure_name, parameters=None, db_name=None):
        """
        Execute stored procedure that returns a single value
        
        Returns:
            The scalar value or None if failed
        """
        result = StoredProcedureExecutor.execute_procedure(procedure_name, parameters, db_name)
        
        if result["success"] and result["data"]:
            # Return first value from first row of first result set
            if isinstance(result["data"], list) and len(result["data"]) > 0:
                first_row = result["data"][0]
                if isinstance(first_row, dict) and len(first_row) > 0:
                    return list(first_row.values())[0]
        
        return None