"""
Face Recognition Service for Attendance System
Uses face_recognition library for face detection and matching
"""

import os
import json
import base64
import time
from datetime import datetime
from io import BytesIO
from PIL import Image
import numpy as np
from flask import current_app

try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    face_recognition = None
except Exception as e:
    # Handle face_recognition_models not found error
    FACE_RECOGNITION_AVAILABLE = False
    face_recognition = None
    print(f"Face recognition not available: {str(e)}")

from app.database.multi_tenant_executor import MultiTenantExecutor
from app.database.connection import DatabaseConnection


class FaceRecognitionService:
    """Service for face recognition operations"""
    
    # Cache for face encodings (5 minute TTL)
    _face_encodings_cache = {
        'encodings': [],
        'employee_ids': [],
        'names': [],
        'loaded_at': 0,
        'ttl': 300  # 5 minutes in seconds
    }
    
    # Face matching tolerance (lower = stricter)
    FACE_MATCH_TOLERANCE = 0.6
    
    # Minimum confidence threshold (percentage)
    MIN_CONFIDENCE_THRESHOLD = 60.0
    
    @staticmethod
    def is_available():
        """Check if face recognition is available"""
        return FACE_RECOGNITION_AVAILABLE
    
    @staticmethod
    def decode_base64_image(base64_string):
        """Decode base64 image string to numpy array"""
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64
            image_data = base64.b64decode(base64_string)
            
            # Convert to PIL Image
            image = Image.open(BytesIO(image_data))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array
            image_array = np.array(image)
            
            return image_array
        except Exception as e:
            current_app.logger.error(f"Error decoding base64 image: {str(e)}")
            return None
    
    @staticmethod
    def generate_face_encoding(image_array):
        """Generate face encoding from image array"""
        if not FACE_RECOGNITION_AVAILABLE:
            raise Exception("Face recognition library not available")
        
        try:
            # Detect faces in image
            face_locations = face_recognition.face_locations(image_array)
            
            if not face_locations:
                return None, "No face detected in the image"
            
            if len(face_locations) > 1:
                return None, "Multiple faces detected. Please ensure only one face is visible"
            
            # Generate face encoding
            face_encodings = face_recognition.face_encodings(image_array, face_locations)
            
            if not face_encodings:
                return None, "Failed to generate face encoding"
            
            # Convert to list for JSON serialization
            encoding = face_encodings[0].tolist()
            
            return encoding, None
        except Exception as e:
            current_app.logger.error(f"Error generating face encoding: {str(e)}")
            return None, f"Face encoding error: {str(e)}"
    
    @staticmethod
    def register_employee_face(employee_id, base64_image, created_by='system'):
        """Register employee face for recognition"""
        try:
            if not FACE_RECOGNITION_AVAILABLE:
                return {
                    "success": False,
                    "message": "Face recognition not available. Please install face_recognition library",
                    "data": None
                }
            
            # Decode image
            image_array = FaceRecognitionService.decode_base64_image(base64_image)
            if image_array is None:
                return {
                    "success": False,
                    "message": "Failed to decode image",
                    "data": None
                }
            
            # Generate face encoding
            encoding, error = FaceRecognitionService.generate_face_encoding(image_array)
            if error:
                return {
                    "success": False,
                    "message": error,
                    "data": None
                }
            
            # Convert encoding to JSON
            encoding_json = json.dumps(encoding)
            
            # Save to database
            parameters = {
                'employee_id': employee_id,
                'face_encoding_json': encoding_json,
                'photo_path': None,  # We're not saving images for now
                'registered_by': created_by
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_register_employee_face', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    # Clear cache so new encoding is loaded
                    FaceRecognitionService._face_encodings_cache['loaded_at'] = 0
                    
                    return {
                        "success": True,
                        "message": proc_result.get("message", "Face registered successfully"),
                        "data": {"face_id": proc_result.get("face_id")}
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to register face"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to register face in database",
                    "data": None
                }
                
        except Exception as e:
            import traceback
            current_app.logger.error(f"Register face error: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return {
                "success": False,
                "message": f"Face registration error: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def load_face_encodings():
        """Load all registered face encodings from employee_personal table (with caching)"""
        try:
            # Check cache first
            current_time = time.time()
            cache = FaceRecognitionService._face_encodings_cache
            
            if (cache['encodings'] and 
                (current_time - cache['loaded_at']) < cache['ttl']):
                current_app.logger.info(f"Using cached face encodings ({len(cache['encodings'])} faces)")
                return cache['encodings'], cache['employee_ids'], cache['names']
            
            # Load from employee_personal table via stored procedure
            result = MultiTenantExecutor.execute_procedure('proc_get_all_active_face_encodings')
            
            if not result["success"] or not result["data"]:
                current_app.logger.warning("No face encodings found in employee_personal table")
                return [], [], []
            
            encodings = []
            employee_ids = []
            names = []
            
            for row in result["data"]:
                try:
                    # Parse JSON encoding from employee_personal.face_encoding_json
                    encoding_json = row.get('face_encoding_json')
                    if encoding_json:
                        encoding = json.loads(encoding_json)
                        encodings.append(encoding)
                        employee_ids.append(row.get('employee_id'))
                        names.append(row.get('employee_name', ''))
                except Exception as e:
                    current_app.logger.error(f"Error parsing encoding for employee {row.get('employee_id')}: {str(e)}")
                    continue
            
            # Update cache
            cache['encodings'] = encodings
            cache['employee_ids'] = employee_ids
            cache['names'] = names
            cache['loaded_at'] = current_time
            
            current_app.logger.info(f"Loaded {len(encodings)} face encodings from employee_personal table")
            
            return encodings, employee_ids, names
            
        except Exception as e:
            import traceback
            current_app.logger.error(f"Load face encodings error: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return [], [], []
    
    @staticmethod
    def recognize_face(base64_image):
        """Recognize face in image and return employee info"""
        try:
            if not FACE_RECOGNITION_AVAILABLE:
                return {
                    "success": False,
                    "message": "Face recognition not available",
                    "data": None
                }
            
            # Decode image
            image_array = FaceRecognitionService.decode_base64_image(base64_image)
            if image_array is None:
                return {
                    "success": False,
                    "message": "Failed to decode image",
                    "data": None
                }
            
            # Generate face encoding from captured image
            encoding, error = FaceRecognitionService.generate_face_encoding(image_array)
            if error:
                return {
                    "success": False,
                    "message": error,
                    "data": None
                }
            
            # Load registered face encodings
            known_encodings, employee_ids, names = FaceRecognitionService.load_face_encodings()
            
            if not known_encodings:
                return {
                    "success": False,
                    "message": "No registered faces found. Please register your face first",
                    "data": None
                }
            
            # Convert list encodings to numpy arrays for face_recognition library
            known_encodings_array = [np.array(enc) for enc in known_encodings]
            encoding_array = np.array(encoding)
            
            # Compare with known faces
            matches = face_recognition.compare_faces(
                known_encodings_array, 
                encoding_array, 
                tolerance=FaceRecognitionService.FACE_MATCH_TOLERANCE
            )
            face_distances = face_recognition.face_distance(known_encodings_array, encoding_array)
            
            # Find best match
            best_match_index = None
            best_distance = 1.0
            
            for i, match in enumerate(matches):
                if match and face_distances[i] < best_distance:
                    best_match_index = i
                    best_distance = face_distances[i]
            
            if best_match_index is not None:
                # Calculate confidence (0-100%)
                confidence = round((1 - best_distance) * 100, 2)
                
                employee_id = employee_ids[best_match_index]
                employee_name = names[best_match_index]
                
                return {
                    "success": True,
                    "message": "Face recognized successfully",
                    "data": {
                        "employee_id": employee_id,
                        "employee_name": employee_name,
                        "confidence": confidence
                    }
                }
            else:
                return {
                    "success": False,
                    "message": "Face not recognized. Please register your face first",
                    "data": None
                }
                
        except Exception as e:
            import traceback
            current_app.logger.error(f"Face recognition error: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return {
                "success": False,
                "message": f"Face recognition error: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def mark_attendance_with_face(base64_image, attendance_type='checkin'):
        """Mark attendance using face recognition"""
        try:
            # Recognize face
            recognition_result = FaceRecognitionService.recognize_face(base64_image)
            
            if not recognition_result["success"]:
                return recognition_result
            
            employee_id = recognition_result["data"]["employee_id"]
            employee_name = recognition_result["data"]["employee_name"]
            confidence = recognition_result["data"]["confidence"]
            
            # Check today's attendance status
            from datetime import date
            parameters = {
                'employee_id': employee_id,
                'attendance_date': date.today()
            }
            status_result = MultiTenantExecutor.execute_procedure('proc_get_today_attendance_status', parameters)
            
            status_code = 0  # Default: not checked in
            first_check_in = None
            last_check_out = None
            
            if status_result["success"] and status_result["data"]:
                status_data = status_result["data"][0]
                
                # Handle both dict and list responses from stored procedure
                if isinstance(status_data, list):
                    # List format: [employee_id, attendance_date, status_code, first_check_in, last_check_out, total_logs]
                    status_code = status_data[2] if len(status_data) > 2 else 0
                    first_check_in = status_data[3] if len(status_data) > 3 else None
                    last_check_out = status_data[4] if len(status_data) > 4 else None
                else:
                    # Dict format
                    status_code = status_data.get('status_code', 0)
                    first_check_in = status_data.get('first_check_in')
                    last_check_out = status_data.get('last_check_out')
            
            # Validate attendance type
            if attendance_type == 'checkin':
                if status_code >= 1:  # Already checked in
                    return {
                        "success": False,
                        "message": f"Already checked in today at {first_check_in.strftime('%I:%M %p') if first_check_in else 'earlier'}",
                        "data": None
                    }
            elif attendance_type == 'checkout':
                if status_code == 0:  # Not checked in yet
                    return {
                        "success": False,
                        "message": "Please check in first before checking out",
                        "data": None
                    }
                if status_code >= 2:  # Already checked out
                    return {
                        "success": False,
                        "message": f"Already checked out today at {last_check_out.strftime('%I:%M %p') if last_check_out else 'earlier'}",
                        "data": None
                    }
            
            # Mark attendance
            log_time = datetime.now()
            parameters = {
                'employee_id': employee_id,
                'log_time': log_time,
                'confidence': confidence,
                'image_path': None
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_mark_attendance_with_face', parameters)
            
            if result["success"] and result["data"]:
                proc_result = result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    # Update daily attendance record from raw logs for this specific employee
                    from datetime import date
                    daily_params = {
                        'employee_id': employee_id,
                        'attendance_date': date.today()
                    }
                    MultiTenantExecutor.execute_procedure('proc_update_daily_attendance', daily_params)
                    
                    return {
                        "success": True,
                        "message": f"{'Check-in' if attendance_type == 'checkin' else 'Check-out'} successful!",
                        "data": {
                            "employee_id": employee_id,
                            "employee_name": employee_name,
                            "confidence": confidence,
                            "log_time": log_time.strftime('%I:%M %p'),
                            "attendance_type": attendance_type
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to mark attendance"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to mark attendance in database",
                    "data": None
                }
                
        except Exception as e:
            import traceback
            current_app.logger.error(f"Mark attendance with face error: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return {
                "success": False,
                "message": f"Attendance marking error: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def check_face_registration_status(employee_id):
        """Check if employee has registered face"""
        try:
            parameters = {'employee_id': employee_id}
            result = MultiTenantExecutor.execute_procedure('proc_check_face_registration_status', parameters)
            
            if result["success"] and result["data"]:
                status_data = result["data"][0]
                return {
                    "success": True,
                    "message": "Face registration status retrieved",
                    "data": {
                        "is_registered": bool(status_data.get('is_registered', 0)),
                        "registered_at": status_data.get('registered_at')
                    }
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to check face registration status",
                    "data": None
                }
                
        except Exception as e:
            current_app.logger.error(f"Check face registration error: {str(e)}")
            return {
                "success": False,
                "message": "Face registration check error",
                "data": None
            }
