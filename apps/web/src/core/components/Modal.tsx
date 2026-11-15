import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  dismissible?: boolean;
}

export function Modal({ open, onClose, title, children, size = 'md', dismissible = true }: ModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    return () => { if (trigger?.isConnected) trigger.focus(); };
  }, [open]);
  useEffect(() => {
    if (open && !dismissible) dialogRef.current?.focus();
  }, [open, dismissible]);
  if (!open) return null;
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={dismissible ? onClose : undefined}>
      <div
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.defaultPrevented) return;
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            if (dismissible) onClose();
          }
          if (event.key !== 'Tab') return;
          const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
            'button, a[href], input, select, textarea, [tabindex]',
          )).filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden');
          const first = focusable[0];
          const last = focusable.at(-1);
          if (!first) {
            event.preventDefault();
            event.currentTarget.focus();
          } else if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative mx-4 w-full ${sizeClasses[size]} rounded-xl border border-border bg-overlay shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute left-0 top-0 h-1 w-full bg-accent" />
        <div className="max-h-[80vh] overflow-y-auto p-6 pt-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 id={titleId} className="font-brand text-base font-extrabold text-text-primary">{title}</h2>
            <button
              type="button"
              disabled={!dismissible}
              onClick={dismissible ? onClose : undefined}
              aria-label={t('common.close')}
              className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
