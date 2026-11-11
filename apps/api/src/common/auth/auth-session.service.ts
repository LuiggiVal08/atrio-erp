import { Injectable } from '@nestjs/common';
import { RedisService } from '@/infrastructure/redis/redis.service';

export interface AuthSession {
  userId: string;
  tenantId: string;
  refreshJti: string;
  lastActivityAt: number;
  idleTimeoutMinutes: number;
}

const VALIDATE_ACCESS_SCRIPT = `
  if redis.call('EXISTS', KEYS[2]) == 1 then
    return 0
  end
  local raw = redis.call('GET', KEYS[1])
  if not raw then return 0 end
  local session = cjson.decode(raw)
  if session.userId ~= ARGV[1] or session.tenantId ~= ARGV[2] then
    return 0
  end
  if tonumber(ARGV[3]) - tonumber(session.lastActivityAt) >= tonumber(session.idleTimeoutMinutes) * 60000 then
    redis.call('DEL', KEYS[1])
    return 0
  end
  return 1
`;

const TOUCH_SESSION_SCRIPT = `
  local raw = redis.call('GET', KEYS[1])
  if not raw then return 0 end
  local session = cjson.decode(raw)
  if session.userId ~= ARGV[1] or session.tenantId ~= ARGV[2] then
    return 0
  end
  if tonumber(ARGV[3]) - tonumber(session.lastActivityAt) >= tonumber(ARGV[4]) * 60000 then
    redis.call('DEL', KEYS[1])
    return 0
  end
  session.lastActivityAt = tonumber(ARGV[3])
  session.idleTimeoutMinutes = tonumber(ARGV[4])
  redis.call('SET', KEYS[1], cjson.encode(session), 'KEEPTTL')
  return 1
`;

const ROTATE_SESSION_SCRIPT = `
  local raw = redis.call('GET', KEYS[1])
  if not raw then return 0 end
  local session = cjson.decode(raw)
  if session.userId ~= ARGV[1] or session.refreshJti ~= ARGV[2] then
    return 0
  end
  if tonumber(ARGV[5]) - tonumber(session.lastActivityAt) >= tonumber(ARGV[6]) * 60000 then
    redis.call('DEL', KEYS[1])
    return 0
  end
  session.tenantId = ARGV[3]
  session.refreshJti = ARGV[4]
  session.idleTimeoutMinutes = tonumber(ARGV[6])
  redis.call('SET', KEYS[1], cjson.encode(session), 'EX', tonumber(ARGV[7]))
  return 1
`;

@Injectable()
export class AuthSessionService {
  constructor(private readonly redis: RedisService) {}

  async create(sessionId: string, session: AuthSession, ttlSeconds: number): Promise<void> {
    await this.redis.set(this.key(sessionId), JSON.stringify(session), 'EX', ttlSeconds);
  }

  async find(sessionId: string): Promise<AuthSession | null> {
    const raw = await this.redis.get(this.key(sessionId));
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  }

  async validateAccess(
    sessionId: string,
    jti: string,
    userId: string,
    tenantId: string,
    now = Date.now(),
  ): Promise<boolean> {
    const result = await this.redis.eval(
      VALIDATE_ACCESS_SCRIPT,
      2,
      this.key(sessionId),
      `jtl:${jti}`,
      userId,
      tenantId,
      String(now),
    );
    return Number(result) === 1;
  }

  async touch(
    sessionId: string,
    userId: string,
    tenantId: string,
    idleTimeoutMinutes: number,
    now = Date.now(),
  ): Promise<boolean> {
    const result = await this.redis.eval(
      TOUCH_SESSION_SCRIPT,
      1,
      this.key(sessionId),
      userId,
      tenantId,
      String(now),
      String(idleTimeoutMinutes),
    );
    return Number(result) === 1;
  }

  async rotate(
    sessionId: string,
    userId: string,
    currentRefreshJti: string,
    nextRefreshJti: string,
    tenantId: string,
    idleTimeoutMinutes: number,
    ttlSeconds: number,
    now = Date.now(),
  ): Promise<boolean> {
    const result = await this.redis.eval(
      ROTATE_SESSION_SCRIPT,
      1,
      this.key(sessionId),
      userId,
      currentRefreshJti,
      tenantId,
      nextRefreshJti,
      String(now),
      String(idleTimeoutMinutes),
      String(ttlSeconds),
    );
    return Number(result) === 1;
  }

  async revoke(sessionId: string): Promise<void> {
    await this.redis.del(this.key(sessionId));
  }

  private key(sessionId: string): string {
    return `auth-session:${sessionId}`;
  }
}
