import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client'; // <-- Importamos los tipos exactos

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
}
