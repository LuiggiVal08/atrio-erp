interface TaxDetail {
  id: string;
  taxType: string;
  baseImponible: number;
  percentage: number;
  amount: number;
  isWithholding: boolean;
}

interface FiscalDetailsProps {
  fiscalStatus?: string | null;
  fiscalNumber?: string | null;
  cufe?: string | null;
  qrUrl?: string | null;
  fiscalError?: string | null;
  taxDetails?: TaxDetail[];
}

export function FiscalDetails({ fiscalStatus, fiscalNumber, cufe, qrUrl, fiscalError, taxDetails }: FiscalDetailsProps) {
  if (!fiscalStatus) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <span className="text-xs text-text-secondary">Sin procesamiento fiscal</span>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    posted: 'Emitida',
    voided: 'Anulada',
  };

  const taxTypeLabels: Record<string, string> = {
    IVA_DEBIT: 'IVA Débito',
    RETE_IVA: 'Retención IVA',
    RETE_FUENTE: 'Retención Fuente',
    RETE_ICA: 'Retención ICA',
    IGTF: 'IGTF',
  };

  const totalWithholdings = (taxDetails ?? [])
    .filter((d) => d.isWithholding)
    .reduce((s, d) => s + d.amount, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="h-4 w-1 rounded-full bg-accent" />
        <h3 className="font-brand text-sm font-bold text-text-primary">Detalle Fiscal</h3>
      </div>

      <div className="space-y-2.5 px-4 py-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Estado fiscal:</span>
          <span className={`font-semibold ${fiscalStatus === 'posted' ? 'text-success' : fiscalStatus === 'pending' ? 'text-warning' : ''}`}>
            {statusLabels[fiscalStatus] ?? fiscalStatus}
          </span>
        </div>
        {fiscalNumber && (
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">N° Fiscal:</span>
            <span className="font-mono text-sm font-medium text-text-primary">{fiscalNumber}</span>
          </div>
        )}
        {cufe && (
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">CUFE:</span>
            <span className="max-w-[220px] truncate font-mono text-[10px] text-text-primary">{cufe}</span>
          </div>
        )}
        {qrUrl && (
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">QR:</span>
            <a href={qrUrl} target="_blank" rel="noopener noreferrer"
              className="text-accent hover:underline">
              Ver código QR
            </a>
          </div>
        )}
        {fiscalError && (
          <div className="rounded-md border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
            Error: {fiscalError}
          </div>
        )}
      </div>

      {taxDetails && taxDetails.length > 0 && (
        <>
          <div className="border-t border-border" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider">Impuesto</th>
                  <th className="px-4 py-2 text-right font-semibold uppercase tracking-wider">Base</th>
                  <th className="px-4 py-2 text-right font-semibold uppercase tracking-wider">%</th>
                  <th className="px-4 py-2 text-right font-semibold uppercase tracking-wider">Monto</th>
                </tr>
              </thead>
              <tbody>
                {taxDetails.filter((d) => !d.isWithholding).map((d) => (
                  <tr key={d.id} className="border-b border-border/50 text-text-primary transition-colors hover:bg-surface-hover">
                    <td className="px-4 py-2">{taxTypeLabels[d.taxType] ?? d.taxType}</td>
                    <td className="px-4 py-2 text-right font-mono text-text-secondary">{d.baseImponible.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-mono text-text-secondary">{d.percentage.toFixed(2)}%</td>
                    <td className="px-4 py-2 text-right font-mono font-medium">{d.amount.toFixed(2)}</td>
                  </tr>
                ))}
                {totalWithholdings > 0 && (
                  <>
                    <tr className="border-b border-border/50 bg-warning/5">
                      <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-warning">Retenciones</td>
                    </tr>
                    {taxDetails.filter((d) => d.isWithholding).map((d) => (
                      <tr key={d.id} className="border-b border-border/50 text-text-primary transition-colors hover:bg-surface-hover">
                        <td className="px-4 py-2 text-warning">{taxTypeLabels[d.taxType] ?? d.taxType}</td>
                        <td className="px-4 py-2 text-right font-mono text-text-secondary">{d.baseImponible.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-mono text-text-secondary">{d.percentage.toFixed(2)}%</td>
                        <td className="px-4 py-2 text-right font-mono font-medium text-warning">-{d.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
