import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { JwtBlacklistService } from '@/infrastructure/redis/jwt-blacklist.service';
import { validateUuid } from '@/common/utils/validation';
import { AuthSessionService } from './auth-session.service';
import { resolveSessionTimeoutMinutes } from './session-timeout';

type UserWithRoles = Prisma.UserGetPayload<{
  include: {
    roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } };
  };
}>;

interface JwtPayload {
  sub: string;
  tenantId: string;
  jti: string;
  sid?: string;
  type?: 'access' | 'refresh';
  enabledModules?: string[];
  locale?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtBlacklist: JwtBlacklistService,
    private readonly authSessions: AuthSessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Refresh tokens cannot be used for API access');
    }

    validateUuid(payload.sub, 'userId');
    validateUuid(payload.tenantId, 'tenantId');

    if (payload.sid) {
      const active = await this.authSessions.validateAccess(
        payload.sid,
        payload.jti,
        payload.sub,
        payload.tenantId,
      );
      if (!active) throw new UnauthorizedException('Session expired or token revoked');
    } else if (await this.jwtBlacklist.isBlacklisted(payload.jti)) {
      throw new UnauthorizedException('Token revoked');
    }

    let user: UserWithRoles | null;
    let tenant: { enabledModules: string[]; settings: unknown } | null;
    try {
      [user, tenant] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: payload.sub },
          include: {
            roles: {
              where: { role: { tenantId: payload.tenantId } },
              include: {
                role: {
                  include: { permissions: { include: { permission: true } } },
                },
              },
            },
          },
        }),
        this.prisma.tenant.findUnique({
          where: { id: payload.tenantId },
          select: { enabledModules: true, settings: true },
        }),
      ]);
    } catch {
      throw new ServiceUnavailableException('Authentication service temporarily unavailable');
    }

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found');
    }

    if (!tenant) {
      throw new UnauthorizedException('Tenant not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User account is not active');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      locale: user.locale,
      tenantId: payload.tenantId,
      enabledModules: tenant.enabledModules,
      sessionTimeoutMinutes: resolveSessionTimeoutMinutes(tenant.settings),
      sid: payload.sid,
      jti: payload.jti,
      roles: user.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        permissions: ur.role.permissions.map((rp) => rp.permission.code),
      })),
    };
  }
}
