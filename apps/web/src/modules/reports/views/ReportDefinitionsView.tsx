import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { Plus, Play, Pencil, Trash2, FileText } from 'lucide-react';
import { applyServerErrors, clearServerErrors, FormInput, FormSelect, resolveServerErrorMessage } from '@/shared/form';
import { reportDefinitionFormSchema, type ReportDefinitionFormValues } from '@/shared/validation/report-definition';
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

const emptyForm: ReportDefinitionFormValues = {
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
  const [editing, setEditing] = useState<ReportDefinition | null>(null);
  const [serverError, setServerError] = useState('');

  const form = useForm({
    defaultValues: emptyForm,
    validators: { onSubmit: reportDefinitionFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      const payload = {
        name: value.name.trim(),
        type: value.type,
        format: value.format || undefined,
        schedule: value.schedule || undefined,
        recipients: value.recipients
          ? value.recipients.split(',').map((recipient) => recipient.trim()).filter(Boolean)
          : undefined,
      };

      try {
        if (editing) {
          await updateMutation.mutateAsync({ id: editing.id, ...payload });
        } else {
          await createMutation.mutateAsync(payload);
        }
        resetForm();
      } catch (error) {
        const result = applyServerErrors(form, error);
        setServerError(resolveServerErrorMessage(result, 'No se pudo guardar la definición'));
      }
    },
  });

  function resetForm() {
    clearServerErrors(form);
    form.reset();
    setEditing(null);
    setServerError('');
    setShowForm(false);
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  useEffect(() => {
    if (!editing) return;
    clearServerErrors(form);
    form.reset({
      name: editing.name,
      type: editing.type,
      format: editing.format,
      schedule: editing.schedule ?? '',
      recipients: (editing.recipients ?? []).join(', '),
    }, { keepDefaultValues: true });
  }, [editing, form]);

  function handleEdit(def: ReportDefinition) {
    setEditing(def);
    setServerError('');
    setShowForm(true);
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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Reportes Programados</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            Define reportes que se generan automáticamente
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Plus size={16} />
          Nueva Definición
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6">

      {showForm && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            {editing ? 'Editar Definición' : 'Nueva Definición'}
          </h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                form={form}
                name="name"
                label="Nombre"
                placeholder="Ej: Reporte Semanal de Ventas"
                className="col-span-2"
                required
              />
              <FormSelect
                form={form}
                name="type"
                label="Tipo"
                options={Object.entries(reportTypeLabels).map(([value, label]) => ({ value, label }))}
              />
              <FormSelect
                form={form}
                name="format"
                label="Formato"
                options={Object.entries(formatLabels).map(([value, label]) => ({ value, label }))}
              />
              <FormSelect
                form={form}
                name="schedule"
                label="Frecuencia"
                options={presetSchedules.map((schedule) => ({
                  value: schedule.value,
                  label: schedule.label,
                }))}
              />
              <FormInput
                form={form}
                name="recipients"
                label="Destinatarios (email, separados por coma)"
                placeholder="admin@ejemplo.com, gerente@ejemplo.com"
              />
            </div>
            {serverError && (
              <p role="alert" className="mt-3 text-xs text-red-500">{serverError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
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
    </div>
  );
}
