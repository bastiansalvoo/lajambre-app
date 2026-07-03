import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from '../prisma.service';
import { MercadoPagoService } from './mercadopago.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, MercadoPagoService, PrismaService],
})
export class OrdersModule {}
