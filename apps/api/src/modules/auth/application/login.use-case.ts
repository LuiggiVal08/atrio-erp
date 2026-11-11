import * as bcrypt from 'bcryptjs';
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthRepository, LoginData } from '../domain/auth.repository.interface';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { validateUuid } from '@/common/utils/validation';
import { resolveSessionTimeoutMinutes } from '@/common/auth/session-timeout';

const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    imageUrl: string | null;
    phone: string | null;
    tenantId: string;
    locale: string;
    enabledModules: string[];
    permissions: string[];
    sessionTimeoutMinutes: number;
  };
  jti: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: LoginData & { tenant?: string }): Promise<LoginResult> {
    let tenantId = dto.tenantId;

    if (!tenantId && dto.tenant) {
      if (UUID_REGEX.test(dto.tenant)) {
        tenantId = dto.tenant;
      } else {
        const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenant } });
        if (!tenant) throw new BadRequestException('Invalid tenant slug');
        tenantId = tenant.id;
      }
    }

    if (!tenantId) throw new BadRequestException('Tenant ID or slug is required');

    validateUuid(tenantId, 'tenantId');
    const user = await this.authRepository.findUserByEmail(dto.email, tenantId);

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'blocked' && user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: attempts };

      if (attempts >= LOCK_THRESHOLD) {
        updateData.status = 'blocked';
        updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }

      await this.authRepository.updateLoginAttempts(user.id, updateData);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.authRepository.updateLoginAttempts(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { enabledModules: true, settings: true },
    });
    const accessRoles = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          where: { role: { tenantId } },
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
    const permissions = accessRoles?.roles.flatMap((userRole) =>
      userRole.role.permissions.map((rolePermission) => rolePermission.permission.code),
    ) ?? [];

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl ?? null,
        phone: user.phone ?? null,
        tenantId,
        locale: user.locale,
        enabledModules: tenant?.enabledModules ?? [],
        permissions,
        sessionTimeoutMinutes: resolveSessionTimeoutMinutes(tenant?.settings),
      },
      jti: crypto.randomUUID(),
    };
  }

  async findAccessibleTenants(email: string) {
    const userRecords = await this.prisma.user.findMany({
      where: { email, deletedAt: null },
      include: {
        tenant: { select: { id: true, slug: true, legalName: true } },
        userAccess: {
          where: { isActive: true },
          include: {
            tenant: { select: { id: true, slug: true, legalName: true } },
          },
        },
      },
    });

    const tenants = new Map<string, { id: string; slug: string; legalName: string; isHome: boolean }>();

    for (const u of userRecords) {
      tenants.set(u.tenantId, { ...u.tenant, isHome: true });
      for (const acc of u.userAccess) {
        if (!tenants.has(acc.tenantId)) {
          tenants.set(acc.tenantId, { ...acc.tenant, isHome: false });
        }
      }
    }

    return Array.from(tenants.values());
  }
}
