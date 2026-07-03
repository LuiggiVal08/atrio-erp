import { useTranslation } from '@/shared/hooks/useTranslation';
import { useState } from 'react';

export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'paid' | 'cancelled' | 'received' | 'partial';

export interface DocumentAction {
  type: 'approve' | 'pay' | 'cancel' | 'receive' | 'complete' | 'return' | 'edit' | 'delete';
  label: string;
  shortcut?: string;
  requiresConfirmation: boolean;
}

interface DocumentStateBadgeProps {
  status: DocumentStatus;
  allowedActions?: DocumentAction[];
  onAction?: (action: DocumentAction) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function DocumentStateBadge({ status, allowedActions, onAction, size: _size }: DocumentStateBadgeProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleAction = (action: DocumentAction) => {
    setOpen(false);
    onAction?.(action);
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={() => allowedActions && allowedActions.length > 0 && setOpen(!open)}
        data-state={status}
        className="state-badge inline-flex items-center gap-1.5 transition-colors hover:opacity-80"
      >
        <span>{t(`document.status.${status}`)}</span>
        {allowedActions && allowedActions.length > 0 && (
          <svg className="ml-0.5 h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {open && allowedActions && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-lg border border-border bg-surface py-1 shadow-lg">
            {allowedActions.map((action) => (
              <button
                key={action.type}
                onClick={() => handleAction(action)}
                className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              >
                <span>{action.label}</span>
                {action.shortcut && (
                  <kbd className="rounded border border-border px-1 font-mono text-[10px]">{action.shortcut}</kbd>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
