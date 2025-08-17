import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/schemas/user.schema';
import { Store } from '../src/stores/schemas/store.schema';
import { Customer } from '../src/customers/schemas/customer.schema';
import { Product } from '../src/products/schemas/product.schema';
import * as argon2 from 'argon2';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const storeModel = app.get<Model<Store>>(getModelToken(Store.name));
  const customerModel = app.get<Model<Customer>>(getModelToken(Customer.name));
  const productModel = app.get<Model<Product>>(getModelToken(Product.name));

  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    await Promise.all([
      userModel.deleteMany({}),
      storeModel.deleteMany({}),
      customerModel.deleteMany({}),
      productModel.deleteMany({}),
    ]);

    console.log('🧹 Cleared existing data');

    // Create users
    const adminMpin = await argon2.hash('1234');
    const ownerMpin = await argon2.hash('1234');

    const admin = await userModel.create({
      phone: '+1234567890',
      name: 'Admin User',
      email: 'admin@shopee.com',
      mpinHash: adminMpin,
      role: 'admin',
    });

    const storeOwner = await userModel.create({
      phone: '+1987654321',
      name: 'Store Owner',
      email: 'owner@shopee.com',
      mpinHash: ownerMpin,
      role: 'store_owner',
    });

    console.log('👥 Created users');

    // Create stores
    const store1 = await storeModel.create({
      ownerId: storeOwner._id,
      name: 'Tech Store',
      description: 'Electronics and gadgets',
      phone: '+1987654321',
      email: 'tech@shopee.com',
      address: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'USA',
      settings: {
        currency: 'USD',
        taxRate: 8.5,
        businessHours: {
          open: '09:00',
          close: '18:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      },
    });

    const store2 = await storeModel.create({
      ownerId: storeOwner._id,
      name: 'Fashion Hub',
      description: 'Trendy clothing and accessories',
      phone: '+1987654322',
      email: 'fashion@shopee.com',
      address: '456 Fashion Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'USA',
      settings: {
        currency: 'USD',
        taxRate: 9.5,
        businessHours: {
          open: '10:00',
          close: '20:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
      },
    });

    console.log('🏪 Created stores');

    // Create customers
    const customer1 = await customerModel.create({
      storeId: store1._id,
      name: 'John Doe',
      phone: '+1555123456',
      email: 'john@example.com',
      address: '789 Customer St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94103',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'male',
      preferences: {
        newsletter: true,
        communicationPreference: 'email',
      },
    });

    const customer2 = await customerModel.create({
      storeId: store1._id,
      name: 'Jane Smith',
      phone: '+1555789012',
      email: 'jane@example.com',
      address: '321 Buyer Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90211',
      dateOfBirth: new Date('1985-08-22'),
      gender: 'female',
      preferences: {
        newsletter: false,
        communicationPreference: 'phone',
      },
    });

    console.log('👥 Created customers');

    // Create products
    await productModel.create([
      {
        storeId: store1._id,
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with advanced camera system',
        price: 999.99,
        stock: 50,
        sku: 'IPH15P-001',
        category: 'Smartphones',
        images: ['https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg'],
        attributes: {
          weight: 0.221,
          color: 'Space Black',
          dimensions: {
            length: 159.9,
            width: 76.7,
            height: 8.25,
          },
        },
      },
      {
        storeId: store1._id,
        name: 'MacBook Pro 16"',
        description: 'Powerful laptop for professionals',
        price: 2499.99,
        stock: 25,
        sku: 'MBP16-001',
        category: 'Laptops',
        images: ['https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg'],
        attributes: {
          weight: 2.1,
          color: 'Space Gray',
        },
      },
      {
        storeId: store2._id,
        name: 'Designer T-Shirt',
        description: 'Premium cotton t-shirt',
        price: 49.99,
        stock: 100,
        sku: 'TSH-001',
        category: 'Clothing',
        attributes: {
          color: 'White',
          size: 'M',
        },
      },
      {
        storeId: store2._id,
        name: 'Leather Jacket',
        description: 'Genuine leather jacket',
        price: 299.99,
        stock: 15,
        sku: 'LJK-001',
        category: 'Outerwear',
        attributes: {
          color: 'Black',
          size: 'L',
        },
      },
    ]);

    console.log('🛍️ Created products');

    console.log(`
✅ Database seeding completed successfully!

📋 Test Credentials:
Admin:
  Phone: +1234567890
  MPIN: 1234

Store Owner:
  Phone: +1987654321
  MPIN: 1234

🔗 API Endpoints:
  Health Check: GET /api/health
  API Docs: GET /api/docs
  Send OTP: POST /api/auth/send-otp
    `);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

seed();