import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  // Fila unica (id=1). La creamos con isOpen=true si todavia no existe.
  async getStatus(): Promise<{ isOpen: boolean }> {
    const status = await this.prisma.storeStatus.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, isOpen: true },
    });
    return { isOpen: status.isOpen };
  }

  async setOpen(isOpen: boolean): Promise<{ isOpen: boolean }> {
    const status = await this.prisma.storeStatus.upsert({
      where: { id: 1 },
      update: { isOpen },
      create: { id: 1, isOpen },
    });
    return { isOpen: status.isOpen };
  }

  // Helper interno para OrdersService: true salvo que el admin haya cerrado a mano.
  async isManuallyOpen(): Promise<boolean> {
    const { isOpen } = await this.getStatus();
    return isOpen;
  }
}
