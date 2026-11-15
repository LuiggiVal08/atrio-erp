import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/store';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useCashRegisters } from '@/modules/cash/hooks/useCashRegisters';
import { useDefaultWarehouse } from '@/modules/inventory/hooks/useWarehouses';
import { usePosSessions } from '@/modules/sales/hooks/usePosSessions';
import { usePosStore, usePosTotals } from '../store/pos-store';
import { FocusTargets, focusManager } from '../focus/focus-manager';
import { useFocus } from '../focus/useFocus';
import { usePosCheckout, type PaymentAllocationInput } from '../hooks/usePosCheckout';
import { offlineQueue } from '@/modules/sales/services/offline-queue';
import { scannerEngine, audioService, ScannerProvider } from '@/platform/interaction';
import { PosHeader } from './PosHeader';
import { PosKeyboardProvider } from './PosKeyboardProvider';
import { ProductSearchPanel } from '../panels/ProductSearchPanel';
import { CartPanel } from '../panels/CartPanel';
import { CustomerPanel } from '../panels/CustomerPanel';
import { TotalsPanel } from '../panels/TotalsPanel';
import { PaymentPanel } from '../panels/PaymentPanel';
import { ReceiptPanel } from '../panels/ReceiptPanel';
import { KeyboardHelpOverlay } from '../panels/KeyboardHelpOverlay';
import { PosLayout } from './PosLayout';
import { formatMoney } from '../lib/format';

export function PosShell() {
  const session = usePosStore((s) => s.session);
  const cart = usePosStore((s) => s.cart);
  const paymentStatus = usePosStore((s) => s.payment.status);
  const paymentOverlayOpen = usePosStore((s) => s.ui.paymentOverlayOpen);
  const saleResultOpen = usePosStore((s) => s.ui.saleResultOpen);
  const helpOpen = usePosStore((s) => s.ui.helpOpen);
  const customerSearchOpen = usePosStore((s) => s.ui.customerSearchOpen);
  const setPaymentOverlayOpen = usePosStore((s) => s.setPaymentOverlayOpen);
  const setSaleResultOpen = usePosStore((s) => s.setSaleResultOpen);
  const setHelpOpen = usePosStore((s) => s.setHelpOpen);
  const resetSale = usePosStore((s) => s.resetSale);
  const setPaymentStatus = usePosStore((s) => s.setPaymentStatus);
  const resetPayment = usePosStore((s) => s.resetPayment);
  const openSession = usePosStore((s) => s.openSession);
  const closeSession = usePosStore((s) => s.closeSession);

  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { data: defaultWarehouse } = useDefaultWarehouse();
  const { data: sessions, isLoading: sessionsLoading } = usePosSessions(!!user);
  const { data: registers, isLoading: registersLoading } = useCashRegisters();

  const activeRegisters = (registers ?? []).filter((register) => register.isActive);
  const openSessions = (sessions ?? []).filter(
    (candidate) =>
      candidate.status === 'open' &&
      activeRegisters.some((register) => register.id === candidate.cashRegisterId),
  );
  const serverSession =
    openSessions.find((candidate) => candidate.userId === user?.id) ?? openSessions[0];
  const openRegister = activeRegisters.find(
    (register) => register.id === serverSession?.cashRegisterId,
  );

  useEffect(() => {
    if (serverSession && openRegister) {
      openSession({
        id: serverSession.id,
        cashRegisterId: openRegister.id,
        cashRegisterName: openRegister.name,
        userId: serverSession.userId,
        userName: user?.name ?? '',
        openedAt: serverSession.openedAt,
        status: 'OPEN',
        trainingMode: false,
      });
    } else if (!sessionsLoading && !registersLoading) {
      closeSession();
    }
  }, [serverSession, openRegister, sessionsLoading, registersLoading, openSession, closeSession, user?.name]);

  const { ref: searchRef, requestFocus: focusSearch } = useFocus(FocusTargets.SEARCH);
  const { ref: customerRef, requestFocus: focusCustomer } = useFocus(FocusTargets.CUSTOMER_SEARCH);

  useEffect(() => {
    if (session && session.id === serverSession?.id) {
      focusSearch();
    }
  }, [session, serverSession?.id, focusSearch]);
  const checkoutMutation = usePosCheckout();
  const { total } = usePosTotals();
  const [lastSale, setLastSale] = useState<{ total: number; change: number } | null>(null);
  const [lastSaleOffline, setLastSaleOffline] = useState(false);

  const handleSearchFocus = useCallback(() => {
    focusSearch();
  }, [focusSearch]);

  const handleCustomerSearch = useCallback(() => {
    usePosStore.getState().setCustomerSearchOpen(true);
    focusCustomer();
  }, [focusCustomer]);

  const handlePay = useCallback(() => {
    const state = usePosStore.getState();
    if (state.cart.length === 0) return;
    if (state.payment.status === 'PROCESSING') return;
    setPaymentOverlayOpen(true);
    usePosStore.getState().setFocusedZone('payment');
  }, [setPaymentOverlayOpen]);

  const handleNewSale = useCallback(() => {
    resetSale();
    setLastSale(null);
    setLastSaleOffline(false);
    usePosStore.getState().setSearchQuery('');
    focusManager.clearHistory();
    focusSearch();
  }, [resetSale, focusSearch]);

  const handleHelp = useCallback(() => {
    setHelpOpen(true);
  }, [setHelpOpen]);

  const handleCloseHelp = useCallback(() => {
    setHelpOpen(false);
    focusSearch();
  }, [setHelpOpen, focusSearch]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const completeSale = useCallback(
    (sale: { total: number; change: number }, offline: boolean) => {
      setPaymentStatus('SUCCESS');
      setLastSale(sale);
      setLastSaleOffline(offline);
      setPaymentOverlayOpen(false);
      setSaleResultOpen(true);

      setTimeout(() => {
        const current = usePosStore.getState();
        if (current.ui.saleResultOpen) {
          handleNewSale();
        }
      }, 10000);
    },
    [setPaymentStatus, setPaymentOverlayOpen, setSaleResultOpen, handleNewSale],
  );

  const handleConfirmPayment = useCallback(
    async (allocations: PaymentAllocationInput[]) => {
      const state = usePosStore.getState();
      if (state.payment.status === 'PROCESSING') return;
      if (allocations.length === 0 || !state.session) return;
      if (!defaultWarehouse?.id) {
        setPaymentStatus('ERROR', t('inventory.warehouseView.noWarehouse'));
        return;
      }

      setPaymentStatus('PROCESSING');

      const amountReceived = allocations.reduce(
        (sum, allocation) => sum + allocation.amount * allocation.exchangeRate,
        0,
      );

      try {
        const result = await checkoutMutation.mutateAsync({
          cashRegisterId: state.session.cashRegisterId,
          customerId: state.customer?.id ?? null,
          allocations,
          items: state.cart.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.price,
            warehouseId: defaultWarehouse.id,
          })),
        });

        completeSale({ total: result.total, change: result.change }, false);
      } catch (err: any) {
        const offline = typeof navigator !== 'undefined' && !navigator.onLine;
        const noResponse = !err?.response;
        if (!offline && !noResponse) {
          setPaymentStatus('ERROR', err?.message ?? 'Error al procesar el pago');
          return;
        }

        try {
          await offlineQueue.save({
            id: crypto.randomUUID(),
            tenantId: user?.tenantId ?? 'offline',
            branchId: '',
            items: state.cart.map((line) => ({
              id: line.id,
              productId: line.productId,
              productName: line.name,
              sku: line.sku,
              quantity: line.quantity,
              unitPrice: line.price,
              subtotal: line.subtotal,
            })),
            total,
            paymentMethod: allocations[0]?.method ?? 'cash',
            createdAt: new Date().toISOString(),
            syncedAt: null,
            retryCount: 0,
          });
          completeSale({ total, change: Math.max(0, amountReceived - total) }, true);
        } catch (queueError: any) {
          setPaymentStatus('ERROR', queueError?.message ?? 'No se pudo guardar la venta sin conexión');
        }
      }
    },
    [checkoutMutation, total, user?.tenantId, completeSale, setPaymentStatus, defaultWarehouse?.id, t],
  );

  const handleCloseResult = useCallback(() => {
    setSaleResultOpen(false);
    handleNewSale();
  }, [setSaleResultOpen, handleNewSale]);

  const handleClosePayment = useCallback(() => {
    const state = usePosStore.getState();
    if (state.payment.status === 'PROCESSING') return;
    resetPayment();
    setPaymentOverlayOpen(false);
    focusSearch();
  }, [resetPayment, setPaymentOverlayOpen, focusSearch]);

  useEffect(() => {
    const unsub = scannerEngine.onScan((code) => {
      const state = usePosStore.getState();
      state.setSearchQuery(code);
      state.setFocusedZone('search');
    });
    scannerEngine.start();
    return () => {
      unsub();
      scannerEngine.stop();
    };
  }, []);

  useEffect(() => {
    const unsub = usePosStore.subscribe((state, prev) => {
      if (state.cart.length > prev.cart.length) {
        audioService.playScan();
      }
      if (state.payment.status === 'SUCCESS' && prev.payment.status === 'PROCESSING') {
        audioService.playPayment();
      }
      if (state.payment.status === 'ERROR' && prev.payment.status === 'PROCESSING') {
        audioService.playError();
      }
    });
    return unsub;
  }, []);

  if (sessionsLoading || registersLoading) {
    return <PosStatus message="Buscando caja abierta…" />;
  }

  if (!serverSession) {
    return <Navigate to="/cash/registers" replace />;
  }

  if (!session || session.id !== serverSession.id) {
    return <PosStatus message="Cargando caja…" />;
  }

  const isProcessing = checkoutMutation.isPending || paymentStatus === 'PROCESSING';

  return (
    <ScannerProvider enabled={!paymentOverlayOpen && !saleResultOpen && !helpOpen && !customerSearchOpen}>
    <PosKeyboardProvider
      onSearchFocus={handleSearchFocus}
      onCustomerSearch={handleCustomerSearch}
      onPay={handlePay}
      onNewSale={handleNewSale}
      onPrint={handlePrint}
      onHelp={handleHelp}
      isProcessing={isProcessing}
    >
      <div className="flex h-full flex-col">
        <PosHeader />
        <PosLayout
          searchPanel={<ProductSearchPanel ref={searchRef} />}
          cartPanel={<CartPanel />}
          customerPanel={<CustomerPanel ref={customerRef} />}
          totalsPanel={<TotalsPanel />}
          paymentBar={
            <PaymentBar
              onPay={handlePay}
              cartCount={cart.length}
              total={total}
              isProcessing={isProcessing}
            />
          }
        />
      </div>

      {paymentOverlayOpen && (
        <PaymentPanel
          onConfirm={handleConfirmPayment}
          onClose={handleClosePayment}
          isProcessing={isProcessing}
        />
      )}

      {saleResultOpen && lastSale && (
        <ReceiptPanel
          total={lastSale.total}
          change={lastSale.change}
          offline={lastSaleOffline}
          onNewSale={handleNewSale}
          onClose={handleCloseResult}
        />
      )}

      {helpOpen && <KeyboardHelpOverlay onClose={handleCloseHelp} />}
    </PosKeyboardProvider>
    </ScannerProvider>
  );
}

function PaymentBar({
  onPay,
  cartCount,
  total,
  isProcessing,
}: {
  onPay: () => void;
  cartCount: number;
  total: number;
  isProcessing: boolean;
}) {
  return (
    <div
      role="region"
      aria-label="Barra de cobro"
      className="flex items-center justify-between gap-4 border-t border-border px-4 py-3"
    >
      <span className="text-xs text-text-secondary">
        {cartCount === 0
          ? 'Agrega productos para iniciar la venta'
          : `${cartCount} ${cartCount === 1 ? 'artículo' : 'artículos'}`}
      </span>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Total</p>
          <p className="text-xl font-bold tabular-nums text-text-primary">${formatMoney(total)}</p>
        </div>
        <button
          onClick={onPay}
          disabled={cartCount === 0 || isProcessing}
          aria-keyshortcuts="F8"
          className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          COBRAR
          <kbd className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-medium">F8</kbd>
        </button>
      </div>
    </div>
  );
}

function PosStatus({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-surface-hover">
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
}
