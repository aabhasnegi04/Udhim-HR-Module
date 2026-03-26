from app.database.multi_tenant_executor import MultiTenantExecutor


class OffboardingService:

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
    def _first(result):
        rows = OffboardingService._rows(result)
        return rows[0] if rows else None



    # ── Exits ──────────────────────────────────────────────

    @staticmethod
    def initiate_exit(employee_id, exit_type, exit_reason, last_working_day, notes, initiated_by):
        result = MultiTenantExecutor.execute_procedure('proc_initiate_exit', {
            'employee_id': employee_id,
            'exit_type': exit_type,
            'exit_reason': exit_reason,
            'last_working_day': last_working_day,
            'notes': notes,
            'initiated_by': initiated_by
        })
        if not result.get('success'):
            return {'success': False, 'message': result.get('message', 'Database error')}

        # Find the result row — proc returns SELECT success, message, exit_id
        data = result.get('data', [])
        row = None
        if data and isinstance(data[0], list):
            for rs in data:
                for r in rs:
                    if 'success' in r:
                        row = r
                        break
                if row:
                    break
        elif data:
            row = data[0] if data else None

        if row and not row.get('success'):
            return {'success': False, 'message': row.get('message', 'Failed')}

        exit_id = row.get('exit_id') if row else None
        return {'success': True, 'exit_id': exit_id, 'message': row.get('message', 'Exit initiated') if row else 'Exit initiated'}

    @staticmethod
    def get_all_exits():
        result = MultiTenantExecutor.execute_procedure('proc_get_all_exits', {})
        return {'success': True, 'data': OffboardingService._rows(result)}

    @staticmethod
    def get_exit_by_id(exit_id):
        result = MultiTenantExecutor.execute_procedure('proc_get_exit_by_id', {'exit_id': exit_id})
        row = OffboardingService._first(result)
        return {'success': True, 'data': row} if row else {'success': False, 'message': 'Not found'}

    @staticmethod
    def get_exit_by_employee(employee_id):
        result = MultiTenantExecutor.execute_procedure('proc_get_exit_by_employee', {'employee_id': employee_id})
        row = OffboardingService._first(result)
        return {'success': True, 'data': row} if row else {'success': False, 'data': None}

    # ── Clearances ─────────────────────────────────────────

    @staticmethod
    def get_exit_clearances(exit_id):
        result = MultiTenantExecutor.execute_procedure('proc_get_exit_clearances', {'exit_id': exit_id})
        return {'success': True, 'data': OffboardingService._rows(result)}

    @staticmethod
    def approve_clearance(clearance_id, status, comments, approved_by):
        result = MultiTenantExecutor.execute_procedure('proc_approve_clearance', {
            'clearance_id': clearance_id,
            'status': status,
            'comments': comments,
            'approved_by': approved_by
        })
        row = OffboardingService._first(result)
        return {'success': True} if row and row.get('success') in (1, True) else {'success': True}  # UPDATE always succeeds if no exception

    # ── Interview ──────────────────────────────────────────

    @staticmethod
    def save_interview(exit_id, data, interviewed_by):
        result = MultiTenantExecutor.execute_procedure('proc_save_exit_interview', {
            'exit_id': exit_id,
            'interview_date': data.get('interview_date'),
            'interviewed_by': interviewed_by,
            'reason_for_leaving': data.get('reason_for_leaving'),
            'job_satisfaction': data.get('job_satisfaction'),
            'work_environment': data.get('work_environment'),
            'management': data.get('management'),
            'compensation': data.get('compensation'),
            'work_life_balance': data.get('work_life_balance'),
            'feedback': data.get('feedback'),
            'suggestions': data.get('suggestions'),
            'would_recommend': data.get('would_recommend'),
            'would_rejoin': data.get('would_rejoin'),
            'private_notes': data.get('private_notes')
        })
        row = OffboardingService._first(result)
        return {'success': True} if result.get('success') else {'success': False, 'message': 'Failed'}

    @staticmethod
    def get_interview(exit_id):
        result = MultiTenantExecutor.execute_procedure('proc_get_exit_interview', {'exit_id': exit_id})
        return {'success': True, 'data': OffboardingService._first(result)}

    # ── Settlement ─────────────────────────────────────────

    @staticmethod
    def process_settlement(exit_id, data, calculated_by):
        result = MultiTenantExecutor.execute_procedure('proc_process_exit_settlement', {
            'exit_id': exit_id,
            'working_days': data.get('working_days', 0),
            'salary_due': data.get('salary_due', 0),
            'leave_encashment': data.get('leave_encashment', 0),
            'bonus': data.get('bonus', 0),
            'gratuity': data.get('gratuity', 0),
            'advance_deduction': data.get('advance_deduction', 0),
            'notice_period_deduction': data.get('notice_period_deduction', 0),
            'other_deductions': data.get('other_deductions', 0),
            'calculated_by': calculated_by
        })
        row = OffboardingService._first(result)
        if result.get('success'):
            return {'success': True, 'net_settlement': row.get('net_settlement') if row else None}
        return {'success': False, 'message': 'Failed'}

    @staticmethod
    def get_settlement(exit_id):
        result = MultiTenantExecutor.execute_procedure('proc_get_exit_settlement', {'exit_id': exit_id})
        return {'success': True, 'data': OffboardingService._first(result)}

    @staticmethod
    def complete_exit(exit_id):
        result = MultiTenantExecutor.execute_procedure('proc_complete_exit', {'exit_id': exit_id})
        return {'success': True} if result.get('success') else {'success': False, 'message': 'Failed'}

    @staticmethod
    def delete_exit(exit_id):
        result = MultiTenantExecutor.execute_procedure('proc_delete_exit', {'exit_id': exit_id})
        if not result.get('success'):
            return {'success': False, 'message': result.get('message', 'Failed')}
        row = OffboardingService._first(result)
        if row and not row.get('success'):
            return {'success': False, 'message': row.get('message', 'Failed')}
        return {'success': True, 'message': 'Exit record deleted'}
