import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthAdapter {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: Record<string, any>): string {
    return this.jwtService.sign(payload);
  }
}
