import { useState } from 'react';
import {
  Banknote,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Truck,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  getEventsForDate,
  isSameDay,
  type CalendarEvent,
  type CalendarEventType,
} from './calendar-events.mock';

const WEEKDAY_LABELS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const WEEKDAY_FULL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const eventVisuals: Record<CalendarEventType, { icon: LucideIcon; bg: string; text: string }> = {
  'sales-delivery': { icon: Truck, bg: 'bg-accent/10', text: 'text-accent' },
  'purchase-delivery': { icon: PackageCheck, bg: 'bg-warning/10', text: 'text-warning' },
  payroll: { icon: Banknote, bg: 'bg-success/10', text: 'text-success' },
  meeting: { icon: Users, bg: 'bg-accent/10', text: 'text-accent' },
  'client-visit': { icon: UserCheck, bg: 'bg-success/10', text: 'text-success' },
};

const MAX_EVENTS = 2;

function getWeekStart(anchor: Date, weekOffset: number): Date {
  const date = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const weekday = date.getDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  date.setDate(date.getDate() - daysFromMonday + weekOffset * 7);
  return date;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
}

function formatMonthYear(date: Date): string {
  const month = MONTHS[date.getMonth()];
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
}

function formatDayLabel(date: Date): string {
  return `${WEEKDAY_FULL[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

interface WeekCalendarWidgetProps {
  /** Fecha de referencia (inyectable para tests). Por defecto, la fecha actual. */
  now?: Date;
}

export function WeekCalendarWidget({ now = new Date() }: WeekCalendarWidgetProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate()),
  );

  const weekDays = getWeekDays(getWeekStart(now, weekOffset));
  const events = getEventsForDate(selectedDate, now).slice(0, MAX_EVENTS);

  function goToAdjacentWeek(delta: number) {
    setWeekOffset((prev) => prev + delta);
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + delta * 7);
      return next;
    });
  }

  function goToday() {
    setWeekOffset(0);
    setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-text-primary">{formatMonthYear(selectedDate)}</h3>
        <div className="flex items-center gap-1">
          {weekOffset !== 0 && (
            <button
              onClick={goToday}
              className="min-h-11 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Hoy
            </button>
          )}
          <button
            aria-label="Semana anterior"
            onClick={() => goToAdjacentWeek(-1)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            aria-label="Semana siguiente"
            onClick={() => goToAdjacentWeek(1)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {weekDays.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, now);
          return (
            <button
              key={date.toISOString()}
              aria-label={formatDayLabel(date)}
              aria-pressed={isSelected}
              onClick={() => setSelectedDate(date)}
              className={`flex min-h-11 flex-col items-center gap-0.5 rounded-lg border py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isSelected
                  ? 'border-accent bg-accent/10'
                  : 'border-transparent hover:bg-surface-hover'
              }`}
            >
              <span className={`text-[10px] font-medium uppercase tracking-wide ${isSelected ? 'text-accent' : 'text-text-muted'}`}>
                {WEEKDAY_LABELS[index]}
              </span>
              <span className={`text-base font-semibold ${isSelected ? 'text-accent' : isToday ? 'text-text-primary' : 'text-text-secondary'}`}>
                {date.getDate()}
              </span>
              {isToday && !isSelected && (
                <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      <div className="my-4 border-t border-border" aria-hidden="true" />

      {events.length > 0 ? (
        <ul>
          {events.map((event, index) => (
            <TimelineItem
              key={`${event.type}-${event.startTime}-${event.title}`}
              event={event}
              isLast={index === events.length - 1}
            />
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-2 border-l border-border pl-5 text-text-secondary">
          <CalendarOff size={14} className="shrink-0" aria-hidden="true" />
          <p className="text-xs">Sin eventos programados para este día</p>
        </div>
      )}
    </div>
  );
}

function TimelineItem({ event, isLast }: { event: CalendarEvent; isLast: boolean }) {
  const visual = eventVisuals[event.type];
  const Icon = visual.icon;

  return (
    <li className="grid grid-cols-[7.5rem_1fr]">
      <p className="whitespace-nowrap py-0.5 pr-3 text-right text-[11px] font-medium leading-relaxed text-text-secondary">
        {formatTime(event.startTime)} – {formatTime(event.endTime)}
      </p>
      <div className={`relative border-l border-border pl-5 ${isLast ? 'pb-1' : 'pb-6'}`}>
        <span
          className="absolute -left-[5px] top-[9px] size-2.5 rounded-full border-2 border-surface bg-accent"
          aria-hidden="true"
        />
        <div className="flex items-center gap-2.5">
          <span className={`shrink-0 rounded-lg p-1.5 ${visual.bg}`}>
            <Icon size={14} className={visual.text} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">{event.title}</p>
            <p className="truncate text-xs text-text-secondary">{event.subtitle}</p>
          </div>
        </div>
      </div>
    </li>
  );
}
