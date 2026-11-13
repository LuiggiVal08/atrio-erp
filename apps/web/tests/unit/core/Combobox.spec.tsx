import { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Combobox } from '@/core/components/Combobox';

vi.mock('@/shared/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: 'es' }),
}));

afterEach(cleanup);

const options = [
  { id: 'cat-1', name: 'Categoría General' },
  { id: 'cat-2', name: 'Herramientas' },
  { id: 'cat-3', name: 'Electricidad' },
];

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <Combobox id="test-combobox" value={value} onChange={setValue} options={options} aria-label="Categorías" />
  );
}

describe('Combobox', () => {
  it('opens the listbox with all options on focus', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('combobox', { name: 'Categorías' }));
    expect(screen.getByRole('listbox')).toBeDefined();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('filters options ignoring case and accents while typing', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Categorías' });
    await user.click(input);
    await user.type(input, 'CATEGORIA');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Categoría General' })).toBeDefined();
    await user.clear(input);
    await user.type(input, 'electri');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Electricidad' })).toBeDefined();
  });

  it('shows the empty state when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Categorías' });
    await user.click(input);
    await user.type(input, 'zzzz');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('common.noResults')).toBeDefined();
  });

  it('selects with arrow keys and Enter', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Categorías' }) as HTMLInputElement;
    await user.click(input);
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(input.value).toBe('Herramientas');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('selects on option click and closes the list', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Categorías' }) as HTMLInputElement;
    await user.click(input);
    await user.click(screen.getByRole('option', { name: 'Electricidad' }));
    expect(input.value).toBe('Electricidad');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('clears the selection with the clear button', async () => {
    const user = userEvent.setup();
    render(<Harness initial="cat-2" />);
    const input = screen.getByRole('combobox', { name: 'Categorías' }) as HTMLInputElement;
    expect(input.value).toBe('Herramientas');
    await user.click(screen.getByRole('button', { name: 'common.clear' }));
    expect(input.value).toBe('');
  });

  it('closes with Escape without changing the selection', async () => {
    const user = userEvent.setup();
    render(<Harness initial="cat-2" />);
    const input = screen.getByRole('combobox', { name: 'Categorías' }) as HTMLInputElement;
    await user.click(input);
    await user.type(input, 'elec');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input.value).toBe('Herramientas');
  });
});
