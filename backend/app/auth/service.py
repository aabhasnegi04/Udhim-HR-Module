import bcrypt
from flask import current_app
from flask_jwt_extended import create_access_token
from app.database.executor import StoredProcedureExecutor


class AuthService:
    """Authentication service layer"""
    
    @staticmethod
    def hash_password(password):
        """Hash password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def verify_password(password, hashed_password):
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    @staticmethod
    def authenticate_user(email, password, role=None):
        """
        Authenticate user via stored procedure
        
        Args:
            email (str): User email
            password (str): Plain text password
            role (str): Optional role filter (not used in new schema)
            
        Returns:
            dict: Authentication result
        """
        try:
            # Get user data using stored procedure
            parameters = {'email': email}
            result = StoredProcedureExecutor.execute_procedure('proc_authenticate_user', parameters)
            
            if not result["success"] or not result["data"]:
                return {
                    "success": False,
                    "message": "Invalid credentials",
                    "data": None
                }
            
            user_data = result["data"][0]
            user_id = user_data.get('user_id')
            user_email = user_data.get('email')
            stored_hash = user_data.get('password_hash')
            user_is_active = user_data.get('user_is_active', 1)
            role_code = user_data.get('role_code')
            role_name = user_data.get('role_name')
            employee_id = user_data.get('employee_id')
            employee_status = user_data.get('employee_status', 'ACTIVE')
            
            # Check if password is still the default (not hashed with bcrypt)
            if stored_hash and not stored_hash.startswith('$2b$'):
                # This is a plain text default password - compare directly
                if password != stored_hash:
                    return {
                        "success": False,
                        "message": "Invalid credentials",
                        "data": None
                    }
                # DON'T upgrade the password hash here - let user change it manually
                # This way their "current password" remains the plain text they know
            else:
                # Verify password using bcrypt
                if not AuthService.verify_password(password, stored_hash):
                    return {
                        "success": False,
                        "message": "Invalid credentials",
                        "data": None
                    }
            
            # Check if password change is required
            password_check_params = {'user_id': user_id}
            password_check_result = StoredProcedureExecutor.execute_procedure('proc_check_password_change_required', password_check_params)
            
            requires_password_change = False
            if password_check_result["success"] and password_check_result["data"]:
                password_data = password_check_result["data"][0]
                requires_password_change = bool(password_data.get('requires_password_change', 0))
            
            # Get profile switching information
            profile_info = AuthService.get_profile_switching_info(user_id)
            
            # Generate JWT token
            additional_claims = {
                "role": role_code,
                "email": user_email,
                "employee_id": employee_id,
                "user_is_active": user_is_active,
                "employee_status": employee_status,
                "requires_password_change": requires_password_change
            }
            
            access_token = create_access_token(
                identity=str(user_id),
                additional_claims=additional_claims
            )
            
            return {
                "success": True,
                "message": "Login successful",
                "data": {
                    "access_token": access_token,
                    "requires_password_change": requires_password_change,
                    "user": {
                        "user_id": user_id,
                        "email": user_email,
                        "role": role_code,
                        "role_name": role_name,
                        "employee_id": employee_id,
                        "user_is_active": user_is_active,
                        "employee_status": employee_status
                    },
                    "profile_switching": profile_info
                }
            }
            
        except Exception as e:
            current_app.logger.error(f"Authentication error: {str(e)}")
            return {
                "success": False,
                "message": "Authentication service error",
                "data": None
            }
    
    @staticmethod
    def get_user_by_id(user_id):
        """
        Get user details by ID via stored procedure
        
        Args:
            user_id (int): User ID
            
        Returns:
            dict: User data or None
        """
        try:
            parameters = {'user_id': user_id}
            result = StoredProcedureExecutor.execute_procedure('proc_get_user_by_id', parameters)
            
            if result["success"] and result["data"]:
                user_data = result["data"]
                if isinstance(user_data, list) and len(user_data) > 0:
                    return user_data[0]
            
            return None
            
        except Exception as e:
            current_app.logger.error(f"Get user error: {str(e)}")
            return None
    
    @staticmethod
    def change_password(user_id, current_password, new_password):
        """
        Change user password
        
        Args:
            user_id (int): User ID
            current_password (str): Current password
            new_password (str): New password
            
        Returns:
            dict: Change password result
        """
        try:
            # Get current user data to verify current password
            parameters = {'user_id': user_id}
            result = StoredProcedureExecutor.execute_procedure('proc_get_user_by_id', parameters)
            
            if not result["success"] or not result["data"]:
                return {
                    "success": False,
                    "message": "User not found",
                    "data": None
                }
            
            user_data = result["data"][0]
            stored_hash = user_data.get('password_hash')
            
            # Verify current password
            if stored_hash and not stored_hash.startswith('$2b$'):
                # Plain text password (default)
                if current_password != stored_hash:
                    return {
                        "success": False,
                        "message": "Current password is incorrect",
                        "data": None
                    }
            else:
                # Hashed password
                if not AuthService.verify_password(current_password, stored_hash):
                    return {
                        "success": False,
                        "message": "Current password is incorrect",
                        "data": None
                    }
            
            # Hash new password
            new_hash = AuthService.hash_password(new_password)
            
            # Update password in database
            update_params = {'user_id': user_id, 'new_password_hash': new_hash}
            update_result = StoredProcedureExecutor.execute_procedure('proc_change_user_password', update_params)
            
            if update_result["success"] and update_result["data"]:
                proc_result = update_result["data"][0]
                if isinstance(proc_result, dict) and proc_result.get("success") == 1:
                    return {
                        "success": True,
                        "message": "Password changed successfully",
                        "data": None
                    }
                else:
                    return {
                        "success": False,
                        "message": proc_result.get("message", "Failed to change password"),
                        "data": None
                    }
            else:
                return {
                    "success": False,
                    "message": "Failed to update password",
                    "data": None
                }
            
        except Exception as e:
            current_app.logger.error(f"Change password error: {str(e)}")
            return {
                "success": False,
                "message": "Password change service error",
                "data": None
            }
    
    @staticmethod
    def get_profile_switching_info(user_id):
        """
        Get profile switching information for user
        
        Args:
            user_id (int): User ID
            
        Returns:
            dict: Profile switching data
        """
        try:
            parameters = {'user_id': user_id}
            result = StoredProcedureExecutor.execute_procedure('proc_get_user_profile_switching_info', parameters)
            
            if result["success"] and result["data"]:
                profile_data = result["data"][0]
                available_views = profile_data.get('available_views', 'EMPLOYEE').split(',')
                
                return {
                    "full_name": profile_data.get('full_name', ''),
                    "employee_code": profile_data.get('employee_code', ''),
                    "department": profile_data.get('department', ''),
                    "designation": profile_data.get('designation', ''),
                    "available_views": available_views,
                    "default_view": profile_data.get('default_view', 'EMPLOYEE'),
                    "can_switch": len(available_views) > 1
                }
            
            return {
                "available_views": ["EMPLOYEE"],
                "default_view": "EMPLOYEE", 
                "can_switch": False
            }
            
        except Exception as e:
            current_app.logger.error(f"Profile switching info error: {str(e)}")
            return {
                "available_views": ["EMPLOYEE"],
                "default_view": "EMPLOYEE",
                "can_switch": False
            }