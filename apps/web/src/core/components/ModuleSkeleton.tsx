import { LoaderCircle } from 'lucide-react';

interface ModuleLoadingScreenProps {
  moduleName?: string;
}

export function ModuleSkeleton({ moduleName = 'módulo' }: ModuleLoadingScreenProps) {
  return (
    <div
      className="module-loading-enter flex h-full min-h-64 items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <LoaderCircle
          className="module-loading-spinner size-5 text-accent"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-text-primary">Cargando {moduleName}</p>
          <p className="mt-0.5 text-xs text-text-secondary">Preparando la pantalla</p>
        </div>
      </div>
    </div>
  );
}
