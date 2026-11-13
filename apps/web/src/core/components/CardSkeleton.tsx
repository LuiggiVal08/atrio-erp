import { Skeleton } from './Skeleton';

interface CardSkeletonProps {
  className?: string;
  lines?: number;
}

export function CardSkeleton({ className = '', lines = 3 }: CardSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 ${className}`}
    >
      <Skeleton variant="text" width="40%" height={10} />
      <Skeleton variant="rect" height={24} />
      {Array.from({ length: Math.max(0, lines - 2) }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i % 2 === 0 ? '80%' : '60%'} height={10} />
      ))}
    </div>
  );
}
