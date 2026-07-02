import { DocumentTimeline } from '@/core/components/DocumentTimeline';
import type { DocumentStatus } from '@/core/components/DocumentStateBadge';

const purchaseFlow: DocumentStatus[] = ['draft', 'approved', 'received', 'paid', 'cancelled'];

interface PurchaseTimelineProps {
  status: DocumentStatus;
}

export function PurchaseTimeline({ status }: PurchaseTimelineProps) {
  const currentIdx = purchaseFlow.indexOf(status);

  const steps = purchaseFlow.map((s, i) => ({
    status: s,
    label: `purchasing.statusLabels.${s}`,
    completed: i <= currentIdx,
    active: i === currentIdx,
    timestamp: undefined as string | undefined,
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <div key={step.status} className="flex items-center gap-1">
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                step.active
                  ? 'bg-accent text-white'
                  : step.completed
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-gray-500/10 text-gray-500'
              }`}
            >
              {i + 1}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-6 ${
                  step.completed ? 'bg-emerald-500/40' : 'bg-gray-500/20'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <DocumentTimeline entries={[]} />
    </div>
  );
}
