import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <-- Importa esto
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    // Esto carga el .env ANTES que cualquier otro módulo
    ConfigModule.forRoot({ isGlobal: true }),
    ProductsModule,
    AuthModule,
    UsersModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
