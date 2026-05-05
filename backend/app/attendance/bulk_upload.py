"""
Biometric Device Bulk Upload
Parses the raw punch log exported from the biometric device via USB.

Expected Excel format (from device):
    ID | Name | Time
    2  | AABHAS NEGI | 2026/04/08 17:29:06

After inserting raw logs, triggers proc_generate_factory_attendance
for the date range found in the file.
"""

import os
import logging
import tempfile
from datetime import datetime, timedelta
from flask import g
import openpyxl
import xlrd

from app.database.multi_tenant_executor import MultiTenantExecutor
from app.database.multi_tenant_connection import connection_manager

logger = logging.getLogger(__name__)


class BulkAttendanceUpload:

    @staticmethod
    def preview_files(file_paths: list) -> dict:
        """
        Preview multiple Excel files before processing.
        Returns summary, sample punches, and warnings.
        """
        all_rows = []
        all_errors = []
        file_summaries = []
        
        for file_path in file_paths:
            try:
                rows, errors = BulkAttendanceUpload._parse_file(file_path)
                
                file_summaries.append({
                    'file_name': os.path.basename(file_path),
                    'punch_count': len(rows),
                    'error_count': len(errors)
                })
                
                all_rows.extend(rows)
                all_errors.extend(errors)
                
            except Exception as e:
                file_summaries.append({
                    'file_name': os.path.basename(file_path),
                    'punch_count': 0,
                    'error_count': 1,
                    'error': str(e)
                })
        
        if not all_rows and all_errors:
            return {
                'success': False,
                'message': 'No valid punches found in any file',
                'files': file_summaries,
                'errors': all_errors
            }
        
        # Get date range
        min_date = None
        max_date = None
        unique_employees = set()
        
        for row in all_rows:
            punch_date = row['log_time'].date()
            if min_date is None or punch_date < min_date:
                min_date = punch_date
            if max_date is None or punch_date > max_date:
                max_date = punch_date
            unique_employees.add(row['employee_id'])
        
        # Analyze punch patterns for warnings
        early_morning_punches = []
        regular_punches = []
        
        for row in all_rows:
            if row['log_time'].time() < datetime.strptime('06:00:00', '%H:%M:%S').time():
                early_morning_punches.append(row)
            else:
                regular_punches.append(row)
        
        # Get sample punches - prioritize showing ALL early morning punches
        sample_punches = []
        
        # First, add ALL early morning punches (these are important to see)
        for row in early_morning_punches:
            punch_time = row['log_time'].time()
            sample_punches.append({
                'employee_code': row['employee_id'],
                'log_time': row['log_time'].strftime('%Y-%m-%d %H:%M:%S'),
                'is_early_morning': True,
                'note': 'Previous day checkout'
            })
        
        # Then add sample of regular punches (up to 20 total)
        remaining_slots = max(20 - len(sample_punches), 10)  # Show at least 10 regular punches
        for row in regular_punches[:remaining_slots]:
            punch_time = row['log_time'].time()
            sample_punches.append({
                'employee_code': row['employee_id'],
                'log_time': row['log_time'].strftime('%Y-%m-%d %H:%M:%S'),
                'is_early_morning': False,
                'note': 'Regular punch'
            })
        
        # Check for invalid employee codes
        company_code = getattr(g, 'company_code', None)
        warnings = []
        
        # Add early morning punch warning
        if early_morning_punches:
            from datetime import timedelta
            reprocess_date = min_date - timedelta(days=1) if min_date else None
            warnings.append({
                'type': 'early_morning_checkout',
                'message': f'{len(early_morning_punches)} early morning punch(es) detected (00:00-06:00)',
                'detail': f'These will be treated as checkouts for {reprocess_date.strftime("%B %d, %Y") if reprocess_date else "previous day"} night shift',
                'count': len(early_morning_punches),
                'affected_employees': len(set(row['employee_id'] for row in early_morning_punches))
            })
        
        if company_code:
            try:
                conn = connection_manager.get_company_connection(company_code)
                cursor = conn.cursor()
                
                invalid_codes = set()
                for emp_code in unique_employees:
                    cursor.execute(
                        "SELECT employee_id FROM employees WHERE employee_code = ? AND status = 'ACTIVE'",
                        (str(emp_code),)
                    )
                    if not cursor.fetchone():
                        invalid_codes.add(emp_code)
                
                connection_manager.return_connection(company_code, conn)
                
                if invalid_codes:
                    punch_count = sum(1 for row in all_rows if row['employee_id'] in invalid_codes)
                    warnings.append({
                        'type': 'invalid_employee',
                        'message': f'{len(invalid_codes)} employee code(s) not found ({punch_count} punches will be skipped)',
                        'codes': list(invalid_codes)[:10]  # Show first 10
                    })
                    
            except Exception as e:
                logger.warning(f"Could not validate employee codes: {e}")
        
        return {
            'success': True,
            'total_punches': len(all_rows),
            'total_files': len(file_paths),
            'files': file_summaries,
            'date_range': {
                'from': str(min_date) if min_date else None,
                'to': str(max_date) if max_date else None
            },
            'unique_employees': len(unique_employees),
            'sample_punches': sample_punches,
            'warnings': warnings,
            'errors': all_errors[:50],  # Limit errors shown
            'punch_analysis': {
                'early_morning_checkouts': len(early_morning_punches),
                'regular_punches': len(regular_punches),
                'will_reprocess_previous_day': len(early_morning_punches) > 0
            }
        }

    @staticmethod
    def process_multiple_files(file_paths: list) -> dict:
        """
        Process multiple Excel files at once.
        Inserts all punches, then generates attendance once.
        """
        all_rows = []
        all_errors = []
        
        # Parse all files
        for file_path in file_paths:
            try:
                rows, errors = BulkAttendanceUpload._parse_file(file_path)
                all_rows.extend(rows)
                all_errors.extend(errors)
            except Exception as e:
                all_errors.append({
                    'file': os.path.basename(file_path),
                    'error': f'Failed to parse file: {str(e)}'
                })
        
        if not all_rows and all_errors:
            return {
                'success': False,
                'message': 'No valid punches found in any file',
                'total_rows': 0,
                'successful_rows': 0,
                'failed_rows': len(all_errors),
                'errors': all_errors
            }
        
        # Insert all punches
        successful = 0
        min_date = None
        max_date = None
        
        company_code = getattr(g, 'company_code', None)
        if not company_code:
            return {'success': False, 'message': 'Company context not set'}
        
        conn = None
        try:
            conn = connection_manager.get_company_connection(company_code)
            cursor = conn.cursor()
            
            for row in all_rows:
                try:
                    enrollid = row['employee_id']
                    log_time = row['log_time']
                    
                    # Resolve employee_code -> employee_id
                    cursor.execute(
                        "SELECT employee_id FROM employees WHERE employee_code = ? AND status = 'ACTIVE'",
                        (str(enrollid),)
                    )
                    emp_row = cursor.fetchone()
                    if not emp_row:
                        all_errors.append({
                            'row': row.get('row_number'),
                            'employee_id': enrollid,
                            'error': f'No active employee found with code {enrollid}'
                        })
                        continue
                    employee_id = emp_row[0]
                    
                    # Skip duplicate punches
                    cursor.execute(
                        "SELECT COUNT(*) FROM attendance_raw_logs WHERE employee_id=? AND log_time=?",
                        (employee_id, log_time)
                    )
                    if cursor.fetchone()[0] > 0:
                        successful += 1
                        continue
                    
                    cursor.execute(
                        """INSERT INTO attendance_raw_logs
                           (employee_id, log_time, source, created_at)
                           VALUES (?, ?, 'BIOMETRIC', GETDATE())""",
                        (employee_id, log_time)
                    )
                    successful += 1
                    
                    punch_date = log_time.date()
                    if min_date is None or punch_date < min_date:
                        min_date = punch_date
                    if max_date is None or punch_date > max_date:
                        max_date = punch_date
                        
                except Exception as row_err:
                    logger.error(f"Row insert error: {row_err}")
                    all_errors.append({
                        'row': row.get('row_number'),
                        'employee_id': row.get('employee_id'),
                        'error': str(row_err)
                    })
            
            conn.commit()
            
        except Exception as e:
            logger.error(f"DB error during bulk upload: {e}")
            return {'success': False, 'message': f'Database error: {str(e)}'}
        finally:
            if conn:
                connection_manager.return_connection(company_code, conn)
        
        # Check if any punches are early morning (00:00-06:00) - these are night shift checkouts
        has_early_morning_punches = any(
            row['log_time'].time() < datetime.strptime('06:00:00', '%H:%M:%S').time()
            for row in all_rows
        )
        
        # Generate attendance once for all dates
        if min_date and max_date:
            try:
                # If we have early morning punches, also re-process previous day
                # to capture night shift checkouts that span midnight
                actual_start_date = min_date
                if has_early_morning_punches and min_date:
                    actual_start_date = min_date - timedelta(days=1)
                    logger.info(f"Early morning punches detected - will re-process from {actual_start_date}")
                
                MultiTenantExecutor.execute_procedure(
                    'proc_generate_factory_attendance',
                    {
                        'start_date': actual_start_date.strftime('%Y-%m-%d'),
                        'end_date': max_date.strftime('%Y-%m-%d')
                    }
                )
                logger.info(f"Factory attendance generated for {actual_start_date} to {max_date}")
            except Exception as e:
                logger.warning(f"Attendance generation failed: {e}")
        
        return {
            'success': True,
            'message': f'Processed {successful} punch records from {len(file_paths)} file(s). Attendance generated.',
            'total_rows': len(all_rows),
            'successful_rows': successful,
            'failed_rows': len(all_errors),
            'errors': all_errors,
            'date_range': {
                'from': str(min_date) if min_date else None,
                'to': str(max_date) if max_date else None
            }
        }

    @staticmethod
    def validate_and_process_file(file_path: str) -> dict:
        """
        Parse device USB export and insert into attendance_raw_logs.
        Then trigger factory attendance generation for the date range.
        """
        rows = []
        errors = []

        # --- Parse file ---
        try:
            rows, errors = BulkAttendanceUpload._parse_file(file_path)
        except Exception as e:
            return {'success': False, 'message': f'Failed to parse file: {str(e)}'}

        if not rows and errors:
            return {
                'success': False,
                'message': 'File could not be parsed. Check format.',
                'total_rows': 0,
                'successful_rows': 0,
                'failed_rows': len(errors),
                'errors': errors
            }

        # --- Insert raw logs ---
        successful = 0
        min_date = None
        max_date = None

        company_code = getattr(g, 'company_code', None)
        if not company_code:
            return {'success': False, 'message': 'Company context not set'}

        conn = None
        try:
            conn = connection_manager.get_company_connection(company_code)
            cursor = conn.cursor()

            for row in rows:
                try:
                    enrollid = row['employee_id']  # this is actually the device enrollid = employee_code
                    log_time = row['log_time']

                    # Resolve employee_code -> employee_id
                    cursor.execute(
                        "SELECT employee_id FROM employees WHERE employee_code = ? AND status = 'ACTIVE'",
                        (str(enrollid),)
                    )
                    emp_row = cursor.fetchone()
                    if not emp_row:
                        errors.append({
                            'row': row.get('row_number'),
                            'employee_id': enrollid,
                            'error': f'No active employee found with code {enrollid}'
                        })
                        continue
                    employee_id = emp_row[0]

                    # Skip duplicate punches (same employee, same minute)
                    cursor.execute(
                        "SELECT COUNT(*) FROM attendance_raw_logs WHERE employee_id=? AND log_time=?",
                        (employee_id, log_time)
                    )
                    if cursor.fetchone()[0] > 0:
                        successful += 1  # already exists, count as ok
                        continue

                    cursor.execute(
                        """INSERT INTO attendance_raw_logs
                           (employee_id, log_time, source, created_at)
                           VALUES (?, ?, 'BIOMETRIC', GETDATE())""",
                        (employee_id, log_time)
                    )
                    successful += 1

                    punch_date = log_time.date()
                    if min_date is None or punch_date < min_date:
                        min_date = punch_date
                    if max_date is None or punch_date > max_date:
                        max_date = punch_date

                except Exception as row_err:
                    logger.error(f"Row insert error - employee_id={row.get('employee_id')} log_time={row.get('log_time')}: {row_err}")
                    errors.append({
                        'row': row.get('row_number'),
                        'employee_id': row.get('employee_id'),
                        'error': str(row_err)
                    })

            conn.commit()

        except Exception as e:
            logger.error(f"DB error during bulk upload: {e}")
            return {'success': False, 'message': f'Database error: {str(e)}'}
        finally:
            if conn:
                connection_manager.return_connection(company_code, conn)

        # --- Trigger factory attendance generation ---
        # Check if any punches are early morning (00:00-06:00) - these are night shift checkouts
        has_early_morning_punches = any(
            row['log_time'].time() < datetime.strptime('06:00:00', '%H:%M:%S').time()
            for row in rows
        )
        
        if min_date and max_date:
            try:
                # If we have early morning punches, also re-process previous day
                # to capture night shift checkouts that span midnight
                actual_start_date = min_date
                if has_early_morning_punches and min_date:
                    actual_start_date = min_date - timedelta(days=1)
                    logger.info(f"Early morning punches detected - will re-process from {actual_start_date}")
                
                MultiTenantExecutor.execute_procedure(
                    'proc_generate_factory_attendance',
                    {
                        'start_date': actual_start_date.strftime('%Y-%m-%d'),
                        'end_date': max_date.strftime('%Y-%m-%d')
                    }
                )
                logger.info(f"Factory attendance generated for {actual_start_date} to {max_date}")
            except Exception as e:
                logger.warning(f"Attendance generation failed (logs still saved): {e}")

        return {
            'success': True,
            'message': f'Processed {successful} punch records. Attendance generated.',
            'total_rows': len(rows),
            'successful_rows': successful,
            'failed_rows': len(errors),
            'errors': errors,
            'date_range': {
                'from': str(min_date) if min_date else None,
                'to': str(max_date) if max_date else None
            }
        }

    @staticmethod
    def _parse_file(file_path: str):
        """Parse .xls or .xlsx device export. Tries openpyxl first, falls back to xlrd."""
        # Try openpyxl first — handles .xlsx and many .xls files
        try:
            return BulkAttendanceUpload._parse_xlsx(file_path)
        except Exception:
            pass
        # Fall back to xlrd for true old-format .xls
        try:
            return BulkAttendanceUpload._parse_xls(file_path)
        except Exception as e:
            return [], [{'row': 0, 'employee_id': None, 'error': f'Cannot read file: {str(e)}'}]

    @staticmethod
    def _parse_xls(file_path: str):
        rows = []
        errors = []
        wb = xlrd.open_workbook(file_path)
        ws = wb.sheet_by_index(0)

        # Find header row
        header_row = 0
        for i in range(min(5, ws.nrows)):
            row_vals = [str(ws.cell_value(i, j)).strip().upper() for j in range(ws.ncols)]
            if 'ID' in row_vals and 'TIME' in row_vals:
                header_row = i
                break

        headers = [str(ws.cell_value(header_row, j)).strip().upper() for j in range(ws.ncols)]

        try:
            id_col   = headers.index('ID')
            time_col = headers.index('TIME')
        except ValueError:
            errors.append({'row': 0, 'employee_id': None, 'error': 'Missing ID or TIME column'})
            return rows, errors

        for i in range(header_row + 1, ws.nrows):
            row_num = i + 1
            try:
                raw_id   = ws.cell_value(i, id_col)
                raw_time = ws.cell_value(i, time_col)

                if not raw_id and not raw_time:
                    continue

                employee_id = int(float(str(raw_id).strip()))
                log_time    = BulkAttendanceUpload._parse_time(raw_time, wb.datemode)

                rows.append({'employee_id': employee_id, 'log_time': log_time, 'row_number': row_num})

            except Exception as e:
                errors.append({'row': row_num, 'employee_id': None, 'error': str(e)})

        return rows, errors

    @staticmethod
    def _parse_xlsx(file_path: str):
        rows = []
        errors = []
        wb = openpyxl.load_workbook(file_path, data_only=True)
        ws = wb.active

        header_row_idx = None
        id_col = time_col = None

        # Find header row (1-indexed for Excel, 0-indexed in openpyxl)
        for i, row in enumerate(ws.iter_rows(max_row=10, values_only=True), start=1):
            headers = [str(c).strip().upper() if c else '' for c in row]
            if 'ID' in headers and 'TIME' in headers:
                header_row_idx = i
                id_col   = headers.index('ID')
                time_col = headers.index('TIME')
                break

        if id_col is None:
            errors.append({'row': 0, 'employee_id': None, 'error': 'Missing ID or TIME column'})
            return rows, errors

        logger.info(f"Found header at row {header_row_idx}, ID col: {id_col}, TIME col: {time_col}")
        logger.info(f"Total rows in sheet: {ws.max_row}")
        
        row_count = 0
        empty_count = 0
        
        # Read all rows after header
        for row_idx in range(header_row_idx + 1, ws.max_row + 1):
            row_count += 1
            try:
                # Get cell values directly by row and column
                raw_id = ws.cell(row=row_idx, column=id_col + 1).value
                raw_time = ws.cell(row=row_idx, column=time_col + 1).value

                # Skip completely empty rows
                if raw_id is None and raw_time is None:
                    empty_count += 1
                    logger.debug(f"Row {row_idx}: Empty row, skipping")
                    continue

                # Skip if either ID or Time is missing
                if raw_id is None or raw_time is None:
                    logger.warning(f"Row {row_idx}: Missing data - ID={raw_id}, Time={raw_time}")
                    errors.append({'row': row_idx, 'employee_id': raw_id, 'error': 'Missing ID or Time'})
                    continue

                employee_id = int(float(str(raw_id).strip()))
                log_time = BulkAttendanceUpload._parse_time(raw_time)

                rows.append({'employee_id': employee_id, 'log_time': log_time, 'row_number': row_idx})
                logger.debug(f"Row {row_idx}: Parsed ID={employee_id}, Time={log_time}")

            except Exception as e:
                logger.error(f"Row {row_idx}: Parse error - {str(e)}, raw_id={raw_id}, raw_time={raw_time}")
                errors.append({'row': row_idx, 'employee_id': None, 'error': str(e)})

        logger.info(f"Parsing complete: {len(rows)} rows parsed successfully, {len(errors)} errors, {empty_count} empty rows, total rows scanned: {row_count}")
        return rows, errors

    @staticmethod
    def _parse_time(value, datemode=None) -> datetime:
        """Parse various time formats from device export."""
        if isinstance(value, datetime):
            return value

        if isinstance(value, float) and datemode is not None:
            # xlrd date serial
            import xlrd as _xlrd
            t = _xlrd.xldate_as_tuple(value, datemode)
            return datetime(*t)

        s = str(value).strip()
        for fmt in ('%Y/%m/%d %H:%M:%S', '%Y-%m-%d %H:%M:%S',
                    '%d/%m/%Y %H:%M:%S', '%d-%m-%Y %H:%M:%S',
                    '%Y/%m/%d %H:%M',    '%Y-%m-%d %H:%M'):
            try:
                return datetime.strptime(s, fmt)
            except ValueError:
                continue
        raise ValueError(f"Cannot parse time: {value!r}")

    @staticmethod
    def generate_template() -> dict:
        """Generate a sample template showing the device export format."""
        try:
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = 'Attendance'
            ws.append(['ID', 'Name', 'Time'])
            ws.append([2, 'AABHAS NEGI', '2026/04/09 08:05:00'])
            ws.append([2, 'AABHAS NEGI', '2026/04/09 20:10:00'])
            ws.append([3, 'PRATHAM KANOJIA', '2026/04/09 08:12:00'])
            ws.append([3, 'PRATHAM KANOJIA', '2026/04/09 20:05:00'])

            tmp = tempfile.NamedTemporaryFile(
                mode='wb', suffix='.xlsx', delete=False,
                prefix='device_attendance_template_'
            )
            wb.save(tmp.name)
            tmp.close()
            return {'success': True, 'file_path': tmp.name}
        except Exception as e:
            return {'success': False, 'error': str(e)}
