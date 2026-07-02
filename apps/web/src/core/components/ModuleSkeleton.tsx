export function ModuleSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="h-5 w-40 animate-pulse rounded bg-surface-hover" />
        <div className="flex items-center gap-3">
          <div className="h-7 w-32 animate-pulse rounded-lg bg-surface-hover" />
          <div className="h-7 w-24 animate-pulse rounded-lg bg-surface-hover" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-2">
            <div className="h-3 w-24 animate-pulse rounded bg-surface-hover" />
            <div className="h-3 flex-1 animate-pulse rounded bg-surface-hover" />
            <div className="h-3 w-20 animate-pulse rounded bg-surface-hover" />
            <div className="h-3 w-16 animate-pulse rounded bg-surface-hover" />
            <div className="h-3 w-24 animate-pulse rounded bg-surface-hover" />
          </div>
        ))}
      </div>
    </div>
  );
}
