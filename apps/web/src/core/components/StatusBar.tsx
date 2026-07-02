import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useEffect, useState } from 'react';

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

  return (
    <footer className="flex h-7 items-center justify-between border-t border-border-thin bg-surface px-3 text-[11px] shrink-0">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}
        />
        <span>{isOnline ? 'Conectado' : 'Sin conexión'}</span>
      </div>
      <div className="flex items-center gap-3 text-light-300">
        <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </footer>
  );
}
