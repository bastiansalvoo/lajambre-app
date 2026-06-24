import {
  Injectable,
  NotFoundException,
  BadRequestException,
  //ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PointTransactionType, Prisma } from '@prisma/client';
import { WebpayService } from './webpay.service';

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    user: true;
    items: {
      include: {
        product: true;
        extras: { include: { extra: true } };
      };
    };
  };
}>;

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
    private configService: ConfigService,
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
    /*
    if (!this.isStoreOpen()) {
      throw new ForbiddenException('Lajambre cerrado. Horario: Mar-Dom 18:30 a 00:00.');
    }
    */

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      let deliveryFee = 1800;
      let pointsToUse = 0;
      let discount = 0;

      if (createOrderDto.rewardType) {
        const reward = createOrderDto.rewardType;
        // UNIFICADO: Llaves en mayúsculas como el DTO
        const rewardCosts: Record<string, number> = {
          QUESO_GRATIS: 120,
          BEBIDA_GRATIS: 150,
          PAPAS_GRATIS: 180,
          DELIVERY_GRATIS: 200,
          TOCINO_GRATIS: 200,
          CARNE_EXTRA: 250,
          DOS_BEBIDAS: 250,
          UPGRADE_BURGER: 300,
          DOS_POR_UNO: 600,
          BURGER_GRATIS: 800,
        };

        pointsToUse = rewardCosts[reward];

        if (!pointsToUse) throw new BadRequestException('Premio no válido.');

        // 👇 AGREGA ESTO SI NO ESTÁ:
        if (user.pointsBalance < pointsToUse) {
          throw new BadRequestException(
            `Puntos insuficientes. Tienes ${user.pointsBalance} y necesitas ${pointsToUse} pts.`,
          );
        }

        // ... (validación de puntos igual)

        switch (reward) {
          case 'DELIVERY_GRATIS':
            deliveryFee = 0;
            break;
          case 'QUESO_GRATIS':
          case 'TOCINO_GRATIS':
          case 'BEBIDA_GRATIS':
            discount = 1200;
            break;
          case 'PAPAS_GRATIS':
            discount = 2500;
            break; // Valor papas rústicas
          case 'CARNE_EXTRA':
          case 'DOS_BEBIDAS':
          case 'UPGRADE_BURGER':
            discount = 2000;
            break;
          case 'DOS_POR_UNO':
          case 'BURGER_GRATIS':
            discount = 8490;
            break; // Valor promedio
        }
      }

      // AHORA SÍ GUARDAMOS LOS CAMPOS NUEVOS
      const order = await tx.order.create({
        data: {
          userId,
          total: 0,
          deliveryFee,
          deliveryAddress: createOrderDto.deliveryAddress, // <--- GUARDADO
          contactPhone: createOrderDto.contactPhone, // <--- GUARDADO
          rewardType: createOrderDto.rewardType,
          pointsUsed: pointsToUse,
        },
      });

      let subTotalItems = 0;
      let hasBurger = false;

      // 2. PROCESAR PRODUCTOS Y EXTRAS
      for (const item of createOrderDto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product || !product.isAvailable) {
          throw new BadRequestException(
            `Producto ${product?.name || item.productId} agotado.`,
          );
        }

        // Heurística simple: Si cuesta más de $5000, asumimos que es una hamburguesa principal
        if (product.price >= 5000) hasBurger = true;

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

      // 3. VALIDACIÓN DE REGLA ESPECIAL (DOS_POR_UNO y UPGRADE_BURGER)
      if (
        createOrderDto.rewardType === 'DOS_POR_UNO' || // <--- CAMBIADO A MAYÚSCULAS
        createOrderDto.rewardType === 'UPGRADE_BURGER' // <--- CAMBIADO A MAYÚSCULAS
      ) {
        if (!hasBurger) {
          throw new BadRequestException(
            'Este premio requiere incluir al menos una hamburguesa.',
          );
        }
      }

      // 4. CÁLCULO FINAL Y DESCUENTO DE PUNTOS
      let finalTotal = subTotalItems + deliveryFee - discount;
      if (finalTotal < 0) finalTotal = 0;

      // Descontamos puntos de inmediato al crear la orden PENDIENTE
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
            type: PointTransactionType.REDEEMED,
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

    const apiHost = this.configService.get<string>('API_HOST', 'localhost');
    const port = this.configService.get<string>('PORT', '3000');
    const returnUrl =
      this.configService.get<string>('WEBPAY_RETURN_URL') ||
      `http://${apiHost}:${port}/orders/webpay/confirm`;

    // Si pagó 100% con puntos
    if (order.total === 0) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAGADO', buyOrder: `FREE-${order.id}` },
      });
      return {
        token: 'GRATIS',
        url: `http://${apiHost}:${port}/orders/webpay/confirm?token_ws=GRATIS`,
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
    if (token === 'GRATIS') return { status: 'success' };

    // Tipado seguro desde la consulta
    const order = (await this.prisma.order.findFirst({
      where: { sessionId: token },
      include: {
        user: true,
        items: {
          include: { product: true, extras: { include: { extra: true } } },
        },
      },
    })) as OrderWithDetails | null; // El casting es directo ahora

    if (!order) throw new NotFoundException('Token no reconocido');

    try {
      const result = (await this.webpay.commit(token)) as WebpayCommitResponse;

      if (result.status === 'AUTHORIZED') {
        let pointsEarned = Math.floor(order.total / 100);
        const hoy = new Date();
        if (hoy.getDay() === 2) pointsEarned = Math.floor(pointsEarned * 1.5); // Multiplicador día Martes

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

        return { status: 'success', orderId: order.id };
      } else {
        // --- DEVOLUCIÓN DE PUNTOS POR RECHAZO DE TARJETA ---
        await this.prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'CANCELADO' },
          });
          if (order.pointsUsed > 0) {
            await tx.user.update({
              where: { id: order.user.id },
              data: { pointsBalance: { increment: order.pointsUsed } },
            });
            await tx.pointTransaction.create({
              data: {
                userId: order.user.id,
                orderId: order.id,
                points: order.pointsUsed,
                type: PointTransactionType.EARNED,
              },
            });
          }
        });
        return { status: 'failed', orderId: order.id };
      }
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Error en el pago');
    }
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
      include: {
        items: {
          include: {
            product: true,
            extras: { include: { extra: true } }, // 👈 ESTA LÍNEA ES NUEVA (Recuerda los extras)
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForAdmin(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        include: {
          user: true,
          items: {
            include: {
              product: true,
              extras: { include: { extra: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count(),
    ]);

    return { data: orders, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateStatus(id: number, status: OrderStatus) {
    return this.prisma.order.update({ where: { id }, data: { status } });
  }

  async cancelOrder(id: number, userId: number) {
    const o = await this.findOne(id, userId);
    if (o.status !== 'PENDIENTE')
      throw new BadRequestException('No cancelable');

    // --- DEVOLUCIÓN DE PUNTOS POR CANCELACIÓN MANUAL ---
    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: 'CANCELADO' },
      });

      if (o.pointsUsed > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { pointsBalance: { increment: o.pointsUsed } },
        });
        await tx.pointTransaction.create({
          data: {
            userId: userId,
            orderId: id,
            points: o.pointsUsed,
            type: PointTransactionType.EARNED,
          },
        });
      }
      return updatedOrder;
    });
  }
}
