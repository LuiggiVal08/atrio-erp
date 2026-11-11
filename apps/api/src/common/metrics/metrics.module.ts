import { Module } from '@nestjs/common';
import { BusinessMetricsService } from './business-metrics.service';
import { MetricsController } from './metrics.controller';

@Module({
  controllers: [MetricsController],
  providers: [BusinessMetricsService],
  exports: [BusinessMetricsService],
})
export class MetricsModule {}
