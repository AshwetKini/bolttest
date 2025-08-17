import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Store, StoreDocument } from '../stores/schemas/store.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
  ) {}

  async getSalesReport(user: any, query: any) {
    const { startDate, endDate, storeId } = query;

    let matchStage: any = {};

    // Role-based filtering
    if (user.role === 'store_owner') {
      const userStores = await this.storeModel.find({ ownerId: user._id }, '_id');
      const storeIds = userStores.map(store => store._id);
      matchStage.storeId = { $in: storeIds };
    }

    // Store filtering
    if (storeId) {
      if (user.role === 'store_owner') {
        const store = await this.storeModel.findOne({ _id: storeId, ownerId: user._id });
        if (!store) {
          throw new ForbiddenException('Access denied to this store');
        }
      }
      matchStage.storeId = storeId;
    }

    // Date filtering
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const salesData = await this.orderModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const summary = await this.orderModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
        },
      },
    ]);

    return {
      summary: summary[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
      dailyData: salesData,
    };
  }

  async getStorePerformanceReport(user: any, query: any) {
    if (user.role === 'store_owner') {
      throw new ForbiddenException('Access denied');
    }

    const { startDate, endDate } = query;

    let matchStage: any = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const storePerformance = await this.orderModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$storeId',
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
        },
      },
      {
        $lookup: {
          from: 'stores',
          localField: '_id',
          foreignField: '_id',
          as: 'store',
        },
      },
      { $unwind: '$store' },
      {
        $project: {
          storeName: '$store.name',
          storeStatus: '$store.status',
          totalRevenue: 1,
          totalOrders: 1,
          avgOrderValue: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    return storePerformance;
  }

  generateCsvReport(data: any[], type: 'sales' | 'store-performance'): string {
    if (type === 'sales') {
      const headers = ['Date', 'Total Revenue', 'Total Orders', 'Average Order Value'];
      const rows = data.map(item => [
        `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
        item.totalRevenue.toFixed(2),
        item.totalOrders,
        item.avgOrderValue.toFixed(2),
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    if (type === 'store-performance') {
      const headers = ['Store Name', 'Status', 'Total Revenue', 'Total Orders', 'Average Order Value'];
      const rows = data.map(item => [
        item.storeName,
        item.storeStatus,
        item.totalRevenue.toFixed(2),
        item.totalOrders,
        item.avgOrderValue.toFixed(2),
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return '';
  }
}