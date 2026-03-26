import EmployeeDocuments from '../Documents/EmployeeDocuments';

const DocumentsTab = ({ employee }) => {
    if (!employee) return null;
    return (
        <EmployeeDocuments
            employeeId={employee.employee_id}
            employeeName={employee.name}
        />
    );
};

export default DocumentsTab;
