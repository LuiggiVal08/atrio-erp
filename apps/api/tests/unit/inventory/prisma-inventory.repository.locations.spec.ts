import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaInventoryRepository } from '../../../src/modules/inventory/infrastructure/prisma-inventory.repository';

const counts = { aisles: 1, shelves: 1, levels: 1, bins: 1 };
const node = (id: string, path: string, type = 'AISLE', parentId: string | null = null) => ({
  id, tenantId: 't1', warehouseId: 'w1', path, type, parentId,
  code: path.split('/').at(-1), name: null, isActive: true, createdAt: new Date(), updatedAt: new Date(),
});

function setup(initial = [node('a', 'A')]) {
  let nodes = structuredClone(initial);
  const tx = {
    warehouse: { findFirst: jest.fn().mockResolvedValue({ id: 'w1', tenantId: 't1', isActive: true, branchId: null }) },
    storageLocation: {
      findFirst: jest.fn().mockImplementation(async ({ where }) => structuredClone(nodes.find(n => n.id === where.id && n.tenantId === where.tenantId) ?? null)),
      findMany: jest.fn().mockImplementation(async ({ where }) => structuredClone(nodes.filter(n => n.tenantId === where.tenantId && n.warehouseId === where.warehouseId))),
      update: jest.fn().mockImplementation(async ({ where, data }) => {
        const index = nodes.findIndex(n => n.id === where.id && n.tenantId === where.tenantId);
        nodes[index] = { ...nodes[index], ...data };
        return structuredClone(nodes[index]);
      }),
      createMany: jest.fn().mockImplementation(async ({ data }) => { nodes.push(...structuredClone(data)); return { count: data.length }; }),
    },
  };
  const prisma = { ...tx, $transaction: jest.fn().mockImplementation(async fn => {
    const before = structuredClone(nodes);
    try { return await fn(tx); } catch (error) { nodes = before; throw error; }
  }) };
  return { repo: new PrismaInventoryRepository(prisma as any), prisma, tx, nodes: () => nodes };
}

const tree = () => [node('a', 'A'), node('s', 'A/1', 'SHELF', 'a'), node('l', 'A/1/1', 'LEVEL', 's'), node('b', 'A/1/1/01', 'BIN', 'l')];

describe('transactional storage locations', () => {
  it('renames the whole subtree without touching sibling paths or foreign tenants', async () => {
    const otherTenant = { ...node('foreign', 'A/2'), tenantId: 't2' };
    const { repo, prisma, tx, nodes } = setup([...tree(), node('aa', 'AA'), otherTenant]);
    const result = await repo.rewriteStorageLocation('a', 't1', { code: ' B ' });
    expect(result.path).toBe('B');
    expect(nodes().map(n => n.path)).toEqual(['B', 'B/1', 'B/1/1', 'B/1/1/01', 'AA', 'A/2']);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ isolationLevel: 'Serializable' }));
    expect(tx.storageLocation.update).toHaveBeenCalledTimes(4);
    for (const [args] of tx.storageLocation.update.mock.calls) expect(args.where.tenantId).toBe('t1');
  });

  it('rolls back the root rename when a descendant cannot be saved', async () => {
    const { repo, tx, nodes } = setup(tree());
    const update = tx.storageLocation.update.getMockImplementation()!;
    tx.storageLocation.update.mockImplementation(async args => {
      if (args.where.id === 'l') throw new Error('child write failed');
      return update(args);
    });
    await expect(repo.rewriteStorageLocation('a', 't1', { code: 'B' })).rejects.toThrow('child write failed');
    expect(nodes().map(n => n.path)).toEqual(['A', 'A/1', 'A/1/1', 'A/1/1/01']);
  });

  it('rejects renaming a foreign location without writes', async () => {
    const { repo, tx } = setup();
    await expect(repo.rewriteStorageLocation('a', 't2', { code: 'B' })).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.storageLocation.update).not.toHaveBeenCalled();
  });

  it('blocks direct deactivation of a parent with active descendants', async () => {
    const { repo, tx } = setup(tree());
    await expect(repo.rewriteStorageLocation('a', 't1', { isActive: false })).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.storageLocation.update).not.toHaveBeenCalled();
  });

  it('blocks reactivation below an inactive ancestor', async () => {
    const initial = tree(); initial[0].isActive = false; initial[3].isActive = false;
    const { repo, tx } = setup(initial);
    await expect(repo.rewriteStorageLocation('b', 't1', { isActive: true })).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.storageLocation.update).not.toHaveBeenCalled();
  });

  it('generates only missing nodes with their real parent IDs and is idempotent', async () => {
    const { repo, tx, nodes } = setup();
    await expect(repo.generateStorageLocations('t1', 'w1', counts)).resolves.toEqual({ created: 3, total: 4 });
    const [aisle, shelf, level, bin] = nodes();
    expect(shelf).toMatchObject({ type: 'SHELF', code: '1', path: 'A/1', parentId: aisle.id });
    expect(level).toMatchObject({ type: 'LEVEL', code: '1', path: 'A/1/1', parentId: shelf.id });
    expect(bin).toMatchObject({ type: 'BIN', code: '01', path: 'A/1/1/01', parentId: level.id });
    await expect(repo.generateStorageLocations('t1', 'w1', counts)).resolves.toEqual({ created: 0, total: 4 });
    expect(tx.storageLocation.createMany).toHaveBeenCalledTimes(1);
    expect(nodes()).toHaveLength(4);
  });

  it.each([{ isActive: false }, { type: 'BIN' }])('rejects incompatible existing paths: %p', async overrides => {
    const { repo, tx, nodes } = setup([{ ...node('a', 'A'), ...overrides }]);
    await expect(repo.generateStorageLocations('t1', 'w1', counts)).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.storageLocation.createMany).not.toHaveBeenCalled();
    expect(nodes()).toHaveLength(1);
  });

  it('counts all hierarchy nodes before starting a transaction', async () => {
    const { repo, prisma } = setup();
    await expect(repo.generateStorageLocations('t1', 'w1', { aisles: 10, shelves: 10, levels: 10, bins: 4 })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rolls back a failed bulk insert', async () => {
    const { repo, tx, nodes } = setup();
    const insert = tx.storageLocation.createMany.getMockImplementation()!;
    tx.storageLocation.createMany.mockImplementation(async args => { await insert(args); throw new Error('insert failed'); });
    await expect(repo.generateStorageLocations('t1', 'w1', counts)).rejects.toThrow('insert failed');
    expect(nodes()).toHaveLength(1);
  });
});
