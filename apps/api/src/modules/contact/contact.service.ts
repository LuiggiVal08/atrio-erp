import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(data: { name: string; email: string; company: string; message: string }) {
    return this.prisma.contactInquiry.create({ data });
  }
}
