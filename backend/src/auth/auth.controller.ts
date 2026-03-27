import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport'; // <-- Importar el Guardia

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(@Body() body: Prisma.UserCreateInput) {
    const newUser = await this.usersService.create(body);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = newUser;
    return result;
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  // --- RUTA PROTEGIDA CON CANDADO ---
  @UseGuards(AuthGuard('jwt'))
  @Get('perfil')
  getProfile(
    @Request() req: { user: { userId: number; email: string; role: string } },
  ) {
    // TypeScript ahora sabe perfectamente que req.user tiene un userId, email y role
    return { mensaje: '¡Acceso concedido al área VIP!', usuario: req.user };
  }
}
