import { useTranslation } from '@/shared/hooks/useTranslation';

interface EmptyStateProps {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ message, actionLabel, onAction, icon }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
      {icon}
      <p className="text-xs text-text-secondary">{message || t('common.noResults')}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
