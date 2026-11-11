import { useEffect, type ReactNode } from 'react';
import { usePosStore } from '../store/pos-store';
import { focusManager, FocusTargets } from '../focus/focus-manager';

interface Props {
  children: ReactNode;
  onSearchFocus: () => void;
  onCustomerSearch: () => void;
  onPay: () => void;
  onNewSale: () => void;
  onPrint: () => void;
  onHelp: () => void;
  isProcessing: boolean;
}

export function PosKeyboardProvider({
  children,
  onSearchFocus,
  onCustomerSearch,
  onPay,
  onNewSale,
  onPrint,
  onHelp,
  isProcessing,
}: Props) {
  const setFocusedZone = usePosStore((s) => s.setFocusedZone);

  useEffect(() => {
    const f1down = (e: KeyboardEvent) => {
      if (e.key !== 'F1') return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };
    const f1up = (e: KeyboardEvent) => {
      if (e.key !== 'F1') return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };
    document.addEventListener('keydown', f1down, true);
    document.addEventListener('keyup', f1up, true);
    return () => {
      document.removeEventListener('keydown', f1down, true);
      document.removeEventListener('keyup', f1up, true);
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      const ctrl = e.ctrlKey || e.metaKey;

      if (e.key === 'F1') return;

      if (e.key === 'F2') {
        e.preventDefault();
        onSearchFocus();
        setFocusedZone('search');
        return;
      }

      if (e.key === 'F4') {
        e.preventDefault();
        onCustomerSearch();
        setFocusedZone('customer');
        return;
      }

      if (e.key === 'F8') {
        e.preventDefault();
        onPay();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        const state = usePosStore.getState();
        if (state.ui.helpOpen) { state.setHelpOpen(false); return; }
        if (state.payment.status === 'PROCESSING') return;
        if (state.ui.saleResultOpen) {
          state.setSaleResultOpen(false);
          return;
        }
        if (state.ui.paymentOverlayOpen) {
          state.setPaymentOverlayOpen(false);
          state.resetPayment();
          focusManager.focusPrevious();
          return;
        }
        if (state.ui.customerSearchOpen) {
          state.setCustomerSearchOpen(false);
          state.setCustomerSearchQuery('');
          focusManager.focusPrevious();
          return;
        }
        if (state.ui.searchQuery) {
          state.setSearchQuery('');
          return;
        }
        focusManager.focusPrevious();
        return;
      }

      if (ctrl && e.key === 'n') {
        e.preventDefault();
        onNewSale();
        return;
      }

      if (ctrl && e.key === 'p') {
        e.preventDefault();
        onPrint();
        return;
      }

      if (ctrl && e.key === 'd') {
        e.preventDefault();
        const state = usePosStore.getState();
        const sel = state.ui.selectedLineIndex;
        if (sel >= 0 && sel < state.cart.length) {
          const line = state.cart[sel];
          const newQty = Math.max(1, line.quantity - 1);
          state.updateQuantity(line.id, newQty);
        }
        return;
      }

      if (ctrl && e.key === 'x') {
        e.preventDefault();
        const state = usePosStore.getState();
        const sel = state.ui.selectedLineIndex;
        if (sel >= 0 && sel < state.cart.length) {
          const line = state.cart[sel];
          state.removeLine(line.id);
          const newLen = state.cart.length - 1;
          if (newLen === 0) {
            state.setSelectedLineIndex(-1);
            focusManager.requestFocus(FocusTargets.SEARCH);
          } else {
            state.setSelectedLineIndex(Math.min(sel, newLen - 1));
          }
        }
        return;
      }

      if (e.key === '/' && !e.shiftKey && !isInput) {
        e.preventDefault();
        onSearchFocus();
        setFocusedZone('search');
        return;
      }

      const state = usePosStore.getState();
      const cartKeysActive =
        state.cart.length > 0 &&
        state.ui.focusedZone === 'search' &&
        state.ui.searchQuery === '' &&
        !state.ui.paymentOverlayOpen &&
        !state.ui.customerSearchOpen &&
        !state.ui.helpOpen &&
        !state.ui.saleResultOpen;

      if (cartKeysActive && !ctrl) {
        const sel = state.ui.selectedLineIndex;
        const last = state.cart.length - 1;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (sel < 0 || sel >= last) state.setSelectedLineIndex(last);
          else state.selectNextLine();
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (sel < 0) state.setSelectedLineIndex(last);
          else state.selectPrevLine();
          return;
        }
        if (e.key === 'Home') {
          e.preventDefault();
          state.selectFirstLine();
          return;
        }
        if (e.key === 'End') {
          e.preventDefault();
          state.selectLastLine();
          return;
        }
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          if (sel >= 0 && sel <= last) {
            const line = state.cart[sel];
            state.updateQuantity(line.id, line.quantity + 1);
          }
          return;
        }
        if (e.key === '-') {
          e.preventDefault();
          if (sel >= 0 && sel <= last) {
            const line = state.cart[sel];
            if (line.quantity > 1) state.updateQuantity(line.id, line.quantity - 1);
          }
          return;
        }
        if (e.key === 'Delete') {
          e.preventDefault();
          if (sel >= 0 && sel <= last) {
            state.removeLine(state.cart[sel].id);
            const newLen = state.cart.length - 1;
            state.setSelectedLineIndex(newLen === 0 ? -1 : Math.min(sel, newLen - 1));
            if (newLen === 0) focusManager.requestFocus(FocusTargets.SEARCH);
          }
          return;
        }
      }

      if (e.key === '?' && !isInput) {
        e.preventDefault();
        onHelp();
        return;
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onSearchFocus, onCustomerSearch, onPay, onNewSale, onPrint, setFocusedZone, isProcessing]);

  return <>{children}</>;
}
