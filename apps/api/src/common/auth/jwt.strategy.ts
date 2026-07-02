import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { JwtBlacklistService } from '@/infrastructure/redis/jwt-blacklist.service';

interface JwtPayload {
  sub: string;
  tenantId: string;
  jti: string;
  enabledModules?: string[];
  locale?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtBlacklist: JwtBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const blacklisted = await this.jwtBlacklist.isBlacklisted(payload.jti);
    if (blacklisted) {
      throw new UnauthorizedException('Token revoked');
    }

    const [user, tenant] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          roles: {
            include: {
              role: {
                include: { permissions: { include: { permission: true } } },
              },
            },
          },
        },
      }),
      this.prisma.tenant.findUnique({ where: { id: payload.tenantId } }),
    ]);

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found');
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
      enabledModules: tenant?.enabledModules || [],
      roles: user.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        permissions: ur.role.permissions.map((rp) => rp.permission.code),
      })),
    };
  }
}
