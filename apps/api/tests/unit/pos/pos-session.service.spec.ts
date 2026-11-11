import { PosSessionService } from '../../../src/modules/pos/application/pos-session.service';
import { PosSession } from '../../../src/modules/pos/domain/pos-session.entity';
import type { PosRepository } from '../../../src/modules/pos/domain/pos.repository.interface';

function makeSession(overrides: Partial<{
  userId: string;
  cashRegisterId: string;
  status: string;
}> = {}) {
  const now = new Date();
  return new PosSession(
    'session-1',
    'tenant-1',
    overrides.cashRegisterId ?? 'register-1',
    overrides.userId ?? 'user-1',
    100,
    null,
    overrides.status ?? 'open',
    now,
    null,
    now,
    now,
  );
}

describe('PosSessionService', () => {
  let service: PosSessionService;
  let repository: jest.Mocked<PosRepository>;

  beforeEach(() => {
    repository = {
      createSession: jest.fn(),
      findSessionById: jest.fn(),
      findSessionByTenant: jest.fn(),
      findOpenSession: jest.fn(),
      findSessionsByTenant: jest.fn(),
      closeSession: jest.fn(),
    };
    service = new PosSessionService(repository);
  });

  it('does not close a session that does not exist', async () => {
    repository.findSessionByTenant.mockResolvedValue(null);

    await expect(
      service.close('missing', 0, {}, 'tenant-1'),
    ).rejects.toThrow('Session not found');
    expect(repository.closeSession).not.toHaveBeenCalled();
  });

  it('closes an open session', async () => {
    const session = makeSession();
    repository.findSessionByTenant.mockResolvedValue(session);
    repository.closeSession.mockResolvedValue(session);

    await service.close(session.id, 100, {}, 'tenant-1');

    expect(repository.closeSession).toHaveBeenCalledWith(session.id, 100, {});
  });

  it('does not close a session that is no longer open', async () => {
    repository.findSessionByTenant.mockResolvedValue(makeSession({ status: 'closed' }));

    await expect(
      service.close('session-1', 100, {}, 'tenant-1'),
    ).rejects.toThrow('Session is not open');
    expect(repository.closeSession).not.toHaveBeenCalled();
  });

  it('requires an explanation when the closing amount differs from the expected amount', async () => {
    repository.findSessionByTenant.mockResolvedValue(makeSession());

    await expect(
      service.close('session-1', 105, { closingDifference: 5 }, 'tenant-1'),
    ).rejects.toThrow('La observación es obligatoria cuando existe un sobrante o faltante');
    expect(repository.closeSession).not.toHaveBeenCalled();
  });

  it('does not let a user open a second concurrent session', async () => {
    repository.findOpenSession.mockResolvedValue(null);
    repository.findSessionsByTenant.mockResolvedValue([
      makeSession({ userId: 'user-1', cashRegisterId: 'register-2' }),
    ]);

    await expect(
      service.open({
        tenantId: 'tenant-1',
        cashRegisterId: 'register-1',
        userId: 'user-1',
        openingBalance: 0,
      }),
    ).rejects.toThrow('Ya tiene una caja abierta');
    expect(repository.createSession).not.toHaveBeenCalled();
  });
});
