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
  Query,
  ParseIntPipe,
  Patch,
  Res,
  Header,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateOrderDto } from './dto/create-order.dto';
import { Request as ExpressRequest } from 'express';
import type { Response } from 'express';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrderStatus } from '@prisma/client';

interface RequestWithUser extends ExpressRequest {
  user: { userId: number; email: string; role: string };
}

// Deep link para devolver al usuario a la app tras el pago
const APP_DEEP_LINK = 'exp://192.168.0.15:8081/--/(client)/orders';

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

  /**
   * Endpoint de retorno de Mercado Pago (back_url success / failure / pending).
   * Mercado Pago redirige aquí con los parámetros: payment_id, status, external_reference.
   * Devolvemos una página HTML estilizada que muestra el resultado y contiene
   * un botón / deep link para volver a la app.
   */
  @Get('mercadopago/feedback')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async mercadoPagoFeedback(
    @Query('payment_id') paymentId?: string,
    @Query('status') status?: string,
    @Query('external_reference') externalReference?: string,
    @Res() res?: Response,
  ) {
    let htmlContent = '';
    const ref = externalReference || '';

    try {
      if (status === 'approved' || ref.startsWith('FREE-')) {
        // Confirmar el pago en la base de datos
        await this.ordersService.confirmPayment(paymentId || '', ref);

        htmlContent = `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>¡Pedido Confirmado! - La Jambre</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Arial', sans-serif; background-color: #0a0a0a; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
              .container { background-color: #141414; padding: 44px 36px; border-radius: 24px; text-align: center; border-top: 4px solid #EAB308; max-width: 420px; width: 100%; box-shadow: 0 0 60px rgba(234,179,8,0.15); }
              .icon { font-size: 64px; margin-bottom: 24px; }
              h1 { font-size: 26px; margin-bottom: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #EAB308; }
              p { color: #9CA3AF; font-size: 14px; margin-bottom: 32px; line-height: 1.6; }
              .btn { background-color: #EAB308; color: #000; text-decoration: none; padding: 16px 32px; border-radius: 14px; font-weight: 900; text-transform: uppercase; display: inline-block; letter-spacing: 1px; font-size: 13px; transition: opacity 0.2s; }
              .btn:active { opacity: 0.8; }
              .badge { display: inline-block; margin-top: 20px; padding: 6px 14px; background: rgba(234,179,8,0.1); border: 1px solid rgba(234,179,8,0.3); border-radius: 20px; color: #EAB308; font-size: 11px; font-weight: 700; letter-spacing: 1px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">🔥</div>
              <h1>¡Pedido Confirmado!</h1>
              <p>Tu pago fue procesado con éxito y la cocina ya está preparando tu comida. ¡Pronto estará listo!</p>
              <a href="${APP_DEEP_LINK}" class="btn">Ver mi pedido →</a>
              <div class="badge">PAGADO CON ÉXITO ✓</div>
            </div>
          </body>
          </html>
        `;
      } else if (status === 'pending') {
        htmlContent = `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pago Pendiente - La Jambre</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Arial', sans-serif; background-color: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
              .container { background-color: #141414; padding: 44px 36px; border-radius: 24px; text-align: center; border-top: 4px solid #F59E0B; max-width: 420px; width: 100%; box-shadow: 0 0 60px rgba(245,158,11,0.15); }
              .icon { font-size: 64px; margin-bottom: 24px; }
              h1 { font-size: 26px; margin-bottom: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #F59E0B; }
              p { color: #9CA3AF; font-size: 14px; margin-bottom: 32px; line-height: 1.6; }
              .btn { background-color: #F59E0B; color: #000; text-decoration: none; padding: 16px 32px; border-radius: 14px; font-weight: 900; text-transform: uppercase; display: inline-block; letter-spacing: 1px; font-size: 13px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">⏳</div>
              <h1>Pago Pendiente</h1>
              <p>Tu pago está siendo procesado. Te notificaremos cuando sea confirmado. Puedes revisar el estado de tu pedido en la app.</p>
              <a href="${APP_DEEP_LINK}" class="btn">Ver mis pedidos →</a>
            </div>
          </body>
          </html>
        `;
      } else {
        // failure o cualquier otro estado
        htmlContent = `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pago Rechazado - La Jambre</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Arial', sans-serif; background-color: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
              .container { background-color: #141414; padding: 44px 36px; border-radius: 24px; text-align: center; border-top: 4px solid #EF4444; max-width: 420px; width: 100%; box-shadow: 0 0 60px rgba(239,68,68,0.12); }
              .icon { font-size: 64px; margin-bottom: 24px; }
              h1 { font-size: 26px; margin-bottom: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #EF4444; }
              p { color: #9CA3AF; font-size: 14px; margin-bottom: 32px; line-height: 1.6; }
              .btn { background-color: #EF4444; color: #fff; text-decoration: none; padding: 16px 32px; border-radius: 14px; font-weight: 900; text-transform: uppercase; display: inline-block; letter-spacing: 1px; font-size: 13px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">❌</div>
              <h1>Pago Rechazado</h1>
              <p>Tu pago no pudo ser procesado. Por favor intenta nuevamente con otro medio de pago. Tu pedido sigue activo.</p>
              <a href="${APP_DEEP_LINK}" class="btn">Volver a la App →</a>
            </div>
          </body>
          </html>
        `;
      }
    } catch (error) {
      console.error('Error en feedback de MercadoPago:', error);
      htmlContent = `
        <!DOCTYPE html><html><body style="background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Arial">
        <div style="text-align:center;padding:40px">
          <h1 style="color:#EF4444">Error procesando el pago</h1>
          <p style="color:#9CA3AF;margin-top:12px">Contacta al local para verificar tu pedido.</p>
          <a href="${APP_DEEP_LINK}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#EAB308;color:#000;border-radius:12px;font-weight:900;text-decoration:none">Volver a la App</a>
        </div>
        </body></html>
      `;
    }

    res?.send(htmlContent);
  }

  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findAllForAdmin(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
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
