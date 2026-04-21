"""
Biometric Device Gateway
WebSocket server that listens for connections from biometric devices (Yunatt/AiFace protocol).
Parses device events and forwards them to the Flask backend via internal HTTP.

Run this as a separate process alongside Flask:
    python device_gateway.py

Environment variables (same .env as Flask):
    GATEWAY_PORT        - WebSocket port (default: 7792)
    FLASK_INTERNAL_URL  - Flask base URL (default: http://127.0.0.1:5000)
    GATEWAY_SECRET      - Shared secret with Flask biometric endpoint
"""

import asyncio
import websockets
import json
import logging
import os
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [GATEWAY] %(levelname)s %(message)s'
)
logger = logging.getLogger(__name__)

GATEWAY_PORT = int(os.environ.get('GATEWAY_PORT', 7792))
FLASK_INTERNAL_URL = os.environ.get('FLASK_INTERNAL_URL', 'http://127.0.0.1:5000')
GATEWAY_SECRET = os.environ.get('GATEWAY_SECRET', 'change-this-secret')

FLASK_ENDPOINT = f"{FLASK_INTERNAL_URL}/biometric/device-event"


def post_to_flask(cmd: str, device_serial: str, data):
    """Forward parsed event to Flask backend."""
    try:
        resp = requests.post(
            FLASK_ENDPOINT,
            json={'cmd': cmd, 'device_serial': device_serial, 'data': data},
            headers={'X-Gateway-Secret': GATEWAY_SECRET},
            timeout=10
        )
        if resp.status_code != 200:
            logger.warning(f"Flask returned {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        logger.error(f"Failed to post to Flask: {e}")


async def handler(websocket):
    addr = websocket.remote_address
    logger.info(f"Device connected from {addr}")
    device_serial = None

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
            except json.JSONDecodeError:
                logger.warning(f"Non-JSON message from {addr}: {message[:100]}")
                continue

            cmd = data.get('cmd', '')
            ret = data.get('ret', '')

            # --- Device registration ---
            if cmd == 'reg':
                device_serial = data.get('sn')
                devinfo = data.get('devinfo', {})
                logger.info(f"Device registered: sn={device_serial} model={devinfo.get('modelname')} ip={devinfo.get('curip')}")
                post_to_flask('reg', device_serial, devinfo)
                await websocket.send(json.dumps({"ret": "reg", "result": True}))

            # --- Heartbeat ---
            elif cmd == 'heart':
                await websocket.send(json.dumps({"ret": "heart", "result": True}))

            # --- Batch attendance logs (sent on connect or after new punch) ---
            elif cmd == 'sendlog':
                sn = data.get('sn', device_serial)
                count = data.get('count', 0)
                logindex = data.get('logindex', 0)
                records = data.get('record', [])
                logger.info(f"sendlog from {sn}: {count} records")
                if records:
                    post_to_flask('sendlog', sn, records)
                await websocket.send(json.dumps({
                    "ret": "sendlog",
                    "result": True,
                    "count": count,
                    "logindex": logindex
                }))

            # --- Real-time punch ---
            elif cmd == 'log':
                sn = data.get('sn', device_serial)
                records = data.get('record', [])
                logger.info(f"Real-time punch from {sn}: {records}")
                if records:
                    post_to_flask('sendlog', sn, records)
                await websocket.send(json.dumps({"ret": "log", "result": True}))

            # --- User data sync ---
            elif cmd == 'senduser':
                sn = data.get('sn', device_serial)
                enrollid = data.get('enrollid')
                name = data.get('name')
                logger.info(f"senduser from {sn}: enrollid={enrollid} name={name}")
                await websocket.send(json.dumps({
                    "ret": "senduser",
                    "result": True,
                    "enrollid": enrollid
                }))

            # --- Device responding to our commands ---
            elif ret:
                logger.debug(f"Device response to '{ret}': result={data.get('result')}")

            # --- Unknown command ---
            else:
                logger.warning(f"Unknown cmd '{cmd}' from {addr}")
                await websocket.send(json.dumps({"ret": cmd, "result": True}))

    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Device disconnected: {addr} (sn={device_serial})")
    except Exception as e:
        logger.error(f"Handler error for {addr}: {e}")


async def main():
    logger.info(f"Biometric Gateway starting on port {GATEWAY_PORT}")
    logger.info(f"Forwarding events to: {FLASK_ENDPOINT}")
    async with websockets.serve(handler, "0.0.0.0", GATEWAY_PORT):
        await asyncio.Future()  # run forever


if __name__ == '__main__':
    asyncio.run(main())
