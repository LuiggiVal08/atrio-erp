import { Routes, Route, Navigate, Outlet, NavLink } from 'react-router-dom';
import { Wallet, Landmark, CreditCard, ClipboardCheck } from 'lucide-react';
import { CashAuditView } from './views/CashAuditView';
import { CashRegisterListView } from './views/CashRegisterListView';
import { PaymentMethodListView } from './views/PaymentMethodListView';
import { BankAccountListView } from './views/BankAccountListView';

export function CashModule() {
  return (
    <Routes>
      <Route element={<CashLayout />}>
        <Route index element={<CashAuditView />} />
        <Route path="registers" element={<CashRegisterListView />} />
        <Route path="payment-methods" element={<PaymentMethodListView />} />
        <Route path="bank-accounts" element={<BankAccountListView />} />
      </Route>
      <Route path="*" element={<Navigate to="/cash" replace />} />
    </Routes>
  );
}

function CashLayout() {
  const sections = [
    { to: '/cash', label: 'Arqueo', icon: ClipboardCheck, end: true },
    { to: '/cash/registers', label: 'Cajas', icon: Wallet, end: false },
    { to: '/cash/payment-methods', label: 'Métodos de pago', icon: CreditCard, end: false },
    { to: '/cash/bank-accounts', label: 'Cuentas bancarias', icon: Landmark, end: false },
  ];

  return (
    <div className="flex h-full flex-col">
      <nav className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-6 py-2" aria-label="Secciones de caja">
        {sections.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `inline-flex whitespace-nowrap items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
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

export default CashModule;
