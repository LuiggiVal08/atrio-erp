import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ShoppingCart, Package, ShoppingBag, Wallet, Users, Building2, FileText, UserCog, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/core/auth/store';
import { useSidebarStore } from '@/core/store/sidebar-store';
import { Layout } from '@/core/components/Layout';
import { ModuleSkeleton } from '@/core/components/ModuleSkeleton';
import { ErrorBoundary } from '@/core/components/ErrorBoundary';
import { LoginView } from '@/core/auth/LoginView';

const InventoryModule = lazy(() => import('@/modules/inventory'));
const SalesModule = lazy(() => import('@/modules/sales'));
const PurchasingModule = lazy(() => import('@/modules/purchases'));
const CashModule = lazy(() => import('@/modules/cash'));
const ReportsModule = lazy(() => import('@/modules/reports'));

export function AppRoutes() {
  const { token, user } = useAuthStore();
  const { setModules } = useSidebarStore();

  useEffect(() => {
    if (!token) return;
    const enabled = (user?.enabledModules ?? []).filter(Boolean);
    const allModules = [
      { id: 'sales', label: 'sidebar.sales.label', icon: ShoppingCart, route: '/sales', permissions: ['sales:read'] },
      { id: 'inventory', label: 'sidebar.inventory.label', icon: Package, route: '/inventory', permissions: ['inventory:read'] },
      { id: 'purchasing', label: 'sidebar.purchasing.label', icon: ShoppingBag, route: '/purchasing', permissions: ['purchasing:read'] },
      { id: 'cash', label: 'sidebar.cash.label', icon: Wallet, route: '/cash', permissions: ['cash:read'] },
      { id: 'clients', label: 'sidebar.clients.label', icon: Users, route: '/inventory/clients/tp-1', permissions: ['crm:read'] },
      { id: 'vendors', label: 'sidebar.vendors.label', icon: Building2, route: '/inventory/vendors/tp-2', permissions: ['crm:read'] },
      { id: 'localization', label: 'sidebar.localization.label', icon: FileText, route: '/inventory/fiscal', permissions: ['localization:read'] },
      { id: 'employees', label: 'sidebar.employees.label', icon: UserCog, route: '/inventory/employees', permissions: ['hr:read'] },
      { id: 'reports', label: 'sidebar.reports.label', icon: BarChart3, route: '/reports/dashboard', permissions: ['reports:dashboard:view'] },
    ];
    const visible = enabled.length > 0 ? allModules.filter((m) => enabled.includes(m.id)) : allModules;
    setModules(visible);
  }, [token, user?.enabledModules]);

  if (!token) {
    return <LoginView />;
  }

  return (
    <Layout>
      <Suspense fallback={<ModuleSkeleton />}>
        <Routes>
          <Route path="/inventory/*" element={<ErrorBoundary moduleName="Inventory"><InventoryModule /></ErrorBoundary>} />
          <Route path="/sales/*" element={<ErrorBoundary moduleName="Sales"><SalesModule /></ErrorBoundary>} />
          <Route path="/purchasing/*" element={<ErrorBoundary moduleName="Purchasing"><PurchasingModule /></ErrorBoundary>} />
          <Route path="/cash/*" element={<ErrorBoundary moduleName="Cash"><CashModule /></ErrorBoundary>} />
          <Route path="/reports/*" element={<ErrorBoundary moduleName="Reports"><ReportsModule /></ErrorBoundary>} />
          <Route path="/" element={<Navigate to="/reports/dashboard" replace />} />
          <Route path="*" element={
            <div className="flex h-full items-center justify-center text-text-secondary">
              Module not available
            </div>
          } />
        </Routes>
      </Suspense>
    </Layout>
  );
}
