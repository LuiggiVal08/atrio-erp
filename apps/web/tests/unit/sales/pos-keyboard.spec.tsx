import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { POSTerminalView } from '@/modules/sales/views/POSTerminalView';

vi.mock('@/shared/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: 'es' }),
}));

vi.mock('@/core/auth/store', () => ({
  useAuthStore: () => ({ user: { locale: 'es' } }),
}));

vi.mock('@/core/components/DocumentStateBadge', () => ({
  DocumentStateBadge: ({ status }: { status: string }) => <span>{status}</span>,
}));

vi.mock('@/modules/sales/hooks/usePosSessions', () => ({
  useOpenSession: () => ({ mutateAsync: vi.fn() }),
  useCloseSession: () => ({ mutateAsync: vi.fn() }),
  useCurrentSession: () => ({ data: null }),
}));

vi.mock('@/modules/sales/hooks/useQuickSale', () => ({
  useQuickSale: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/modules/cash/hooks/useCashRegisters', () => ({
  useCashRegisters: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/modules/sales/hooks/useProductSearch', () => ({
  useProductSearch: () => ({ data: [], isLoading: false, isError: false }),
}));

vi.mock('@/modules/sales/store/pos-store', () => ({
  usePOSStore: () => ({
    items: [],
    total: 0,
    subtotal: 0,
    paymentMethod: 'cash',
    isBlockedByAudit: false,
    isOffline: false,
    searchQuery: '',
    setSearchQuery: vi.fn(),
    searchFocused: false,
    setSearchFocused: vi.fn(),
    addItem: vi.fn(),
    clearCart: vi.fn(),
  }),
}));

describe('POS keyboard context', () => {
  beforeEach(() => {
    cleanup();
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders POS Terminal view', () => {
    render(<MemoryRouter><POSTerminalView /></MemoryRouter>);
    expect(screen.getByText('sales.pos.terminal')).toBeDefined();
  });

  it('registers keydown listener on mount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    render(<MemoryRouter><POSTerminalView /></MemoryRouter>);
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('removes keydown listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<MemoryRouter><POSTerminalView /></MemoryRouter>);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
