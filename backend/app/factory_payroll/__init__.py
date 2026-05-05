"""
Factory Payroll Module
Handles daily wage payroll for factory workers
"""
from flask import Blueprint

factory_payroll_bp = Blueprint('factory_payroll', __name__, url_prefix='/factory-payroll')

from app.factory_payroll import routes
