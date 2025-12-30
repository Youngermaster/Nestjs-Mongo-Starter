import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export type TaskDocument = HydratedDocument<Task>;

@Schema({
  timestamps: true,
  collection: 'tasks',
})
export class Task extends Document {
  @Prop({
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200,
  })
  title: string;

  @Prop({
    trim: true,
    maxlength: 2000,
  })
  description?: string;

  @Prop({
    type: String,
    enum: TaskStatus,
    default: TaskStatus.TODO,
    index: true,
  })
  status: TaskStatus;

  @Prop({
    type: String,
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
    index: true,
  })
  priority: TaskPriority;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: Date,
  })
  dueDate?: Date;

  @Prop({
    type: [String],
    default: [],
  })
  tags: string[];

  @Prop({
    default: null,
  })
  completedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, priority: 1 });
TaskSchema.index({ userId: 1, createdAt: -1 });
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ tags: 1 });
TaskSchema.index({ title: 'text', description: 'text' });
