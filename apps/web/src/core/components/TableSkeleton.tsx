import { Skeleton } from './Skeleton';
import { useTranslation } from '@/shared/hooks/useTranslation';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  rowHeight?: number;
  className?: string;
}

export function TableSkeleton({
  rows = 8,
  columns = 5,
  rowHeight = 48,
  className = '',
}: TableSkeletonProps) {
  const { t } = useTranslation();

  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{t('common.loading')}</span>
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="flex items-center gap-3 border-b border-border px-3"
          style={{ height: rowHeight }}
        >
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton key={col} variant="text" height={12} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
