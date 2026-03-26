from flask import current_app
from app.database.multi_tenant_executor import MultiTenantExecutor


class NotificationService:

    @staticmethod
    def _rows(result):
        data = result.get('data', [])
        if data and isinstance(data[0], list):
            for rs in data:
                if rs:
                    return rs
            return []
        return data or []

    @staticmethod
    def create(user_id, title, message, module=None, reference_id=None):
        """Fire-and-forget — errors are logged but never bubble up."""
        try:
            params = {'user_id': user_id, 'title': title, 'message': message}
            if module:       params['module']       = module
            if reference_id: params['reference_id'] = reference_id
            MultiTenantExecutor.execute_procedure('proc_create_notification', params)
        except Exception as e:
            try:
                current_app.logger.error(f'create_notification error: {e}')
            except Exception:
                pass

    @staticmethod
    def get_notifications(user_id):
        try:
            result = MultiTenantExecutor.execute_procedure('proc_get_notifications', {'user_id': user_id})
            return {'success': True, 'data': NotificationService._rows(result)}
        except Exception as e:
            current_app.logger.error(f'get_notifications error: {e}')
            return {'success': False, 'data': [], 'message': str(e)}

    @staticmethod
    def get_unread_count(user_id):
        try:
            result = MultiTenantExecutor.execute_procedure('proc_get_unread_count', {'user_id': user_id})
            rows = NotificationService._rows(result)
            count = rows[0].get('unread_count', 0) if rows else 0
            return {'success': True, 'data': {'unread_count': int(count)}}
        except Exception as e:
            current_app.logger.error(f'get_unread_count error: {e}')
            return {'success': True, 'data': {'unread_count': 0}}

    @staticmethod
    def mark_read(notification_id):
        try:
            MultiTenantExecutor.execute_procedure('proc_mark_notification_read', {'notification_id': notification_id})
            return {'success': True}
        except Exception as e:
            current_app.logger.error(f'mark_read error: {e}')
            return {'success': False, 'message': str(e)}

    @staticmethod
    def mark_all_read(user_id):
        try:
            MultiTenantExecutor.execute_procedure('proc_mark_all_notifications_read', {'user_id': user_id})
            return {'success': True}
        except Exception as e:
            current_app.logger.error(f'mark_all_read error: {e}')
            return {'success': False, 'message': str(e)}
