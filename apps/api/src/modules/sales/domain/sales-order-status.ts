import { createStateMachine } from '@/common/state-machine/state-machine';

export enum SalesOrderStatus {
  DRAFT = 'draft',
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

const ORDERED_STATUSES: SalesOrderStatus[] = [
  SalesOrderStatus.DRAFT,
  SalesOrderStatus.PENDING_PAYMENT,
  SalesOrderStatus.PAID,
  SalesOrderStatus.COMPLETED,
];

export const salesOrderStateMachine = createStateMachine<SalesOrderStatus>({
  [SalesOrderStatus.DRAFT]: [SalesOrderStatus.PENDING_PAYMENT],
  [SalesOrderStatus.PENDING_PAYMENT]: [SalesOrderStatus.PAID],
  [SalesOrderStatus.PAID]: [SalesOrderStatus.COMPLETED],
  [SalesOrderStatus.COMPLETED]: [],
  [SalesOrderStatus.CANCELLED]: [],
});

export function isValidStatus(value: string): value is SalesOrderStatus {
  return Object.values<SalesOrderStatus>(SalesOrderStatus).includes(value as SalesOrderStatus);
}

export function compareStatus(a: SalesOrderStatus, b: SalesOrderStatus): number {
  return ORDERED_STATUSES.indexOf(a) - ORDERED_STATUSES.indexOf(b);
}
