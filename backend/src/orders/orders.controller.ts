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
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateOrderDto } from './dto/create-order.dto';
import { Request as ExpressRequest } from 'express';
import { RolesGuard } from '../auth/roles.guard';
import { OrderStatus } from '@prisma/client';

interface RequestWithUser extends ExpressRequest {
  user: {
    userId: number;
    email: string;
    role: string;
  };
}

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: RequestWithUser,
  ) {
    return this.ordersService.create(createOrderDto, req.user.userId);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  async findAllAdmin() {
    return this.ordersService.findAllForAdmin();
  }

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    return this.ordersService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.ordersService.findOne(id, req.user.userId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: OrderStatus, // Tipado correctamente
  ) {
    return this.ordersService.updateStatus(id, status);
  }
}
