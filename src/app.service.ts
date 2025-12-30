import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiInfo() {
    return {
      name: 'NestJS MongoDB Starter API',
      version: '1.0.0',
      description:
        'Enterprise-grade NestJS starter with MongoDB, JWT authentication, and Swagger',
      endpoints: {
        documentation: '/api/docs',
        health: '/api/health',
      },
    };
  }

  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
