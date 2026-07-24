import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from '../prisma.service';
import { MercadoPagoService } from './mercadopago.service';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [StoreModule],
  controllers: [OrdersController],
  providers: [OrdersService, MercadoPagoService, PrismaService],
})
export class OrdersModule {}
