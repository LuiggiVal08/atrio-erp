import { AuthSessionService } from '../../../src/common/auth/auth-session.service';
import { resolveSessionTimeoutMinutes } from '../../../src/common/auth/session-timeout';

describe('AuthSessionService', () => {
  const redis = {
    set: jest.fn(),
    get: jest.fn(),
    eval: jest.fn(),
    del: jest.fn(),
  };
  let sessions: AuthSessionService;

  beforeEach(() => {
    jest.clearAllMocks();
    sessions = new AuthSessionService(redis as any);
  });

  it('stores the refresh session with its absolute expiry', async () => {
    const session = {
      userId: 'user-id',
      tenantId: 'tenant-id',
      refreshJti: 'refresh-id',
      lastActivityAt: 1000,
      idleTimeoutMinutes: 60,
    };

    await sessions.create('session-id', session, 604800);

    expect(redis.set).toHaveBeenCalledWith(
      'auth-session:session-id',
      JSON.stringify(session),
      'EX',
      604800,
    );
  });

  it('validates access tokens against both session state and the revocation list', async () => {
    redis.eval.mockResolvedValue(1);

    await expect(
      sessions.validateAccess('session-id', 'token-id', 'user-id', 'tenant-id', 2000),
    ).resolves.toBe(true);

    expect(redis.eval.mock.calls[0][1]).toBe(2);
    expect(redis.eval.mock.calls[0][3]).toBe('jtl:token-id');
  });

  it('rotates a refresh token only when Redis confirms the current token is still active', async () => {
    redis.eval.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    await expect(
      sessions.rotate('session-id', 'user-id', 'old-id', 'new-id', 'tenant-id', 60, 604800),
    ).resolves.toBe(true);
    await expect(
      sessions.rotate('session-id', 'user-id', 'old-id', 'other-id', 'tenant-id', 60, 604800),
    ).resolves.toBe(false);
  });

  it('loads the session and revokes it on logout', async () => {
    redis.get.mockResolvedValue('{"userId":"user-id"}');

    await expect(sessions.find('session-id')).resolves.toEqual({ userId: 'user-id' });
    await sessions.revoke('session-id');

    expect(redis.get).toHaveBeenCalledWith('auth-session:session-id');
    expect(redis.del).toHaveBeenCalledWith('auth-session:session-id');
  });
});

describe('resolveSessionTimeoutMinutes', () => {
  it('uses the saved tenant setting when it is a supported whole number', () => {
    expect(resolveSessionTimeoutMinutes({ sessionTimeout: 45 })).toBe(45);
  });

  it.each([undefined, null, {}, { sessionTimeout: 0 }, { sessionTimeout: 1.5 }, { sessionTimeout: 1441 }])(
    'falls back to the default for invalid settings: %j',
    (settings) => {
      expect(resolveSessionTimeoutMinutes(settings)).toBe(60);
    },
  );
});
