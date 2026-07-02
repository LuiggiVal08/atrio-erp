import { Module } from '@nestjs/common';
import { ClientVendorController } from './infrastructure/client-vendor.controller';
import { PrismaClientVendorRepository } from './infrastructure/prisma-client-vendor.repository';
import { ClientService } from './application/client.service';
import { VendorService } from './application/vendor.service';

@Module({
  imports: [],
  controllers: [ClientVendorController],
  providers: [
    ClientService,
    VendorService,
    { provide: 'ClientVendorRepository', useClass: PrismaClientVendorRepository },
  ],
  exports: ['ClientVendorRepository'],
})
export class ClientVendorModule {}
