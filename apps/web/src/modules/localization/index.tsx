import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { CurrencyRateListView } from '@/modules/inventory/views/CurrencyRateListView';
import { FiscalConfigView } from '@/modules/inventory/views/FiscalConfigView';

export function LocalizationModule() {
  return (
    <Routes>
      <Route element={<LocalizationLayout />}>
        <Route index element={<Navigate to="taxes" replace />} />
        <Route path="taxes" element={<FiscalConfigView />} />
        <Route path="currency-rates" element={<CurrencyRateListView />} />
        <Route path="*" element={<Navigate to="/localization/taxes" replace />} />
      </Route>
    </Routes>
  );
}

function LocalizationLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav
        aria-label={t('localization.title')}
        className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-6 py-2"
      >
        <NavLink
          to="/localization/taxes"
          end
          className={({ isActive }) =>
            `inline-flex shrink-0 items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive ? 'bg-accent text-white' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`
          }
        >
          {t('localization.taxes')}
        </NavLink>
        <NavLink
          to="/localization/currency-rates"
          end
          className={({ isActive }) =>
            `inline-flex shrink-0 items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive ? 'bg-accent text-white' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`
          }
        >
          {t('localization.currencyRates')}
        </NavLink>
      </nav>
      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export default LocalizationModule;
