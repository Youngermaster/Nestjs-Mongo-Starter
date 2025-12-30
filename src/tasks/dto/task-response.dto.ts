import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '../schemas/task.schema.js';

export class TaskResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority })
  priority: TaskPriority;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  dueDate?: Date;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
