import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/shared/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: 'es' }),
}));

import { Skeleton } from '@/core/components/Skeleton';
import { TableSkeleton } from '@/core/components/TableSkeleton';
import { CardSkeleton } from '@/core/components/CardSkeleton';

describe('Skeleton', () => {
  it('renders a decorative placeholder', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('skeleton');
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies circle radius for the circle variant', () => {
    const { container } = render(<Skeleton variant="circle" />);
    expect((container.firstChild as HTMLElement).className).toContain('rounded-full');
  });
});

describe('TableSkeleton', () => {
  it('renders the requested number of rows and columns', () => {
    const { container } = render(<TableSkeleton rows={3} columns={4} />);
    const rows = container.querySelectorAll('[role="status"] > div');
    expect(rows.length).toBe(3);
    expect(rows[0].querySelectorAll('.skeleton').length).toBe(4);
  });

  it('announces loading via the status role', () => {
    const { container } = render(<TableSkeleton />);
    expect(container.querySelector('[role="status"]')?.getAttribute('aria-busy')).toBe('true');
  });
});

describe('CardSkeleton', () => {
  it('renders decorative placeholder lines', () => {
    const { container } = render(<CardSkeleton />);
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });
});
