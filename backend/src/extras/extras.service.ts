import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateExtraDto } from './dto/create-extra.dto';

@Injectable()
export class ExtrasService {
  constructor(private prisma: PrismaService) {}

  // 1. Método para crear un nuevo Extra
  async create(createExtraDto: CreateExtraDto) {
    return this.prisma.extra.create({
      data: createExtraDto,
    });
  }

  // 2. Método para listar todos los Extras
  async findAll() {
    return this.prisma.extra.findMany();
  }

  // 3. Método para actualizar disponibilidad (Original)
  async updateAvailability(id: number, isAvailable: boolean) {
    const extra = await this.prisma.extra.findUnique({ where: { id } });

    if (!extra) {
      throw new NotFoundException(`El extra con ID ${id} no existe.`);
    }

    return this.prisma.extra.update({
      where: { id },
      data: { isAvailable },
    });
  }

  // 👇 4. NUEVO MÉTODO: Actualizar nombre, precio o disponibilidad (El que pedía el Controlador)
  async update(
    id: number,
    updateData: { name?: string; price?: number; isAvailable?: boolean },
  ) {
    const extra = await this.prisma.extra.findUnique({ where: { id } });

    if (!extra) {
      throw new NotFoundException(`El extra con ID ${id} no existe.`);
    }

    return this.prisma.extra.update({
      where: { id },
      data: updateData,
    });
  }
}
