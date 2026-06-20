import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';

describe('Document Engine Integration', () => {
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('should compile the module successfully', () => {
    expect(moduleFixture).toBeDefined();
  });

  it('should have DocumentModule configured', () => {
    const app = moduleFixture.createNestApplication();
    expect(app).toBeDefined();
    app.close();
  });
});
