import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { MongoExceptionFilter } from './../src/common/filters/mongo-exception.filter';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';

describe('App E2E Tests', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same configuration as main.ts for realistic testing
    app.setGlobalPrefix('api');

    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter(), new MongoExceptionFilter());

    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public Endpoints', () => {
    describe('GET /api/v1 - API Info', () => {
      it('should return API information', () => {
        return request(app.getHttpServer())
          .get('/api/v1')
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('name');
            expect(res.body.data).toHaveProperty('version');
            expect(res.body.data).toHaveProperty('description');
            expect(res.body.data).toHaveProperty('endpoints');
            expect(res.body.data.name).toBe('NestJS MongoDB Starter API');
          });
      });
    });

    describe('GET /api/v1/health - Health Check', () => {
      it('should return health status', () => {
        return request(app.getHttpServer())
          .get('/api/v1/health')
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('ok');
            expect(res.body.data).toHaveProperty('timestamp');
            expect(res.body.data).toHaveProperty('uptime');
            expect(res.body.data).toHaveProperty('environment');
            expect(typeof res.body.data.uptime).toBe('number');
          });
      });
    });
  });

  describe('Auth Endpoints', () => {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'Test123456!',
      firstName: 'Test',
      lastName: 'User',
    };

    let accessToken: string;
    let refreshToken: string;

    describe('POST /api/v1/auth/register - User Registration', () => {
      it('should register a new user', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send(testUser)
          .expect(201)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('refreshToken');
            expect(res.body.data).toHaveProperty('user');
            expect(res.body.data.user.email).toBe(testUser.email);
            expect(res.body.data.user).not.toHaveProperty('password');

            // Save tokens for subsequent tests
            accessToken = res.body.data.accessToken;
            refreshToken = res.body.data.refreshToken;
          });
      });

      it('should fail with duplicate email', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send(testUser)
          .expect(409)
          .expect((res) => {
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('already exists');
          });
      });

      it('should fail with invalid email', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            ...testUser,
            email: 'invalid-email',
          })
          .expect(400);
      });

      it('should fail with weak password', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            ...testUser,
            email: 'newuser@example.com',
            password: '123',
          })
          .expect(400);
      });
    });

    describe('POST /api/v1/auth/login - User Login', () => {
      it('should login with valid credentials', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('refreshToken');
            expect(res.body.data.user.email).toBe(testUser.email);
          });
      });

      it('should fail with invalid credentials', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: testUser.email,
            password: 'WrongPassword123!',
          })
          .expect(401)
          .expect((res) => {
            expect(res.body.success).toBe(false);
          });
      });

      it('should fail with non-existent user', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'SomePassword123!',
          })
          .expect(401);
      });
    });

    describe('POST /api/v1/auth/refresh - Refresh Token', () => {
      it('should refresh access token with valid refresh token', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/refresh')
          .send({ refreshToken })
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('refreshToken');
          });
      });

      it('should fail with invalid refresh token', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/refresh')
          .send({ refreshToken: 'invalid-token' })
          .expect(401);
      });
    });
  });

  describe('Protected Endpoints', () => {
    const testUser = {
      email: `protected-test-${Date.now()}@example.com`,
      password: 'Test123456!',
      firstName: 'Protected',
      lastName: 'User',
    };

    let accessToken: string;

    beforeAll(async () => {
      // Register and login to get access token
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser);

      accessToken = response.body.data.accessToken;
    });

    describe('GET /api/v1/users/me - Get Current User', () => {
      it('should return current user with valid token', () => {
        return request(app.getHttpServer())
          .get('/api/v1/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.email).toBe(testUser.email);
            expect(res.body.data).not.toHaveProperty('password');
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
      });

      it('should fail with invalid token', () => {
        return request(app.getHttpServer())
          .get('/api/v1/users/me')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });
    });

    describe('GET /api/v1/tasks - Tasks CRUD', () => {
      let taskId: string;

      it('should create a new task', () => {
        return request(app.getHttpServer())
          .post('/api/v1/tasks')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: 'Test Task',
            description: 'This is a test task',
            priority: 'MEDIUM',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.title).toBe('Test Task');
            expect(res.body.data.status).toBe('TODO'); // Status defaults to TODO
            taskId = res.body.data._id;
          });
      });

      it('should get all tasks for current user', () => {
        return request(app.getHttpServer())
          .get('/api/v1/tasks')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            // Tasks endpoint returns paginated response
            expect(res.body.data).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('meta');
            expect(Array.isArray(res.body.data.data)).toBe(true);
            expect(res.body.data.data.length).toBeGreaterThan(0);
            expect(res.body.data.meta).toHaveProperty('page');
            expect(res.body.data.meta).toHaveProperty('total');
          });
      });

      it('should get a specific task by id', () => {
        return request(app.getHttpServer())
          .get(`/api/v1/tasks/${taskId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data._id).toBe(taskId);
            expect(res.body.data.title).toBe('Test Task');
          });
      });

      it('should update a task', () => {
        return request(app.getHttpServer())
          .put(`/api/v1/tasks/${taskId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: 'Updated Task',
            status: 'IN_PROGRESS',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe('Updated Task');
            expect(res.body.data.status).toBe('IN_PROGRESS');
          });
      });

      it('should delete a task', () => {
        return request(app.getHttpServer())
          .delete(`/api/v1/tasks/${taskId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(204); // Delete returns 204 No Content
      });

      it('should fail to create task without authentication', () => {
        return request(app.getHttpServer())
          .post('/api/v1/tasks')
          .send({
            title: 'Unauthorized Task',
            description: 'Should fail',
          })
          .expect(401);
      });
    });
  });
});
