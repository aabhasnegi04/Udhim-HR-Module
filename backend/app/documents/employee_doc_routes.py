import os
import logging
from datetime import datetime
from flask import Blueprint, request, current_app, send_file, Response
from werkzeug.utils import secure_filename
from flask_jwt_extended import get_jwt_identity, get_jwt

from app.middleware.company_context import company_required
from app.middleware.multi_tenant_jwt import multi_tenant_jwt_required
from app.middleware.role_guard import hr_required
from app.database.multi_tenant_executor import MultiTenantExecutor
from app.utils.response import success_response, error_response, validation_error_response, not_found_response

employee_docs_bp = Blueprint('employee_docs', __name__)

# ── Config ────────────────────────────────────────────────────
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

MIME_TYPES = {
    'pdf':  'application/pdf',
    'jpg':  'image/jpeg',
    'jpeg': 'image/jpeg',
    'png':  'image/png',
    'doc':  'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_extension(filename):
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

def _docs_folder(claims) -> str:
    """Return the company-namespaced employee_documents folder for this request."""
    from app.utils.upload_path import get_upload_folder
    company_code = claims.get('company_code', 'default')
    return get_upload_folder(company_code, 'employee_documents')


# ── GET: list documents for an employee ──────────────────────
@employee_docs_bp.route('/employee-docs/<int:employee_id>', methods=['GET'])
@company_required
@hr_required
def get_employee_documents(employee_id):
    try:
        result = MultiTenantExecutor.execute_procedure(
            'proc_get_employee_documents', {'employee_id': employee_id}
        )
        if result['success']:
            return success_response(
                message='Documents retrieved successfully',
                data={'documents': result['data'] or []}
            )
        return error_response('Failed to retrieve documents', 500)
    except Exception as e:
        current_app.logger.error(f"Get employee documents error: {str(e)}")
        return error_response('Failed to retrieve documents', 500)


# ── POST: upload a document for an employee ──────────────────
@employee_docs_bp.route('/employee-docs/<int:employee_id>', methods=['POST'])
@company_required
@hr_required
def upload_employee_document(employee_id):
    try:
        file = request.files.get('file')
        document_type = request.form.get('document_type', '').strip()
        document_name = request.form.get('document_name', '').strip()

        if not file:
            return validation_error_response('File is required')
        if not document_type:
            return validation_error_response('Document type is required')
        if not document_name:
            document_name = document_type  # fallback

        if file.filename == '':
            return validation_error_response('No file selected')
        if not allowed_file(file.filename):
            return validation_error_response('Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX')

        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        if file_size > MAX_FILE_SIZE:
            return validation_error_response('File too large. Maximum 10MB allowed')

        ext = get_extension(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_type = secure_filename(document_type.replace(' ', '_'))
        file_name = f"emp_{employee_id}_{safe_type}_{timestamp}.{ext}"
        claims = get_jwt()
        docs_folder = _docs_folder(claims)
        full_path = os.path.join(docs_folder, file_name)
        file.save(full_path)

        uploaded_by = claims.get('user_id')

        result = MultiTenantExecutor.execute_procedure('proc_upload_employee_document', {
            'employee_id':   employee_id,
            'document_type': document_type,
            'document_name': document_name,
            'file_name':     file_name,
            'file_path':     file_name,   # store relative name; folder resolved at serve time
            'file_size':     file_size,
            'file_type':     ext,
            'uploaded_by':   uploaded_by,
        })

        if result['success'] and result['data']:
            row = result['data'][0]
            if row.get('success') == 1:
                # Notify the employee
                try:
                    from app.notifications.service import NotificationService
                    emp_r = MultiTenantExecutor.execute_procedure('proc_get_employee_user_id', {'employee_id': employee_id})
                    emp_rows = emp_r.get('data', [])
                    if emp_rows and isinstance(emp_rows[0], list): emp_rows = emp_rows[0]
                    if emp_rows and emp_rows[0].get('user_id'):
                        NotificationService.create(
                            user_id=emp_rows[0]['user_id'],
                            title='Document Uploaded',
                            message=f'A new document "{document_name}" ({document_type}) has been added to your profile.',
                            module='DOCUMENTS',
                            reference_id=row.get('document_id')
                        )
                except Exception as e:
                    current_app.logger.warning(f"Failed to send notification: {str(e)}")
                return success_response(
                    message='Document uploaded successfully',
                    data={'document_id': row.get('document_id')}
                )
            return error_response(row.get('message', 'Upload failed'), 400)

        # DB insert failed — remove the saved file
        if os.path.exists(full_path):
            os.remove(full_path)
        return error_response('Failed to save document record', 500)

    except Exception as e:
        current_app.logger.error(f"Upload employee document error: {str(e)}")
        return error_response('Failed to upload document', 500)


# ── GET: serve / download a document file ────────────────────
@employee_docs_bp.route('/employee-docs/file/<int:document_id>', methods=['GET'])
@company_required
@hr_required
def serve_employee_document(document_id):
    try:
        result = MultiTenantExecutor.execute_procedure(
            'proc_get_employee_document_by_id', {'document_id': document_id}
        )
        if not result['success'] or not result['data']:
            return not_found_response('Document not found')

        doc = result['data'][0]
        file_name = doc.get('file_name') or doc.get('file_path')
        claims = get_jwt()
        full_path = os.path.join(_docs_folder(claims), file_name)

        if not os.path.exists(full_path):
            return not_found_response('File not found on server')

        ext = get_extension(file_name)
        mime = MIME_TYPES.get(ext, 'application/octet-stream')

        # inline for images/pdf, attachment (download) for doc/docx
        disposition = 'inline' if ext in ('pdf', 'jpg', 'jpeg', 'png') else 'attachment'

        return send_file(
            full_path,
            mimetype=mime,
            as_attachment=(disposition == 'attachment'),
            download_name=doc.get('document_name', file_name)
        )

    except Exception as e:
        current_app.logger.error(f"Serve document error: {str(e)}")
        return error_response('Failed to retrieve file', 500)


# ── DELETE: soft-delete a document ───────────────────────────
@employee_docs_bp.route('/employee-docs/<int:document_id>', methods=['DELETE'])
@company_required
@hr_required
def delete_employee_document(document_id):
    try:
        claims = get_jwt()
        deleted_by = claims.get('user_id')

        result = MultiTenantExecutor.execute_procedure(
            'proc_delete_employee_document',
            {'document_id': document_id, 'deleted_by': deleted_by}
        )

        if result['success'] and result['data']:
            row = result['data'][0]
            if row.get('success') == 1:
                # Remove physical file
                file_path = row.get('file_path')
                if file_path:
                    claims = get_jwt()
                    full_path = os.path.join(_docs_folder(claims), file_path)
                    if os.path.exists(full_path):
                        os.remove(full_path)
                return success_response(message='Document deleted successfully')
            return error_response(row.get('message', 'Delete failed'), 400)

        return error_response('Failed to delete document', 500)

    except Exception as e:
        current_app.logger.error(f"Delete document error: {str(e)}")
        return error_response('Failed to delete document', 500)
