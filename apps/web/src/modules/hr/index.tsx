import { Navigate, Route, Routes } from 'react-router-dom';
import { DepartmentListView } from '@/modules/inventory/views/DepartmentListView';
import { EmployeeDetailView } from '@/modules/inventory/views/EmployeeDetailView';
import { EmployeeFormView } from '@/modules/inventory/views/EmployeeFormView';
import { EmployeeListView } from '@/modules/inventory/views/EmployeeListView';
import { EmployeeWorkspaceLayout } from '@/modules/inventory/views/EmployeeWorkspaceLayout';
import { PayrollConceptsView } from '@/modules/payroll/views/PayrollConceptsView';
import { PayrollDetailView } from '@/modules/payroll/views/PayrollDetailView';
import { PayrollListView } from '@/modules/payroll/views/PayrollListView';
import { PayrollLoansView } from '@/modules/payroll/views/PayrollLoansView';

export function HrModule() {
  return (
    <Routes>
      <Route element={<EmployeeWorkspaceLayout />}>
        <Route index element={<EmployeeListView />} />
        <Route path="new" element={<EmployeeFormView />} />
        <Route path=":id/edit" element={<EmployeeFormView />} />
        <Route path=":id" element={<EmployeeDetailView />} />
        <Route path="departments" element={<DepartmentListView />} />
        <Route path="concepts" element={<PayrollConceptsView />} />
        <Route path="process" element={<PayrollListView />} />
        <Route path="process/:id" element={<PayrollDetailView />} />
        <Route path="history" element={<PayrollListView mode="history" />} />
        <Route path="loans" element={<PayrollLoansView />} />
        <Route path="*" element={<Navigate to="/employees" replace />} />
      </Route>
    </Routes>
  );
}

export default HrModule;
