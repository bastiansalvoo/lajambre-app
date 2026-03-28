import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma, PointTransactionType } from '@prisma/client';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    return this.prisma.user.create({
      data: { ...data, password: hashedPassword },
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
          take: 10,
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const pts = user.pointsBalance;

    // 🧠 GAMIFICACIÓN: Calculamos el nivel del cliente
    let nivel = 'Bronce 🥉';
    if (pts >= 1500) nivel = 'Oro 👑';
    else if (pts >= 500) nivel = 'Plata 🥈';

    return {
      puntosActuales: pts,
      nivelActual: nivel, // <-- Lo mandamos a la app móvil
      progreso: {
        bebida: {
          alcanzado: pts >= 150,
          faltan: pts >= 150 ? 0 : 150 - pts,
          mensaje:
            pts >= 150
              ? '¡Bebida gratis desbloqueada! 🥤'
              : `Faltan ${150 - pts} pts para bebida gratis`,
        },
        delivery: {
          alcanzado: pts >= 200,
          faltan: pts >= 200 ? 0 : 200 - pts,
          mensaje:
            pts >= 200
              ? '¡Delivery gratis desbloqueado! 🚚'
              : `Faltan ${200 - pts} pts para delivery gratis`,
        },
        hamburguesa: {
          alcanzado: pts >= 800,
          faltan: pts >= 800 ? 0 : 800 - pts,
          mensaje:
            pts >= 800
              ? '¡Hamburguesa gratis desbloqueada! 🍔'
              : `Faltan ${800 - pts} pts para burger gratis`,
        },
      },
      historial: user.pointTransactions.map((t) => ({
        id: t.id,
        puntos: t.points,
        tipo: t.type,
        fecha: t.createdAt,
      })),
    };
  }

  // 🧹 ROBOT NOCTURNO: Se ejecuta todos los días a las 3:00 AM
  @Cron('0 3 * * *')
  async cleanExpiredPoints() {
    console.log('Iniciando limpieza de puntos vencidos...');
    const now = new Date();

    // 1. Buscamos puntos ganados hace más de 90 días que aún no han sido procesados
    const expiredTxs = await this.prisma.pointTransaction.findMany({
      where: { type: PointTransactionType.EARNED, expiresAt: { lte: now } },
    });

    for (const tx of expiredTxs) {
      const user = await this.prisma.user.findUnique({
        where: { id: tx.userId },
      });

      if (user && user.pointsBalance > 0) {
        // Le quitamos los puntos (pero sin dejarlo en números negativos)
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
          // Borramos la fecha para que el robot no la vuelva a leer mañana
          this.prisma.pointTransaction.update({
            where: { id: tx.id },
            data: { expiresAt: null },
          }),
        ]);
      } else {
        // Si el usuario ya se gastó los puntos y tiene 0, solo marcamos la transacción como leída
        await this.prisma.pointTransaction.update({
          where: { id: tx.id },
          data: { expiresAt: null },
        });
      }
    }
  }
}
