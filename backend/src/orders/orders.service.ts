import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
import { WebpayService } from './webpay.service';

export interface WebpayCreateResponse {
  token: string;
  url: string;
}

export interface WebpayCommitResponse {
  status: string;
  vci?: string;
  amount?: number;
  buy_order?: string;
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private webpay: WebpayService,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: number) {
    const deliveryFee = 1000;
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: { userId, total: 0, deliveryFee },
      });

      let totalOrder = 0;
      for (const item of createOrderDto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product)
          throw new NotFoundException(
            `Producto ${item.productId} no encontrado`,
          );

        let itemTotal = product.price * item.quantity;
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: product.price,
          },
        });

        if (item.extraIds && item.extraIds.length > 0) {
          for (const extraId of item.extraIds) {
            const extra = await tx.extra.findUnique({ where: { id: extraId } });
            if (extra) {
              await tx.orderItemExtra.create({
                data: {
                  orderItemId: orderItem.id,
                  extraId: extra.id,
                  priceAtPurchase: extra.price,
                },
              });
              itemTotal += extra.price * item.quantity;
            }
          }
        }
        totalOrder += itemTotal;
      }

      return tx.order.update({
        where: { id: order.id },
        data: { total: totalOrder + deliveryFee },
        include: { items: { include: { extras: true } } },
      });
    });
  }

  async startPayment(orderId: number, userId: number) {
    const order = await this.findOne(orderId, userId);
    if (order.status !== 'PENDIENTE') {
      throw new BadRequestException('El pedido ya no está pendiente de pago');
    }

    const buyOrder = `ORD-${order.id}-${Math.floor(Math.random() * 1000)}`;
    const sessionId = `USR-${userId}`;
    const returnUrl =
      process.env.WEBPAY_RETURN_URL ||
      'http://localhost:3000/orders/webpay/confirm';

    const response = (await this.webpay.create(
      buyOrder,
      sessionId,
      order.total,
      returnUrl,
    )) as WebpayCreateResponse;

    await this.prisma.order.update({
      where: { id: order.id },
      data: { buyOrder, sessionId: response.token },
    });

    return response;
  }

  async confirmPayment(token: string) {
    const result = (await this.webpay.commit(token)) as WebpayCommitResponse;
    const order = await this.prisma.order.findFirst({
      where: { sessionId: token },
    });

    if (!order) throw new NotFoundException('Token de pago no reconocido');

    if (result.status === 'AUTHORIZED') {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAGADO' },
      });
      return { status: 'success', orderId: order.id };
    }
    return { status: 'failed', orderId: order.id };
  }

  async findAllByUser(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true, extras: { include: { extra: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true, extras: { include: { extra: true } } },
        },
      },
    });
    if (!order || order.userId !== userId)
      throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async findAllForAdmin() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: number, status: OrderStatus) {
    return this.prisma.order.update({ where: { id }, data: { status } });
  }
}
