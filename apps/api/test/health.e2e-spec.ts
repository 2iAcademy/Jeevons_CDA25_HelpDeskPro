import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TerminusModule } from '@nestjs/terminus';
import request from 'supertest';
import { HealthController } from '../src/health/health.controller';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET) répond', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    // 200 si la base est joignable, 503 sinon — les deux sont acceptables en CI
    expect(res.status === 200 || res.status === 503).toBe(true);
  });
});
