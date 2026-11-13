import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const hoisted = vi.hoisted(() => ({ reduced: false, stop: vi.fn() }));

vi.mock('framer-motion', () => ({
  useReducedMotion: () => hoisted.reduced,
  animate: (_from: number, to: number, opts: { onUpdate: (v: number) => void }) => {
    opts.onUpdate(to);
    return { stop: hoisted.stop };
  },
}));

import { useCountUp } from '@/core/hooks/useCountUp';

describe('useCountUp', () => {
  beforeEach(() => {
    hoisted.reduced = false;
    hoisted.stop.mockClear();
  });

  it('animates up to the target value', () => {
    const { result } = renderHook(() => useCountUp(42));
    expect(result.current).toBe(42);
  });

  it('jumps to the value when reduced motion is preferred', () => {
    hoisted.reduced = true;
    const { result } = renderHook(() => useCountUp(7));
    expect(result.current).toBe(7);
  });

  it('jumps to the value when disabled', () => {
    const { result } = renderHook(() => useCountUp(9, { enabled: false }));
    expect(result.current).toBe(9);
  });
});
