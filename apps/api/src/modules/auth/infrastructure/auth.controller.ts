import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LoginUseCase } from '../application/login.use-case';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { AuthSessionService } from '@/common/auth/auth-session.service';
import { JwtAuthAdapter } from './jwt-auth.adapter';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Request, Response } from 'express';
import { resolveSessionTimeoutMinutes } from '@/common/auth/session-timeout';

const REFRESH_COOKIE = 'atrio_refresh';

function refreshTtlSeconds(): number {
  const duration = process.env.JWT_REFRESH_EXPIRATION || '7d';
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) throw new Error(`Unsupported JWT_REFRESH_EXPIRATION: ${duration}`);
  const amount = Number(match[1]);
  const unitSeconds = { s: 1, m: 60, h: 3600, d: 86400 }[match[2] as 's' | 'm' | 'h' | 'd'];
  const ttlSeconds = amount * unitSeconds;
  if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error('JWT_REFRESH_EXPIRATION must be a positive, safe duration');
  }
  return ttlSeconds;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly jwtAuthAdapter: JwtAuthAdapter,
    private readonly authSessions: AuthSessionService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email, password, and tenant slug or ID' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.loginUseCase.execute(dto);
    const sid = crypto.randomUUID();
    const refreshJti = crypto.randomUUID();
    const payload = {
      sub: result.user.id,
      tenantId: result.user.tenantId,
      jti: result.jti,
      sid,
      type: 'access',
    };
    const accessToken = this.jwtAuthAdapter.sign(payload);
    const refreshToken = this.jwtAuthAdapter.signRefresh({
      sub: result.user.id,
      tenantId: result.user.tenantId,
      sid,
      jti: refreshJti,
      type: 'refresh',
    });
    const ttlSeconds = refreshTtlSeconds();
    await this.authSessions.create(
      sid,
      {
        userId: result.user.id,
        tenantId: result.user.tenantId,
        refreshJti,
        lastActivityAt: Date.now(),
        idleTimeoutMinutes: result.user.sessionTimeoutMinutes,
      },
      ttlSeconds,
    );
    this.setRefreshCookie(req, res, refreshToken, ttlSeconds);
    return { accessToken, user: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the refresh token and issue a new access token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.readRefreshCookie(req);
    if (!refreshToken) throw new UnauthorizedException('Refresh token is missing');

    let payload: Record<string, unknown>;
    try {
      payload = await this.jwtAuthAdapter.verifyRefresh(refreshToken);
    } catch {
      this.clearRefreshCookie(req, res);
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const { sub, tenantId, sid, jti } = payload;
    if (
      typeof sub !== 'string' ||
      typeof tenantId !== 'string' ||
      typeof sid !== 'string' ||
      typeof jti !== 'string' ||
      payload.type !== 'refresh'
    ) {
      this.clearRefreshCookie(req, res);
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const session = await this.authSessions.find(sid);
    if (
      !session ||
      session.userId !== sub ||
      session.tenantId !== tenantId ||
      session.refreshJti !== jti
    ) {
      this.clearRefreshCookie(req, res);
      throw new UnauthorizedException('Session expired or refresh token revoked');
    }

    const [user, tenant] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: sub },
        select: { id: true, status: true, deletedAt: true },
      }),
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true },
      }),
    ]);
    if (!user || user.deletedAt || user.status !== 'active' || !tenant) {
      await this.authSessions.revoke(sid);
      this.clearRefreshCookie(req, res);
      throw new UnauthorizedException('User or tenant is no longer active');
    }

    const idleTimeoutMinutes = resolveSessionTimeoutMinutes(tenant.settings);
    const nextRefreshJti = crypto.randomUUID();
    const ttlSeconds = refreshTtlSeconds();
    const nextRefreshToken = this.jwtAuthAdapter.signRefresh({
      sub,
      tenantId,
      sid,
      jti: nextRefreshJti,
      type: 'refresh',
    });
    const accessToken = this.jwtAuthAdapter.sign({
      sub,
      tenantId,
      sid,
      jti: crypto.randomUUID(),
      type: 'access',
    });
    const rotated = await this.authSessions.rotate(
      sid,
      sub,
      jti,
      nextRefreshJti,
      tenantId,
      idleTimeoutMinutes,
      ttlSeconds,
    );
    if (!rotated) {
      this.clearRefreshCookie(req, res);
      throw new UnauthorizedException('Session expired or refresh token already used');
    }

    this.setRefreshCookie(req, res, nextRefreshToken, ttlSeconds);
    return { accessToken };
  }

  @Post('activity')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record activity and extend the idle session window' })
  async recordActivity(@CurrentUser() user: any) {
    if (!user.sid) return;
    const active = await this.authSessions.touch(
      user.sid,
      user.id,
      user.tenantId,
      user.sessionTimeoutMinutes,
    );
    if (!active) throw new UnauthorizedException('Session expired');
  }

  @Post('login/tenants')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find accessible tenants for an email' })
  async findTenants(@Body() body: { email: string }) {
    if (!body.email) throw new BadRequestException('Email is required');
    const tenants = await this.loginUseCase.findAccessibleTenants(body.email);
    return { tenants };
  }

  @Post('switch-tenant')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Switch to a different accessible tenant' })
  async switchTenant(
    @Body() body: { tenantId: string },
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const targetTenantId = body.tenantId;
    if (!targetTenantId) throw new BadRequestException('tenantId is required');

    if (targetTenantId !== user.tenantId) {
      const access = await this.prisma.userAccess.findUnique({
        where: { userId_tenantId: { userId: user.id, tenantId: targetTenantId } },
      });
      if (!access?.isActive) throw new UnauthorizedException('Access denied to this tenant');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: targetTenantId },
      select: { id: true, slug: true, legalName: true, enabledModules: true, settings: true },
    });
    if (!tenant) throw new BadRequestException('Tenant not found');

    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, imageUrl: true, phone: true, locale: true, tenantId: true },
    });
    if (!currentUser) throw new UnauthorizedException('User not found');

    const accessRoles = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          where: { role: { tenantId: targetTenantId } },
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
    const permissions = accessRoles?.roles.flatMap((userRole) =>
      userRole.role.permissions.map((rolePermission) => rolePermission.permission.code),
    ) ?? [];

    const sid = user.sid as string | undefined;
    const accessToken = this.jwtAuthAdapter.sign({
      sub: user.id,
      tenantId: targetTenantId,
      sid,
      jti: crypto.randomUUID(),
      type: 'access',
    });
    if (sid) {
      const active = await this.authSessions.touch(
        sid,
        user.id,
        user.tenantId,
        user.sessionTimeoutMinutes,
      );
      if (!active) throw new UnauthorizedException('Session expired');
      const session = await this.authSessions.find(sid);
      if (!session) throw new UnauthorizedException('Session expired');
      const refreshJti = crypto.randomUUID();
      const ttlSeconds = refreshTtlSeconds();
      const refreshToken = this.jwtAuthAdapter.signRefresh({
        sub: user.id,
        tenantId: targetTenantId,
        sid,
        jti: refreshJti,
        type: 'refresh',
      });
      const rotated = await this.authSessions.rotate(
        sid,
        user.id,
        session.refreshJti,
        refreshJti,
        targetTenantId,
        resolveSessionTimeoutMinutes(tenant.settings),
        ttlSeconds,
      );
      if (!rotated) throw new UnauthorizedException('Session expired or changed');
      this.setRefreshCookie(req, res, refreshToken, ttlSeconds);
    }

    return {
      accessToken,
      user: {
        ...currentUser,
        tenantId: targetTenantId,
        enabledModules: tenant.enabledModules,
        permissions,
        sessionTimeoutMinutes: resolveSessionTimeoutMinutes(tenant.settings),
      },
    };
  }

  @Get('tenants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List accessible tenants for current user' })
  async myTenants(@CurrentUser() user: any) {
    const home = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { id: true, slug: true, legalName: true },
    });

    const accessRecords = await this.prisma.userAccess.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        tenant: { select: { id: true, slug: true, legalName: true } },
      },
    });

    const tenants = [{ ...home, isHome: true }];
    for (const acc of accessRecords) {
      if (acc.tenantId !== user.tenantId) {
        tenants.push({ ...acc.tenant, isHome: false });
      }
    }

    return { tenants };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.readRefreshCookie(req);
    let payload: Record<string, unknown> | undefined;
    if (refreshToken) {
      try {
        payload = await this.jwtAuthAdapter.verifyRefresh(refreshToken);
      } catch {
        payload = undefined;
      }
    }
    if (payload?.type === 'refresh' && typeof payload.sid === 'string') {
      await this.authSessions.revoke(payload.sid);
    }
    this.clearRefreshCookie(req, res);
    return { success: true };
  }

  private setRefreshCookie(req: Request, res: Response, token: string, ttlSeconds: number) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: ttlSeconds * 1000,
    });
  }

  private clearRefreshCookie(req: Request, res: Response) {
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https',
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }

  private readRefreshCookie(req: Request): string | undefined {
    const prefix = `${REFRESH_COOKIE}=`;
    const cookie = req.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix));
    if (!cookie) return undefined;
    try {
      return decodeURIComponent(cookie.slice(prefix.length));
    } catch {
      return undefined;
    }
  }
}
