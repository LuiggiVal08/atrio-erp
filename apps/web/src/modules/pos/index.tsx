import { Route, Routes, Navigate, NavLink } from 'react-router-dom';
import { ShoppingCart, RotateCcw } from 'lucide-react';
import { PosShell } from './shell/PosShell';
import { SalesReturnListView } from '@/modules/sales/views/SalesReturnListView';

const sections = [
  { to: '/pos', label: 'Venta', icon: ShoppingCart, end: true },
  { to: '/pos/returns', label: 'Devoluciones', icon: RotateCcw, end: false },
];

export function PosModule() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <nav
        className="flex shrink-0 items-center gap-1 border-b border-border px-4 py-2"
        aria-label="Secciones de ventas"
      >
        {sections.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`
            }
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="min-h-0 flex-1 overflow-hidden">
        <Routes>
          <Route index element={<PosShell />} />
          <Route path="returns" element={<SalesReturnListView />} />
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default PosModule;
