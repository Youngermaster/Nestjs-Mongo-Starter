import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

@Injectable()
export class TasksRepository {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async create(
    userId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<TaskDocument> {
    const task = new this.taskModel({
      ...createTaskDto,
      userId: new Types.ObjectId(userId),
      dueDate: createTaskDto.dueDate
        ? new Date(createTaskDto.dueDate)
        : undefined,
    });
    return task.save();
  }

  async findById(id: string, userId: string): Promise<TaskDocument | null> {
    return this.taskModel
      .findOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
  }

  async update(
    id: string,
    userId: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<TaskDocument | null> {
    const updateData: any = { ...updateTaskDto };

    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }

    if (
      updateTaskDto.status === TaskStatus.COMPLETED &&
      !updateData.completedAt
    ) {
      updateData.completedAt = new Date();
    }

    return this.taskModel
      .findOneAndUpdate(
        { _id: id, userId: new Types.ObjectId(userId) },
        updateData,
        { new: true },
      )
      .exec();
  }

  async delete(id: string, userId: string): Promise<TaskDocument | null> {
    return this.taskModel
      .findOneAndDelete({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
  }

  async findWithPagination(
    userId: string,
    filter: any,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ data: TaskDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const query = { ...filter, userId: new Types.ObjectId(userId) };

    const [data, total] = await Promise.all([
      this.taskModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
      this.taskModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }
}
