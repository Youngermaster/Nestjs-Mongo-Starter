import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsISO8601,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '../schemas/task.schema.js';

export class CreateTaskDto {
  @ApiProperty({ example: 'Complete project documentation' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    example: 'Write comprehensive API documentation for all endpoints',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.HIGH })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @ApiPropertyOptional({
    example: ['documentation', 'urgent'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
