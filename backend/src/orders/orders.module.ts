import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from '../prisma.service'; // <-- Importar

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService], // <-- Proveer el servicio de DB
})
export class OrdersModule {}
