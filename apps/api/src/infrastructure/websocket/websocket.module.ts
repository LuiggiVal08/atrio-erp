import { Global, Module } from '@nestjs/common';
import { MainGateway } from './main.gateway';

@Global()
@Module({
  providers: [MainGateway],
  exports: [MainGateway],
})
export class WebSocketModule {}
