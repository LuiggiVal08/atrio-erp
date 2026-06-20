import { EventEmitter2 } from '@nestjs/event-emitter';
import { DocumentEventEmitter } from '../../../src/modules/document-engine/infrastructure/document-event-emitter';

describe('DocumentEventEmitter', () => {
  let emitter: DocumentEventEmitter;
  let eventEmitter2: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    eventEmitter2 = { emit: jest.fn() } as any;
    emitter = new DocumentEventEmitter(eventEmitter2);
  });

  it('should emit event and status-changed event', () => {
    const payload = {
      eventType: 'document.approved',
      tenantId: 't1',
      documentId: 'd1',
      documentType: 'sales_invoice',
      timestamp: new Date().toISOString(),
      triggeredBy: 'u1',
    };

    emitter.emit('document.approved', payload);

    expect(eventEmitter2.emit).toHaveBeenCalledWith('document.approved', payload);
    expect(eventEmitter2.emit).toHaveBeenCalledWith('document.status-changed', payload);
  });
});
