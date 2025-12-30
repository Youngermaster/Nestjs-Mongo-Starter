import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);

  app.use(helmet());

  app.enableCors({
    origin: configService.get('cors.origin'),
    credentials: true,
  });

  app.use(compression());

  const apiPrefix = configService.get('app.apiPrefix');
  app.setGlobalPrefix(apiPrefix);

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

  if (configService.get('swagger.enabled')) {
    const config = new DocumentBuilder()
      .setTitle(configService.get<string>('swagger.title')!)
      .setDescription(configService.get<string>('swagger.description')!)
      .setVersion(configService.get<string>('swagger.version')!)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT access token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('tasks', 'Task management endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(
      configService.get<string>('swagger.path')!,
      app,
      document,
      {
        swaggerOptions: {
          persistAuthorization: true,
        },
      },
    );
  }

  const port = configService.get('app.port');
  await app.listen(port);

  console.log(`
    Application is running on: http://localhost:${port}/${apiPrefix}/v1
    Swagger documentation: http://localhost:${port}/${apiPrefix}/docs
    Health check: http://localhost:${port}/${apiPrefix}/v1/health
    Environment: ${configService.get('app.environment')}
  `);
}

bootstrap();
