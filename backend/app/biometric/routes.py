"""
Biometric Device Routes
Internal endpoint called by device_gateway.py — NOT exposed to frontend.
Protected by a shared secret key instead of JWT.
"""

import os
import logging
from flask import Blueprint, request, current_app
from app.biometric.service import BiometricService
from app.utils.response import success_response, error_response, validation_error_response

logger = logging.getLogger(__name__)
biometric_bp = Blueprint('biometric', __name__)

GATEWAY_SECRET = os.environ.get('GATEWAY_SECRET', 'change-this-secret')


def _verify_gateway_secret():
    """Verify the request comes from our own gateway process."""
    return request.headers.get('X-Gateway-Secret') == GATEWAY_SECRET


@biometric_bp.route('/device-event', methods=['POST'])
def device_event():
    """
    Receives parsed events from device_gateway.py.
    Payload: { "cmd": "reg"|"sendlog", "device_serial": "...", "data": {...} }
    """
    if not _verify_gateway_secret():
        return error_response("Unauthorized", status_code=401)

    body = request.get_json()
    if not body:
        return validation_error_response("Empty request body")

    cmd = body.get('cmd')
    device_serial = body.get('device_serial')

    if not cmd or not device_serial:
        return validation_error_response("cmd and device_serial are required")

    # --- Device registration ---
    if cmd == 'reg':
        device_info = body.get('data', {})
        BiometricService.register_device(device_serial, device_info)
        return success_response(message="Device registered")

    # --- Attendance logs ---
    if cmd == 'sendlog':
        records = body.get('data', [])
        if not records:
            return success_response(message="No records to process")

        tenant = BiometricService.get_tenant_by_device(device_serial)
        if not tenant:
            logger.warning(f"Unknown device: {device_serial}")
            return error_response(f"Device {device_serial} not assigned to any tenant", status_code=404)

        company_code = tenant.get('company_code')
        results = BiometricService.process_attendance_logs(company_code, records)
        return success_response(message="Logs processed", data={"results": results})

    return validation_error_response(f"Unknown cmd: {cmd}")
