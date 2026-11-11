import { createStateMachine } from '@/common/state-machine/state-machine';

export type GoodsReceiptStatus = 'PENDING' | 'RECEIVED';

export const goodsReceiptStateMachine = createStateMachine<GoodsReceiptStatus>({
  PENDING: ['RECEIVED'],
  RECEIVED: [],
});
