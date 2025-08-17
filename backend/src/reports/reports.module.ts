import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Store, StoreSchema } from '../stores/schemas/store.schema';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Store.name, schema: StoreSchema },
    ]),
    StoresModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}