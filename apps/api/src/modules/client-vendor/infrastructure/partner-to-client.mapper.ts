import { Injectable } from '@nestjs/common';
import type { PartnerWithRelations } from '@/core/business-partners/domain/partner.entity';
import { Client } from '../domain/client.entity';

/**
 * Maps PartnerWithRelations → Client entity.
 *
 * ⚠️ Limitation: Business Partners supports multiple contacts per partner,
 * but the legacy Client entity exposes only a single email/phone pair.
 * The mapper uses the primary contact (isPrimary === true) when available,
 * falling back to the first contact in the list.
 * This is a compatibility shim — new code should consume PartnerWithRelations directly.
 */
@Injectable()
export class PartnerToClientMapper {
  toClient(p: PartnerWithRelations): Client {
    const primary = p.contacts?.find((c) => c.isPrimary);

    return new Client(
      p.id,
      p.tenantId,
      p.externalId ?? p.id,
      p.taxId?.type ?? null,
      p.legalName,
      null,
      null,
      null,
      null,
      p.taxId?.value ?? '',
      primary?.email ?? p.contacts?.[0]?.email ?? null,
      primary?.phone ?? p.contacts?.[0]?.phone ?? null,
      null,
      null,
      p.status === 'ACTIVE',
      p.createdAt,
      p.updatedAt,
      p.deletedAt ?? null,
    );
  }

  matchesActiveFilter(partner: PartnerWithRelations, isActive?: boolean): boolean {
    if (isActive === undefined) return true;
    return (partner.status === 'ACTIVE') === isActive;
  }
}
