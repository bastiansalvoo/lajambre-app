import {
  Injectable,
  NotFoundException,
  BadRequestException,
  //ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PointTransactionType } from '@prisma/client';
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

interface OrderWithDetails {
  id: number;
  createdAt: Date;
  address: string | null;
  total: number;
  deliveryFee: number;
  pointsEarned: number;
  pointsUsed: number;
  rewardType: string | null;
  user: { id: number; name: string; phone: string; pointsBalance: number };
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
    // COMENTAMOS ESTO TEMPORALMENTE PARA PODER COMPRAR DE DÍA
    // if (!this.isStoreOpen()) {
    //   throw new ForbiddenException('Lajambre cerrado. Horario: Mar-Dom 18:30 a 00:00.');
    // }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      let deliveryFee = 1250;
      let pointsToUse = 0;
      let discount = 0;

      // 1. Validar Canjes de Puntos
      if (createOrderDto.rewardType) {
        if (createOrderDto.rewardType === 'FREE_DELIVERY') {
          if (user.pointsBalance < 200)
            throw new BadRequestException(
              'Puntos insuficientes para Delivery Gratis',
            );
          pointsToUse = 200;
          deliveryFee = 0; // Se elimina el cobro de envío
        } else if (createOrderDto.rewardType === 'FREE_BEVERAGE') {
          if (user.pointsBalance < 150)
            throw new BadRequestException(
              'Puntos insuficientes para Bebida Gratis',
            );
          pointsToUse = 150;
          discount = 1000; // Descuento directo por la bebida
        } else if (createOrderDto.rewardType === 'FREE_BURGER') {
          if (user.pointsBalance < 800)
            throw new BadRequestException(
              'Puntos insuficientes para Hamburguesa Gratis',
            );
          pointsToUse = 800;
          discount = 7990; // Descuento promedio de una hamburguesa
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          total: 0,
          deliveryFee,
          rewardType: createOrderDto.rewardType,
          pointsUsed: pointsToUse,
        },
      });

      let subTotalItems = 0;
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
            if (!extra || !extra.isAvailable)
              throw new BadRequestException(`Agregado agotado.`);

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
        subTotalItems += itemTotal;
      }

      // 2. Calcular total final asegurando que no quede en negativo
      let finalTotal = subTotalItems + deliveryFee - discount;
      if (finalTotal < 0) finalTotal = 0;

      // 3. Descontar puntos al usuario de inmediato si usó un canje
      if (pointsToUse > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { pointsBalance: { decrement: pointsToUse } },
        });

        await tx.pointTransaction.create({
          data: {
            userId,
            orderId: order.id,
            points: -pointsToUse,
            type: PointTransactionType.REDEEMED, // <-- Cambio aquí
          },
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: { total: finalTotal },
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

    // Si el total es 0 (ej: canjeó puntos y pagó todo el pedido), podemos saltarnos Webpay
    if (order.total === 0) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAGADO', buyOrder: `FREE-${order.id}` },
      });
      return {
        token: 'GRATIS',
        url: 'http://localhost:3000/orders/webpay/confirm?token_ws=GRATIS',
      };
    }

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

    // Manejo de pedidos gratuitos (pagados 100% con puntos)
    if (token === 'GRATIS')
      return { status: 'success', message: 'Pedido gratuito por canje' };

    const order = (await this.prisma.order.findFirst({
      where: { sessionId: token },
      include: {
        user: true,
        items: {
          include: { product: true, extras: { include: { extra: true } } },
        },
      },
    })) as unknown as OrderWithDetails;

    if (!order) throw new NotFoundException('Token no reconocido');

    try {
      const result = (await this.webpay.commit(token)) as WebpayCommitResponse;

      if (result.status === 'AUTHORIZED') {
        // --- 4. CALCULAR Y ENTREGAR PUNTOS AL PAGAR ---
        const pointsEarned = Math.floor(order.total / 100);

        // Vencimiento en 90 días
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);

        await this.prisma.$transaction([
          this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'PAGADO', pointsEarned },
          }),
          this.prisma.user.update({
            where: { id: order.user.id },
            data: { pointsBalance: { increment: pointsEarned } },
          }),
          this.prisma.pointTransaction.create({
            data: {
              userId: order.user.id,
              orderId: order.id,
              points: pointsEarned,
              type: PointTransactionType.EARNED,
              expiresAt,
            },
          }),
        ]);

        console.log(this.generateTicket(order, pointsEarned));
        return { status: 'success', orderId: order.id };
      } else {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'CANCELADO' },
        });
        return { status: 'failed', orderId: order.id };
      }
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Error en el pago');
    }
  }

  private generateTicket(order: OrderWithDetails, pointsEarned: number) {
    let t = `\n--- TICKET #${order.id} ---\nCliente: ${order.user.name}\nTel: ${order.user.phone}\nDir: ${order.address || 'Local'}\n`;

    if (order.rewardType)
      t += `🎁 Canje utilizado: ${order.rewardType} (-${order.pointsUsed} pts)\n`;

    order.items.forEach((i) => {
      t += `${i.quantity}x ${i.product.name} ($${i.priceAtPurchase})\n`;
      i.extras.forEach((e) => (t += `  + ${e.extra.name}\n`));
    });
    t += `Delivery: $${order.deliveryFee}\n`;
    t += `Total a pagar: $${order.total}\n`;
    t += `⭐ Puntos ganados en esta compra: ${pointsEarned}\n`;
    t += `----------------\n`;
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
      data: { status: 'CANCELADO' },
    });
  }
}
