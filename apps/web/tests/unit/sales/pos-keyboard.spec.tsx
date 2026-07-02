import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
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
    render(<POSTerminalView />);
    expect(screen.getByText('sales.pos.terminal')).toBeDefined();
  });

  it('registers keydown listener on mount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    render(<POSTerminalView />);
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('removes keydown listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<POSTerminalView />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
