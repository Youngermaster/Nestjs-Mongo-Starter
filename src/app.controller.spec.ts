import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getApiInfo', () => {
    it('should return API information with name, version, and description', () => {
      const result = appController.getApiInfo();

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('endpoints');
      expect(result.name).toBe('NestJS MongoDB Starter API');
      expect(result.version).toBe('1.0.0');
    });

    it('should include documentation and health endpoints', () => {
      const result = appController.getApiInfo();

      expect(result.endpoints).toHaveProperty('documentation');
      expect(result.endpoints).toHaveProperty('health');
      expect(result.endpoints.documentation).toBe('/api/docs');
      expect(result.endpoints.health).toBe('/api/health');
    });
  });

  describe('healthCheck', () => {
    it('should return health status with ok status', () => {
      const result = appController.healthCheck();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('environment');
      expect(result.status).toBe('ok');
      expect(typeof result.uptime).toBe('number');
    });

    it('should return a valid timestamp', () => {
      const result = appController.healthCheck();

      const timestamp = new Date(result.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should return positive uptime', () => {
      const result = appController.healthCheck();

      expect(result.uptime).toBeGreaterThan(0);
    });
  });
});
