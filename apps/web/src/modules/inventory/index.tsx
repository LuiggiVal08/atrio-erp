import { Routes, Route, Navigate, Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { Package, Warehouse, Store, PackageSearch, ArrowRightLeft, BellRing, Tag, Tags } from 'lucide-react';
import { InventoryListView } from './views/InventoryListView';
import { WarehouseListView } from './views/WarehouseListView';
import { TransferListView } from './views/TransferListView';
import { ReorderPointListView } from './views/ReorderPointListView';
import { CategoryListView } from './views/CategoryListView';
import { ProductDetailView } from './views/ProductDetailView';
import { BranchListView } from './views/BranchListView';
import { StockMovementsView } from './views/StockMovementsView';
import { BrandListView } from './views/BrandListView';

export function InventoryModule() {
  return (
    <Routes>
      <Route element={<InventoryLayout />}>
        <Route index element={<Navigate to="stock" replace />} />
        <Route path="new" element={<Navigate to="products" replace />} />
        <Route path=":id/edit" element={<Navigate to="products" replace />} />
        <Route path="products" element={<InventoryListView />} />
        <Route path=":id" element={<ProductDetailView />} />
        <Route path="warehouses" element={<WarehouseListView />} />
        <Route path="branches" element={<BranchListView />} />
        <Route path="stock" element={<StockMovementsView />} />
        <Route path="categories" element={<CategoryListView />} />
        <Route path="brands" element={<BrandListView />} />
        <Route path="transfers" element={<TransferListView />} />
        <Route path="reorder-points" element={<ReorderPointListView />} />
      </Route>
      <Route path="*" element={<Navigate to="/inventory" replace />} />
    </Routes>
  );
}

function InventoryLayout() {
  const { t } = useTranslation();
  const sections = [
    { to: '/inventory/stock', label: t('inventory.nav.stock'), icon: PackageSearch },
    { to: '/inventory/transfers', label: t('inventory.nav.transfers'), icon: ArrowRightLeft },
    { to: '/inventory/reorder-points', label: t('inventory.nav.reorderPoints'), icon: BellRing },
    { to: '/inventory/warehouses', label: t('inventory.nav.warehouses'), icon: Warehouse },
    { to: '/inventory/branches', label: t('inventory.nav.branches'), icon: Store },
    { to: '/inventory/products', label: t('inventory.nav.products'), icon: Package },
    { to: '/inventory/brands', label: t('inventory.nav.brands'), icon: Tag },
    { to: '/inventory/categories', label: t('inventory.nav.categories'), icon: Tags },
  ];

  return (
    <div className="flex h-full flex-col">
      <nav className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-6 py-2" aria-label={t('inventory.nav.aria')}>
        {sections.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `inline-flex whitespace-nowrap items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-accent-alpha text-accent'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`
            }
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
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

export default InventoryModule;
