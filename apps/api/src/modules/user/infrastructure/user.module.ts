import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { CreateUserUseCase } from '../application/create-user.use-case';
import { ManageUserUseCase } from '../application/manage-user.use-case';
import { PrismaUserRepository } from './prisma-user.repository';

export const USER_REPOSITORY = 'USER_REPOSITORY';

@Module({
  controllers: [UserController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    {
      provide: CreateUserUseCase,
      useFactory: (repo: any) => new CreateUserUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: ManageUserUseCase,
      useFactory: (repo: any) => new ManageUserUseCase(repo),
      inject: [USER_REPOSITORY],
    },
  ],
  exports: [],
})
export class UserModule {}
