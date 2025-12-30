import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksService } from './tasks.service.js';
import { TasksController } from './tasks.controller.js';
import { TasksRepository } from './tasks.repository.js';
import { Task, TaskSchema } from './schemas/task.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksRepository],
  exports: [TasksService],
})
export class TasksModule {}
