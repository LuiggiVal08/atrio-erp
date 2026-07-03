import { useEffect } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Package, Users, Building2, FileText, UserCog } from 'lucide-react';
import { useSidebarStore } from '@/core/store/sidebar-store';
import { InventoryListView } from './views/InventoryListView';
import { InventoryFormView } from './views/InventoryFormView';
import { WarehouseListView } from './views/WarehouseListView';
import { TransferListView } from './views/TransferListView';
import { ReorderPointListView } from './views/ReorderPointListView';
import { FichaTerceroView } from './views/FichaTerceroView';
import { FiscalConfigView } from './views/FiscalConfigView';
import { EmployeeListView } from './views/EmployeeListView';
import { EmployeeFormView } from './views/EmployeeFormView';
import { EmployeeDetailView } from './views/EmployeeDetailView';
import { DepartmentListView } from './views/DepartmentListView';
import { CurrencyRateListView } from './views/CurrencyRateListView';

export function InventoryModule() {
  const { setModules } = useSidebarStore();

  useEffect(() => {
    setModules([
      {
        id: 'inventory',
        label: 'sidebar.inventory.label',
        icon: Package,
        route: '/inventory',
        permissions: ['inventory:read'],
      },
      {
        id: 'clients',
        label: 'sidebar.clients.label',
        icon: Users,
        route: '/inventory/clients/tp-1',
        permissions: ['crm:read'],
      },
      {
        id: 'vendors',
        label: 'sidebar.vendors.label',
        icon: Building2,
        route: '/inventory/vendors/tp-2',
        permissions: ['crm:read'],
      },
      {
        id: 'localization',
        label: 'sidebar.localization.label',
        icon: FileText,
        route: '/inventory/fiscal',
        permissions: ['localization:read'],
      },
      {
        id: 'employees',
        label: 'sidebar.employees.label',
        icon: UserCog,
        route: '/inventory/employees',
        permissions: ['hr:read'],
      },
    ]);
  }, []);

  return (
    <Routes>
      <Route index element={<InventoryListView />} />
      <Route path="new" element={<InventoryFormView />} />
      <Route path=":id/edit" element={<InventoryFormView />} />
      <Route path="warehouses" element={<WarehouseListView />} />
      <Route path="transfers" element={<TransferListView />} />
      <Route path="reorder-points" element={<ReorderPointListView />} />
      <Route path="clients/:id" element={<FichaTerceroViewWrapper />} />
      <Route path="vendors/:id" element={<FichaTerceroViewWrapper />} />
      <Route path="fiscal" element={<FiscalConfigView />} />
      <Route path="employees" element={<EmployeeListView />} />
      <Route path="employees/new" element={<EmployeeFormView />} />
      <Route path="employees/:id" element={<EmployeeDetailView />} />
      <Route path="employees/:id/edit" element={<EmployeeFormView />} />
      <Route path="departments" element={<DepartmentListView />} />
      <Route path="currency-rates" element={<CurrencyRateListView />} />
      <Route path="*" element={<Navigate to="/inventory" replace />} />
    </Routes>
  );
}

function FichaTerceroViewWrapper() {
  const { id } = useParams<{ id: string }>();
  return <FichaTerceroView id={id ?? 'tp-1'} />;
}

export default InventoryModule;
