import { useState } from 'react';
import { Plus, Play, Pencil, Trash2, FileText } from 'lucide-react';
import { useDefinitions, useCreateDefinition, useUpdateDefinition, useDeleteDefinition, useExecuteDefinition } from '../hooks/useReports';
import type { ReportDefinition } from '../hooks/useReports';

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

const freqLabels: Record<string, string> = {
  '0 8 * * 1': 'Semanal (Lun 8am)',
  '0 8 1 * *': 'Mensual (Día 1, 8am)',
  '0 7 * * *': 'Diario (7am)',
};

interface FormState {
  name: string;
  type: string;
  format: string;
  schedule: string;
  recipients: string;
}

const emptyForm: FormState = {
  name: '',
  type: 'SALES',
  format: 'PDF',
  schedule: '',
  recipients: '',
};

const presetSchedules = [
  { label: 'Sin programación', value: '' },
  { label: 'Diario (7am)', value: '0 7 * * *' },
  { label: 'Semanal (Lun 8am)', value: '0 8 * * 1' },
  { label: 'Mensual (Día 1, 8am)', value: '0 8 1 * *' },
];

export function ReportDefinitionsView() {
  const { data: definitions, isLoading } = useDefinitions();
  const createMutation = useCreateDefinition();
  const updateMutation = useUpdateDefinition();
  const deleteMutation = useDeleteDefinition();
  const executeMutation = useExecuteDefinition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(def: ReportDefinition) {
    setForm({
      name: def.name,
      type: def.type,
      format: def.format,
      schedule: def.schedule ?? '',
      recipients: (def.recipients ?? []).join(', '),
    });
    setEditingId(def.id);
    setShowForm(true);
  }

  async function handleSubmit() {
    const payload = {
      name: form.name,
      type: form.type,
      format: form.format || undefined,
      schedule: form.schedule || undefined,
      recipients: form.recipients
        ? form.recipients.split(',').map((r) => r.trim()).filter(Boolean)
        : undefined,
    };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    resetForm();
  }

  async function handleExecute(id: string) {
    await executeMutation.mutateAsync(id);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Reportes Programados</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            Define reportes que se generan automáticamente
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Plus size={16} />
          Nueva Definición
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            {editingId ? 'Editar Definición' : 'Nueva Definición'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-text-secondary">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
                placeholder="Ej: Reporte Semanal de Ventas"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary"
              >
                {Object.entries(reportTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Formato</label>
              <select
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary"
              >
                {Object.entries(formatLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Frecuencia</label>
              <select
                value={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary"
              >
                {presetSchedules.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Destinatarios (email, separados por coma)
              </label>
              <input
                type="text"
                value={form.recipients}
                onChange={(e) => setForm({ ...form, recipients: e.target.value })}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
                placeholder="admin@ejemplo.com, gerente@ejemplo.com"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={resetForm}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.name || createMutation.isPending || updateMutation.isPending}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {editingId ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      {!definitions || definitions.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <FileText size={48} className="mx-auto text-text-muted" />
            <p className="mt-3 text-sm text-text-secondary">No hay definiciones de reportes</p>
            <p className="text-xs text-text-muted">Crea una para empezar a programar reportes automáticos</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs font-medium text-text-secondary">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Formato</th>
                <th className="px-4 py-3">Frecuencia</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {definitions.map((def) => (
                <tr
                  key={def.id}
                  className="border-b border-border/50 text-text-primary transition-colors hover:bg-surface-hover"
                >
                  <td className="px-4 py-3 font-medium">{def.name}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {reportTypeLabels[def.type] ?? def.type}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      {formatLabels[def.format] ?? def.format}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {freqLabels[def.schedule ?? ''] ?? def.schedule ?? 'Manual'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`state-badge`} data-state={def.enabled ? 'paid' : 'draft'}>
                      {def.enabled ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExecute(def.id)}
                        disabled={executeMutation.isPending}
                        className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-hover hover:text-success"
                        title="Ejecutar ahora"
                      >
                        <Play size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(def)}
                        className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-hover hover:text-accent"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(def.id)}
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
