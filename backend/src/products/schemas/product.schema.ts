import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
  storeId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0, default: 0 })
  stock: number;

  @Prop()
  sku?: string;

  @Prop()
  category?: string;

  @Prop([String])
  images?: string[];

  @Prop({
    type: String,
    enum: ['active', 'inactive', 'out_of_stock'],
    default: 'active',
  })
  status: string;

  @Prop({ type: Object })
  attributes?: {
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    color?: string;
    size?: string;
  };

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes
ProductSchema.index({ storeId: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ price: 1 });