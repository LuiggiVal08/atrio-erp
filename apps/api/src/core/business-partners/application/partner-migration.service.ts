import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { PARTNER_REPOSITORY } from '../domain/partner.repository.interface';
import type { PartnerRepository, CreatePartnerData, CreateContactData } from '../domain/partner.repository.interface';
import type {
  LegacyClient,
  LegacyVendor,
  NormalizedPartner,
  NormalizedContact,
  ValidationResult,
  MatchResult,
  MigrationReport,
  MatchConfidence,
  MatchCriteria,
  NormalizationChange,
} from '../domain/migration.types';

@Injectable()
export class PartnerMigrationService {
  private readonly logger = new Logger(PartnerMigrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PARTNER_REPOSITORY) private readonly partnerRepository: PartnerRepository,
  ) {}

  async runMigration(tenantId: string, batchId: string): Promise<MigrationReport> {
    const startTime = Date.now();
    const report: MigrationReport = {
      batchId,
      clientsRead: 0,
      vendorsRead: 0,
      partnersCreated: 0,
      rolesCustomer: 0,
      rolesSupplier: 0,
      autoMerged: 0,
      manualReview: 0,
      errors: 0,
      warnings: 0,
      elapsedMs: 0,
      startTime: new Date(startTime).toISOString(),
      endTime: '',
      matchDistribution: { byTaxId: 0, byEmail: 0, byPhone: 0, byName: 0, byManual: 0 },
      normalizationChanges: [],
    };

    try {
      const legacyClients = await this.extractClients(tenantId);
      const legacyVendors = await this.extractVendors(tenantId);
      report.clientsRead = legacyClients.length;
      report.vendorsRead = legacyVendors.length;

      const normalized = [
        ...legacyClients.map((c) => this.normalizeClient(c, tenantId)),
        ...legacyVendors.map((v) => this.normalizeVendor(v, tenantId)),
      ];

      for (const n of normalized) {
        report.normalizationChanges.push(...n.changes);
      }

      const validated = normalized.map((n) => this.validate(n));
      for (const v of validated) {
        report.warnings += v.warnings.length;
        report.errors += v.errors.length;
      }
      const validRecords = validated.filter((v) => v.valid).map((v) => v.record);

      for (const record of validRecords) {
        const mapEntry = await this.prisma.partnerMigrationMap.findFirst({
          where: { legacyType: record.legacyType, legacyId: record.legacyId },
        });
        if (mapEntry) continue;

        const matchResult = await this.match(record);

        if (matchResult.matchedPartnerId) {
          await this.loadMerge(matchResult, batchId);
          this.tallyMatch(report, matchResult.matchedBy);
          if (matchResult.matchConfidence !== 'LOW') {
            report.autoMerged++;
          } else {
            report.manualReview++;
            await this.enqueueReview(batchId, record, 'name_match_low_confidence');
          }
        } else {
          await this.loadNew(matchResult, batchId);
          report.partnersCreated++;
        }

        if (record.legacyType === 'client') report.rolesCustomer++;
        else report.rolesSupplier++;
      }

      report.endTime = new Date().toISOString();
      report.elapsedMs = Date.now() - startTime;
    } catch (err) {
      this.logger.error('Migration failed', err);
      report.endTime = new Date().toISOString();
      report.elapsedMs = Date.now() - startTime;
    }

    return report;
  }

  // ── Extract ──────────────────────────────────────────────────────
  async extractClients(tenantId: string): Promise<LegacyClient[]> {
    return this.prisma.client.findMany({
      where: { tenantId, deletedAt: null },
    }) as unknown as LegacyClient[];
  }

  async extractVendors(tenantId: string): Promise<LegacyVendor[]> {
    return this.prisma.vendor.findMany({
      where: { tenantId, deletedAt: null },
    }) as unknown as LegacyVendor[];
  }

  // ── Normalize ────────────────────────────────────────────────────
  normalizeClient(client: LegacyClient, tenantId: string): NormalizedPartner {
    const changes: NormalizationChange[] = [];
    const type = this.determineType(client.legalName, client.firstName, client.lastName);
    const legalName = this.buildLegalName(client.legalName, client.firstName, client.lastName, client.middleName, client.secondLastName);
    const tenantCountry = 'VE';

    if (client.legalName !== legalName) {
      changes.push({ field: 'legalName', from: client.legalName || null, to: legalName, reason: 'built_from_person_parts' });
    }

    if (!client.legalName && client.firstName) {
      changes.push({ field: 'type', from: null, to: type, reason: 'inferred_from_name_structure' });
    }

    if (client.taxId && client.taxId !== client.taxId?.trim()) {
      changes.push({ field: 'taxIdValue', from: client.taxId, to: client.taxId.trim(), reason: 'trimmed_whitespace' });
    }

    if (client.contributorType) {
      changes.push({ field: 'metadataNotes', from: null, to: `Contributor: ${client.contributorType}`, reason: 'mapped_contributor_type' });
    }

    return {
      tenantId,
      type,
      legalName,
      taxIdValue: client.taxId || null,
      taxIdCountry: tenantCountry,
      taxIdType: client.identificationType || null,
      commercialName: null,
      email: client.email?.toLowerCase() || null,
      phone: client.phone || null,
      status: client.isActive ? 'ACTIVE' : 'INACTIVE',
      metadataSource: 'client',
      metadataNotes: client.contributorType ? `Contributor: ${client.contributorType}` : null,
      externalId: client.documentId || null,
      legacyType: 'client',
      legacyId: client.id,
      changes,
    };
  }

  normalizeVendor(vendor: LegacyVendor, tenantId: string): NormalizedPartner {
    const changes: NormalizationChange[] = [];
    const type = this.determineType(vendor.legalName, vendor.firstName, vendor.lastName);
    const legalName = this.buildLegalName(vendor.legalName, vendor.firstName, vendor.lastName, vendor.middleName, vendor.secondLastName);
    const tenantCountry = 'VE';

    if (vendor.legalName !== legalName) {
      changes.push({ field: 'legalName', from: vendor.legalName || null, to: legalName, reason: 'built_from_person_parts' });
    }

    if (!vendor.legalName && vendor.firstName) {
      changes.push({ field: 'type', from: null, to: type, reason: 'inferred_from_name_structure' });
    }

    return {
      tenantId,
      type,
      legalName,
      taxIdValue: vendor.taxId || null,
      taxIdCountry: tenantCountry,
      taxIdType: vendor.identificationType || null,
      commercialName: null,
      email: vendor.email?.toLowerCase() || null,
      phone: vendor.phone || null,
      status: vendor.isActive ? 'ACTIVE' : 'INACTIVE',
      metadataSource: 'vendor',
      metadataNotes: null,
      externalId: vendor.documentId || null,
      legacyType: 'vendor',
      legacyId: vendor.id,
      changes,
    };
  }

  // ── Validate ─────────────────────────────────────────────────────
  validate(record: NormalizedPartner): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.legalName?.trim()) errors.push('legalName is required');
    if (!record.tenantId) errors.push('tenantId is required');

    if (record.taxIdValue && record.taxIdValue.length > 50) {
      warnings.push('taxIdValue is unusually long');
    }

    return { record, valid: errors.length === 0, warnings, errors };
  }

  // ── Match ────────────────────────────────────────────────────────
  async match(record: NormalizedPartner): Promise<MatchResult> {
    const mapEntry = await this.findExistingMap(record.legacyType, record.legacyId);
    if (mapEntry) {
      return {
        matchedPartnerId: mapEntry.partnerId,
        matchConfidence: 'HIGH',
        matchedBy: 'MANUAL',
        normalized: record,
        contacts: [],
      };
    }

    if (record.taxIdValue) {
      const existing = await this.partnerRepository.findByTaxId(record.tenantId, {
        value: record.taxIdValue,
        country: record.taxIdCountry ?? 'VE',
        type: record.taxIdType ?? '',
      });
      if (existing) {
        return {
          matchedPartnerId: existing.id,
          matchConfidence: 'HIGH',
          matchedBy: 'TAX_ID',
          normalized: record,
          contacts: [],
        };
      }
    }

    if (record.email) {
      const existing = await this.partnerRepository.findMany({
        tenantId: record.tenantId,
        search: record.email,
        pageSize: 10,
      });
      const matched = existing.data.find((p) =>
        p.primaryContact?.email?.toLowerCase() === record.email?.toLowerCase(),
      );
      if (matched) {
        return {
          matchedPartnerId: matched.id,
          matchConfidence: 'MEDIUM',
          matchedBy: 'EMAIL',
          normalized: record,
          contacts: [],
        };
      }
    }

    return {
      matchedPartnerId: undefined,
      matchConfidence: 'LOW',
      matchedBy: null,
      normalized: record,
      contacts: this.buildContacts(record),
    };
  }

  // ── Load: new partner ────────────────────────────────────────────
  private async loadNew(result: MatchResult, batchId: string): Promise<void> {
    const r = result.normalized;
    const systemId = await this.getSystemUserId(r.tenantId);

    const createData: CreatePartnerData = {
      tenantId: r.tenantId,
      type: r.type,
      legalName: r.legalName,
      taxId: r.taxIdValue
        ? { value: r.taxIdValue, country: r.taxIdCountry ?? 'VE', type: r.taxIdType ?? '' }
        : null,
      commercialName: r.commercialName ?? null,
      status: r.status,
      metadataSource: r.metadataSource ?? null,
      metadataNotes: r.metadataNotes ?? null,
      externalId: r.externalId ?? null,
      createdById: systemId,
      updatedById: systemId,
      roles: [r.legacyType === 'client' ? 'CUSTOMER' : 'SUPPLIER'],
    };

    const partner = await this.partnerRepository.create(createData);

    for (const contact of result.contacts) {
      const contactData: CreateContactData = {
        partnerId: partner.id,
        fullName: contact.fullName,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
        isPrimary: contact.isPrimary,
        createdById: systemId,
        updatedById: systemId,
      };
      await this.partnerRepository.addContact(contactData);
    }

    await this.recordMap(r.legacyType, r.legacyId, partner.id, r, result.matchedBy, result.matchConfidence, batchId);
  }

  // ── Load: merge into existing partner ────────────────────────────
  private async loadMerge(result: MatchResult, batchId: string): Promise<void> {
    const r = result.normalized;

    if (!result.matchedPartnerId) return;
    const existingRole = r.legacyType === 'client' ? 'CUSTOMER' : 'SUPPLIER';
    await this.partnerRepository.assignRole(result.matchedPartnerId, existingRole);

    await this.recordMap(r.legacyType, r.legacyId, result.matchedPartnerId, r, result.matchedBy, result.matchConfidence, batchId);
  }

  // ── Helpers ──────────────────────────────────────────────────────
  private tallyMatch(report: MigrationReport, matchedBy: MatchCriteria | null): void {
    if (!matchedBy) return;
    if (matchedBy === 'TAX_ID') report.matchDistribution.byTaxId++;
    else if (matchedBy === 'EMAIL') report.matchDistribution.byEmail++;
    else if (matchedBy === 'PHONE') report.matchDistribution.byPhone++;
    else if (matchedBy === 'NAME') report.matchDistribution.byName++;
    else if (matchedBy === 'MANUAL') report.matchDistribution.byManual++;
  }

  private async findExistingMap(legacyType: string, legacyId: string) {
    return this.prisma.partnerMigrationMap.findUnique({
      where: { legacyType_legacyId: { legacyType, legacyId } },
    });
  }

  private async enqueueReview(batchId: string, record: NormalizedPartner, reason: string): Promise<void> {
    await this.prisma.partnerMigrationReview.create({
      data: {
        batchId,
        legacyType: record.legacyType,
        legacyId: record.legacyId,
        reason,
      },
    });
  }

  private async recordMap(
    legacyType: string,
    legacyId: string,
    partnerId: string,
    record: NormalizedPartner,
    matchedBy: MatchCriteria | null,
    confidence: MatchConfidence,
    batchId: string,
  ): Promise<void> {
    await this.prisma.partnerMigrationMap.create({
      data: {
        legacyType,
        legacyId,
        partnerId,
        migrationBatch: batchId,
        matchedBy,
        confidence,
        payload: { changes: record.changes } as object,
      },
    });
  }

  private buildContacts(record: NormalizedPartner): NormalizedContact[] {
    const contacts: NormalizedContact[] = [];
    if (record.email || record.phone) {
      contacts.push({
        partnerLegacyType: record.legacyType,
        partnerLegacyId: record.legacyId,
        fullName: record.legalName,
        email: record.email,
        phone: record.phone,
        isPrimary: true,
      });
    }
    return contacts;
  }

  private determineType(legalName: string, firstName?: string | null, lastName?: string | null): 'PERSON' | 'COMPANY' {
    if (!legalName && firstName) return 'PERSON';
    if (!legalName) return 'COMPANY';
    return legalName.includes(',') || legalName.includes('S.A.') || legalName.includes('C.A.') || legalName.includes('Ltda.') ? 'COMPANY' : 'PERSON';
  }

  private buildLegalName(legalName: string, firstName?: string | null, lastName?: string | null, middleName?: string | null, secondLastName?: string | null): string {
    if (legalName?.trim()) return legalName.trim();
    const parts = [firstName, middleName, lastName, secondLastName].filter(Boolean);
    return parts.join(' ') || 'UNKNOWN';
  }

  private async getSystemUserId(tenantId: string): Promise<string> {
    const admin = await this.prisma.user.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        roles: { some: { role: { name: { in: ['super-admin', 'Admin', 'admin'] } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (admin) return admin.id;

    const fallback = await this.prisma.user.findFirst({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    if (fallback) return fallback.id;

    throw new Error(`No user available to attribute the migration operation in tenant ${tenantId}`);
  }
}
