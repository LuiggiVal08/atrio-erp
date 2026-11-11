import { Routes, Route, Navigate, useParams } from 'react-router-dom';

export function PayrollModule() {
  return (
    <Routes>
      <Route index element={<Navigate to="/employees/process" replace />} />
      <Route path=":id" element={<LegacyPayrollPeriodRedirect />} />
      <Route path="*" element={<Navigate to="/employees/process" replace />} />
    </Routes>
  );
}

function LegacyPayrollPeriodRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/employees/process/${id}`} replace />;
}

export default PayrollModule;
