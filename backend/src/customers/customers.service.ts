import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const createdCustomer = new this.customerModel(createCustomerDto);
    return createdCustomer.save();
  }

  async findAll(): Promise<Customer[]> {
    return this.customerModel.find().exec();
  }

  async findOne(id: string): Promise<Customer> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid customer ID');
    }
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const updatedCustomer = await this.customerModel.findByIdAndUpdate(id, updateCustomerDto, {
      new: true,
    });
    if (!updatedCustomer) {
      throw new NotFoundException('Customer not found');
    }
    return updatedCustomer;
  }

  async remove(id: string): Promise<void> {
    const result = await this.customerModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Customer not found');
    }
  }
}
