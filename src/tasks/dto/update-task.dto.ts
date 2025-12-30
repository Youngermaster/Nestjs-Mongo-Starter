import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto.js';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '../schemas/task.schema.js';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
