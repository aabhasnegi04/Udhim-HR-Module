"""
Kiosk Service for Face Recognition Attendance System
Handles kiosk-specific operations and attendance marking
"""

from flask import current_app
from app.database.executor import StoredProcedureExecutor
from app.attendance.face_recognition_service import FaceRecognitionService
from datetime import datetime, date


class KioskService:
    """Service for kiosk operations"""
    
    # Minimum confidence threshold for kiosk (60%)
    MIN_CONFIDENCE_THRESHOLD = 60.0
    
    @staticmethod
    def verify_kiosk_pin(kiosk_id, pin):
        """Verify kiosk PIN"""
        try:
            parameters = {
                'kiosk_id': kiosk_id,
                'kiosk_pin': pin  # In production, hash this before sending
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_verify_kiosk_pin', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "PIN verified"),
                        "data": {
                            "kiosk_id": proc_result.get("kiosk_id"),
                            "kiosk_name": proc_result.get("kiosk_name"),
                            "kiosk_location": proc_result.get("kiosk_location")
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Invalid PIN"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to verify PIN",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Verify kiosk PIN error: {str(e)}")
            return {
                "success": False,
                "message": "Kiosk service error",
                "data": None
            }
    
    @staticmethod
    def get_kiosk_settings(kiosk_id):
        """Get kiosk configuration"""
        try:
            parameters = {'kiosk_id': kiosk_id}
            result = StoredProcedureExecutor.execute_procedure('proc_get_kiosk_settings', parameters)
            
            if result["success"] and result["data"]:
                return {
                    "success": True,
                    "message": "Kiosk settings retrieved",
                    "data": result["data"][0]
                }
            else:
                return {
                    "success": False,
                    "message": "Kiosk not found",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get kiosk settings error: {str(e)}")
            return {
                "success": False,
                "message": "Kiosk service error",
                "data": None
            }
    
    @staticmethod
    def get_today_logs(kiosk_id, log_date=None):
        """Get today's attendance logs for kiosk"""
        try:
            parameters = {'kiosk_id': kiosk_id}
            if log_date:
                parameters['log_date'] = log_date
            
            result = StoredProcedureExecutor.execute_procedure('proc_get_kiosk_today_logs', parameters)
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Kiosk logs retrieved",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve logs",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Get kiosk logs error: {str(e)}")
            return {
                "success": False,
                "message": "Kiosk service error",
                "data": None
            }
    
    @staticmethod
    def mark_attendance_with_face(kiosk_id, base64_image):
        """Mark attendance using face recognition via kiosk"""
        try:
            # Check if face recognition is available
            if not FaceRecognitionService.is_available():
                return {
                    "success": False,
                    "message": "Face recognition service not available",
                    "data": None
                }
            
            # Recognize face
            recognition_result = FaceRecognitionService.recognize_face(base64_image)
            
            if not recognition_result["success"]:
                # Log failed attempt (without employee_id)
                current_app.logger.warning(f"Kiosk {kiosk_id}: Face not recognized - {recognition_result['message']}")
                return {
                    "success": False,
                    "message": "PLEASE TRY AGAIN",
                    "data": None
                }
            
            employee_id = recognition_result["data"]["employee_id"]
            employee_name = recognition_result["data"]["employee_name"]
            confidence = recognition_result["data"]["confidence"]
            
            # Check confidence threshold
            if confidence < KioskService.MIN_CONFIDENCE_THRESHOLD:
                current_app.logger.warning(
                    f"Kiosk {kiosk_id}: Low confidence {confidence}% for employee {employee_id}"
                )
                return {
                    "success": False,
                    "message": "PLEASE TRY AGAIN",
                    "data": None
                }
            
            # Mark attendance via stored procedure
            log_time = datetime.now()
            parameters = {
                'kiosk_id': kiosk_id,
                'employee_id': employee_id,
                'confidence': confidence,
                'log_time': log_time
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_mark_kiosk_attendance', parameters)
            
            # Debug logging
            current_app.logger.info(f"Stored procedure result: {result}")
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                
                # Debug logging
                current_app.logger.info(f"proc_result type: {type(proc_result)}, value: {proc_result}")
                
                # Handle if proc_result is a list (multiple result sets)
                if isinstance(proc_result, list) and len(proc_result) > 0:
                    current_app.logger.info(f"proc_result is a list, extracting first element")
                    proc_result = proc_result[0]
                    current_app.logger.info(f"After extraction - type: {type(proc_result)}, value: {proc_result}")
                
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Attendance marked"),
                        "data": {
                            "employee_name": proc_result.get("employee_name"),
                            "log_type": proc_result.get("log_type"),
                            "log_time": proc_result.get("log_time_formatted"),
                            "confidence": proc_result.get("confidence")
                        }
                    }
                elif isinstance(proc_result, dict):
                    # Debug: Check what's in proc_result
                    current_app.logger.warning(f"proc_result is dict but success != 1: {proc_result}")
                    
                    # Failed due to business logic (e.g., already checked in)
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to mark attendance"),
                        "data": {
                            "employee_name": proc_result.get("employee_name"),
                            "check_in_time": proc_result.get("check_in_time").strftime('%I:%M %p') if proc_result.get("check_in_time") else None
                        }
                    }
                else:
                    current_app.logger.error(f"Unexpected proc_result type: {type(proc_result)}, value: {proc_result}")
                    return {
                        "success": False,
                        "message": "Invalid response from database",
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to mark attendance",
                    "data": None
                }
                
        except Exception as e:
            import traceback
            current_app.logger.error(f"Kiosk mark attendance error: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return {
                "success": False,
                "message": "Attendance marking error",
                "data": None
            }
    
    @staticmethod
    def list_all_kiosks():
        """List all kiosks (HR only)"""
        try:
            result = StoredProcedureExecutor.execute_procedure('proc_list_all_kiosks')
            
            if result["success"]:
                return {
                    "success": True,
                    "message": "Kiosks retrieved",
                    "data": result["data"]
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to retrieve kiosks",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"List kiosks error: {str(e)}")
            return {
                "success": False,
                "message": "Kiosk service error",
                "data": None
            }
    
    @staticmethod
    def create_kiosk(kiosk_name, kiosk_location, kiosk_pin):
        """Create new kiosk (HR only)"""
        try:
            parameters = {
                'kiosk_name': kiosk_name,
                'kiosk_location': kiosk_location,
                'kiosk_pin': kiosk_pin  # In production, hash this
            }
            
            result = StoredProcedureExecutor.execute_procedure('proc_create_kiosk', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Kiosk created"),
                        "data": {"kiosk_id": proc_result.get("kiosk_id")}
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to create kiosk"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to create kiosk",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Create kiosk error: {str(e)}")
            return {
                "success": False,
                "message": "Kiosk service error",
                "data": None
            }
    
    @staticmethod
    def update_kiosk_settings(kiosk_id, kiosk_name, kiosk_location, kiosk_pin=None):
        """Update kiosk settings (HR only)"""
        try:
            parameters = {
                'kiosk_id': kiosk_id,
                'kiosk_name': kiosk_name,
                'kiosk_location': kiosk_location
            }
            if kiosk_pin:
                parameters['kiosk_pin'] = kiosk_pin  # In production, hash this
            
            result = StoredProcedureExecutor.execute_procedure('proc_update_kiosk_settings', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Kiosk updated"),
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to update kiosk"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to update kiosk",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Update kiosk error: {str(e)}")
            return {
                "success": False,
                "message": "Kiosk service error",
                "data": None
            }
