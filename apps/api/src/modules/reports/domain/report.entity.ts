export enum ReportType {
  SALES = 'SALES',
  INVENTORY = 'INVENTORY',
  CASH = 'CASH',
  CLIENTS = 'CLIENTS',
  TAXES = 'TAXES',
  PROFIT = 'PROFIT',
}

export enum ReportFormat {
  PDF = 'PDF',
  XLSX = 'XLSX',
  CSV = 'CSV',
}

export class Report {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly type: ReportType,
    public readonly format: ReportFormat,
    public readonly filters: Record<string, any> | null,
    public readonly data: Record<string, any>[],
    public readonly generatedAt: Date,
    public readonly periodStart: Date | null,
    public readonly periodEnd: Date | null,
  ) {}
}
