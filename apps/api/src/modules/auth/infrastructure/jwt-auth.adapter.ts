import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class JwtAuthAdapter {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: Record<string, any>): string {
    return this.jwtService.sign(payload);
  }

  signRefresh(payload: Record<string, unknown>): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-secret',
      expiresIn: (process.env.JWT_REFRESH_EXPIRATION || '7d') as JwtSignOptions['expiresIn'],
    });
  }

  verifyRefresh(token: string): Promise<Record<string, unknown>> {
    return this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-secret',
    });
  }
}
