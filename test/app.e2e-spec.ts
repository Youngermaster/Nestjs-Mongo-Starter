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

// Type definitions for API responses
interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  timestamp?: string;
  path?: string;
  message?: string;
}

interface ApiErrorResponse {
  success: boolean;
  message: string;
  error?: string;
}

interface ApiInfoData {
  name: string;
  version: string;
  description: string;
  endpoints: unknown[];
}

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

interface UserData {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: UserData;
}

interface TaskData {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  userId: string;
  dueDate?: string;
  tags: string[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedData<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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
            const body = res.body as ApiResponse<ApiInfoData>;
            expect(body.success).toBe(true);
            expect(body.data).toHaveProperty('name');
            expect(body.data).toHaveProperty('version');
            expect(body.data).toHaveProperty('description');
            expect(body.data).toHaveProperty('endpoints');
            expect(body.data.name).toBe('NestJS MongoDB Starter API');
          });
      });
    });

    describe('GET /api/v1/health - Health Check', () => {
      it('should return health status', () => {
        return request(app.getHttpServer())
          .get('/api/v1/health')
          .expect(200)
          .expect((res) => {
            const body = res.body as ApiResponse<HealthData>;
            expect(body.success).toBe(true);
            expect(body.data.status).toBe('ok');
            expect(body.data).toHaveProperty('timestamp');
            expect(body.data).toHaveProperty('uptime');
            expect(body.data).toHaveProperty('environment');
            expect(typeof body.data.uptime).toBe('number');
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

    let refreshToken: string;

    describe('POST /api/v1/auth/register - User Registration', () => {
      it('should register a new user', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send(testUser)
          .expect(201)
          .expect((res) => {
            const body = res.body as ApiResponse<AuthData>;
            expect(body.success).toBe(true);
            expect(body.data).toHaveProperty('accessToken');
            expect(body.data).toHaveProperty('refreshToken');
            expect(body.data).toHaveProperty('user');
            expect(body.data.user.email).toBe(testUser.email);
            expect(body.data.user).not.toHaveProperty('password');

            // Save refresh token for subsequent tests
            refreshToken = body.data.refreshToken;
          });
      });

      it('should fail with duplicate email', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send(testUser)
          .expect(409)
          .expect((res) => {
            const body = res.body as ApiErrorResponse;
            expect(body.success).toBe(false);
            expect(body.message).toContain('already exists');
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
            const body = res.body as ApiResponse<AuthData>;
            expect(body.success).toBe(true);
            expect(body.data).toHaveProperty('accessToken');
            expect(body.data).toHaveProperty('refreshToken');
            expect(body.data.user.email).toBe(testUser.email);
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
            const body = res.body as ApiErrorResponse;
            expect(body.success).toBe(false);
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
            const body = res.body as ApiResponse<AuthData>;
            expect(body.success).toBe(true);
            expect(body.data).toHaveProperty('accessToken');
            expect(body.data).toHaveProperty('refreshToken');
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

      const body = response.body as ApiResponse<AuthData>;
      accessToken = body.data.accessToken;
    });

    describe('GET /api/v1/users/me - Get Current User', () => {
      it('should return current user with valid token', () => {
        return request(app.getHttpServer())
          .get('/api/v1/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            const body = res.body as ApiResponse<UserData>;
            expect(body.success).toBe(true);
            expect(body.data.email).toBe(testUser.email);
            expect(body.data).not.toHaveProperty('password');
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
            const body = res.body as ApiResponse<TaskData>;
            expect(body.success).toBe(true);
            expect(body.data).toHaveProperty('_id');
            expect(body.data.title).toBe('Test Task');
            expect(body.data.status).toBe('TODO'); // Status defaults to TODO
            taskId = body.data._id;
          });
      });

      it('should get all tasks for current user', () => {
        return request(app.getHttpServer())
          .get('/api/v1/tasks')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            const body = res.body as ApiResponse<PaginatedData<TaskData>>;
            expect(body.success).toBe(true);
            // Tasks endpoint returns paginated response
            expect(body.data).toHaveProperty('data');
            expect(body.data).toHaveProperty('meta');
            expect(Array.isArray(body.data.data)).toBe(true);
            expect(body.data.data.length).toBeGreaterThan(0);
            expect(body.data.meta).toHaveProperty('page');
            expect(body.data.meta).toHaveProperty('total');
          });
      });

      it('should get a specific task by id', () => {
        return request(app.getHttpServer())
          .get(`/api/v1/tasks/${taskId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            const body = res.body as ApiResponse<TaskData>;
            expect(body.success).toBe(true);
            expect(body.data._id).toBe(taskId);
            expect(body.data.title).toBe('Test Task');
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
            const body = res.body as ApiResponse<TaskData>;
            expect(body.success).toBe(true);
            expect(body.data.title).toBe('Updated Task');
            expect(body.data.status).toBe('IN_PROGRESS');
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
