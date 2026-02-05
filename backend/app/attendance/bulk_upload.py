"""
Bulk attendance upload service
"""
import pandas as pd
from datetime import datetime, time
from flask import current_app
from app.database.connection import DatabaseConnection


class BulkAttendanceUpload:
    """Handle bulk attendance upload from Excel files"""
    
    REQUIRED_COLUMNS = ['Employee ID', 'Date', 'Check-in Time', 'Check-out Time', 'Status']
    VALID_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'WFH', 'HOLIDAY']
    
    @staticmethod
    def validate_and_process_file(file_path):
        """
        Validate and process Excel file
        
        Returns:
            dict: {
                'success': bool,
                'total_rows': int,
                'successful_rows': int,
                'failed_rows': int,
                'errors': list,
                'message': str
            }
        """
        try:
            # Read Excel file
            df = pd.read_excel(file_path)
            
            current_app.logger.info(f"Excel file loaded. Columns found: {list(df.columns)}")
            current_app.logger.info(f"Total rows in file: {len(df)}")
            
            # Validate columns
            missing_columns = [col for col in BulkAttendanceUpload.REQUIRED_COLUMNS if col not in df.columns]
            if missing_columns:
                return {
                    'success': False,
                    'message': f"Missing required columns: {', '.join(missing_columns)}. Found columns: {', '.join(df.columns)}",
                    'total_rows': 0,
                    'successful_rows': 0,
                    'failed_rows': 0,
                    'errors': []
                }
            
            total_rows = len(df)
            successful_rows = 0
            failed_rows = 0
            errors = []
            
            # Get valid employee IDs from database
            valid_employee_ids = BulkAttendanceUpload._get_valid_employee_ids()
            
            # Process each row
            for index, row in df.iterrows():
                row_number = index + 2  # Excel row number (header is row 1)
                
                try:
                    current_app.logger.info(f"Processing row {row_number}: {dict(row)}")
                    
                    # Validate and extract data
                    validation_result = BulkAttendanceUpload._validate_row(
                        row, row_number, valid_employee_ids
                    )
                    
                    if not validation_result['valid']:
                        failed_rows += 1
                        current_app.logger.warning(f"Row {row_number} validation failed: {validation_result['error']}")
                        errors.append({
                            'row': row_number,
                            'employee_id': str(row.get('Employee ID', 'N/A')),
                            'error': validation_result['error']
                        })
                        continue
                    
                    # Save to database
                    save_result = BulkAttendanceUpload._save_attendance_record(
                        validation_result['data']
                    )
                    
                    if save_result['success']:
                        successful_rows += 1
                    else:
                        failed_rows += 1
                        errors.append({
                            'row': row_number,
                            'employee_id': str(row.get('Employee ID', 'N/A')),
                            'error': save_result['error']
                        })
                        
                except Exception as e:
                    failed_rows += 1
                    errors.append({
                        'row': row_number,
                        'employee_id': str(row.get('Employee ID', 'N/A')),
                        'error': f"Processing error: {str(e)}"
                    })
            
            current_app.logger.info(f"Processing complete. Successful: {successful_rows}, Failed: {failed_rows}")
            
            # Return results even if some/all rows failed
            return {
                'success': True,  # Changed to True so frontend can see the errors
                'total_rows': total_rows,
                'successful_rows': successful_rows,
                'failed_rows': failed_rows,
                'errors': errors,
                'message': f"Processed {total_rows} rows: {successful_rows} successful, {failed_rows} failed"
            }
            
        except Exception as e:
            current_app.logger.error(f"Bulk upload error: {str(e)}")
            return {
                'success': False,
                'message': f"File processing error: {str(e)}",
                'total_rows': 0,
                'successful_rows': 0,
                'failed_rows': 0,
                'errors': []
            }
    
    @staticmethod
    def _get_valid_employee_ids():
        """Get list of valid employee IDs from database using stored procedure"""
        try:
            from app.database.executor import StoredProcedureExecutor
            
            result = StoredProcedureExecutor.execute_procedure('proc_get_valid_employee_ids')
            
            if result["success"] and result["data"]:
                return {row['employee_id'] for row in result["data"]}
            
            return set()
        except Exception as e:
            current_app.logger.error(f"Error fetching employee IDs: {str(e)}")
            return set()
    
    @staticmethod
    def _validate_row(row, row_number, valid_employee_ids):
        """Validate a single row"""
        try:
            # Get employee ID
            employee_id = row.get('Employee ID')
            if pd.isna(employee_id):
                return {'valid': False, 'error': 'Employee ID is required'}
            
            # Convert employee_id to string and clean it
            employee_id_str = str(employee_id).strip()
            
            # Try to extract numeric ID
            try:
                # Remove leading zeros and convert to int
                emp_id_int = int(employee_id_str.lstrip('0')) if employee_id_str else None
                if emp_id_int is None:
                    return {'valid': False, 'error': 'Invalid Employee ID format'}
            except ValueError:
                return {'valid': False, 'error': f'Employee ID must be numeric (got: {employee_id_str})'}
            
            # Check if employee exists
            if emp_id_int not in valid_employee_ids:
                return {'valid': False, 'error': f'Employee ID {emp_id_int} not found in system'}
            
            # Validate date
            date_value = row.get('Date')
            if pd.isna(date_value):
                return {'valid': False, 'error': 'Date is required'}
            
            try:
                if isinstance(date_value, str):
                    # Try DD-MM-YYYY format first
                    try:
                        attendance_date = datetime.strptime(date_value, '%d-%m-%Y').date()
                    except ValueError:
                        # Fallback to YYYY-MM-DD format
                        attendance_date = datetime.strptime(date_value, '%Y-%m-%d').date()
                else:
                    attendance_date = pd.to_datetime(date_value).date()
            except:
                return {'valid': False, 'error': 'Invalid date format (use DD-MM-YYYY)'}
            
            # Validate status
            status = str(row.get('Status', '')).strip().upper()
            if not status:
                return {'valid': False, 'error': 'Status is required'}
            
            if status not in BulkAttendanceUpload.VALID_STATUSES:
                return {'valid': False, 'error': f'Invalid status (must be one of: {", ".join(BulkAttendanceUpload.VALID_STATUSES)})'}
            
            # Validate times (optional for some statuses)
            check_in_time = None
            check_out_time = None
            
            if status in ['PRESENT', 'LATE', 'WFH']:
                check_in_value = row.get('Check-in Time')
                check_out_value = row.get('Check-out Time')
                
                if not pd.isna(check_in_value):
                    try:
                        # Check if it's already a time object
                        if hasattr(check_in_value, 'hour'):
                            check_in_time = check_in_value if isinstance(check_in_value, time) else check_in_value.time()
                        elif isinstance(check_in_value, str):
                            check_in_value = check_in_value.strip()
                            # Try HH:MM:SS format first, then HH:MM
                            try:
                                check_in_time = datetime.strptime(check_in_value, '%H:%M:%S').time()
                            except ValueError:
                                check_in_time = datetime.strptime(check_in_value, '%H:%M').time()
                        else:
                            # Try to convert to datetime and extract time
                            check_in_time = pd.to_datetime(check_in_value).time()
                    except Exception as e:
                        return {'valid': False, 'error': f'Invalid check-in time format (use HH:MM) - got: {check_in_value}'}
                
                if not pd.isna(check_out_value):
                    try:
                        # Check if it's already a time object
                        if hasattr(check_out_value, 'hour'):
                            check_out_time = check_out_value if isinstance(check_out_value, datetime.time) else check_out_value.time()
                        elif isinstance(check_out_value, str):
                            check_out_value = check_out_value.strip()
                            # Try HH:MM:SS format first, then HH:MM
                            try:
                                check_out_time = datetime.strptime(check_out_value, '%H:%M:%S').time()
                            except ValueError:
                                check_out_time = datetime.strptime(check_out_value, '%H:%M').time()
                        else:
                            # Try to convert to datetime and extract time
                            check_out_time = pd.to_datetime(check_out_value).time()
                    except Exception as e:
                        return {'valid': False, 'error': f'Invalid check-out time format (use HH:MM) - got: {check_out_value}'}
            
            return {
                'valid': True,
                'data': {
                    'employee_id': emp_id_int,
                    'attendance_date': attendance_date,
                    'status': status,
                    'check_in_time': check_in_time,
                    'check_out_time': check_out_time
                }
            }
            
        except Exception as e:
            return {'valid': False, 'error': f'Validation error: {str(e)}'}
    
    @staticmethod
    def _save_attendance_record(data):
        """Save attendance record to database using stored procedure"""
        try:
            from app.database.executor import StoredProcedureExecutor
            
            employee_id = data['employee_id']
            attendance_date = data['attendance_date']
            status = data['status']
            check_in_time = data.get('check_in_time')
            check_out_time = data.get('check_out_time')
            
            # Calculate working minutes
            working_mins = None
            if check_in_time and check_out_time:
                check_in_dt = datetime.combine(attendance_date, check_in_time)
                check_out_dt = datetime.combine(attendance_date, check_out_time)
                working_mins = int((check_out_dt - check_in_dt).total_seconds() / 60)
            
            # Use stored procedure to upsert attendance record
            parameters = {
                'employee_id': employee_id,
                'attendance_date': attendance_date,
                'status': status,
                'check_in_time': check_in_time,
                'check_out_time': check_out_time,
                'working_minutes': working_mins
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_upsert_attendance_record', parameters)
            
            if result["success"]:
                return {'success': True}
            else:
                return {'success': False, 'error': 'Failed to save attendance record'}
            
        except Exception as e:
            current_app.logger.error(f"Error saving attendance record: {str(e)}")
            return {'success': False, 'error': f'Database error: {str(e)}'}
    
    @staticmethod
    def generate_template():
        """Generate Excel template file"""
        try:
            import tempfile
            import os
            
            # Create sample data with DD-MM-YYYY format
            data = {
                'Employee ID': ['1', '2', '3'],
                'Date': ['15-01-2026', '15-01-2026', '15-01-2026'],
                'Check-in Time': ['09:00', '09:15', ''],
                'Check-out Time': ['18:00', '18:30', ''],
                'Status': ['PRESENT', 'LATE', 'ABSENT']
            }
            
            df = pd.DataFrame(data)
            
            # Create Excel file in system temp directory
            temp_dir = tempfile.gettempdir()
            template_path = os.path.join(temp_dir, 'attendance_upload_template.xlsx')
            df.to_excel(template_path, index=False, engine='openpyxl')
            
            return {'success': True, 'file_path': template_path}
            
        except Exception as e:
            current_app.logger.error(f"Error generating template: {str(e)}")
            return {'success': False, 'error': str(e)}
