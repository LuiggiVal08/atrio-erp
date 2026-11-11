import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../store/pos-store';

export function PosHeader() {
  const session = usePosStore((s) => s.session);
  const customer = usePosStore((s) => s.customer);
  const navigate = useNavigate();
  const [online, setOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!session) return null;

  return (
    <div
      role="region"
      aria-label="Barra superior"
      className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Caja
          </span>
          <span className="text-sm font-semibold text-text-primary">
            {session.cashRegisterName}
          </span>
          <span className="text-xs text-text-secondary">{session.userName}</span>
        </div>
        <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
          Sesión abierta
        </span>
        {!online && (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
            Sin conexión
          </span>
        )}
        {session.trainingMode && (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
            ENTRENAMIENTO
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden text-xs text-text-muted lg:block">
          F2 buscar · F4 cliente · F8 cobrar · ? ayuda
        </span>
        <span className="text-sm text-text-secondary">
          {customer ? `${customer.name} (${customer.taxId})` : 'Consumidor Final'}
        </span>
        <span className="text-sm tabular-nums text-text-muted">
          {new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <button
          onClick={() => navigate('/cash')}
          className="rounded-lg border border-border-light px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover"
        >
          Arqueo y cierre
        </button>
      </div>
    </div>
  );
}
