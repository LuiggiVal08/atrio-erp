import { useEffect, type ReactNode } from 'react';
import { scannerEngine } from './scanner-engine';

export function ScannerProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  useEffect(() => {
    scannerEngine.updateConfig({ enabled });
    if (enabled) scannerEngine.start();
    else scannerEngine.stop();
    return () => scannerEngine.stop();
  }, [enabled]);
  return <>{children}</>;
}
