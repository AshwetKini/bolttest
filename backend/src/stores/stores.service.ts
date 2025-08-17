import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Store, StoreDocument } from './schemas/store.schema';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class StoresService {
  constructor(
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
  ) {}

  async create(createStoreDto: CreateStoreDto, user: any): Promise<Store> {
    const store = new this.storeModel({
      ...createStoreDto,
      ownerId: user._id,
      status: 'active',
      subscriptionPlan: 'basic',
      settings: {
        currency: 'USD',
        taxRate: 0,
        businessHours: {
          open: '09:00',
          close: '18:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      },
    });

    return store.save();
  }

  async findAll(user: any, query: any = {}): Promise<Store[]> {
    let filter: any = {};

    // Role-based filtering
    if (user.role === 'store_owner') {
      filter.ownerId = user._id;
    }

    // Status filter
    if (query.status) {
      filter.status = query.status;
    }

    // Search filter
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const stores = await this.storeModel
      .find(filter)
      .populate('ownerId', 'phone name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(query.limit) || 50)
      .skip(parseInt(query.skip) || 0);

    return stores;
  }

  async findOne(id: string, user: any): Promise<Store> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid store ID');
    }

    const store = await this.storeModel
      .findById(id)
      .populate('ownerId', 'phone name email');

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Authorization check
    if (user.role === 'store_owner' && !store.ownerId.equals(user._id)) {
      throw new ForbiddenException('Access denied');
    }

    return store;
  }

  async update(id: string, updateStoreDto: UpdateStoreDto, user: any): Promise<Store> {
    const store = await this.findOne(id, user);

    // Only allow owner or admin to update
    if (user.role === 'store_owner' && !store.ownerId.equals(user._id)) {
      throw new ForbiddenException('Access denied');
    }

    Object.assign(store, updateStoreDto);
    return store.save();
  }

  async activate(id: string, user: any): Promise<Store> {
    const store = await this.findOne(id, user);

    // Only admins can activate/deactivate
    if (!['admin', 'superadmin'].includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    store.status = 'active';
    return store.save();
  }

  async deactivate(id: string, user: any): Promise<Store> {
    const store = await this.findOne(id, user);

    // Only admins can activate/deactivate
    if (!['admin', 'superadmin'].includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    store.status = 'inactive';
    return store.save();
  }

  async updateSubscription(
    id: string,
    subscriptionPlan: string,
    expiresAt: Date,
    user: any,
  ): Promise<Store> {
    const store = await this.findOne(id, user);

    // Only admins can update subscriptions
    if (!['admin', 'superadmin'].includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    store.subscriptionPlan = subscriptionPlan;
    store.subscriptionExpiresAt = expiresAt;
    return store.save();
  }

  async remove(id: string, user: any): Promise<void> {
    const store = await this.findOne(id, user);

    // Only superadmin can delete
    if (user.role !== 'superadmin') {
      throw new ForbiddenException('Access denied');
    }

    await this.storeModel.findByIdAndDelete(id);
  }

  async getStoresByOwner(ownerId: string): Promise<Store[]> {
    return this.storeModel.find({ ownerId, status: 'active' });
  }
}