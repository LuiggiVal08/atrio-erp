import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleListView } from './views/RoleListView';
import { RoleFormView } from './views/RoleFormView';

export function RbacModule() {
  return (
    <Routes>
      <Route index element={<RoleListView />} />
      <Route path="new" element={<RoleFormView />} />
      <Route path=":id/edit" element={<RoleFormView />} />
      <Route path="*" element={<Navigate to="/rbac" replace />} />
    </Routes>
  );
}

export default RbacModule;
