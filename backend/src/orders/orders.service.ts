import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PointTransactionType, Prisma, Reward } from '@prisma/client';
import { MercadoPagoService } from './mercadopago.service';
import { StoreService } from '../store/store.service';
import { RewardsService } from '../rewards/rewards.service';

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



@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private mercadoPago: MercadoPagoService,
    private configService: ConfigService,
    private storeService: StoreService,
    private rewardsService: RewardsService,
  ) {}

  private isWithinSchedule(): boolean {
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
    if (!(await this.storeService.isManuallyOpen())) {
      throw new ForbiddenException('Lajambre está cerrado por el momento. Vuelve a intentarlo más tarde.');
    }
    if (!this.isWithinSchedule()) {
      throw new ForbiddenException('Lajambre está cerrado. Horario: Martes a Domingo de 18:30 a 00:00.');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      let deliveryFee = createOrderDto.isDelivery === false ? 0 : 1800;
      let pointsToUse = 0;
      let discount = 0;
      let rewardRecord: Reward | null = null;

      if (createOrderDto.rewardType) {
        rewardRecord = await this.rewardsService.findByCode(createOrderDto.rewardType);

        if (!rewardRecord || !rewardRecord.isActive) {
          throw new BadRequestException('Premio no válido.');
        }

        pointsToUse = rewardRecord.pointsCost;

        if (user.pointsBalance < pointsToUse) {
          throw new BadRequestException(
            `Puntos insuficientes. Tienes ${user.pointsBalance} y necesitas ${pointsToUse} pts.`,
          );
        }

        if (rewardRecord.freeDelivery) {
          deliveryFee = 0;
        } else {
          discount = rewardRecord.discountAmount;
        }
      }

      // AHORA SÍ GUARDAMOS LOS CAMPOS NUEVOS
      const order = await tx.order.create({
        data: {
          userId,
          total: 0,
          deliveryFee,
          deliveryAddress: createOrderDto.deliveryAddress,
          contactPhone: createOrderDto.contactPhone,
          rewardType: createOrderDto.rewardType,
          pointsUsed: pointsToUse,
        },
      });

      // GUARDADO AUTOMÁTICO DE LA DIRECCIÓN PARA EL FUTURO
      if (createOrderDto.deliveryAddress || createOrderDto.contactPhone) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(createOrderDto.deliveryAddress && { address: createOrderDto.deliveryAddress }),
            ...(createOrderDto.contactPhone && { phone: createOrderDto.contactPhone })
          }
        });
      }

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

      // 3. VALIDACIÓN DE REGLA ESPECIAL (premios que requieren hamburguesa)
      if (rewardRecord?.requiresBurger && !hasBurger) {
        throw new BadRequestException(
          'Este premio requiere incluir al menos una hamburguesa.',
        );
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

    const apiHost = this.configService.get<string>('API_HOST', 'localhost');
    const port = this.configService.get<string>('PORT', '3000');
    const baseUrl = this.configService.get<string>('API_BASE_URL') ||
      `http://${apiHost}:${port}`;

    const feedbackUrl = `${baseUrl}/orders/mercadopago/feedback`;

    // Si pagó 100% con puntos, confirmar directamente sin pasar por pasarela
    if (order.total === 0) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAGADO', buyOrder: `FREE-${order.id}` },
      });
      return {
        checkout_url: `${baseUrl}/orders/mercadopago/feedback?status=approved&external_reference=FREE-${order.id}`,
        is_free: true,
      };
    }

    const externalReference = `ORDER-${order.id}-USR-${userId}`;

    // Construir items desde la orden
    const items = await this.prisma.orderItem.findMany({
      where: { orderId: order.id },
      include: { product: true },
    });

    const mpItems = items.map((item) => ({
      title: item.product.name,
      quantity: item.quantity,
      unit_price: item.priceAtPurchase,
    }));

    // En modo sandbox usamos sandbox_init_point.
    // El prefijo del token (APP_USR- vs TEST-) NO es confiable para distinguir
    // prueba de producción en Mercado Pago: algunas credenciales de prueba
    // (con "usuario de prueba" asociado) también usan el prefijo APP_USR-.
    // La única fuente de verdad es MERCADOPAGO_ENV, que el usuario cambia
    // manualmente al activar credenciales reales de producción.
    const isSandbox =
      this.configService.get<string>('MERCADOPAGO_ENV', 'sandbox') !== 'production';

    // Obtener email del usuario (usar uno falso en sandbox para evitar bloqueos de Mercado Pago)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const payerEmail = isSandbox ? `test_user_${Date.now()}@testuser.com` : (user?.email || 'cliente@lajambre.cl');

    const preference = await this.mercadoPago.createPreference({
      orderId: order.id,
      items: mpItems,
      payer: { 
        name: user?.name || 'Cliente',
        email: isSandbox ? undefined : payerEmail, // En sandbox omitimos para evitar error de sesión
      },
      backUrls: {
        success: feedbackUrl,
        failure: feedbackUrl,
        pending: feedbackUrl,
      },
      // Mercado Pago exige que el notificationUrl sea un dominio o IP pública válida.
      // Si estamos probando en red local (192.168...), enviamos un dominio falso válido
      // para saltarnos su validación estricta (el webhook real funcionará en prod).
      notificationUrl: baseUrl.includes('192.168') || baseUrl.includes('localhost') 
        ? 'https://api.lajambre.cl/orders/mercadopago/webhook' 
        : `${baseUrl}/orders/mercadopago/webhook`,
      externalReference,
    });

    // Guardar referencia externa en la orden
    await this.prisma.order.update({
      where: { id: order.id },
      data: { buyOrder: externalReference, sessionId: preference.preferenceId },
    });

    // EXPERIMENTO: probando init_point en vez de sandbox_init_point con
    // credenciales de prueba (tipo "usuario de prueba" / APP_USR-), porque
    // sandbox_init_point se está trabando en el botón "Pagar" del checkout.
    const checkoutUrl = preference.init_point;

    console.log('\n=============================================');
    console.log('🔗 URL DE PAGO (Cópiala en tu PC en Incógnito):');
    console.log(checkoutUrl);
    console.log('=============================================\n');

    return {
      checkout_url: checkoutUrl,
      preference_id: preference.preferenceId,
      is_free: false,
    };
  }

  /**
   * Confirma un pago de Mercado Pago usando el payment_id recibido en el back_url.
   * También soporta ordenes pagadas 100% con puntos (external_reference = FREE-{id}).
   */
  async confirmPayment(paymentId: string, externalReference: string) {
    // Caso pedido gratis (pagado con puntos)
    if (externalReference.startsWith('FREE-')) {
      const orderId = parseInt(externalReference.replace('FREE-', ''), 10);
      return { status: 'success', orderId };
    }

    if (!paymentId) throw new BadRequestException('payment_id no proporcionado');

    // Verificar pago en Mercado Pago
    const mpPayment = await this.mercadoPago.getPayment(paymentId);

    // Buscar orden por external_reference
    const order = (await this.prisma.order.findFirst({
      where: { buyOrder: externalReference },
      include: {
        user: true,
        items: {
          include: { product: true, extras: { include: { extra: true } } },
        },
      },
    })) as OrderWithDetails | null;

    if (!order) throw new NotFoundException('Orden no encontrada');

    // Idempotencia: si ya estaba PAGADO, no lo reprocesamos. Evita que
    // un webhook reenviado duplique puntos, y evita que una segunda
    // consulta a Mercado Pago (desde el feedback o un reintento de
    // webhook) revierta a CANCELADO un pago que ya habia sido confirmado.
    if (order.status === 'PAGADO') {
      return { status: 'success', orderId: order.id };
    }

    if (mpPayment.status === 'approved') {
      let pointsEarned = Math.floor(order.total / 100);
      const hoy = new Date();
      if (hoy.getDay() === 2) pointsEarned = Math.floor(pointsEarned * 1.5); // Martes

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
      // Pago rechazado o pendiente: cancelar y devolver puntos si hubo
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
      where: { userId, hiddenByUser: false },
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

  async clearHistory(userId: number) {
    await this.prisma.order.updateMany({
      where: { userId },
      data: { hiddenByUser: true },
    });
    return { success: true };
  }

  async findAllForAdmin(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
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
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { user: { select: { id: true, name: true, expoPushToken: true } } },
    });

    // Enviar notificación Push al cliente si tiene token
    if (updatedOrder.user?.expoPushToken) {
      let message = '';
      if (status === 'PREPARANDO') message = '👨‍🍳 ¡Tu pedido se está preparando en la cocina!';
      if (status === 'EN_CAMINO') message = '🛵 ¡Tu pedido ya va en camino hacia tu dirección!';
      if (status === 'ENTREGADO') message = '🎉 ¡Tu pedido ha sido entregado! Que lo disfrutes.';

      if (message) {
        try {
          await globalThis.fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: updatedOrder.user.expoPushToken,
              title: 'Lajambre 🍔',
              body: message,
              sound: 'default',
            }),
          });
        } catch (e) {
          console.error('Error enviando notificación Push:', e);
        }
      }
    }

    return updatedOrder;
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
