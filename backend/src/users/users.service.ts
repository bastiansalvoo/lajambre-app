import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma, PointTransactionType } from '@prisma/client';
import { Cron } from '@nestjs/schedule';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const verificationToken = crypto.randomBytes(20).toString('hex');

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        isVerified: false,
        verificationToken: verificationToken,
      },
    });
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getRewardsInfo(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        pointTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Para el historial visual de la app
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const pts = user.pointsBalance; // Saldo real para gastar

    // 👇 SOLUCIÓN: Calculamos los puntos HISTÓRICOS (solo lo que ha ganado)
    const transaccionesHistoricas = await this.prisma.pointTransaction.findMany(
      {
        where: {
          userId: userId,
          type: PointTransactionType.EARNED, // Solo sumamos lo ganado, ignoramos los canjes
        },
      },
    );

    const puntosHistoricos = transaccionesHistoricas.reduce(
      (total, tx) => total + tx.points,
      0,
    );

    // 🏆 PREMIOS OFICIALES LAJAMBRE
    const listaPremios = [
      { id: 'BEBIDA_GRATIS', nombre: 'Bebida Gratis', pts: 150, icono: '🥤' },
      {
        id: 'DELIVERY_GRATIS',
        nombre: 'Delivery Gratis',
        pts: 200,
        icono: '🚚',
      },
      {
        id: 'BURGER_GRATIS',
        nombre: 'Hamburguesa Gratis',
        pts: 800,
        icono: '🍔',
      },
    ];

    // 🧠 GAMIFICACIÓN: Basado en PUNTOS HISTÓRICOS (Ya no bajan de nivel)
    let nivel = 'Bronce 🥉';
    if (puntosHistoricos >= 1500) nivel = 'Oro 👑';
    else if (puntosHistoricos >= 500) nivel = 'Plata 🥈';

    return {
      puntosActuales: pts, // Saldo para gastar en el carrito
      nivelActual: nivel, // Nivel que no se pierde al gastar
      recompensas: listaPremios.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        puntosRequeridos: p.pts,
        alcanzado: pts >= p.pts,
        faltan: pts >= p.pts ? 0 : p.pts - pts,
        mensaje:
          pts >= p.pts
            ? `¡${p.nombre} desbloqueado! ${p.icono}`
            : `Te faltan ${p.pts - pts} pts para ${p.nombre}`,
        icono: p.icono,
      })),
      historial: user.pointTransactions.map((t) => ({
        id: t.id,
        puntos: t.points,
        tipo: t.type,
        fecha: t.createdAt,
      })),
    };
  }

  @Cron('0 3 * * *')
  async cleanExpiredPoints() {
    console.log('Iniciando limpieza de puntos vencidos...');
    const now = new Date();

    const expiredTxs = await this.prisma.pointTransaction.findMany({
      where: { type: PointTransactionType.EARNED, expiresAt: { lte: now } },
    });

    for (const tx of expiredTxs) {
      const user = await this.prisma.user.findUnique({
        where: { id: tx.userId },
      });

      if (user && user.pointsBalance > 0) {
        const pointsToRemove = Math.min(tx.points, user.pointsBalance);

        await this.prisma.$transaction([
          this.prisma.user.update({
            where: { id: user.id },
            data: { pointsBalance: { decrement: pointsToRemove } },
          }),
          this.prisma.pointTransaction.create({
            data: {
              userId: user.id,
              points: -pointsToRemove,
              type: PointTransactionType.EXPIRED,
            },
          }),
          this.prisma.pointTransaction.update({
            where: { id: tx.id },
            data: { expiresAt: null },
          }),
        ]);
      } else {
        await this.prisma.pointTransaction.update({
          where: { id: tx.id },
          data: { expiresAt: null },
        });
      }
    }
  }
}
