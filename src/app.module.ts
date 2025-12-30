import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from './config/config.module.js';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
    }),
    AuthModule,
    UsersModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
