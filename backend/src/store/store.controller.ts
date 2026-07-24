import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StoreService } from './store.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // 🌍 PÚBLICO: el cliente lo consulta para saber si puede pedir
  @Get('status')
  getStatus() {
    return this.storeService.getStatus();
  }

  // 🔒 SOLO ADMIN: abrir/cerrar el local a mano
  @Patch('status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  setStatus(@Body('isOpen') isOpen: boolean) {
    return this.storeService.setOpen(isOpen);
  }
}
