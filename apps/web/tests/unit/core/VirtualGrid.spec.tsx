import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { VirtualGrid } from '@/core/components/VirtualGrid';

vi.mock('@/shared/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: 'es' }),
}));

vi.mock('@/core/auth/store', () => ({
  useAuthStore: () => ({ user: { locale: 'es' } }),
}));

interface MockRow {
  id: number;
  name: string;
  value: number;
}

const columns = [
  { key: 'id' as const, label: 'ID', width: 80 },
  { key: 'name' as const, label: 'Name', width: 200, sortable: true },
  { key: 'value' as const, label: 'Value', width: 120, sortable: true, align: 'right' as const },
];

function generateRows(count: number): MockRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    value: Math.random() * 1000,
  }));
}

describe('VirtualGrid', () => {
  it('renders empty state when data is empty', () => {
    const { container } = render(
      <VirtualGrid data={[]} columns={columns} emptyMessage="No items" />,
    );
    expect(container.textContent).toContain('No items');
  });

  it('renders loading state', () => {
    const { container } = render(
      <VirtualGrid data={[]} columns={columns} loading />,
    );
    expect(container.textContent).toContain('common.loading');
  });

  it('renders small dataset without virtualization', () => {
    const data = generateRows(10);
    const { container } = render(
      <VirtualGrid data={data} columns={columns} />,
    );
    expect(container.textContent).toContain('Item 1');
    expect(container.textContent).toContain('Item 10');
  });

  it('renders 10,000 rows without virtualization crash', () => {
    const data = generateRows(10000);
    const { container } = render(
      <VirtualGrid data={data} columns={columns} virtualized={false} />,
    );
    expect(container.textContent).toContain('Item 1');
    expect(container.textContent).toContain('Item 10000');
  });

  it('renders with virtualization enabled and 10k rows', () => {
    const data = generateRows(10000);
    const { container } = render(
      <VirtualGrid data={data} columns={columns} virtualized />,
    );
    expect(container.querySelector('table')).not.toBeNull();
  });

  it('calls onSort when sortable column header is clicked', () => {
    const onSort = vi.fn();
    const data = generateRows(5);
    const { container } = render(
      <VirtualGrid data={data} columns={columns} onSort={onSort} />,
    );
    const nameHeader = container.querySelector('th:nth-child(2)');
    nameHeader?.click();
    expect(onSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('renders sort icons on active sort column', () => {
    const data = generateRows(5);
    const { container } = render(
      <VirtualGrid
        data={data}
        columns={columns}
        sortColumn="name"
        sortDirection="asc"
      />,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
