import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { WeekCalendarWidget } from '@/modules/reports/components/WeekCalendarWidget';
import { getEventsForDate, isSameDay } from '@/modules/reports/components/calendar-events.mock';

afterEach(cleanup);

// Martes 10 de noviembre de 2026. La semana va del lunes 9 al domingo 15.
const NOW = new Date(2026, 10, 10);

describe('WeekCalendarWidget', () => {
  it('muestra los 7 días de la semana actual empezando en lunes', () => {
    render(<WeekCalendarWidget now={NOW} />);

    expect(screen.getByRole('button', { name: 'lunes 9 de noviembre' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'martes 10 de noviembre' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'domingo 15 de noviembre' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'domingo 8 de noviembre' })).toBeNull();
  });

  it('muestra el mes y el año de la fecha seleccionada', () => {
    render(<WeekCalendarWidget now={NOW} />);

    expect(screen.getByText('Noviembre 2026')).toBeTruthy();
  });

  it('selecciona el día de hoy por defecto', () => {
    render(<WeekCalendarWidget now={NOW} />);

    const todayButton = screen.getByRole('button', { name: 'martes 10 de noviembre' });
    expect(todayButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('muestra los 2 eventos más relevantes del día seleccionado', () => {
    render(<WeekCalendarWidget now={NOW} />);

    expect(screen.getByText('Reunión de equipo')).toBeTruthy();
    expect(screen.getByText('Entrega pedido SOC-1042')).toBeTruthy();
    expect(screen.getByText('08:30 AM – 09:00 AM')).toBeTruthy();
    expect(screen.getByText('04:30 PM – 05:00 PM')).toBeTruthy();
  });

  it('avanza y retrocede de semana conservando el día seleccionado', async () => {
    const user = userEvent.setup();
    render(<WeekCalendarWidget now={NOW} />);

    await user.click(screen.getByRole('button', { name: 'Semana siguiente' }));
    expect(screen.getByRole('button', { name: 'lunes 16 de noviembre' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'martes 17 de noviembre' }).getAttribute('aria-pressed')).toBe('true');

    await user.click(screen.getByRole('button', { name: 'Semana anterior' }));
    expect(screen.getByRole('button', { name: 'martes 10 de noviembre' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('vuelve a la semana actual con el botón Hoy', async () => {
    const user = userEvent.setup();
    render(<WeekCalendarWidget now={NOW} />);

    await user.click(screen.getByRole('button', { name: 'Semana siguiente' }));
    await user.click(screen.getByRole('button', { name: 'Hoy' }));

    expect(screen.getByRole('button', { name: 'martes 10 de noviembre' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Reunión de equipo')).toBeTruthy();
  });

  it('muestra estado vacío para días sin eventos', async () => {
    const user = userEvent.setup();
    render(<WeekCalendarWidget now={NOW} />);

    await user.click(screen.getByRole('button', { name: 'sábado 14 de noviembre' }));

    expect(screen.getByText('Sin eventos programados para este día')).toBeTruthy();
  });
});

describe('calendar-events.mock', () => {
  it('devuelve los eventos del día ordenados por hora', () => {
    const events = getEventsForDate(new Date(2026, 10, 12), NOW);

    expect(events).toHaveLength(2);
    expect(events[0].startTime).toBe('09:00');
    expect(events[1].startTime).toBe('11:30');
  });

  it('identifica el mismo día sin importar la hora', () => {
    expect(isSameDay(new Date(2026, 10, 10, 23, 59), NOW)).toBe(true);
    expect(isSameDay(new Date(2026, 10, 11, 0, 0), NOW)).toBe(false);
  });
});
