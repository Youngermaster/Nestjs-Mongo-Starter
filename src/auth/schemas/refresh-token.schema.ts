import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

@Schema({
  timestamps: true,
  collection: 'refresh_tokens',
})
export class RefreshToken extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  token: string;

  @Prop({
    required: true,
  })
  expiresAt: Date;

  @Prop({
    default: false,
  })
  isRevoked: boolean;

  @Prop({
    default: null,
  })
  revokedAt?: Date;

  @Prop({
    trim: true,
  })
  userAgent?: string;

  @Prop({
    trim: true,
  })
  ipAddress?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
RefreshTokenSchema.index({ token: 1 }, { unique: true });
RefreshTokenSchema.index({ expiresAt: 1 });
RefreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 },
);
