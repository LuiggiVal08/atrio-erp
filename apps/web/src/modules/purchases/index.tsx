import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useSidebarStore } from '@/core/store/sidebar-store';
import { PurchaseOrderListView } from './views/PurchaseOrderListView';
import { PurchaseOrderFormView } from './views/PurchaseOrderFormView';
import { PurchaseOrderDetailView } from './views/PurchaseOrderDetailView';
import { PurchaseReturnListView } from './views/PurchaseReturnListView';
import { PriceListListView } from './views/PriceListListView';

export function PurchasingModule() {
  const { setModules } = useSidebarStore();

  useEffect(() => {
    setModules([
      {
        id: 'purchasing',
        label: 'sidebar.purchasing.label',
        icon: ShoppingBag,
        route: '/purchasing',
        permissions: ['purchasing:read'],

      },
    ]);
  }, []);

  return (
    <Routes>
      <Route index element={<PurchaseOrderListView />} />
      <Route path="new" element={<PurchaseOrderFormView />} />
      <Route path="returns" element={<PurchaseReturnListView />} />
      <Route path="price-lists" element={<PriceListListView />} />
      <Route path=":id" element={<PurchaseOrderDetailView />} />
      <Route path="*" element={<Navigate to="/purchasing" replace />} />
    </Routes>
  );
}

export default PurchasingModule;
