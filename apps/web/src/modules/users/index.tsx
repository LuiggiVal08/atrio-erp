import { Routes, Route, Navigate } from 'react-router-dom';
import { UserListView } from './views/UserListView';
import { UserFormView } from './views/UserFormView';

export function UsersModule() {
  return (
    <Routes>
      <Route index element={<UserListView />} />
      <Route path="new" element={<UserFormView />} />
      <Route path=":id/edit" element={<UserFormView />} />
      <Route path="*" element={<Navigate to="/users" replace />} />
    </Routes>
  );
}

export default UsersModule;
