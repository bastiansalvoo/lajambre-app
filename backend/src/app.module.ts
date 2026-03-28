import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'; // <-- Importamos el motor de Cron Jobs
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { ExtrasModule } from './extras/extras.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), // <-- Encendemos el reloj interno de NestJS
    ProductsModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    ExtrasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
