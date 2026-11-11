export type FocusTarget = string;

export const FocusTargets = {
  SEARCH: 'pos:search',
  CUSTOMER_SEARCH: 'pos:customer-search',
  PAYMENT_AMOUNT: 'pos:payment-amount',
  CART: 'pos:cart',
} as const;

const MAX_HISTORY = 10;

class FocusManager {
  private registry = new Map<FocusTarget, () => void>();
  private pending = new Set<FocusTarget>();
  private history: FocusTarget[] = [];
  private lastFocused: FocusTarget | null = null;

  register(target: FocusTarget, focusFn: () => void): () => void {
    this.registry.set(target, focusFn);
    return () => {
      this.registry.delete(target);
      this.pending.delete(target);
    };
  }

  requestFocus(target: FocusTarget) {
    if (this.pending.has(target)) return;
    if (this.lastFocused && this.lastFocused !== target) {
      this.history.push(this.lastFocused);
      if (this.history.length > MAX_HISTORY) this.history.shift();
    }
    this.lastFocused = target;
    this.pending.add(target);
    requestAnimationFrame(() => {
      this.pending.delete(target);
      const focusFn = this.registry.get(target);
      if (focusFn) {
        focusFn();
      }
    });
  }

  focusPrevious(): boolean {
    const prev = this.history.pop();
    if (!prev) return false;
    this.lastFocused = null;
    this.requestFocus(prev);
    return true;
  }

  clearHistory() {
    this.history = [];
    this.lastFocused = null;
  }
}

export const focusManager = new FocusManager();
