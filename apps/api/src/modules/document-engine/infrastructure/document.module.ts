import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { DocumentController } from './document.controller';
import { DocumentAuditInterceptor } from './document-audit.interceptor';
import { DocumentStateMachine } from '../domain/document-state-machine';
import { CreateDocumentUseCase } from '../application/create-document.use-case';
import { SubmitDocumentUseCase } from '../application/submit-document.use-case';
import { ApproveDocumentUseCase } from '../application/approve-document.use-case';
import { CreateCounterDocumentUseCase } from '../application/create-counter-document.use-case';
import { TransitionDocumentUseCase } from '../application/transition-document.use-case';
import { QueryDocumentUseCase } from '../application/query-document.use-case';
import { PrismaDocumentRepository } from './prisma-document.repository';
import { PrismaDocumentEventRepository } from './prisma-document-event.repository';
import { DocumentEventEmitter } from './document-event-emitter';

export const DOCUMENT_REPOSITORY = 'DOCUMENT_REPOSITORY';
export const DOCUMENT_EVENT_REPOSITORY = 'DOCUMENT_EVENT_REPOSITORY';
export const DOCUMENT_STATE_MACHINE = 'DOCUMENT_STATE_MACHINE';
export const DOCUMENT_EVENT_EMITTER = 'DOCUMENT_EVENT_EMITTER';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [DocumentController],
  providers: [
    { provide: DOCUMENT_REPOSITORY, useClass: PrismaDocumentRepository },
    { provide: DOCUMENT_EVENT_REPOSITORY, useClass: PrismaDocumentEventRepository },
    { provide: DOCUMENT_STATE_MACHINE, useFactory: () => new DocumentStateMachine() },
    DocumentEventEmitter,
    { provide: DOCUMENT_EVENT_EMITTER, useExisting: DocumentEventEmitter },
    { provide: APP_INTERCEPTOR, useClass: DocumentAuditInterceptor },
    {
      provide: CreateDocumentUseCase,
      useFactory: (repo: any) => new CreateDocumentUseCase(repo),
      inject: [DOCUMENT_REPOSITORY],
    },
    {
      provide: SubmitDocumentUseCase,
      useFactory: (repo: any, sm: any) => new SubmitDocumentUseCase(repo, sm),
      inject: [DOCUMENT_REPOSITORY, DOCUMENT_STATE_MACHINE],
    },
    {
      provide: ApproveDocumentUseCase,
      useFactory: (repo: any, sm: any, emitter: any, prisma: PrismaService) =>
        new ApproveDocumentUseCase(repo, sm, emitter, prisma),
      inject: [DOCUMENT_REPOSITORY, DOCUMENT_STATE_MACHINE, DOCUMENT_EVENT_EMITTER, PrismaService],
    },
    {
      provide: CreateCounterDocumentUseCase,
      useFactory: (repo: any, sm: any, eventRepo: any, emitter: any, prisma: PrismaService) =>
        new CreateCounterDocumentUseCase(repo, sm, eventRepo, emitter, prisma),
      inject: [DOCUMENT_REPOSITORY, DOCUMENT_STATE_MACHINE, DOCUMENT_EVENT_REPOSITORY, DOCUMENT_EVENT_EMITTER, PrismaService],
    },
    {
      provide: TransitionDocumentUseCase,
      useFactory: (repo: any, sm: any, eventRepo: any, emitter: any, prisma: PrismaService) =>
        new TransitionDocumentUseCase(repo, sm, eventRepo, emitter, prisma),
      inject: [DOCUMENT_REPOSITORY, DOCUMENT_STATE_MACHINE, DOCUMENT_EVENT_REPOSITORY, DOCUMENT_EVENT_EMITTER, PrismaService],
    },
    {
      provide: QueryDocumentUseCase,
      useFactory: (repo: any, eventRepo: any) => new QueryDocumentUseCase(repo, eventRepo),
      inject: [DOCUMENT_REPOSITORY, DOCUMENT_EVENT_REPOSITORY],
    },
  ],
  exports: [],
})
export class DocumentModule {}
