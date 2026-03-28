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

  // NUEVO: Iniciar proceso de pago
  @Post(':id/pay')
  @UseGuards(AuthGuard('jwt'))
  async startPayment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.ordersService.startPayment(id, req.user.userId);
  }

  // NUEVO: Callback de Webpay (Confirmación)
  // Transbank redirige aquí con un query param 'token_ws'
  // Esta ruta DEBE ser pública para recibir la redirección de Transbank
  @Get('webpay/confirm')
  async confirm(@Query('token_ws') token: string) {
    return this.ordersService.confirmPayment(token);
  }

  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
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

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }
}
