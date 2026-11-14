import { Skeleton } from './Skeleton';

interface ModuleLoadingScreenProps {
  moduleName?: string;
}

export function ModuleSkeleton({ moduleName = 'módulo' }: ModuleLoadingScreenProps) {
  return (
    <div
      className="module-loading-enter h-full p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Cargando {moduleName}</span>
      <span className="sr-only">Preparando la pantalla</span>
      <div aria-hidden="true" className="mx-auto max-w-6xl space-y-4">
        <Skeleton variant="text" width="10rem" height={20} />
        <div className="flex flex-wrap gap-3">
          <Skeleton variant="rect" width="14rem" height={32} />
          <Skeleton variant="rect" width="10rem" height={32} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <Skeleton variant="text" width="8rem" height={12} />
          <div className="mt-4 space-y-3.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton variant="text" className="flex-1" height={12} />
                <Skeleton variant="text" width="6rem" height={12} />
                <Skeleton variant="text" width="4rem" height={12} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
