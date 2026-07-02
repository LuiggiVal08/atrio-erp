import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useSidebarStore } from '@/core/store/sidebar-store';
import { POSTerminalView } from './views/POSTerminalView';

export function SalesModule() {
  const { setModules } = useSidebarStore();

  useEffect(() => {
    setModules([
      {
        id: 'sales',
        label: 'sidebar.sales.label',
        icon: ShoppingCart,
        route: '/sales',
        permissions: ['sales:read'],
      },
    ]);
  }, [setModules]);

  return (
    <Routes>
      <Route index element={<POSTerminalView />} />
      <Route path="*" element={<Navigate to="/sales" replace />} />
    </Routes>
  );
}

export default SalesModule;
