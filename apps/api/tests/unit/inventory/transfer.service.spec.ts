import { TransferService } from '../../../src/modules/inventory/application/transfer.service';
import { InventoryRepository } from '../../../src/modules/inventory/domain/inventory.repository.interface';

describe('TransferService', () => {
  const transfer = {
    id: 'tr-1', tenantId: 't1', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2',
    productId: 'prod-1', quantity: 10, status: 'pending', pendingQuantity: 10,
  };
  const repo = {
    findProductById: jest.fn(), findWarehouseById: jest.fn(), getStock: jest.fn(),
    createTransfer: jest.fn(), findTransfersByTenant: jest.fn(), findTransferById: jest.fn(),
    dispatchTransfer: jest.fn(), receiveTransfer: jest.fn(), cancelTransfer: jest.fn(),
  };
  const service = new TransferService(repo as unknown as InventoryRepository);

  beforeEach(() => {
    jest.resetAllMocks();
    repo.findProductById.mockResolvedValue({ id: 'prod-1', tenantId: 't1', isActive: true, isService: false });
    repo.findWarehouseById.mockResolvedValue({ tenantId: 't1', isActive: true });
    repo.getStock.mockResolvedValue({ quantity: 20, committedQuantity: 0 });
    repo.findTransferById.mockResolvedValue(transfer);
    repo.createTransfer.mockResolvedValue(transfer);
  });

  it('creates a transfer with sufficient available stock', async () => {
    expect(await service.create(transfer)).toMatchObject({ status: 'pending' });
    expect(repo.createTransfer).toHaveBeenCalledWith(transfer);
    expect(repo.getStock).toHaveBeenCalledWith('prod-1', 'wh-1', 't1');
  });

  it('subtracts committed stock from availability on creation', async () => {
    repo.getStock.mockResolvedValue({ quantity: 20, committedQuantity: 15 });
    await expect(service.create(transfer)).rejects.toThrow('Insufficient stock in source warehouse');
    expect(repo.createTransfer).not.toHaveBeenCalled();
  });

  it('rejects transfers to the same warehouse', async () => {
    await expect(service.create({ ...transfer, toWarehouseId: transfer.fromWarehouseId }))
      .rejects.toThrow('Source and destination warehouses must be different');
  });

  it.each([0, -1, NaN, Infinity])('rejects invalid quantity %s', async (quantity) => {
    await expect(service.create({ ...transfer, quantity })).rejects.toThrow('Quantity must be positive');
    expect(repo.createTransfer).not.toHaveBeenCalled();
  });

  it('rejects insufficient stock on creation', async () => {
    repo.getStock.mockResolvedValue({ quantity: 3, committedQuantity: 0 });
    await expect(service.create(transfer)).rejects.toThrow('Insufficient stock in source warehouse');
  });

  it('rejects an inactive or foreign warehouse', async () => {
    repo.findWarehouseById.mockResolvedValueOnce({ tenantId: 'other', isActive: true });
    await expect(service.create(transfer)).rejects.toThrow('Active transfer resources not found');
    repo.findWarehouseById.mockResolvedValueOnce({ tenantId: 't1', isActive: false });
    await expect(service.create(transfer)).rejects.toThrow('Active transfer resources not found');
    expect(repo.createTransfer).not.toHaveBeenCalled();
  });

  it('lists transfers for the tenant', async () => {
    repo.findTransfersByTenant.mockResolvedValue([transfer]);
    expect(await service.findAll('t1')).toEqual([transfer]);
    expect(repo.findTransfersByTenant).toHaveBeenCalledWith('t1');
  });

  it('finds the transfer using tenant-first service arguments', async () => {
    expect(await service.findById('t1', 'tr-1')).toEqual(transfer);
    expect(repo.findTransferById).toHaveBeenCalledWith('tr-1');
  });

  it('rejects missing and foreign transfers', async () => {
    repo.findTransferById.mockResolvedValueOnce(null);
    await expect(service.findById('t1', 'missing')).rejects.toThrow('Transfer not found');
    await expect(service.findById('other', 'tr-1')).rejects.toThrow('Transfer not found');
    await expect(service.dispatch('other', 'tr-1')).rejects.toThrow('Transfer not found');
    await expect(service.cancel('other', 'tr-1')).rejects.toThrow('Transfer not found');
    expect(repo.dispatchTransfer).not.toHaveBeenCalled();
    expect(repo.cancelTransfer).not.toHaveBeenCalled();
  });

  it('dispatches a pending transfer with tenant and actor', async () => {
    repo.dispatchTransfer.mockResolvedValue({ ...transfer, status: 'in_transit' });
    expect(await service.dispatch('t1', 'tr-1', 'actor')).toMatchObject({ status: 'in_transit' });
    expect(repo.dispatchTransfer).toHaveBeenCalledWith('tr-1', 't1', 'actor');
  });

  it('receives an in-transit transfer and forwards shortage closure', async () => {
    repo.findTransferById.mockResolvedValue({ ...transfer, status: 'in_transit', pendingQuantity: 10 });
    repo.receiveTransfer.mockResolvedValue({ ...transfer, status: 'completed', receivedQuantity: 8, shortageQuantity: 2 });
    expect(await service.receive('t1', 'tr-1', { quantity: 8, closeShortage: true, userId: 'actor' }))
      .toMatchObject({ status: 'completed', shortageQuantity: 2 });
    expect(repo.receiveTransfer).toHaveBeenCalledWith('tr-1', 't1', { quantity: 8, closeShortage: true, userId: 'actor' });
  });

  it('validates receipt status and quantity before mutating', async () => {
    await expect(service.receive('t1', 'tr-1', { quantity: 1 }))
      .rejects.toThrow('Only in-transit transfers can be received');

    repo.findTransferById.mockResolvedValue({ ...transfer, status: 'in_transit', pendingQuantity: 2 });
    await expect(service.receive('t1', 'tr-1', { quantity: 3 }))
      .rejects.toThrow('Received quantity exceeds the pending transfer quantity');
    await expect(service.receive('t1', 'tr-1', { quantity: 0 }))
      .rejects.toThrow('Received quantity must be positive');
    await expect(service.receive('t1', 'tr-1', { quantity: -1 }))
      .rejects.toThrow('Received quantity must be zero or positive');
    expect(repo.receiveTransfer).not.toHaveBeenCalled();
  });

  it('rejects dispatch and cancellation outside pending status', async () => {
    repo.findTransferById.mockResolvedValue({ ...transfer, status: 'completed' });
    await expect(service.dispatch('t1', 'tr-1')).rejects.toThrow('Only pending transfers can be dispatched');
    await expect(service.cancel('t1', 'tr-1')).rejects.toThrow('Only pending transfers can be cancelled');
  });

  it('cancels a pending transfer in its tenant', async () => {
    repo.cancelTransfer.mockResolvedValue({ ...transfer, status: 'cancelled' });
    expect(await service.cancel('t1', 'tr-1')).toMatchObject({ status: 'cancelled' });
    expect(repo.cancelTransfer).toHaveBeenCalledWith('tr-1', 't1');
  });
});
