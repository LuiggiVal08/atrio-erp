import { Routes, Route } from 'react-router-dom';
import { TenantSettingsView } from './views/TenantSettingsView';

export function SettingsModule() {
  return (
    <Routes>
      <Route index element={<TenantSettingsView />} />
      <Route path="*" element={<TenantSettingsView />} />
    </Routes>
  );
}

export default SettingsModule;
