import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client'; // <-- Importamos los tipos exactos
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Ahora TypeScript sabe exactamente qué campos tiene "data"
  async create(data: Prisma.UserCreateInput) {
    // Generamos la sal (salt) y el hash de seguridad
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Guardamos en la DB con la contraseña protegida
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  // Buscar usuario por email (para el Login posterior)
  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async getRewardsInfo(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        pointTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Traemos solo los últimos 10 movimientos para no saturar la app
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const pts = user.pointsBalance;

    return {
      puntosActuales: pts,
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
        puntos: t.points, // Será positivo o negativo según si ganó o gastó
        tipo: t.type, // 'EARNED' o 'REDEEMED'
        fecha: t.createdAt,
      })),
    };
  }
}
