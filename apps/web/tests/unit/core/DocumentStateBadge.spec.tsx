import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { DocumentStateBadge, type DocumentStatus } from '@/core/components/DocumentStateBadge';

vi.mock('@/shared/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: 'es' }),
}));

vi.mock('@/core/auth/store', () => ({
  useAuthStore: () => ({ user: { locale: 'es' } }),
}));

afterEach(cleanup);

const statuses: DocumentStatus[] = ['draft', 'approved', 'paid', 'cancelled', 'received', 'partial'];

describe.each(statuses)('DocumentStateBadge - %s', (status) => {
  it('renders with correct status text', () => {
    render(<DocumentStateBadge status={status} />);
    expect(screen.getByText(`document.status.${status}`)).toBeDefined();
  });
});

describe('DocumentStateBadge actions', () => {
  it('shows dropdown chevron when allowedActions are provided', () => {
    const { container } = render(
      <DocumentStateBadge
        status="draft"
        allowedActions={[
          { type: 'approve', label: 'Approve', requiresConfirmation: false },
        ]}
      />,
    );
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders without chevron when no actions provided', () => {
    const { container } = render(<DocumentStateBadge status="draft" />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders with state-badge class', () => {
    const { container } = render(<DocumentStateBadge status="approved" />);
    expect(container.querySelector('button')?.className).toContain('state-badge');
  });
});
