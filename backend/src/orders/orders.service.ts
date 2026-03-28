import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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

// Interfaz para evitar errores de "unsafe member access" en el ticket
interface OrderWithDetails {
  id: number;
  createdAt: Date;
  address: string | null;
  total: number;
  deliveryFee: number;
  user: { name: string; phone: string };
  items: Array<{
    quantity: number;
    priceAtPurchase: number;
    product: { name: string };
    extras: Array<{
      priceAtPurchase: number;
      extra: { name: string };
    }>;
  }>;
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private webpay: WebpayService,
  ) {}

  private isStoreOpen(): boolean {
    const now = new Date();
    const chileTime = new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'long',
    }).formatToParts(now);

    const hour = parseInt(
      chileTime.find((p) => p.type === 'hour')?.value || '0',
    );
    const minute = parseInt(
      chileTime.find((p) => p.type === 'minute')?.value || '0',
    );
    const dayName =
      chileTime.find((p) => p.type === 'weekday')?.value.toLowerCase() || '';

    if (dayName.includes('lunes')) return false;

    const currentTimeInMinutes = hour * 60 + minute;
    const openingTime = 18 * 60 + 30; // 18:30
    const closingTime = 23 * 60 + 59; // 23:59

    return (
      currentTimeInMinutes >= openingTime && currentTimeInMinutes <= closingTime
    );
  }

  async create(createOrderDto: CreateOrderDto, userId: number) {
    if (!this.isStoreOpen()) {
      throw new ForbiddenException(
        'Lajambre cerrado. Horario: Mar-Dom 18:30 a 00:00.',
      );
    }

    const deliveryFee = 1250;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: { userId, total: 0, deliveryFee },
      });

      let totalOrder = 0;
      for (const item of createOrderDto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product || !product.isAvailable) {
          throw new BadRequestException(
            `Producto ${product?.name || item.productId} agotado.`,
          );
        }

        let itemTotal = product.price * item.quantity;
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: product.price,
          },
        });

        if (item.extraIds?.length) {
          for (const extraId of item.extraIds) {
            const extra = await tx.extra.findUnique({ where: { id: extraId } });
            if (!extra || !extra.isAvailable) {
              throw new BadRequestException(
                `Agregado ${extra?.name || extraId} agotado.`,
              );
            }
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
        totalOrder += itemTotal;
      }

      return tx.order.update({
        where: { id: order.id },
        data: { total: totalOrder + deliveryFee },
        include: {
          items: {
            include: { extras: { include: { extra: true } }, product: true },
          },
        },
      });
    });
  }

  async startPayment(orderId: number, userId: number) {
    const order = await this.findOne(orderId, userId);
    if (order.status !== 'PENDIENTE')
      throw new BadRequestException('El pedido no está pendiente.');

    const buyOrder = `ORD-${order.id}-${Math.floor(Math.random() * 1000)}`;
    const returnUrl =
      process.env.WEBPAY_RETURN_URL ||
      'http://localhost:3000/orders/webpay/confirm';

    const response = (await this.webpay.create(
      buyOrder,
      `USR-${userId}`,
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
    if (!token) throw new BadRequestException('Token no proporcionado');

    const order = (await this.prisma.order.findFirst({
      where: { sessionId: token },
      include: {
        user: true,
        items: {
          include: { product: true, extras: { include: { extra: true } } },
        },
      },
    })) as unknown as OrderWithDetails; // El cast a nuestra interfaz limpia los rojos

    if (!order) throw new NotFoundException('Token no reconocido');

    try {
      const result = (await this.webpay.commit(token)) as WebpayCommitResponse;
      if (result.status === 'AUTHORIZED') {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'PAGADO' as OrderStatus },
        });
        console.log(this.generateTicket(order));
        return { status: 'success', orderId: order.id };
      } else {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'CANCELADO' as OrderStatus },
        });
        return { status: 'failed', orderId: order.id };
      }
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Error en el pago');
    }
  }

  private generateTicket(order: OrderWithDetails) {
    let t = `\n--- TICKET #${order.id} ---\nCliente: ${order.user.name}\nTel: ${order.user.phone}\nDir: ${order.address || 'Local'}\n`;
    order.items.forEach((i) => {
      t += `${i.quantity}x ${i.product.name} ($${i.priceAtPurchase})\n`;
      i.extras.forEach((e) => (t += `  + ${e.extra.name}\n`));
    });
    t += `Total: $${order.total}\n----------------\n`;
    return t;
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

  async findAllByUser(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
  async findAllForAdmin() {
    return this.prisma.order.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }
  async updateStatus(id: number, status: OrderStatus) {
    return this.prisma.order.update({ where: { id }, data: { status } });
  }
  async cancelOrder(id: number, userId: number) {
    const o = await this.findOne(id, userId);
    if (o.status !== 'PENDIENTE')
      throw new BadRequestException('No cancelable');
    return this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELADO' as OrderStatus },
    });
  }
}
