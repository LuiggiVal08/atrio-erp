import type { ReactNode } from 'react';
import { RotateCw } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';

interface ListPageProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  contentPadding?: boolean;
  onRefresh?: () => void | Promise<unknown>;
  refreshing?: boolean;
  pagination?: ReactNode;
}

export function ListPage({
  title,
  subtitle,
  actions,
  toolbar,
  children,
  contentClassName,
  contentPadding = true,
  onRefresh,
  refreshing = false,
  pagination,
}: ListPageProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-text-primary">{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>}
        </div>
        {(actions || onRefresh) && (
          <div className="flex flex-wrap items-center gap-3">
            {onRefresh && (
              <button
                type="button"
                onClick={() => void onRefresh()}
                disabled={refreshing}
                aria-label={t('common.refresh')}
                title={t('common.refresh')}
                className="rounded-lg border border-border p-1.5 text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCw
                  size={14}
                  aria-hidden="true"
                  className={refreshing ? 'animate-spin' : ''}
                />
              </button>
            )}
            {actions}
          </div>
        )}
      </div>
      {toolbar}
      <div
        className={`flex min-h-0 flex-1 flex-col ${contentPadding ? 'p-6' : ''} ${contentClassName ?? ''}`}
      >
        {children}
      </div>
      {pagination && <div className="shrink-0 border-t border-border px-6 py-2">{pagination}</div>}
    </div>
  );
}
