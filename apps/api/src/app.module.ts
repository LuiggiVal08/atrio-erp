import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { WebSocketModule } from './infrastructure/websocket/websocket.module';
import { AuthFoundationModule } from './common/auth/auth.module';
import { AuditModule } from './common/audit/audit.module';
import { AuthModule } from './modules/auth/infrastructure/auth.module';
import { TenantModule } from './modules/tenant/infrastructure/tenant.module';
import { RbacModule } from './modules/rbac/infrastructure/rbac.module';
import { UserModule } from './modules/user/infrastructure/user.module';
import { EmployeeModule } from './modules/employee/infrastructure/employee.module';
import { DocumentModule } from './modules/document-engine/infrastructure/document.module';
import { TenantScopeMiddleware } from './common/middleware/tenant-scope.middleware';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    WebSocketModule,
    AuthFoundationModule,
    AuditModule,
    TenantModule,
    AuthModule,
    RbacModule,
    UserModule,
    EmployeeModule,
    DocumentModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantScopeMiddleware).forRoutes('*');
  }
}
