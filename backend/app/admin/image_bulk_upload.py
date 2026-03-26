"""
Bulk Employee Image Upload Service
Handles ZIP file upload with employee photos for face recognition
"""
import os
import zipfile
import tempfile
from flask import current_app
from PIL import Image
import face_recognition
import numpy as np
from app.database.multi_tenant_executor import MultiTenantExecutor


class BulkImageUpload:
    """Handle bulk employee image upload from ZIP files"""
    
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png'}
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB per image
    MIN_IMAGE_DIMENSION = 100  # Minimum width/height in pixels
    MAX_IMAGE_DIMENSION = 5000  # Maximum width/height in pixels
    
    @staticmethod
    def validate_and_process_zip(zip_path, company_code='default'):
        """
        Validate and process ZIP file containing employee images
        
        Returns:
            dict: {
                'success': bool,
                'total_images': int,
                'successful_images': int,
                'failed_images': int,
                'skipped_images': int,
                'errors': list,
                'message': str
            }
        """
        try:
            # Validate ZIP file
            if not zipfile.is_zipfile(zip_path):
                return {
                    'success': False,
                    'message': 'Invalid ZIP file format',
                    'total_images': 0,
                    'successful_images': 0,
                    'failed_images': 0,
                    'skipped_images': 0,
                    'errors': []
                }
            
            # Get valid employee codes from database
            valid_employees = BulkImageUpload._get_valid_employees()
            
            if not valid_employees:
                return {
                    'success': False,
                    'message': 'No active employees found in system',
                    'total_images': 0,
                    'successful_images': 0,
                    'failed_images': 0,
                    'skipped_images': 0,
                    'errors': []
                }
            
            total_images = 0
            successful_images = 0
            failed_images = 0
            skipped_images = 0
            errors = []
            processed_employees = set()  # Track to prevent duplicates
            
            # Extract and process ZIP
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # Create temp directory for extraction
                temp_dir = tempfile.mkdtemp()
                
                try:
                    # Get list of files in ZIP
                    file_list = zip_ref.namelist()
                    
                    # Filter out directories and hidden files
                    image_files = [
                        f for f in file_list 
                        if not f.endswith('/') 
                        and not os.path.basename(f).startswith('.')
                        and not os.path.basename(f).startswith('__MACOSX')
                    ]
                    
                    if not image_files:
                        return {
                            'success': False,
                            'message': 'No image files found in ZIP',
                            'total_images': 0,
                            'successful_images': 0,
                            'failed_images': 0,
                            'skipped_images': 0,
                            'errors': []
                        }
                    
                    total_images = len(image_files)
                    current_app.logger.info(f"Found {total_images} files in ZIP")
                    
                    # Process each image
                    for file_name in image_files:
                        try:
                            # Get just the filename without path
                            base_name = os.path.basename(file_name)
                            
                            # Extract employee code from filename (e.g., EMP001.jpg -> EMP001)
                            name_without_ext, ext = os.path.splitext(base_name)
                            employee_code = name_without_ext.strip().upper()
                            
                            current_app.logger.info(f"Processing: {base_name} -> Employee Code: {employee_code}")
                            
                            # Validate file extension
                            if ext.lower() not in BulkImageUpload.ALLOWED_EXTENSIONS:
                                failed_images += 1
                                errors.append({
                                    'file': base_name,
                                    'employee_code': employee_code,
                                    'error': f'Invalid file format. Only JPG, JPEG, PNG allowed (got: {ext})'
                                })
                                continue
                            
                            # Check if employee code exists
                            if employee_code not in valid_employees:
                                skipped_images += 1
                                errors.append({
                                    'file': base_name,
                                    'employee_code': employee_code,
                                    'error': 'Employee code not found in system'
                                })
                                continue
                            
                            # Check for duplicate
                            if employee_code in processed_employees:
                                skipped_images += 1
                                errors.append({
                                    'file': base_name,
                                    'employee_code': employee_code,
                                    'error': 'Duplicate image for this employee (already processed in this upload)'
                                })
                                continue
                            
                            # Extract file to temp directory
                            zip_ref.extract(file_name, temp_dir)
                            image_path = os.path.join(temp_dir, file_name)
                            
                            # Validate and process image
                            validation_result = BulkImageUpload._validate_and_process_image(
                                image_path, 
                                employee_code,
                                valid_employees[employee_code],
                                company_code
                            )
                            
                            if validation_result['success']:
                                successful_images += 1
                                processed_employees.add(employee_code)
                            else:
                                failed_images += 1
                                errors.append({
                                    'file': base_name,
                                    'employee_code': employee_code,
                                    'error': validation_result['error']
                                })
                            
                        except Exception as e:
                            failed_images += 1
                            errors.append({
                                'file': base_name if 'base_name' in locals() else file_name,
                                'employee_code': employee_code if 'employee_code' in locals() else 'Unknown',
                                'error': f'Processing error: {str(e)}'
                            })
                    
                finally:
                    # Clean up temp directory
                    import shutil
                    try:
                        shutil.rmtree(temp_dir)
                    except:
                        pass
            
            current_app.logger.info(
                f"Bulk image upload complete: {successful_images} succeeded, "
                f"{failed_images} failed, {skipped_images} skipped"
            )
            
            return {
                'success': True,
                'total_images': total_images,
                'successful_images': successful_images,
                'failed_images': failed_images,
                'skipped_images': skipped_images,
                'errors': errors,
                'message': f"Processed {total_images} images: {successful_images} successful, {failed_images} failed, {skipped_images} skipped"
            }
            
        except Exception as e:
            current_app.logger.error(f"Bulk image upload error: {str(e)}")
            return {
                'success': False,
                'message': f"Failed to process ZIP file: {str(e)}",
                'total_images': 0,
                'successful_images': 0,
                'failed_images': 0,
                'skipped_images': 0,
                'errors': []
            }
    
    @staticmethod
    def _get_valid_employees():
        """Get dictionary of valid employee codes and their IDs"""
        try:
            result = MultiTenantExecutor.execute_procedure('proc_get_active_employees_for_dropdown', {})
            
            if result.get("success") and result.get("data"):
                # Return dict: {employee_code: employee_id}
                return {
                    row['employee_code']: row['employee_id'] 
                    for row in result["data"]
                }
            
            return {}
        except Exception as e:
            current_app.logger.error(f"Error fetching employees: {str(e)}")
            return {}
    
    @staticmethod
    def _validate_and_process_image(image_path, employee_code, employee_id, company_code='default'):
        """Validate image and process face recognition"""
        try:
            # Check file size
            file_size = os.path.getsize(image_path)
            if file_size > BulkImageUpload.MAX_IMAGE_SIZE:
                return {
                    'success': False,
                    'error': f'Image too large ({file_size / 1024 / 1024:.1f}MB). Max size: 10MB'
                }
            
            if file_size == 0:
                return {
                    'success': False,
                    'error': 'Image file is empty'
                }
            
            # Open and validate image
            try:
                img = Image.open(image_path)
                img.verify()  # Verify it's a valid image
                img = Image.open(image_path)  # Reopen after verify
            except Exception as e:
                return {
                    'success': False,
                    'error': f'Invalid or corrupted image file: {str(e)}'
                }
            
            # Check image dimensions
            width, height = img.size
            if width < BulkImageUpload.MIN_IMAGE_DIMENSION or height < BulkImageUpload.MIN_IMAGE_DIMENSION:
                return {
                    'success': False,
                    'error': f'Image too small ({width}x{height}). Minimum: 100x100 pixels'
                }
            
            if width > BulkImageUpload.MAX_IMAGE_DIMENSION or height > BulkImageUpload.MAX_IMAGE_DIMENSION:
                return {
                    'success': False,
                    'error': f'Image too large ({width}x{height}). Maximum: 5000x5000 pixels'
                }
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Load image for face recognition
            image_array = face_recognition.load_image_file(image_path)
            
            # Detect faces
            face_locations = face_recognition.face_locations(image_array)
            
            if len(face_locations) == 0:
                return {
                    'success': False,
                    'error': 'No face detected in image. Please ensure face is clearly visible'
                }
            
            if len(face_locations) > 1:
                return {
                    'success': False,
                    'error': f'Multiple faces detected ({len(face_locations)}). Image must contain only one person'
                }
            
            # Generate face encoding
            face_encodings = face_recognition.face_encodings(image_array, face_locations)
            
            if len(face_encodings) == 0:
                return {
                    'success': False,
                    'error': 'Failed to generate face encoding. Please use a clearer image'
                }
            
            face_encoding = face_encodings[0]
            
            # Convert encoding to string for storage
            encoding_str = ','.join(map(str, face_encoding))
            
            # Save image to uploads folder
            from app.utils.upload_path import get_upload_folder
            upload_folder = get_upload_folder(company_code, 'employee_photos')
            
            # Generate filename
            filename = f'employee_{employee_id}.jpg'
            save_path = os.path.join(upload_folder, filename)
            
            # Save optimized image
            img_to_save = Image.open(image_path)
            if img_to_save.mode != 'RGB':
                img_to_save = img_to_save.convert('RGB')
            
            # Resize if too large (max 800px)
            if max(img_to_save.size) > 800:
                img_to_save.thumbnail((800, 800), Image.Resampling.LANCZOS)
            
            img_to_save.save(save_path, 'JPEG', quality=85, optimize=True)
            
            # Update database with file path and encoding
            parameters = {
                'employee_id': employee_id,
                'image_data': None,  # Not used anymore
                'face_encoding': encoding_str
            }
            
            result = MultiTenantExecutor.execute_procedure('proc_update_employee_face_image', parameters)
            
            if result.get("success"):
                return {'success': True}
            else:
                return {
                    'success': False,
                    'error': 'Failed to save image to database'
                }
            
        except Exception as e:
            current_app.logger.error(f"Image validation error for {employee_code}: {str(e)}")
            return {
                'success': False,
                'error': f'Image processing error: {str(e)}'
            }
