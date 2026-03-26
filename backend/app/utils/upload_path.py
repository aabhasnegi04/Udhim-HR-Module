"""
Upload path helper — resolves per-company upload folders.

Structure on disk:
    <BASE_UPLOAD_FOLDER>/
        <company_code>/
            employee_photos/
            employee_documents/

Usage:
    from app.utils.upload_path import get_upload_folder
    folder = get_upload_folder('udhim', 'employee_photos')
"""
import os

# Base folder from env — falls back to an 'uploads' dir next to this package
_BASE = os.environ.get(
    'BASE_UPLOAD_FOLDER',
    os.path.join(os.path.dirname(__file__), '..', '..', 'uploads')
)


def get_upload_folder(company_code: str, subfolder: str) -> str:
    """
    Return (and create if needed) the upload folder for a company + subfolder.

    Args:
        company_code: e.g. 'udhim'
        subfolder:    'employee_photos' | 'employee_documents'

    Returns:
        Absolute path string, directory is guaranteed to exist.
    """
    company_code = (company_code or 'default').lower().strip()
    path = os.path.join(_BASE, company_code, subfolder)
    os.makedirs(path, exist_ok=True)
    return path
