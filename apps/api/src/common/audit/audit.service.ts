import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    tenantId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    resource?: string;
    before?: any;
    after?: any;
  }) {
    await this.prisma.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        ...(params.resource ? { resource: params.resource } : {}),
        action: params.action as any,
        before: params.before || null,
        after: params.after || null,
        userId: params.userId,
        tenantId: params.tenantId,
      },
    });
  }
}
