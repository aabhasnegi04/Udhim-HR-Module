from flask import Blueprint
from app.notifications.service import NotificationService
from app.middleware.multi_tenant_jwt import multi_tenant_jwt_required, get_current_user
from app.middleware.company_context import company_required
from app.utils.response import success_response, error_response

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def get_notifications():
    user = get_current_user()
    result = NotificationService.get_notifications(user['user_id'])
    return success_response(data=result['data'])


@notifications_bp.route('/unread-count', methods=['GET'])
@company_required
@multi_tenant_jwt_required
def unread_count():
    user = get_current_user()
    result = NotificationService.get_unread_count(user['user_id'])
    return success_response(data=result['data'])


@notifications_bp.route('/<int:notification_id>/read', methods=['POST'])
@company_required
@multi_tenant_jwt_required
def mark_read(notification_id):
    result = NotificationService.mark_read(notification_id)
    return success_response(message='Marked as read') if result['success'] else error_response('Failed', 400)


@notifications_bp.route('/read-all', methods=['POST'])
@company_required
@multi_tenant_jwt_required
def mark_all_read():
    user = get_current_user()
    NotificationService.mark_all_read(user['user_id'])
    return success_response(message='All marked as read')
