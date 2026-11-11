export type CalendarEventType =
  | 'sales-delivery'
  | 'purchase-delivery'
  | 'payroll'
  | 'meeting'
  | 'client-visit';

export interface CalendarEvent {
  /** Diferencia en días respecto a la fecha actual (0 = hoy, negativo = pasado). */
  offsetDays: number;
  startTime: string;
  endTime: string;
  type: CalendarEventType;
  title: string;
  subtitle: string;
}

/**
 * Datos de ejemplo del calendario del dashboard (solo frontend).
 * Representa eventos del dominio del ERP: entregas de pedidos a clientes,
 * recepciones de órdenes de compra a proveedores, pagos de nómina,
 * reuniones y visitas de clientes. Cuando el backend exponga las fechas
 * reales de entregas, órdenes y nómina, este archivo se reemplaza por un hook
 * de React Query que consuma dichos endpoints.
 */
export const calendarEvents: CalendarEvent[] = [
  // Semana actual
  { offsetDays: -1, startTime: '08:00', endTime: '08:30', type: 'meeting', title: 'Reunión de equipo', subtitle: 'Planificación de la semana' },
  { offsetDays: -1, startTime: '15:00', endTime: '16:00', type: 'sales-delivery', title: 'Entrega pedido SOC-1028', subtitle: 'Cliente: Comercial El Progreso' },
  { offsetDays: 0, startTime: '08:30', endTime: '09:00', type: 'meeting', title: 'Reunión de equipo', subtitle: 'Repaso de ventas de ayer' },
  { offsetDays: 0, startTime: '16:30', endTime: '17:00', type: 'sales-delivery', title: 'Entrega pedido SOC-1042', subtitle: 'Cliente: Ferretería El Tornillo' },
  { offsetDays: 1, startTime: '10:00', endTime: '11:00', type: 'client-visit', title: 'Visita de cliente nuevo', subtitle: 'Presentación de catálogo' },
  { offsetDays: 1, startTime: '14:00', endTime: '15:30', type: 'purchase-delivery', title: 'Recepción OC-2087', subtitle: 'Proveedor: Distribuidora Central' },
  { offsetDays: 2, startTime: '09:00', endTime: '10:00', type: 'payroll', title: 'Pago de nómina', subtitle: 'Quincena · 12 empleados' },
  { offsetDays: 2, startTime: '11:30', endTime: '12:30', type: 'sales-delivery', title: 'Entrega pedido SOC-1050', subtitle: 'Cliente: Ferretería El Tornillo' },
  { offsetDays: 3, startTime: '08:00', endTime: '08:45', type: 'meeting', title: 'Entrevista de trabajo', subtitle: 'Candidato: Analista de compras' },
  { offsetDays: 3, startTime: '13:00', endTime: '14:00', type: 'purchase-delivery', title: 'Recepción OC-2091', subtitle: 'Proveedor: Tubos y Conexiones C.A.' },
  // Fin de semana: sin eventos
  // Semana siguiente
  { offsetDays: 7, startTime: '09:30', endTime: '10:30', type: 'purchase-delivery', title: 'Recepción OC-2102', subtitle: 'Proveedor: Pinturas Andinas' },
  { offsetDays: 7, startTime: '16:00', endTime: '17:00', type: 'meeting', title: 'Reunión de equipo', subtitle: 'Cierre de la semana' },
  { offsetDays: 8, startTime: '10:00', endTime: '11:00', type: 'payroll', title: 'Pago de nómina', subtitle: 'Fin de mes · 12 empleados' },
  { offsetDays: 9, startTime: '15:00', endTime: '16:00', type: 'sales-delivery', title: 'Entrega pedido SOC-1108', subtitle: 'Cliente: Comercial El Progreso' },
  { offsetDays: 9, startTime: '16:30', endTime: '17:30', type: 'client-visit', title: 'Visita de cliente nuevo', subtitle: 'Cotización mayorista' },
];

function daysBetween(date: Date, reference: Date): number {
  const dateMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const referenceMs = Date.UTC(reference.getFullYear(), reference.getMonth(), reference.getDate());
  return Math.round((dateMs - referenceMs) / 86_400_000);
}

export function isSameDay(date: Date, reference: Date): boolean {
  return daysBetween(date, reference) === 0;
}

export function getEventsForDate(date: Date, now: Date): CalendarEvent[] {
  const offsetDays = daysBetween(date, now);
  return calendarEvents
    .filter((event) => event.offsetDays === offsetDays)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}
