import { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { ShoppingCart, ShoppingBag, Wallet, Users, Truck, FileText, UserCog, BarChart3, Shield, Package } from 'lucide-react';
import { useAuthStore } from '@/core/auth/store';
import { useSidebarStore } from '@/core/store/sidebar-store';
import { Layout } from '@/core/components/Layout';
import { ModuleSkeleton } from '@/core/components/ModuleSkeleton';
import { ErrorBoundary } from '@/core/components/ErrorBoundary';
import { LoginView } from '@/core/auth/LoginView';
import { ProfileView } from '@/core/auth/ProfileView';
import { LandingPage } from '@/landing/LandingPage';
import { lazyWithRetry } from '@/shared/lib/lazy-with-retry';
import { LegacyRouteRedirect } from './LegacyRouteRedirect';

const InventoryModule = lazyWithRetry(() => import('@/modules/inventory'));
const PurchasingModule = lazyWithRetry(() => import('@/modules/purchases'));
const CashModule = lazyWithRetry(() => import('@/modules/cash'));
const ReportsModule = lazyWithRetry(() => import('@/modules/reports'));
const SettingsModule = lazyWithRetry(() => import('@/modules/settings'));
const RbacModule = lazyWithRetry(() => import('@/modules/rbac'));
const UsersModule = lazyWithRetry(() => import('@/modules/users'));
const PosModule = lazyWithRetry(() => import('@/modules/pos'));
const ClientsModule = lazyWithRetry(() =>
  import('@/modules/client-vendor').then(({ ClientsModule: module }) => ({ default: module })),
);
const VendorsModule = lazyWithRetry(() =>
  import('@/modules/client-vendor').then(({ VendorsModule: module }) => ({ default: module })),
);
const LocalizationModule = lazyWithRetry(() => import('@/modules/localization'));
const HrModule = lazyWithRetry(() => import('@/modules/hr'));

function getModuleName(pathname: string) {
  if (pathname.startsWith('/pos') || pathname.startsWith('/sales')) return 'Ventas';
  if (pathname.startsWith('/employees') || pathname.startsWith('/payroll')) return 'Empleados';
  if (pathname.startsWith('/clients')) return 'Clientes';
  if (pathname.startsWith('/vendors')) return 'Proveedores';
  if (pathname.startsWith('/localization')) return 'Localización';
  if (pathname.startsWith('/inventory')) return 'Inventario';
  if (pathname.startsWith('/purchasing')) return 'Compras';
  if (pathname.startsWith('/cash')) return 'Caja';
  if (pathname.startsWith('/reports')) return 'Reportes';
  if (pathname.startsWith('/rbac')) return 'Permisos';
  if (pathname.startsWith('/users')) return 'Usuarios';
  if (pathname.startsWith('/settings')) return 'Configuración';
  if (pathname.startsWith('/profile')) return 'Perfil';
  return 'módulo';
}

export function AppRoutes() {
  const { token, user } = useAuthStore();
  const { setModules } = useSidebarStore();
  const location = useLocation();
  const moduleName = getModuleName(location.pathname);

  useEffect(() => {
    if (!token) return;
    const enabled = (user?.enabledModules ?? []).filter(Boolean);
    const allModules = [
      { id: 'pos', label: 'sidebar.sales.label', icon: ShoppingCart, route: '/pos', permissions: ['sales:read'] },
      { id: 'reports', label: 'sidebar.reports.label', icon: BarChart3, route: '/reports/dashboard', permissions: ['reports:dashboard:view'] },
      { id: 'purchasing', label: 'sidebar.purchasing.label', icon: ShoppingBag, route: '/purchasing', permissions: ['purchasing:read'] },
      { id: 'inventory', label: 'Inventario', icon: Package, route: '/inventory', permissions: [] },
      { id: 'cash', label: 'sidebar.cash.label', icon: Wallet, route: '/cash/registers', permissions: ['cash-payments:register:read'] },
      { id: 'clients', label: 'sidebar.clients.label', icon: Users, route: '/clients', permissions: ['crm:read'] },
      { id: 'vendors', label: 'sidebar.vendors.label', icon: Truck, route: '/vendors', permissions: ['crm:read'] },
      { id: 'localization', label: 'sidebar.localization.label', icon: FileText, route: '/localization', permissions: ['localization:read'] },
      { id: 'employees', label: 'sidebar.employees.label', icon: UserCog, route: '/employees', permissions: ['hr:read'] },
      { id: 'rbac', label: 'sidebar.rbac.label', icon: Shield, route: '/rbac', permissions: ['role:read'] },
      { id: 'users', label: 'sidebar.users.label', icon: Users, route: '/users', permissions: ['user:read'] },
    ];

    const enabledByModule: Record<string, string[]> = {
      pos: ['sales'],
      reports: ['reports'],
      purchasing: ['purchasing'],
      inventory: ['inventory'],
      cash: ['cash', 'cash-payments'],
      clients: ['clients', 'client-vendor'],
      vendors: ['vendors', 'client-vendor'],
      localization: ['localization'],
      employees: ['hr', 'employees'],
      rbac: ['rbac'],
      users: ['users'],
    };
    const filtered = enabled.length > 0
      ? allModules.filter((module) =>
          (enabledByModule[module.id] ?? [module.id]).some((flag) => enabled.includes(flag)),
        )
      : allModules;
    setModules(filtered);
  }, [token, user?.enabledModules, setModules]);

  if (!token) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/*" element={
        <Layout>
          <Suspense fallback={<ModuleSkeleton moduleName={moduleName} />}>
            <Routes>
              <Route
                path="/inventory/clients/*"
                element={<LegacyRouteRedirect from="/inventory/clients" to="/clients" />}
              />
              <Route
                path="/inventory/vendors/*"
                element={<LegacyRouteRedirect from="/inventory/vendors" to="/vendors" />}
              />
              <Route
                path="/inventory/fiscal/*"
                element={<LegacyRouteRedirect from="/inventory/fiscal" to="/localization/taxes" />}
              />
              <Route
                path="/inventory/currency-rates/*"
                element={<LegacyRouteRedirect from="/inventory/currency-rates" to="/localization/currency-rates" />}
              />
              <Route
                path="/inventory/employees/*"
                element={<LegacyRouteRedirect from="/inventory/employees" to="/employees" />}
              />
              <Route
                path="/inventory/departments/*"
                element={<LegacyRouteRedirect from="/inventory/departments" to="/employees/departments" />}
              />
              <Route
                path="/clients/*"
                element={
                  <ErrorBoundary moduleName="Clients">
                    <ClientsModule />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/vendors/*"
                element={
                  <ErrorBoundary moduleName="Vendors">
                    <VendorsModule />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/localization/*"
                element={
                  <ErrorBoundary moduleName="Localization">
                    <LocalizationModule />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/employees/*"
                element={
                  <ErrorBoundary moduleName="HR">
                    <HrModule />
                  </ErrorBoundary>
                }
              />
              <Route path="/inventory/*" element={<ErrorBoundary moduleName="Inventory"><InventoryModule /></ErrorBoundary>} />
              <Route
                path="/sales/*"
                element={<LegacyRouteRedirect from="/sales" to="/pos" />}
              />
              <Route path="/pos/*" element={<ErrorBoundary moduleName="Ventas"><PosModule /></ErrorBoundary>} />
              <Route path="/purchasing/*" element={<ErrorBoundary moduleName="Purchasing"><PurchasingModule /></ErrorBoundary>} />
              <Route path="/cash/*" element={<ErrorBoundary moduleName="Cash"><CashModule /></ErrorBoundary>} />
              <Route path="/reports/*" element={<ErrorBoundary moduleName="Reports"><ReportsModule /></ErrorBoundary>} />
              <Route path="/rbac/*" element={<ErrorBoundary moduleName="RBAC"><RbacModule /></ErrorBoundary>} />
              <Route path="/users/*" element={<ErrorBoundary moduleName="Users"><UsersModule /></ErrorBoundary>} />
              <Route path="/payroll/:id" element={<LegacyPayrollPeriodRedirect />} />
              <Route path="/payroll/*" element={<Navigate to="/employees/process" replace />} />
              <Route path="/settings/*" element={<ErrorBoundary moduleName="Settings"><SettingsModule /></ErrorBoundary>} />
              <Route path="/profile" element={<ProfileView />} />
              <Route path="/" element={<Navigate to="/reports/dashboard" replace />} />
              <Route path="*" element={
                <div className="flex h-full items-center justify-center text-text-secondary">
                  Module not available
                </div>
              } />
            </Routes>
          </Suspense>
        </Layout>
      } />
    </Routes>
  );
}

function LegacyPayrollPeriodRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/employees/process/${id}`} replace />;
}
