import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrderStatus } from '@prisma/client';

const PAID_STATUSES: OrderStatus[] = [
  OrderStatus.PAGADO,
  OrderStatus.PREPARANDO,
  OrderStatus.EN_CAMINO,
  OrderStatus.ENTREGADO,
];

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const [totalOrders, orders] = await Promise.all([
      this.prisma.order.count({ where: { status: { in: PAID_STATUSES } } }),
      this.prisma.order.findMany({
        where: { status: { in: PAID_STATUSES } },
        select: { total: true, createdAt: true },
      }),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const avgTicket = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ordersToday = await this.prisma.order.count({
      where: { status: { in: PAID_STATUSES }, createdAt: { gte: today, lt: tomorrow } },
    });

    const revenueToday = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: PAID_STATUSES }, createdAt: { gte: today, lt: tomorrow } },
    });

    return {
      totalOrders,
      totalRevenue,
      avgTicket,
      ordersToday,
      revenueToday: revenueToday._sum.total || 0,
    };
  }

  async getTopProducts(limit = 5) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return items.map((item) => {
      const product = productMap.get(item.productId);
      return {
        productId: item.productId,
        name: product?.name || 'Desconocido',
        price: product?.price || 0,
        quantitySold: item._sum.quantity || 0,
        revenue: (product?.price || 0) * (item._sum.quantity || 0),
      };
    });
  }

  async getSalesChart(days = 7) {
    // Ventas diarias de los últimos N días
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: { status: { in: PAID_STATUSES }, createdAt: { gte: startDate } },
      select: { total: true, createdAt: true },
    });

    // Agrupar por día
    const dailyMap: Record<string, { revenue: number; orders: number }> = {};

    // Inicializar todos los días
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = { revenue: 0, orders: 0 };
    }

    for (const order of orders) {
      const key = order.createdAt.toISOString().split('T')[0];
      if (dailyMap[key]) {
        dailyMap[key].revenue += order.total;
        dailyMap[key].orders += 1;
      }
    }

    return Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }));
  }

  async getHourlyHeatmap() {
    const orders = await this.prisma.order.findMany({
      where: { status: { in: PAID_STATUSES } },
      select: { createdAt: true },
    });

    const heatmap: { hour: number; dayOfWeek: number; orders: number }[] = [];
    const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

    for (const order of orders) {
      const d = new Date(order.createdAt);
      const hour = d.getHours();
      const dayOfWeek = d.getDay(); // 0=dom, 6=sab
      matrix[dayOfWeek][hour]++;
    }

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        if (matrix[day][hour] > 0) {
          heatmap.push({ hour, dayOfWeek: day, orders: matrix[day][hour] });
        }
      }
    }

    return heatmap;
  }
}
