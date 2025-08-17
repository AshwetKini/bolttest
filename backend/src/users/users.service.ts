import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll(query: any = {}): Promise<User[]> {
    const filter: any = {};
    
    if (query.role) {
      filter.role = query.role;
    }
    
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    return this.userModel
      .find(filter)
      .select('-mpinHash')
      .sort({ createdAt: -1 })
      .limit(parseInt(query.limit) || 50)
      .skip(parseInt(query.skip) || 0);
  }

  async findOne(id: string): Promise<User> {
    return this.userModel.findById(id).select('-mpinHash');
  }

  async findByPhone(phone: string): Promise<User> {
    return this.userModel.findOne({ phone });
  }
}