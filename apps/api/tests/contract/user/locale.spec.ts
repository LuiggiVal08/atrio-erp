import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('User Locale API (contract)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('PATCH /api/v1/users/me/locale should return 400 without valid body', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/users/me/locale')
      .send({ locale: 'invalid' })
      .expect(400);
    expect(res.body).toHaveProperty('message');
  });
});
