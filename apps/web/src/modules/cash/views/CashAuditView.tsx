import { useTranslation } from '@/shared/hooks/useTranslation';
import { useCashAuditStore, type ExpectedAmounts } from '@/modules/cash/store/cash-audit-store';
import { AuditFormView } from '@/modules/cash/components/AuditFormView';
import { CashDashboard } from '@/modules/cash/components/CashDashboard';
import { useCashRegisters } from '@/modules/cash/hooks/useCashRegisters';
import { useCashRegisterDetail } from '@/modules/cash/hooks/useCashRegisterDetail';
import { useEffect, useState } from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import { Modal } from '@/core/components/Modal';
import { useAuthStore } from '@/core/auth/store';
import { useCloseSession, usePosSessions } from '@/modules/sales/hooks/usePosSessions';
import { useCreateCashMovement } from '@/modules/cash/hooks/useCashMovements';
import { useCurrencyRates } from '@/modules/inventory/hooks/useCurrencyRates';
import { useTenantStore } from '@/core/tenant/store';
import { useTenant } from '@/modules/settings/hooks/useTenant';
import { FormInput, FormSelect, applyServerErrors, resolveServerErrorMessage } from '@/shared/form';
import {
  cashMovementSchema,
  type CashMovementValues,
} from '@/shared/validation/cash-movement';

export function CashAuditView() {
  const { t } = useTranslation();
  const { audit, startAudit, isAuditing } = useCashAuditStore();
  const { data: registers = [] } = useCashRegisters();
  const { data: posSessions = [], isLoading: isLoadingSessions } = usePosSessions();
  const currentUser = useAuthStore((state) => state.user);
  const [registerId, setRegisterId] = useState('');
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementReceipt, setMovementReceipt] = useState<File | null>(null);
  const [movementExchangeRate, setMovementExchangeRate] = useState('1');
  const [movementError, setMovementError] = useState('');
  const selectedRegister = registers.find((item) => item.id === registerId);
  const { data: registerDetail } = useCashRegisterDetail(registerId || null);
  const movementMutation = useCreateCashMovement(registerId);
  const tenantId = useTenantStore((state) => state.activeTenantId);
  const { data: tenant } = useTenant(tenantId);
  const { data: rates = [] } = useCurrencyRates();
  const closeSessionMutation = useCloseSession();

  const movementForm = useForm({
    defaultValues: {
      type: 'out',
      amount: undefined,
      currency: 'VED',
      description: '',
      category: 'Caja chica',
    } as CashMovementValues,
    validators: { onSubmit: cashMovementSchema },
    onSubmit: async ({ value }) => {
      setMovementError('');
      if (!registerId) return;
      try {
        await movementMutation.mutateAsync({
          type: value.type,
          amount: value.amount ?? 0,
          description: value.description.trim(),
          currency: value.currency,
          exchangeRate: Number(movementExchangeRate) || 1,
          category: value.type === 'out' ? value.category : undefined,
          receiptName: movementReceipt?.name,
        });
        movementForm.setFieldValue('amount', undefined);
        movementForm.setFieldValue('description', '');
        setMovementReceipt(null);
        setShowMovementModal(false);
      } catch (error) {
        const result = applyServerErrors(movementForm, error);
        setMovementError(resolveServerErrorMessage(result, 'No se pudo registrar el movimiento.'));
      }
    },
  });

  const movementType = useStore(movementForm.store, (state) => state.values.type);
  const movementCurrency = useStore(movementForm.store, (state) => state.values.currency);
  const movementAmount = useStore(movementForm.store, (state) => state.values.amount);
  const movementDescription = useStore(movementForm.store, (state) => state.values.description);

  useEffect(() => {
    if (registerId || !currentUser?.id) return;
    const ownOpenSession = posSessions.find(
      (session) => session.status === 'open' && session.userId === currentUser.id,
    );
    const firstOpenSession = posSessions.find((session) => session.status === 'open');
    if (ownOpenSession) setRegisterId(ownOpenSession.cashRegisterId);
    else if (firstOpenSession) setRegisterId(firstOpenSession.cashRegisterId);
  }, [currentUser?.id, posSessions, registerId]);

  useEffect(() => {
    const normalize = (currency: string) => currency === 'VED' ? 'VES' : currency.toUpperCase();
    const from = normalize(movementCurrency);
    const base = normalize(tenant?.baseCurrency || 'VES');
    if (from === base) {
      setMovementExchangeRate('1');
      return;
    }
    const direct = rates
      .filter((rate) => normalize(rate.fromCurrency) === from && normalize(rate.toCurrency) === base)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const inverse = rates
      .filter((rate) => normalize(rate.fromCurrency) === base && normalize(rate.toCurrency) === from)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (direct?.rate > 0) setMovementExchangeRate(String(direct.rate));
    else if (inverse?.rate > 0) setMovementExchangeRate(String(1 / inverse.rate));
    else setMovementExchangeRate('');
  }, [movementCurrency, tenant?.baseCurrency, rates]);

  const handleStartAudit = () => {
    if (!selectedOpenSession) return;
    const payments = registerDetail?.totals.payments ?? [];
    const card = payments
      .filter((payment) => payment.method === 'card')
      .reduce((sum, payment) => sum + payment.amount, 0);
    const transfer = payments
      .filter((payment) => ['transfer', 'digital'].includes(payment.method))
      .reduce((sum, payment) => sum + payment.amount, 0);
    const expected: ExpectedAmounts = {
      cash: registerDetail?.totals.expectedCash ?? selectedRegister?.balance ?? 0,
      card,
      transfer,
      cashByCurrency: Object.fromEntries(
        [
          ...(registerDetail?.totals.cashByCurrency ?? []),
        ].map((cash) => [cash.currency === 'VED' ? 'VES' : cash.currency.toUpperCase(), cash.amount]),
      ),
    };
    startAudit(registerId, expected);
  };

  const handleApproveAudit = async () => {
    const sessionId = registerDetail?.session?.id;
    if (!sessionId || !audit) return;
    let physicalBase = 0;
    for (const [currency, counts] of Object.entries(audit.closingDenominations)) {
      const physical = Object.entries(counts).reduce(
        (sum, [denomination, quantity]) => sum + Number(denomination) * Number(quantity),
        0,
      );
      if (currency === 'VES') physicalBase += physical;
      else {
        const direct = rates.find((rate) =>
          rate.fromCurrency.toUpperCase() === currency &&
          (rate.toCurrency.toUpperCase() === 'VES' || rate.toCurrency.toUpperCase() === 'VED'));
        const inverse = rates.find((rate) =>
          (rate.fromCurrency.toUpperCase() === 'VES' || rate.fromCurrency.toUpperCase() === 'VED') &&
          rate.toCurrency.toUpperCase() === currency);
        const conversion = direct?.rate ?? (inverse?.rate ? 1 / inverse.rate : 1);
        physicalBase += physical * conversion;
      }
    }
    const expectedBase = registerDetail?.totals.expectedCash ?? audit.expectedCash;
    await closeSessionMutation.mutateAsync({
      id: sessionId,
      closingBalance: physicalBase,
      closingDifference: physicalBase - expectedBase,
      closingNote: audit.closingNote,
      closingDenominations: audit.closingDenominations,
    });
  };

  const normalizeCurrency = (currency: string) => currency === 'VED' ? 'VES' : currency;
  const selectedOpenSession = posSessions.find(
    (session) => session.status === 'open' && session.cashRegisterId === registerId,
  );
  const canStartAudit = !!selectedOpenSession;
  const movementMethodLabels: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    mobile_payment: 'Pago Móvil',
    digital: 'Pago digital',
    point: 'Punto',
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">{t('cash.audit.title')}</h1>
        {!isAuditing && (
          <div className="flex items-center gap-2">
            <select
              value={registerId}
              onChange={(event) => setRegisterId(event.target.value)}
              className="max-w-56 truncate rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary"
            >
              <option value="">Seleccionar turno abierto</option>
              {posSessions
                .filter((session) => session.status === 'open')
                .map((session) => (
                  <option key={session.id} value={session.cashRegisterId}>
                    {registers.find((register) => register.id === session.cashRegisterId)?.name ?? 'Caja'} · {session.userId === currentUser?.id ? 'Mi turno' : 'Otro cajero'}
                  </option>
                ))}
            </select>
            <button
              onClick={handleStartAudit}
              disabled={!canStartAudit || isLoadingSessions || !registerDetail?.session}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
              title={!selectedOpenSession ? 'Debe existir un turno abierto antes de auditar' : undefined}
            >
              {t('cash.audit.start')}
            </button>
          </div>
        )}
        {registerDetail?.session && registerDetail.session.user?.id === currentUser?.id && (
          <button
            type="button"
            onClick={() => setShowMovementModal(true)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:border-accent hover:text-accent"
          >
            Registrar movimiento
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CashDashboard
          registerName={selectedRegister?.name}
          registerBalance={selectedRegister?.balance}
          registerId={registerId || undefined}
          showMovements={false}
        />
        <div className="space-y-4">
          {isAuditing ? (
            <AuditFormView onApprove={handleApproveAudit} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-border bg-surface">
              <p className="px-6 text-center text-sm text-text-secondary">
                {isLoadingSessions
                  ? 'Cargando turnos…'
                  : selectedOpenSession
                    ? 'Selecciona el turno abierto para comenzar el arqueo.'
                    : 'No hay turno abierto para auditar. Abre una caja desde la sección Cajas.'}
              </p>
            </div>
          )}

          <section className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-text-primary">Movimientos del turno</h2>
              <span className="text-xs tabular-nums text-text-secondary">
                {registerDetail?.movements.length ?? 0} movimientos
              </span>
            </div>
            <div className="max-h-72 overflow-auto p-2">
              {!registerId && (
                <p className="py-8 text-center text-sm text-text-secondary">Seleccione una caja.</p>
              )}
              {registerId && !registerDetail && (
                <p className="py-8 text-center text-sm text-text-secondary">Cargando movimientos...</p>
              )}
              {registerDetail?.movements.length === 0 && (
                <p className="py-8 text-center text-sm text-text-secondary">No hay movimientos en el turno abierto.</p>
              )}
              {registerDetail?.movements.map((movement) => (
                <div
                  key={movement.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-border px-3 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {movement.description || (movement.type === 'in' ? 'Ingreso de caja' : 'Salida de caja')}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                      <span>{movementMethodLabels[movement.paymentMethod] ?? movement.paymentMethod}</span>
                      <span>{new Date(movement.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold tabular-nums ${
                      movement.type === 'out' ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {movement.type === 'out' ? '-' : '+'}
                      {movement.amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                      {normalizeCurrency(movement.currency)}
                    </p>
                    <p className="mt-1 text-xs tabular-nums text-text-secondary">
                      Base: {movement.baseAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}{' '}VES
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-text-primary">Historial de cierres</h2>
              <span className="text-xs text-text-secondary">
                {posSessions.filter((session) => session.status === 'closed' && (!registerId || session.cashRegisterId === registerId)).length} cierres
              </span>
            </div>
            <div className="max-h-64 overflow-auto p-2">
              {posSessions
                .filter((session) => session.status === 'closed' && (!registerId || session.cashRegisterId === registerId))
                .map((session) => (
                  <div key={session.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border px-3 py-3 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {registers.find((register) => register.id === session.cashRegisterId)?.name || 'Caja'}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">
                        {new Date(session.openedAt).toLocaleString()} — {session.closedAt ? new Date(session.closedAt).toLocaleString() : ''}
                      </p>
                      {session.closingNote && (
                        <p className="mt-1 text-xs text-amber-400">{session.closingNote}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-text-primary">
                        {(session.closingBalance ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                      </p>
                      {session.closingDifference != null && (
                        <p className={`mt-1 text-xs ${session.closingDifference === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          Diferencia {(session.closingDifference >= 0 ? '+' : '')}{session.closingDifference.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="mt-2 text-xs font-medium text-accent hover:underline"
                      >
                        Imprimir
                      </button>
                    </div>
                  </div>
                ))}
              {posSessions.filter((session) => session.status === 'closed' && (!registerId || session.cashRegisterId === registerId)).length === 0 && (
                <p className="py-8 text-center text-sm text-text-secondary">No hay cierres registrados.</p>
              )}
            </div>
          </section>
        </div>
      </div>
        <Modal open={showMovementModal} onClose={() => setShowMovementModal(false)} title="Registrar movimiento de caja">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void movementForm.handleSubmit();
            }}
            className="grid gap-4"
          >
            <FormSelect
              form={movementForm}
              name="type"
              label="Tipo"
              options={[
                { value: 'in', label: 'Entrada / fondo adicional' },
                { value: 'out', label: 'Salida / caja chica / traslado' },
              ]}
            />
            <FormInput
              form={movementForm}
              name="amount"
              label="Monto"
              type="number"
              min="0.01"
              step="0.01"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <FormSelect
                form={movementForm}
                name="currency"
                label="Moneda"
                options={[
                  { value: 'VED', label: 'VES' },
                  { value: 'USD', label: 'USD' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'COP', label: 'COP' },
                  { value: 'BRL', label: 'BRL' },
                ]}
              />
              <label className="grid gap-1 text-xs font-medium text-text-secondary">
                Tasa de cambio
                <input
                  type="number"
                  min="0.0000001"
                  step="any"
                  value={movementExchangeRate}
                  readOnly
                  className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary"
                />
              </label>
            </div>
            <FormInput
              form={movementForm}
              name="description"
              label="Concepto y justificante"
              placeholder="Ej. compra de limpieza - factura 001"
              multiline
              rows={3}
              required
            />
            {movementType === 'out' && (
              <>
                <FormSelect
                  form={movementForm}
                  name="category"
                  label="Categoría del gasto"
                  options={[
                    { value: 'Caja chica', label: 'Caja chica' },
                    { value: 'Operación', label: 'Operación' },
                    { value: 'Transporte', label: 'Transporte' },
                    { value: 'Mantenimiento', label: 'Mantenimiento' },
                    { value: 'Servicios', label: 'Servicios' },
                    { value: 'Otros', label: 'Otros' },
                  ]}
                />
                <label className="grid gap-1 text-xs font-medium text-text-secondary">
                  Comprobante o recibo
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(event) => setMovementReceipt(event.target.files?.[0] || null)}
                    className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary"
                  />
                </label>
              </>
            )}
            {movementError && (
              <p role="alert" className="text-xs text-error">{movementError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMovementModal(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={movementMutation.isPending || !movementAmount || !movementDescription.trim()}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Registrar movimiento
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
