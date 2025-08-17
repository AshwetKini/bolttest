import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  isRevoked: boolean;

  @Prop({ type: Date })
  createdAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Indexes
RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ token: 1 }, { unique: true });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });