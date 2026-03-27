import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from '../prisma.service'; // <-- Importar
import { WebpayService } from './webpay.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, WebpayService, PrismaService], // <-- Proveer el servicio de DB
})
export class OrdersModule {}
