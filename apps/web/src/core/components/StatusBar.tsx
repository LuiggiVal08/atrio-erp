import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useEffect, useState } from 'react';
import { useCurrencyRates } from '@/modules/inventory/hooks/useCurrencyRates';
import { useTenantStore } from '@/core/tenant/store';
import { useTenant } from '@/modules/settings/hooks/useTenant';

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function StatusBar() {
  const isOnline = useOnlineStatus();
  const time = useClock();
  const tenantId = useTenantStore((state) => state.activeTenantId);
  const { data: tenant } = useTenant(tenantId);
  const settings = tenant?.settings;
  const foreignCurrency = typeof settings?.foreignCurrency === 'string'
    ? settings.foreignCurrency
    : 'USD';
  const baseCurrency = tenant?.baseCurrency === 'VED' ? 'VES' : (tenant?.baseCurrency || 'VES');
  const { data: rates = [], isLoading } = useCurrencyRates(foreignCurrency);
  const baseCurrencyCodes = baseCurrency === 'VES'
    ? new Set(['VES', 'VED'])
    : new Set([baseCurrency]);
  const matchingRates = rates.filter((item) =>
    item.fromCurrency === foreignCurrency && baseCurrencyCodes.has(item.toCurrency),
  );
  const latestRate = matchingRates.reduce<(typeof matchingRates)[number] | undefined>(
    (latest, current) => !latest || current.date > latest.date ? current : latest,
    undefined,
  );
  const formattedRate = latestRate
    ? latestRate.rate.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : null;

  return (
    <footer className="relative mx-1 mb-1 flex h-7 items-center justify-between rounded-2xl border border-white/10 bg-overlay/85 px-3 text-[11px] shrink-0 shadow-[0_8px_24px_rgba(0,0,0,0.16)] backdrop-blur-xl">
      <span className="absolute left-3 top-0 h-px w-16 rounded-full bg-accent/40" />
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-success' : 'bg-error'}`}
        />
        <span className="text-text-secondary">{isOnline ? 'Conectado' : 'Sin conexión'}</span>
      </div>
      {!isLoading && (
        <div className="absolute left-1/2 -translate-x-1/2 rounded-md px-2 text-center">
          <span className="font-semibold tabular-nums text-text-primary">
            {formattedRate
              ? `1 ${foreignCurrency} = ${formattedRate} ${baseCurrency}`
              : `Sin tasa ${foreignCurrency} registrada`}
          </span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-text-muted">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </footer>
  );
}
