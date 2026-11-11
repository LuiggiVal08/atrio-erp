import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BusinessMetricsService } from './business-metrics.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: BusinessMetricsService) {}

  @Get('business')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @ApiOperation({ summary: 'Prometheus business metrics' })
  async getBusinessMetrics(): Promise<string> {
    return this.metrics.getMetrics();
  }
}
