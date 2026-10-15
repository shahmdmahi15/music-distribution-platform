import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) - Root greeting', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(
        'This is music distribution platform api design by Shah Md Mahi from RoyalMotionIT!',
      );
  });

  it('/health (GET) - Liveness and health check', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('/operational (GET) - Operational readiness', async () => {
    const response = await request(app.getHttpServer())
      .get('/operational')
      .expect(200);

    expect(response.body).toEqual({ operational: true });
  });
});
