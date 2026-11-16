import { useTranslation } from '@/shared/hooks/useTranslation';
import { getReadErrorKind } from '@/core/lib/read-error';

interface ReadErrorAlertProps {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

export function ReadErrorAlert({ error, onRetry, retrying = false, className = '' }: ReadErrorAlertProps) {
  const { t } = useTranslation();
  const kind = getReadErrorKind(error);
  const message = kind === 'forbidden'
    ? t('common.readError.forbidden')
    : kind === 'notFound'
      ? t('common.readError.notFound')
      : kind === 'offline'
        ? t('common.readError.offline')
        : t('common.readError.unknown');

  return (
    <div role="alert" className={`grid gap-2 text-sm text-error ${className}`}>
      <p>{message}</p>
      {onRetry && kind !== 'forbidden' && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="w-fit text-xs font-semibold text-accent underline disabled:opacity-50"
        >
          {retrying ? t('common.loading') : t('common.retry')}
        </button>
      )}
    </div>
  );
}
