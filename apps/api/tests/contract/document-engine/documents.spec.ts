import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('Document API Contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /tenants/:tenantId/documents', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/tenants/t1/documents')
        .send({ documentType: 'sales_invoice', lines: [] })
        .expect(401);
    });
  });

  describe('GET /tenants/:tenantId/documents', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/tenants/t1/documents')
        .expect(401);
    });
  });

  describe('POST /tenants/:tenantId/documents/:id/submit', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/tenants/t1/documents/doc-1/submit')
        .expect(401);
    });
  });

  describe('POST /tenants/:tenantId/documents/:id/approve', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/tenants/t1/documents/doc-1/approve')
        .expect(401);
    });
  });

  describe('POST /tenants/:tenantId/documents/:id/reject', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/tenants/t1/documents/doc-1/reject')
        .send({ rejectionReason: 'Missing data' })
        .expect(401);
    });
  });

  describe('POST /tenants/:tenantId/documents/:id/transition', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/tenants/t1/documents/doc-1/transition')
        .send({ targetStatus: 'delivered' })
        .expect(401);
    });
  });

  describe('POST /tenants/:tenantId/documents/:id/counter', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/tenants/t1/documents/doc-1/counter')
        .send({ counterDocumentType: 'credit_note', lines: [] })
        .expect(401);
    });
  });

  describe('DELETE /tenants/:tenantId/documents/:id', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .delete('/tenants/t1/documents/doc-1')
        .expect(401);
    });
  });

  describe('GET /tenants/:tenantId/documents/:id', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/tenants/t1/documents/doc-1')
        .expect(401);
    });
  });

  describe('GET /tenants/:tenantId/documents/:id/events', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/tenants/t1/documents/doc-1/events')
        .expect(401);
    });
  });
});
