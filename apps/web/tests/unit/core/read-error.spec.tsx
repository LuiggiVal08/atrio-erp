import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ReadErrorAlert } from '@/core/components/ReadErrorAlert';
import { getReadErrorKind } from '@/core/lib/read-error';

afterEach(cleanup);

vi.mock('@/shared/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: 'es' }),
}));

const axiosError = (status?: number) => ({ isAxiosError: true, response: status ? { status } : undefined });

describe('getReadErrorKind', () => {
  it('classifies permissions, missing records, disconnects and unknown failures', () => {
    expect(getReadErrorKind(axiosError(403))).toBe('forbidden');
    expect(getReadErrorKind(axiosError(404))).toBe('notFound');
    expect(getReadErrorKind(axiosError())).toBe('offline');
    expect(getReadErrorKind(new Error('boom'))).toBe('unknown');
  });
});

describe('ReadErrorAlert', () => {
  it('explains a forbidden read without offering a pointless retry', () => {
    const onRetry = vi.fn();
    render(<ReadErrorAlert error={axiosError(403)} onRetry={onRetry} />);
    expect(screen.getByRole('alert').textContent).toContain('common.readError.forbidden');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('distinguishes a disconnect and allows retrying', () => {
    const onRetry = vi.fn();
    render(<ReadErrorAlert error={axiosError()} onRetry={onRetry} />);
    expect(screen.getByRole('alert').textContent).toContain('common.readError.offline');
    fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
