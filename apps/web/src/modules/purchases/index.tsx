import { Routes, Route, Navigate, Outlet, NavLink } from 'react-router-dom';
import { ShoppingBag, RotateCcw, Tags, BarChart3 } from 'lucide-react';
import { PurchaseOrderListView } from './views/PurchaseOrderListView';
import { PurchaseOrderFormView } from './views/PurchaseOrderFormView';
import { PurchaseOrderDetailView } from './views/PurchaseOrderDetailView';
import { PurchaseReturnListView } from './views/PurchaseReturnListView';
import { PriceListListView } from './views/PriceListListView';
import { PurchasingMetricsView } from './views/PurchasingMetricsView';

export function PurchasingModule() {
  return (
    <Routes>
      <Route element={<PurchasingLayout />}>
        <Route index element={<PurchaseOrderListView />} />
        <Route path="new" element={<PurchaseOrderFormView />} />
        <Route path="returns" element={<PurchaseReturnListView />} />
        <Route path="price-lists" element={<PriceListListView />} />
        <Route path="metrics" element={<PurchasingMetricsView />} />
        <Route path="orders/:id" element={<PurchaseOrderDetailView />} />
        <Route path=":id" element={<PurchaseOrderDetailView />} />
      </Route>
      <Route path="*" element={<Navigate to="/purchasing" replace />} />
    </Routes>
  );
}

function PurchasingLayout() {
  const sections = [
    { to: '/purchasing', label: 'Órdenes', icon: ShoppingBag, end: true },
    { to: '/purchasing/returns', label: 'Devoluciones', icon: RotateCcw },
    { to: '/purchasing/price-lists', label: 'Listas de precios', icon: Tags },
    { to: '/purchasing/metrics', label: 'Métricas', icon: BarChart3 },
  ];

  return (
    <div className="flex h-full flex-col">
      <nav className="flex shrink-0 items-center gap-1 border-b border-border px-6 py-2" aria-label="Secciones de compras">
        {sections.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive ? 'bg-accent text-white' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`
            }
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export default PurchasingModule;
