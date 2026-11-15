import { PurchaseReturnService } from '../../../src/modules/purchasing/application/purchase-return.service';

describe('PurchaseReturnService lifecycle', () => {
  const lines = [{ productId: 'p1', warehouseId: 'w1', quantity: 2, unitPrice: 3 }];
  function setup(status = 'draft') {
    let ret: any = { id: 'ret-1', tenantId: 't1', purchaseOrderId: 'po-1', status, lines, userId: 'creator', resolution: 'supplier_credit' };
    const repo = {
      findReturnById: jest.fn(async () => ret), validateReturnLines: jest.fn(), deleteReturn: jest.fn(),
      transitionReturnStatus: jest.fn(async (_id, _tenant, expected, next) => {
        if (ret.status !== expected) return null;
        ret = { ...ret, status: next }; return ret;
      }),
    };
    const emitter = { emit: jest.fn() };
    const service = new PurchaseReturnService(repo as any, emitter as any);
    return { repo, emitter, service };
  }

  it('emits once at approved (the existing Procesar action), not at completed or retry', async () => {
    const h = setup();
    await h.service.updateStatus('ret-1', 'approved', 't1', 'actor');
    await h.service.updateStatus('ret-1', 'approved', 't1', 'actor');
    await h.service.updateStatus('ret-1', 'completed', 't1', 'actor');
    expect(h.emitter.emit).toHaveBeenCalledTimes(1);
    expect(h.emitter.emit).toHaveBeenCalledWith('document.returned', expect.objectContaining({
      documentId: 'ret-1', triggeredBy: 'actor', documentType: 'purchase_return',
      metadata: expect.objectContaining({ operationId: 'ret-1', lines: [expect.objectContaining({ lineId: '0', quantity: 2 })] }),
    }));
  });

  it('does not emit when a concurrent transition already won', async () => {
    const h = setup(); h.repo.transitionReturnStatus.mockResolvedValueOnce(null);
    await expect(h.service.updateStatus('ret-1', 'approved', 't1')).rejects.toThrow('changed');
    expect(h.emitter.emit).not.toHaveBeenCalled();
  });

  it.each(['draft', 'cancelled', 'rejected'])('cannot reprocess an approved return through %s', async next => {
    const h = setup('approved');
    await expect(h.service.updateStatus('ret-1', next, 't1')).rejects.toThrow('transition');
    expect(h.emitter.emit).not.toHaveBeenCalled();
  });

  it('rejects foreign returns before resource validation or writes', async () => {
    const h = setup();
    await expect(h.service.updateStatus('ret-1', 'approved', 'other')).rejects.toThrow('not found');
    await expect(h.service.delete('ret-1', 'other')).rejects.toThrow('not found');
    expect(h.repo.transitionReturnStatus).not.toHaveBeenCalled();
  });

  it('does not allow deletion of processed returns', async () => {
    const h = setup('approved');
    await expect(h.service.delete('ret-1', 't1')).rejects.toThrow('processed');
    expect(h.repo.deleteReturn).not.toHaveBeenCalled();
  });
});
