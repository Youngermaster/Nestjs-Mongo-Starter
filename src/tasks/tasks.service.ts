import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksRepository } from './tasks.repository.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { QueryTaskDto } from './dto/query-task.dto.js';
import { TaskResponseDto } from './dto/task-response.dto.js';
import { ResponseUtil } from '../common/utils/response.util.js';
import { FilterQuery } from 'mongoose';
import { TaskDocument } from './schemas/task.schema.js';
import { MESSAGES } from '../common/constants/messages.constant.js';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async create(userId: string, createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.create(userId, createTaskDto);
    return task.toObject() as TaskResponseDto;
  }

  async findAll(userId: string, queryDto: QueryTaskDto) {
    const { page, limit, sortBy, sortOrder, status, priority, search, tags } = queryDto;

    const filter: FilterQuery<TaskDocument> = {};

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    const { data, total } = await this.tasksRepository.findWithPagination(
      userId,
      filter,
      page,
      limit,
      sortBy,
      sortOrder,
    );

    const tasks = data.map((task) => task.toObject() as TaskResponseDto);

    return ResponseUtil.paginated(tasks, page, limit, total);
  }

  async findOne(userId: string, id: string): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findById(id, userId);

    if (!task) {
      throw new NotFoundException(MESSAGES.TASK.NOT_FOUND);
    }

    return task.toObject() as TaskResponseDto;
  }

  async update(
    userId: string,
    id: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.update(id, userId, updateTaskDto);

    if (!task) {
      throw new NotFoundException(MESSAGES.TASK.NOT_FOUND);
    }

    return task.toObject() as TaskResponseDto;
  }

  async remove(userId: string, id: string): Promise<void> {
    const task = await this.tasksRepository.delete(id, userId);

    if (!task) {
      throw new NotFoundException(MESSAGES.TASK.NOT_FOUND);
    }
  }
}
