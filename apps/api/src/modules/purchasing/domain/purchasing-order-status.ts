import { createStateMachine } from '@/common/state-machine/state-machine';

export type PurchasingOrderStatus = 'DRAFT' | 'APPROVED' | 'RECEIVING' | 'COMPLETED';

export const purchasingOrderStateMachine = createStateMachine<PurchasingOrderStatus>({
  DRAFT: ['APPROVED'],
  APPROVED: ['RECEIVING'],
  RECEIVING: ['COMPLETED'],
  COMPLETED: [],
});
