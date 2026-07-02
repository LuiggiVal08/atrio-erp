import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useSidebarStore } from '@/core/store/sidebar-store';
import { CashAuditView } from './views/CashAuditView';

export function CashModule() {
  const { setModules } = useSidebarStore();

  useEffect(() => {
    setModules([
      {
        id: 'cash',
        label: 'sidebar.cash.label',
        icon: Wallet,
        route: '/cash',
        permissions: ['cash:read'],
      },
    ]);
  }, []);

  return (
    <Routes>
      <Route index element={<CashAuditView />} />
      <Route path="*" element={<Navigate to="/cash" replace />} />
    </Routes>
  );
}

export default CashModule;
