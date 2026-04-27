import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma, PointTransactionType } from '@prisma/client';
import { Cron } from '@nestjs/schedule';
import * as crypto from 'crypto'; // <-- Importar la librería nativa de Node para crear códigos seguros

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // 👇 Generamos un código secreto de 40 letras/números
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Guardamos al usuario "congelado" y con el código secreto
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
          take: 10,
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const pts = user.pointsBalance;

    // 🏆 Definición de los nuevos premios de Angelo
    const listaPremios = [
      { id: 'queso', nombre: 'Queso Extra', pts: 120, icono: '🧀' },
      { id: 'bebida', nombre: 'Bebida Gratis', pts: 150, icono: '🥤' },
      {
        id: 'papas',
        nombre: 'Papas Fritas Extra (130g)',
        pts: 180,
        icono: '🍟',
      },
      { id: 'delivery', nombre: 'Delivery Gratis', pts: 200, icono: '🚚' },
      { id: 'tocino', nombre: 'Tocino Extra', pts: 200, icono: '🥓' },
      { id: 'carne', nombre: 'Carne Extra', pts: 250, icono: '🥩' },
      { id: 'dos_bebidas', nombre: '2 Bebidas', pts: 250, icono: '🥤🥤' },
      {
        id: 'upgrade',
        nombre: 'Upgrade de Hamburguesa',
        pts: 300,
        icono: '🔝',
      },
      {
        id: 'dos_por_uno',
        nombre: 'Burger 2x1 (comprando 1)',
        pts: 600,
        icono: '👯',
      },
      {
        id: 'burger_gratis',
        nombre: 'Hamburguesa Gratis',
        pts: 800,
        icono: '🍔',
      },
    ];

    // 🧠 GAMIFICACIÓN: Niveles de fidelidad
    let nivel = 'Bronce 🥉';
    if (pts >= 1500) nivel = 'Oro 👑';
    else if (pts >= 500) nivel = 'Plata 🥈';

    return {
      puntosActuales: pts,
      nivelActual: nivel,
      // Mapeamos los premios para que el frontend sepa qué mostrar
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
