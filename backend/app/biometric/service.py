"""
Biometric Device Service
Handles device registration and attendance log processing.

Convention: device enrollid == employee_id (direct match, no mapping table needed)
"""

import logging
from datetime import datetime
from app.database.master_db import master_db
from app.database.multi_tenant_connection import connection_manager

logger = logging.getLogger(__name__)


class BiometricService:

    @staticmethod
    def get_tenant_by_device(device_serial: str):
        """
        Look up which tenant owns this device serial.
        Returns dict with company_code, company_id or None.
        """
        try:
            result = master_db.execute_procedure(
                'proc_mt_get_device_tenant',
                {'device_serial': device_serial}
            )
            if result:
                return result[0]
            return None
        except Exception as e:
            logger.error(f"get_tenant_by_device error: {e}")
            return None

    @staticmethod
    def register_device(device_serial: str, device_info: dict):
        """Register or update device in master DB on every 'reg' event."""
        try:
            master_db.execute_procedure('proc_mt_upsert_device', {
                'device_serial': device_serial,
                'model_name':    device_info.get('modelname', ''),
                'firmware':      device_info.get('firmware', ''),
                'mac_address':   device_info.get('mac', ''),
                'current_ip':    device_info.get('curip', ''),
                'last_seen':     datetime.now()
            })
            return True
        except Exception as e:
            logger.error(f"register_device error: {e}")
            return False

    @staticmethod
    def process_attendance_logs(company_code: str, records: list):
        """
        Process attendance records from the device.
        enrollid = employee_code (not employee_id directly).
        Looks up employee_id from employee_code.
        """
        results = []
        conn = None
        try:
            conn = connection_manager.get_company_connection(company_code)
            cursor = conn.cursor()

            for record in records:
                try:
                    enrollid = record.get('enrollid')
                    log_time_str = record.get('time')

                    if not enrollid or not log_time_str:
                        continue

                    try:
                        log_time = datetime.strptime(log_time_str, '%Y-%m-%d %H:%M:%S')
                    except ValueError:
                        logger.warning(f"Invalid time format: {log_time_str}")
                        continue

                    # Resolve employee_code -> employee_id
                    cursor.execute(
                        "SELECT employee_id FROM employees WHERE employee_code = ? AND status = 'ACTIVE'",
                        (str(enrollid),)
                    )
                    emp_row = cursor.fetchone()
                    if not emp_row:
                        logger.warning(f"No active employee with code={enrollid}")
                        results.append({'enrollid': enrollid, 'status': 'unmapped'})
                        continue
                    employee_id = emp_row[0]

                    cursor.execute(
                        "EXEC proc_mark_attendance_raw @employee_id=?, @log_time=?, @source=?",
                        (employee_id, log_time, 'BIOMETRIC')
                    )
                    conn.commit()
                    results.append({'enrollid': enrollid, 'employee_id': employee_id, 'status': 'logged'})

                except Exception as row_err:
                    logger.error(f"Error processing record {record}: {row_err}")
                    results.append({'enrollid': record.get('enrollid'), 'status': 'error'})

        except Exception as e:
            logger.error(f"process_attendance_logs error: {e}")
        finally:
            if conn:
                connection_manager.return_connection(company_code, conn)

        return results
