import { Injectable, Logger } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class BusinessMetricsService {
  private readonly logger = new Logger(BusinessMetricsService.name);
  private readonly checkoutDuration: promClient.Histogram;
  private readonly paymentDuration: promClient.Histogram;
  private readonly paymentsTotal: promClient.Counter;
  private readonly paymentErrors: promClient.Counter;
  private readonly stockConflicts: promClient.Counter;

  constructor() {
    const labelNames = ['tenant_id'] as const;

    this.checkoutDuration = new promClient.Histogram({
      name: 'pos_checkout_duration_seconds',
      help: 'Checkout duration in seconds',
      labelNames,
      buckets: [0.1, 0.3, 0.5, 1, 2, 5],
    });

    this.paymentDuration = new promClient.Histogram({
      name: 'pos_payment_duration_seconds',
      help: 'Payment duration in seconds',
      labelNames,
      buckets: [0.1, 0.3, 0.5, 1, 2, 5],
    });

    this.paymentsTotal = new promClient.Counter({
      name: 'pos_payments_total',
      help: 'Total number of POS payments',
      labelNames: [...labelNames, 'status'],
    });

    this.paymentErrors = new promClient.Counter({
      name: 'pos_payment_errors_total',
      help: 'POS payment errors by type',
      labelNames: [...labelNames, 'error_type'],
    });

    this.stockConflicts = new promClient.Counter({
      name: 'pos_stock_conflicts_total',
      help: 'Stock race conditions detected during payment',
      labelNames,
    });
  }

  observeCheckout(tenantId: string, durationMs: number): void {
    this.checkoutDuration.labels(tenantId).observe(durationMs / 1000);
  }

  observePayment(tenantId: string, durationMs: number): void {
    this.paymentDuration.labels(tenantId).observe(durationMs / 1000);
  }

  incrementPaymentsTotal(tenantId: string, status: string): void {
    this.paymentsTotal.labels(tenantId, status).inc();
  }

  incrementPaymentError(tenantId: string, errorType: string): void {
    this.paymentErrors.labels(tenantId, errorType).inc();
  }

  incrementStockConflict(tenantId: string): void {
    this.stockConflicts.labels(tenantId).inc();
  }

  getMetrics(): Promise<string> {
    return promClient.register.metrics();
  }
}
