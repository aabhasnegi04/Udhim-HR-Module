"""
Multi-Tenant Authentication Service
Handles authentication with company context
"""

import bcrypt
from flask import current_app, g
from flask_jwt_extended import create_access_token
from app.database.multi_tenant_executor import MultiTenantExecutor


class MultiTenantAuthService:
    """Multi-tenant authentication service"""
    
    @staticmethod
    def hash_password(password):
        """Hash password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def verify_password(password, hashed_password):
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    @staticmethod
    def authenticate_user(email, password, company_code):
        """
        Authenticate user for a specific company
        
        Args:
            email: User email
            password: Plain text password
            company_code: Company identifier
            
        Returns:
            dict: Authentication result with JWT token
        """
        try:
            # Note: company_code should already be set in g by company_required middleware
            # Get user data using stored procedure
            parameters = {'email': email}
            result = MultiTenantExecutor.execute_procedure('proc_authenticate_user', parameters)
            
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
            
            current_app.logger.info(f"Login attempt for {email}, stored_hash starts with: {stored_hash[:20] if stored_hash else 'None'}")
            
            # Check if password is plain text (default password)
            if stored_hash and not stored_hash.startswith('$2b$'):
                # Plain text password - compare directly
                current_app.logger.info(f"Plain text password comparison")
                if password != stored_hash:
                    return {
                        "success": False,
                        "message": "Invalid credentials",
                        "data": None
                    }
            else:
                # Verify hashed password
                current_app.logger.info(f"Bcrypt password verification")
                if not MultiTenantAuthService.verify_password(password, stored_hash):
                    current_app.logger.error(f"Password verification failed for {email}")
                    return {
                        "success": False,
                        "message": "Invalid credentials",
                        "data": None
                    }
            
            # Check if password change is required
            password_check_params = {'user_id': user_id}
            password_check_result = MultiTenantExecutor.execute_procedure(
                'proc_check_password_change_required', 
                password_check_params
            )
            
            requires_password_change = False
            if password_check_result["success"] and password_check_result["data"]:
                password_data = password_check_result["data"][0]
                requires_password_change = bool(password_data.get('requires_password_change', 0))
            
            # Get profile switching information
            profile_info = MultiTenantAuthService.get_profile_switching_info(user_id)
            
            # Generate JWT token with company context
            additional_claims = {
                "role": role_code,
                "email": user_email,
                "employee_id": employee_id,
                "user_is_active": user_is_active,
                "employee_status": employee_status,
                "requires_password_change": requires_password_change,
                "company_code": company_code  # Include company in JWT
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
                        "employee_status": employee_status,
                        "company_code": company_code,
                        "company_name": getattr(g, 'company_name', None)
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
        """Get user details by ID"""
        try:
            parameters = {'user_id': user_id}
            result = MultiTenantExecutor.execute_procedure('proc_get_user_by_id', parameters)
            
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
        """Change user password"""
        try:
            # Get current user data
            parameters = {'user_id': user_id}
            result = MultiTenantExecutor.execute_procedure('proc_get_user_by_id', parameters)
            
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
                # Plain text password
                if current_password != stored_hash:
                    return {
                        "success": False,
                        "message": "Current password is incorrect",
                        "data": None
                    }
            else:
                # Hashed password
                if not MultiTenantAuthService.verify_password(current_password, stored_hash):
                    return {
                        "success": False,
                        "message": "Current password is incorrect",
                        "data": None
                    }
            
            # Hash new password
            new_hash = MultiTenantAuthService.hash_password(new_password)
            
            # Update password
            update_params = {'user_id': user_id, 'new_password_hash': new_hash}
            update_result = MultiTenantExecutor.execute_procedure('proc_change_user_password', update_params)
            
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
        """Get profile switching information"""
        try:
            parameters = {'user_id': user_id}
            result = MultiTenantExecutor.execute_procedure('proc_get_user_profile_switching_info', parameters)
            
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
