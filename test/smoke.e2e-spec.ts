import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('Melo API Smoke Tests (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  const testEmail = `ci_test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testUsername = `user_${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    await app.init();
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Health Check', () => {
    it('GET /api/health should return 200 OK', async () => {
      const response = await request(app.getHttpServer()).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.data || response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Authentication Lifecycle', () => {
    it('POST /api/auth/register should create user and return tokens', async () => {
      const response = await request(app.getHttpServer()).post('/api/auth/register').send({
        email: testEmail,
        password: testPassword,
        username: testUsername,
        displayName: 'CI Smoke Tester',
      });

      expect([200, 201]).toContain(response.status);
      const data = response.body.data || response.body;
      expect(data).toHaveProperty('accessToken');
    });

    it('POST /api/auth/login should authenticate user and provide JWT', async () => {
      const response = await request(app.getHttpServer()).post('/api/auth/login').send({
        emailOrUsername: testEmail,
        password: testPassword,
      });

      expect(response.status).toBe(200);
      const data = response.body.data || response.body;
      expect(data).toHaveProperty('accessToken');
      jwtToken = data.accessToken;
    });

    it('GET /api/users/me should reject request without Bearer token (401)', async () => {
      const response = await request(app.getHttpServer()).get('/api/users/me');
      expect(response.status).toBe(401);
    });

    it('GET /api/users/me should return user profile with valid Bearer token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      const data = response.body.data || response.body;
      expect(data).toHaveProperty('email', testEmail);
    });
  });

  describe('Music Search & Streaming Engine', () => {
    it('GET /api/search should query Jamendo music tracks with auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/search')
        .set('Authorization', `Bearer ${jwtToken}`)
        .query({ q: 'hiphop', service: 'jamendo', limit: 5 });

      expect(response.status).toBe(200);
      const data = response.body.data || response.body;
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
    }, 15000);

    it('POST /api/stream should resolve Jamendo audio stream URL with auth', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/stream')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          trackId: '1363876',
          service: 'jamendo',
        });

      expect(response.status).toBe(200);
      const data = response.body.data || response.body;
      expect(data).toHaveProperty('streamUrl');
    }, 15000);
  });
});
