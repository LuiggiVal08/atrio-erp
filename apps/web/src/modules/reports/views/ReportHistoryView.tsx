import { useState } from 'react';
import { Download, Trash2, FileText, Loader2 } from 'lucide-react';
import { useHistory, useDownloadHistory, useDeleteHistory } from '../hooks/useReports';

const reportTypeLabels: Record<string, string> = {
  SALES: 'Ventas',
  INVENTORY: 'Inventario',
  CASH: 'Caja',
  CLIENTS: 'Clientes',
  TAXES: 'Impuestos',
  PROFIT: 'Utilidad',
};

const formatLabels: Record<string, string> = {
  PDF: 'PDF',
  XLSX: 'Excel',
  CSV: 'CSV',
};

export function ReportHistoryView() {
  const { data: history, isLoading } = useHistory();
  const downloadMutation = useDownloadHistory();
  const deleteMutation = useDeleteHistory();
  const [downloading, setDownloading] = useState<string | null>(null);

  async function handleDownload(id: string) {
    setDownloading(id);
    try {
      const { downloadUrl } = await downloadMutation.mutateAsync(id);
      const fullUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}${downloadUrl}`;
      const link = document.createElement('a');
      link.href = fullUrl;
      link.target = '_blank';
      link.click();
    } finally {
      setDownloading(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Historial de Reportes</h1>
        <p className="mt-0.5 text-sm text-text-secondary">
          Reportes generados recientemente (disponibles por 48h)
        </p>
      </div>

      {!history || history.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <FileText size={48} className="mx-auto text-text-muted" />
            <p className="mt-3 text-sm text-text-secondary">No hay reportes en el historial</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs font-medium text-text-secondary">
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Formato</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tamaño</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border/50 text-text-primary transition-colors hover:bg-surface-hover"
                >
                  <td className="px-4 py-3 font-medium">
                    {reportTypeLabels[entry.reportType] ?? entry.reportType}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      {formatLabels[entry.format] ?? entry.format}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(entry.createdAt).toLocaleDateString('es-VE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {entry.fileSize
                      ? entry.fileSize > 1024 * 1024
                        ? `${(entry.fileSize / (1024 * 1024)).toFixed(1)} MB`
                        : `${(entry.fileSize / 1024).toFixed(0)} KB`
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`state-badge`} data-state={entry.status.toLowerCase()}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(entry.id)}
                        disabled={downloading === entry.id}
                        className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-hover hover:text-accent disabled:opacity-50"
                        title="Descargar"
                      >
                        {downloading === entry.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Download size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(entry.id)}
                        className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-hover hover:text-error"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
