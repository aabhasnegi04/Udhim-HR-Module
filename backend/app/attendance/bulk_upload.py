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
from datetime import datetime
from flask import g
import openpyxl
import xlrd

from app.database.multi_tenant_executor import MultiTenantExecutor
from app.database.multi_tenant_connection import connection_manager

logger = logging.getLogger(__name__)


class BulkAttendanceUpload:

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
        if min_date and max_date:
            try:
                MultiTenantExecutor.execute_procedure(
                    'proc_generate_factory_attendance',
                    {
                        'start_date': min_date.strftime('%Y-%m-%d'),
                        'end_date': max_date.strftime('%Y-%m-%d')
                    }
                )
                logger.info(f"Factory attendance generated for {min_date} to {max_date}")
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

        for i, row in enumerate(ws.iter_rows(max_row=10, values_only=True)):
            headers = [str(c).strip().upper() if c else '' for c in row]
            if 'ID' in headers and 'TIME' in headers:
                header_row_idx = i
                id_col   = headers.index('ID')
                time_col = headers.index('TIME')
                break

        if id_col is None:
            errors.append({'row': 0, 'employee_id': None, 'error': 'Missing ID or TIME column'})
            return rows, errors

        for i, row in enumerate(ws.iter_rows(min_row=header_row_idx + 2, values_only=True)):
            row_num = header_row_idx + 2 + i
            try:
                raw_id   = row[id_col]
                raw_time = row[time_col]

                if raw_id is None and raw_time is None:
                    continue

                employee_id = int(float(str(raw_id).strip()))
                log_time    = BulkAttendanceUpload._parse_time(raw_time)

                rows.append({'employee_id': employee_id, 'log_time': log_time, 'row_number': row_num})

            except Exception as e:
                errors.append({'row': row_num, 'employee_id': None, 'error': str(e)})

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
