import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

const logger = new Logger('RedisService');
const ERROR_LOG_INTERVAL_MS = 10_000;

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private lastErrorLogAt = 0;

  constructor() {
    super({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      connectTimeout: 3000,
      commandTimeout: 2000,
      retryStrategy: (times) => Math.min(times * 200, 5000),
    });

    // Without a listener ioredis prints every reconnect failure, flooding the logs.
    this.on('error', (error: Error) => {
      const now = Date.now();
      if (now - this.lastErrorLogAt >= ERROR_LOG_INTERVAL_MS) {
        this.lastErrorLogAt = now;
        logger.warn(`Redis connection error: ${error.message}`);
      }
    });
  }

  async onModuleDestroy() {
    await this.quit();
  }
}
