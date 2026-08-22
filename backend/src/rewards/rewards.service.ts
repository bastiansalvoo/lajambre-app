import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';

@Injectable()
export class RewardsService {
  constructor(private prisma: PrismaService) {}

  // 🌍 PÚBLICO: solo premios activos, para el carrito y la pantalla de perfil.
  async findAllActive() {
    return this.prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { pointsCost: 'asc' },
    });
  }

  // 🔒 ADMIN: todos, incluidos los desactivados, para el panel de gestion.
  async findAllForAdmin() {
    return this.prisma.reward.findMany({ orderBy: { pointsCost: 'asc' } });
  }

  async findByCode(code: string) {
    return this.prisma.reward.findUnique({ where: { code } });
  }

  async create(dto: CreateRewardDto) {
    const existing = await this.prisma.reward.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Ya existe un premio con el codigo ${dto.code}`);
    }
    return this.prisma.reward.create({ data: dto });
  }

  async update(id: number, dto: UpdateRewardDto) {
    const reward = await this.prisma.reward.findUnique({ where: { id } });
    if (!reward) throw new NotFoundException(`Premio #${id} no encontrado`);
    return this.prisma.reward.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    const reward = await this.prisma.reward.findUnique({ where: { id } });
    if (!reward) throw new NotFoundException(`Premio #${id} no encontrado`);
    return this.prisma.reward.delete({ where: { id } });
  }
}
