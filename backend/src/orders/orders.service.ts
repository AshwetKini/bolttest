import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PdfService } from '../common/services/pdf.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private pdfService: PdfService,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: any): Promise<Order> {
    const orderNumber = this.generateOrderNumber();

    // Calculate totals
    const subtotal = createOrderDto.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const tax = subtotal * (createOrderDto.taxRate || 0) / 100;
    const totalAmount = subtotal + tax - (createOrderDto.discount || 0);

    const order = new this.orderModel({
      orderNumber,
      storeId: createOrderDto.storeId,
      customerId: createOrderDto.customerId,
      items: createOrderDto.items.map(item => ({
        ...item,
        total: item.quantity * item.price,
      })),
      subtotal,
      tax,
      discount: createOrderDto.discount || 0,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      notes: createOrderDto.notes,
      shippingAddress: createOrderDto.shippingAddress,
    });

    return order.save();
  }

  async findAll(user: any, query: any = {}): Promise<Order[]> {
    let filter: any = {};

    // Role-based filtering (store owners see only their store's orders)
    if (user.role === 'store_owner') {
      // Get user's stores first
      filter.storeId = { $in: await this.getUserStoreIds(user._id) };
    }

    // Additional filters
    if (query.storeId) filter.storeId = query.storeId;
    if (query.status) filter.status = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.customerId) filter.customerId = query.customerId;

    const orders = await this.orderModel
      .find(filter)
      .populate('storeId', 'name phone address')
      .populate('customerId', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(parseInt(query.limit) || 50)
      .skip(parseInt(query.skip) || 0);

    return orders;
  }

  async findOne(id: string, user: any): Promise<Order> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel
      .findById(id)
      .populate('storeId', 'name phone address')
      .populate('customerId', 'name phone email address');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Authorization check for store owners
    if (user.role === 'store_owner') {
      const userStoreIds = await this.getUserStoreIds(user._id);
      if (!userStoreIds.some(storeId => storeId.equals(order.storeId))) {
        throw new ForbiddenException('Access denied');
      }
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, user: any): Promise<Order> {
    const order = await this.findOne(id, user);

    Object.assign(order, updateOrderDto);
    return order.save();
  }

  async updatePaymentStatus(id: string, paymentStatus: string, user: any): Promise<Order> {
    const order = await this.findOne(id, user);

    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      throw new BadRequestException('Invalid payment status');
    }

    order.paymentStatus = paymentStatus;
    return order.save();
  }

  async generateInvoice(id: string, user: any): Promise<Buffer> {
    const order = await this.findOne(id, user);

    // Populate additional fields needed for PDF
    await order.populate('storeId', 'name phone address email');
    await order.populate('customerId', 'name phone address email');

    return this.pdfService.generateInvoice(order);
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp.slice(-8)}${random}`;
  }

  private async getUserStoreIds(userId: string): Promise<Types.ObjectId[]> {
    // This would typically involve a call to StoresService
    // For now, returning empty array - implement based on your needs
    return [];
  }
}