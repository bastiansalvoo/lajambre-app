import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto, userId: number) {
    let totalOrder = 0;
    const deliveryFee = 1000;

    // 1. Iniciamos una transacción para que todo sea atómico
    return this.prisma.$transaction(async (tx) => {
      // Creamos la orden base
      const order = await tx.order.create({
        data: {
          userId,
          total: 0, // Lo actualizaremos al final del cálculo
          deliveryFee,
          // address y phone se podrían sacar del perfil, pero los pasamos por ahora
        },
      });

      for (const item of createOrderDto.items) {
        // Buscamos el producto real para sacar el precio verídico
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product)
          throw new NotFoundException(
            `Producto ${item.productId} no encontrado`,
          );

        let itemTotal = product.price * item.quantity;

        // Creamos el detalle del pedido (OrderItem)
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: product.price,
          },
        });

        // Si hay extras, los procesamos
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

      // Sumamos el envío al total final
      const finalTotal = totalOrder + deliveryFee;

      // Actualizamos la orden con el total real calculado
      return tx.order.update({
        where: { id: order.id },
        data: { total: finalTotal },
        include: { items: { include: { extras: true } } },
      });
    });
  }

  async findAllByUser(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            extras: { include: { extra: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' }, // Los más nuevos primero
    });
  }

  // 2. Obtener UN pedido por ID (con validación de dueño)
  async findOne(id: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            extras: { include: { extra: true } },
          },
        },
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException(
        'Pedido no encontrado o no tienes permiso para verlo',
      );
    }
    return order;
  }

  async findAllForAdmin() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } }, // Sabemos quién pidió
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: number, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    return this.prisma.order.update({
      where: { id },
      data: { status }, // Ahora los tipos coinciden perfectamente
    });
  }
}
