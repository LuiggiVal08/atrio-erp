export type DeliveryTiming = 'EARLY' | 'ON_TIME' | 'LATE' | 'UNKNOWN';

export const MS_PER_DAY = 86_400_000;

export function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / MS_PER_DAY;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function classifyDelivery(expected: Date | null, received: Date | null): {
  timing: DeliveryTiming;
  delayDays: number | null;
} {
  if (!expected || !received) return { timing: 'UNKNOWN', delayDays: null };

  const delayDays = Math.round((startOfUtcDay(received) - startOfUtcDay(expected)) / MS_PER_DAY);
  if (delayDays < 0) return { timing: 'EARLY', delayDays };
  if (delayDays > 0) return { timing: 'LATE', delayDays };
  return { timing: 'ON_TIME', delayDays: 0 };
}
