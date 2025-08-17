import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true, index: true })
  phone: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true })
  isVerified: boolean;

  @Prop({ default: Date.now, expires: 300 }) // 5 minutes TTL
  createdAt: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// TTL index for automatic cleanup
OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });