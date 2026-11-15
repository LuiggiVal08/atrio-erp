import { Injectable } from '@nestjs/common';
import type { PartnerWithRelations } from '@/core/business-partners/domain/partner.entity';
import type { CreateVendorData } from '../domain/client-vendor.repository.interface';
import { Vendor } from '../domain/vendor.entity';

/**
 * Maps PartnerWithRelations → Vendor entity.
 *
 * ⚠️ Limitation: Business Partners supports multiple contacts per partner,
 * but the legacy Vendor entity exposes a single contact with firstName/lastName,
 * identification, email, and phone. The mapper uses the primary contact
 * (isPrimary === true) when available, falling back to the first contact.
 * The `legacy` parameter preserves original CreateVendorData for name fields
 * that have no Partner equivalent (firstName, lastName, etc.).
 * This is a compatibility shim — new code should consume PartnerWithRelations directly.
 */
@Injectable()
export class PartnerToVendorMapper {
  toVendor(p: PartnerWithRelations, legacy?: CreateVendorData): Vendor {
    const primaryContact = p.contacts?.find((c) => c.isPrimary);
    const ownerContact = p.contacts?.find((c) => c.position === 'Dueño' && !c.deletedAt);

    return new Vendor(
      p.id,
      p.tenantId,
      p.externalId ?? p.id,
      p.taxId?.type ?? null,
      p.legalName,
      legacy?.firstName ?? null,
      legacy?.middleName ?? null,
      legacy?.lastName ?? null,
      legacy?.secondLastName ?? null,
      p.taxId?.value ?? '',
      (ownerContact ?? primaryContact ?? p.contacts?.[0])?.email ?? null,
      (ownerContact ?? primaryContact ?? p.contacts?.[0])?.phone ?? null,
      null,
      legacy?.contactFirstName ?? null,
      legacy?.contactMiddleName ?? null,
      legacy?.contactLastName ?? null,
      legacy?.contactSecondLastName ?? null,
      ownerContact?.identificationType ?? legacy?.contactIdentificationType ?? null,
      ownerContact?.identificationNumber ?? legacy?.contactIdentificationNumber ?? null,
      primaryContact?.email ?? legacy?.contactEmail ?? null,
      primaryContact?.phone ?? legacy?.contactPhone ?? null,
      p.status === 'ACTIVE',
      p.createdAt,
      p.updatedAt,
      p.deletedAt ?? null,
      p.commercialName ?? null,
      p.website ?? null,
      p.paymentTerms ?? null,
      p.deliveryDays ?? null,
      p.metadataNotes ?? null,
      p.tags?.map((t) => t.value) ?? [],
      p.categories?.map((c) => c.categoryId) ?? [],
      p.categories?.map((c) => ({ id: c.categoryId, name: c.name })) ?? [],
      (p.contacts ?? []).map((c) => ({
        id: c.id,
        fullName: c.fullName,
        position: c.position ?? null,
        email: c.email ?? null,
        phone: c.phone ?? null,
        mobile: c.mobile ?? null,
        identificationType: c.identificationType ?? null,
        identificationNumber: c.identificationNumber ?? null,
        isPrimary: c.isPrimary,
      })),
    );
  }

  matchesActiveFilter(partner: PartnerWithRelations, isActive?: boolean): boolean {
    if (isActive === undefined) return true;
    return (partner.status === 'ACTIVE') === isActive;
  }

  /**
   * Determines partner type (PERSON / COMPANY) from legacy input data.
   * PERSON if no legalName but firstName present, or if legalName doesn't
   * contain common corporate suffixes. COMPANY otherwise.
   */
  determineType(data: { legalName: string; firstName?: string | null; lastName?: string | null }): 'PERSON' | 'COMPANY' {
    if (!data.legalName && data.firstName) return 'PERSON';
    if (!data.legalName) return 'COMPANY';
    return data.legalName.includes(',') || data.legalName.includes('S.A.') || data.legalName.includes('C.A.') || data.legalName.includes('Ltda.') ? 'COMPANY' : 'PERSON';
  }
}
