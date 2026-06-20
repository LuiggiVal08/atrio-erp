import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class JwtBlacklistService {
  constructor(private readonly redis: RedisService) {}

  async blacklist(jti: string, expiresIn: number): Promise<void> {
    await this.redis.set(`jtl:${jti}`, '1', 'EX', expiresIn);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const result = await this.redis.exists(`jtl:${jti}`);
    return result === 1;
  }
}
