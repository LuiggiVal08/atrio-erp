import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { RedisService } from '@/infrastructure/redis/redis.service';

interface HealthChecks {
  database: 'up' | 'down';
  redis: 'up' | 'down';
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Readiness probe (no auth required)' })
  async check() {
    const checks: HealthChecks = { database: 'down', redis: 'down' };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'up';
    } catch (error) {
      this.logger.warn(`Database health check failed: ${(error as Error).message}`);
    }

    if (this.redis.status === 'ready') {
      try {
        await this.redis.ping();
        checks.redis = 'up';
      } catch (error) {
        this.logger.warn(`Redis health check failed: ${(error as Error).message}`);
      }
    }

    if (checks.database === 'down' || checks.redis === 'down') {
      const down = Object.entries(checks)
        .filter(([, state]) => state === 'down')
        .map(([name]) => name);
      throw new ServiceUnavailableException({
        message: `Unhealthy dependencies: ${down.join(', ')}`,
        checks,
      });
    }

    return { status: 'ok', checks };
  }
}
