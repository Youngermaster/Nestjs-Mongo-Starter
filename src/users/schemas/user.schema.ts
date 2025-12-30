import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import { Role } from '../../common/constants/role.enum.js';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User extends Document {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({
    required: true,
    minlength: 2,
    maxlength: 100,
  })
  firstName: string;

  @Prop({
    required: true,
    minlength: 2,
    maxlength: 100,
  })
  lastName: string;

  @Prop({
    required: true,
    select: false,
  })
  password: string;

  @Prop({
    type: [String],
    enum: Role,
    default: [Role.USER],
  })
  roles: Role[];

  @Prop({
    default: true,
  })
  isActive: boolean;

  @Prop({
    default: null,
  })
  lastLoginAt?: Date;

  @Prop({
    default: null,
  })
  emailVerifiedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ roles: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

UserSchema.virtual('fullName').get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    const retObj = ret as unknown as Record<string, unknown>;
    delete retObj.password;
    delete retObj.__v;
    return retObj;
  },
});

UserSchema.set('toObject', {
  virtuals: true,
  transform: function (_doc, ret) {
    const retObj = ret as unknown as Record<string, unknown>;
    delete retObj.password;
    delete retObj.__v;
    return retObj;
  },
});
