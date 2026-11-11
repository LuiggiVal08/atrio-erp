import { useState } from 'react';
import { isAxiosError } from 'axios';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { usePaymentMethods, type PaymentMethod } from '@/modules/cash/hooks/usePaymentMethods';
import { useCreatePaymentMethod } from '@/modules/cash/hooks/useCreatePaymentMethod';
import { useUpdatePaymentMethod } from '@/modules/cash/hooks/useUpdatePaymentMethod';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { toastService } from '@/core/services/toast-service';

const paymentTypeLabels: Record<PaymentMethod['type'], string> = {
  cash: 'Efectivo',
  digital: 'Digital',
  card: 'Punto / tarjeta',
  other: 'Otro',
};

export function PaymentMethodListView() {
  const { t } = useTranslation();
  const { data: methods, isLoading, isError, refetch } = usePaymentMethods();
  const createMethod = useCreatePaymentMethod();
  const updateMethod = useUpdatePaymentMethod();
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'digital' | 'card' | 'other'>('cash');
  const [currency, setCurrency] = useState('VED');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [isActive, setIsActive] = useState(true);

  const closeForm = () => {
    setShowForm(false);
    setEditingMethod(null);
    setName('');
    setType('cash');
    setCurrency('VED');
    setCommissionPercent('');
    setIsActive(true);
  };

  const openCreateForm = () => {
    closeForm();
    setShowForm(true);
  };

  const openEditForm = (method: PaymentMethod) => {
    setEditingMethod(method);
    setName(method.name);
    setType(method.type);
    setCurrency(method.currency || 'VED');
    setCommissionPercent(
      method.commissionRate === null ? '' : String(method.commissionRate * 100),
    );
    setIsActive(method.isActive);
    setShowForm(true);
  };

  const columns: GridColumn<PaymentMethod>[] = [
    { key: 'name', label: 'Método', sortable: true },
    { key: 'type', label: 'Tipo', width: 130,
      render: (v) => paymentTypeLabels[v as PaymentMethod['type']] },
    { key: 'currency', label: 'Moneda', width: 90,
      render: (v, row) => row.type === 'cash' ? '—' : ((v as string) || '—') },
    { key: 'commissionRate', label: 'Comisión', width: 100, align: 'right',
      render: (v) => v === null || v === undefined ? '—' : `${(Number(v) * 100).toLocaleString('es-VE', { maximumFractionDigits: 2 })}%` },
    { key: 'isActive', label: 'Estado', width: 90,
      render: (v) => v ? 'Activo' : 'Inactivo' },
    { key: 'actions', label: '', width: 100, align: 'right',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => openEditForm(row)}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-primary hover:border-accent hover:text-accent"
        >
          Editar
        </button>
      ) },
  ];

  const handleSave = async () => {
    const parsedPercent = commissionPercent.trim() === '' ? null : Number(commissionPercent);
    if (!name.trim() || (parsedPercent !== null && (!Number.isFinite(parsedPercent) || parsedPercent < 0 || parsedPercent > 100))) {
      toastService.error('Revisa los datos', 'Indica un nombre y una comisión entre 0 % y 100 %.');
      return;
    }

    const commissionRate = type === 'cash' || parsedPercent === null
      ? null
      : parsedPercent / 100;
    const methodData = {
      name: name.trim(),
      type,
      currency: type === 'cash' ? undefined : currency,
      commissionRate,
      isActive,
    };

    try {
      if (editingMethod) {
        await updateMethod.mutateAsync({ id: editingMethod.id, data: methodData });
        toastService.success('Método actualizado', 'Los cambios se guardaron correctamente.');
      } else {
        await createMethod.mutateAsync({
          name: methodData.name,
          type: methodData.type,
          currency: methodData.currency,
          commissionRate: methodData.commissionRate ?? undefined,
        });
        toastService.success('Método creado', 'El método de pago está disponible.');
      }
      closeForm();
    } catch (error) {
      const timedOut = isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT');
      if (timedOut) {
        await refetch();
        toastService.error(
          'No se confirmó el cambio',
          'La solicitud agotó el tiempo de espera. Revisa la lista antes de volver a guardar.',
        );
        return;
      }

      const message = isAxiosError<{ message?: string | string[] }>(error)
        ? error.response?.data?.message
        : undefined;
      toastService.error(
        'No se pudo guardar el método de pago',
        Array.isArray(message) ? message.join(', ') : message || 'Verifica los datos y vuelve a intentarlo.',
      );
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">{t('cash.paymentMethods')}</h1>
        <button onClick={showForm ? closeForm : openCreateForm}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover">
          {showForm ? t('common.cancel') : `+ ${t('common.create')}`}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6">
      {showForm && (
        <div className="mb-4 rounded-lg border border-border bg-surface p-3">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">
            {editingMethod ? 'Editar método de pago' : 'Nuevo método de pago'}
          </h2>
          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex min-w-0 flex-col gap-1 text-xs text-text-secondary">
              Nombre
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Pago móvil"
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none" />
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-xs text-text-secondary">
              Tipo
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none">
                <option value="cash">Efectivo</option>
                <option value="digital">Digital / pago móvil</option>
                <option value="card">Punto / tarjeta</option>
                <option value="other">Otro</option>
              </select>
            </label>
            {type !== 'cash' && (
              <>
                <label className="flex min-w-0 flex-col gap-1 text-xs text-text-secondary">
                  Moneda
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded border border-border bg-bg px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none">
                    <option value="VED">VES</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="COP">COP</option>
                    <option value="BRL">BRL</option>
                  </select>
                </label>
                <label className="flex min-w-0 flex-col gap-1 text-xs text-text-secondary">
                  Comisión (%)
                  <input type="number" min="0" max="100" step="0.01" value={commissionPercent}
                    onChange={(e) => setCommissionPercent(e.target.value)} placeholder="0"
                    className="w-full rounded border border-border bg-bg px-2 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none" />
                </label>
              </>
            )}
            {editingMethod && (
              <label className="flex items-center gap-2 pb-1 text-xs text-text-primary">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                  className="accent-accent" />
                Método activo
              </label>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={closeForm}
              className="rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary">
              {t('common.cancel')}
            </button>
            <button type="button" onClick={handleSave}
              disabled={createMethod.isPending || updateMethod.isPending}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50">
              {createMethod.isPending || updateMethod.isPending ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 rounded-xl border border-border bg-surface p-4">
        {isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-text-secondary">No se pudieron cargar los métodos de pago.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:border-accent hover:text-accent"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <VirtualGrid data={methods ?? []} columns={columns} loading={isLoading} emptyMessage="No hay métodos de pago" />
        )}
      </div>
      </div>
    </div>
  );
}
