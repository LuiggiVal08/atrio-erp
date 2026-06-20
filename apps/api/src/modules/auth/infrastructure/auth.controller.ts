import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LoginUseCase } from '../application/login.use-case';
import { LogoutUseCase } from '../application/logout.use-case';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { JwtAuthAdapter } from './jwt-auth.adapter';
import { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly jwtAuthAdapter: JwtAuthAdapter,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email, password, and tenant ID' })
  async login(@Body() dto: LoginDto) {
    try {
      const result = await this.loginUseCase.execute(dto);
      const payload = { sub: result.user.id, tenantId: dto.tenantId, jti: result.jti };
      const accessToken = this.jwtAuthAdapter.sign(payload);
      return { accessToken, user: result.user };
    } catch (error: any) {
      throw new UnauthorizedException(error.message || 'Invalid credentials');
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  async logout(@Req() req: Request) {
    const user = (req as any).user;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const payload = this.decodeToken(token);
    if (payload) {
      await this.logoutUseCase.execute(payload, 900);
    }
  }

  private decodeToken(token: string): { sub: string; jti: string } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      return { sub: payload.sub, jti: payload.jti };
    } catch {
      return null;
    }
  }
}
