import { classifyDelivery, addDays, startOfUtcDay } from '@/modules/purchasing/application/delivery-classification';

describe('delivery classification', () => {
  it('classifies a delivery received before the expected day as early', () => {
    const result = classifyDelivery(new Date('2026-01-10T12:00:00Z'), new Date('2026-01-08T23:00:00Z'));
    expect(result).toEqual({ timing: 'EARLY', delayDays: -2 });
  });

  it('classifies a delivery received on the expected day as on time regardless of the hour', () => {
    const result = classifyDelivery(new Date('2026-01-10T08:00:00Z'), new Date('2026-01-10T20:00:00Z'));
    expect(result).toEqual({ timing: 'ON_TIME', delayDays: 0 });
  });

  it('classifies a delivery received after the expected day as late', () => {
    const result = classifyDelivery(new Date('2026-01-10T08:00:00Z'), new Date('2026-01-11T08:00:00Z'));
    expect(result).toEqual({ timing: 'LATE', delayDays: 1 });
  });

  it('returns unknown when there is no reference or no received date', () => {
    expect(classifyDelivery(null, new Date('2026-01-10T08:00:00Z'))).toEqual({ timing: 'UNKNOWN', delayDays: null });
    expect(classifyDelivery(new Date('2026-01-10T08:00:00Z'), null)).toEqual({ timing: 'UNKNOWN', delayDays: null });
  });

  it('compares calendar days in UTC', () => {
    expect(startOfUtcDay(new Date('2026-01-10T23:59:59Z'))).toBe(Date.UTC(2026, 0, 10));
    expect(classifyDelivery(new Date('2026-01-10T23:00:00Z'), new Date('2026-01-11T00:30:00Z')).delayDays).toBe(1);
  });

  it('adds days without mutating the original date', () => {
    const original = new Date('2026-01-01T00:00:00Z');
    const next = addDays(original, 5);
    expect(next.toISOString()).toBe('2026-01-06T00:00:00.000Z');
    expect(original.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });
});
