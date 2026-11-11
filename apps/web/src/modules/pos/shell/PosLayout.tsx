import type { ReactNode } from 'react';

interface Props {
  searchPanel: ReactNode;
  cartPanel: ReactNode;
  customerPanel: ReactNode;
  totalsPanel: ReactNode;
  paymentBar: ReactNode;
}

export function PosLayout({ searchPanel, cartPanel, customerPanel, totalsPanel, paymentBar }: Props) {
  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
        <div className="flex w-2/5 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          {searchPanel}
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{cartPanel}</div>
          {totalsPanel}
        </div>
      </div>
      <div className="border-t border-border bg-surface">
        <div className="flex items-center justify-between gap-4 px-4 py-2">
          {customerPanel}
          <span className="hidden text-xs text-text-muted md:block">
            F2 buscar · F4 cliente · F8 cobrar · ? ayuda
          </span>
        </div>
        {paymentBar}
      </div>
    </div>
  );
}
