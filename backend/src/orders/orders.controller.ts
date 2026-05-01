import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateOrderDto } from './dto/create-order.dto';
import { Request as ExpressRequest } from 'express';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrderStatus } from '@prisma/client';

interface RequestWithUser extends ExpressRequest {
  user: { userId: number; email: string; role: string };
}

@Controller('orders')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() dto: CreateOrderDto, @Request() req: RequestWithUser) {
    return this.ordersService.create(dto, req.user.userId);
  }

  @Post(':id/pay')
  @UseGuards(AuthGuard('jwt'))
  async startPayment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.ordersService.startPayment(id, req.user.userId);
  }

  @Get('webpay/confirm')
  async confirm(
    @Query('token_ws') tokenWs?: string,
    @Query('TBK_TOKEN') tbkToken?: string,
  ) {
    let htmlContent = '';

    if (tbkToken) {
      console.log(`Pago anulado por el usuario. Token: ${tbkToken}`);
      // HTML de Pago Cancelado
      htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pago Cancelado - La Jambre</title>
          <style>
            body { font-family: 'Arial', sans-serif; background-color: #000; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { background-color: #171717; padding: 40px; border-radius: 20px; text-align: center; border-top: 4px solid #EF4444; max-width: 90%; width: 400px; }
            .icon { font-size: 60px; color: #EF4444; margin-bottom: 20px; }
            h1 { font-size: 24px; margin-bottom: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
            p { color: #9CA3AF; font-size: 14px; margin-bottom: 30px; line-height: 1.5; }
            .btn { background-color: #EF4444; color: #fff; text-decoration: none; padding: 15px 30px; border-radius: 12px; font-weight: bold; text-transform: uppercase; display: inline-block; transition: opacity 0.2s; }
            .btn:active { opacity: 0.8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">❌</div>
            <h1>Pago Cancelado</h1>
            <p>Has anulado el pago en Webpay. Tu pedido no ha sido procesado y sigue pendiente en tu carrito.</p>
            <a href="exp://192.168.1.14:8081/--/(client)/orders" class="btn">Volver a la App</a>
          </div>
        </body>
        </html>
      `;
    } else if (tokenWs) {
      try {
        await this.ordersService.confirmPayment(tokenWs);
        // HTML de Pago Exitoso
        htmlContent = `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pago Exitoso - La Jambre</title>
            <style>
              body { font-family: 'Arial', sans-serif; background-color: #000; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .container { background-color: #171717; padding: 40px; border-radius: 20px; text-align: center; border-top: 4px solid #EAB308; max-width: 90%; width: 400px; }
              .icon { font-size: 60px; color: #EAB308; margin-bottom: 20px; }
              h1 { font-size: 24px; margin-bottom: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #EAB308; }
              p { color: #9CA3AF; font-size: 14px; margin-bottom: 30px; line-height: 1.5; }
              .btn { background-color: #EAB308; color: #000; text-decoration: none; padding: 15px 30px; border-radius: 12px; font-weight: 900; text-transform: uppercase; display: inline-block; transition: opacity 0.2s; letter-spacing: 1px; }
              .btn:active { opacity: 0.8; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">🔥</div>
              <h1>¡Pedido Confirmado!</h1>
              <p>Tu pago fue procesado con éxito y la cocina ya está preparando tu comida.</p>
              <a href="exp://192.168.1.14:8081/--/(client)/orders" class="btn">Ver mi pedido</a>
            </div>
          </body>
          </html>
        `;
      } catch (error) {
        console.error('Error procesando el pago en Transbank:', error); // 👈 Usamos la variable aquí
        // HTML de Pago Fallido/Rechazado por el banco
        htmlContent = `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error de Pago - La Jambre</title>
            <style>
              body { font-family: 'Arial', sans-serif; background-color: #000; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .container { background-color: #171717; padding: 40px; border-radius: 20px; text-align: center; border-top: 4px solid #EF4444; max-width: 90%; width: 400px; }
              .icon { font-size: 60px; color: #EF4444; margin-bottom: 20px; }
              h1 { font-size: 24px; margin-bottom: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
              p { color: #9CA3AF; font-size: 14px; margin-bottom: 30px; line-height: 1.5; }
              .btn { background-color: #EF4444; color: #fff; text-decoration: none; padding: 15px 30px; border-radius: 12px; font-weight: bold; text-transform: uppercase; display: inline-block; transition: opacity 0.2s; }
              .btn:active { opacity: 0.8; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">⚠️</div>
              <h1>Pago Rechazado</h1>
              <p>Tu banco ha rechazado la transacción. Por favor, intenta con otro medio de pago.</p>
              <a href="exp://192.168.1.14:8081/--/(client)/orders" class="btn">Volver a la App</a>
            </div>
          </body>
          </html>
        `;
      }
    } else {
      htmlContent = `<h1>Error: No se recibieron tokens válidos de Transbank</h1>`;
    }

    return htmlContent;
  }

  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async findAllAdmin() {
    return this.ordersService.findAllForAdmin();
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Request() req: RequestWithUser) {
    return this.ordersService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.ordersService.findOne(id, req.user.userId);
  }

  // 👇 AHORA SÍ: Solo los administradores pueden cambiar el estado
  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }
}
