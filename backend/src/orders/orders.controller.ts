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
    if (tbkToken) {
      console.log(`Pago anulado por el usuario. Token: ${tbkToken}`);
      return {
        status: 'cancelled',
        message: 'Cancelaste el pago en Webpay. Tu orden sigue pendiente.',
      };
    }

    if (tokenWs) {
      return this.ordersService.confirmPayment(tokenWs);
    }

    return {
      status: 'error',
      message: 'No se recibieron tokens válidos de Transbank',
    };
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
