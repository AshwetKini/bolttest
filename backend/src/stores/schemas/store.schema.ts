import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StoreDocument = Store & Document;

@Schema({ timestamps: true })
export class Store {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  email?: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  zipCode?: string;

  @Prop()
  country?: string;

  @Prop({
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  })
  status: string;

  @Prop({
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    default: 'basic',
  })
  subscriptionPlan: string;

  @Prop({ type: Date })
  subscriptionExpiresAt?: Date;

  @Prop({ type: Object })
  settings?: {
    currency: string;
    taxRate: number;
    businessHours: {
      open: string;
      close: string;
      days: string[];
    };
  };

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const StoreSchema = SchemaFactory.createForClass(Store);

// Indexes
StoreSchema.index({ ownerId: 1 });
StoreSchema.index({ status: 1 });
StoreSchema.index({ name: 'text', description: 'text' });