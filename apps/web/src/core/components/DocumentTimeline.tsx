import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { DocumentStatus } from './DocumentStateBadge';

export interface TimelineEntry {
  fromStatus: DocumentStatus | null;
  toStatus: DocumentStatus;
  timestamp: string;
  userId: string;
  userName: string;
  reason?: string;
}

interface DocumentTimelineProps {
  entries: TimelineEntry[];
  defaultOpen?: boolean;
}

const statusLabels: Record<DocumentStatus, string> = {
  draft: 'document.status.draft',
  approved: 'document.status.approved',
  paid: 'document.status.paid',
  cancelled: 'document.status.cancelled',
  received: 'document.status.received',
  partial: 'document.status.partial',
};

export function DocumentTimeline({ entries, defaultOpen = false }: DocumentTimelineProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-surface">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-medium text-text-secondary hover:text-text-primary"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Clock size={14} />
        <span>{t('document.timeline.title')}</span>
        <span className="ml-auto text-[11px] text-text-secondary">{entries.length} events</span>
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3">
          {entries.length === 0 ? (
            <p className="text-xs text-text-secondary">{t('document.timeline.empty')}</p>
          ) : (
            <div className="relative space-y-0">
              {entries.map((entry, i) => (
                <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="z-10 h-2.5 w-2.5 rounded-full border-2 border-accent bg-surface" />
                    {i < entries.length - 1 && (
                      <div className="mt-1 h-full w-px bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pt-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-text-primary">{entry.userName}</span>
                      <span className="text-text-secondary">
                        {entry.fromStatus && t(statusLabels[entry.fromStatus])}
                        {entry.fromStatus && ' → '}
                        {t(statusLabels[entry.toStatus])}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-text-secondary">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                    {entry.reason && (
                      <p className="mt-1 text-[11px] italic text-text-secondary">{entry.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
