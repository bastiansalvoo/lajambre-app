import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from './dto/register.dto'; // <-- Importamos
import { LoginDto } from './dto/login.dto'; // <-- Importamos
import { PrismaService } from '../prisma.service';

@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService, // <-- Asegúrate de importar PrismaService si lo necesitas directo
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    // 👇 Ahora llamamos al authService que orquesta todo (base de datos + correo)
    return this.authService.register(registerDto);
  }

  // 👇 NUEVA RUTA: Aquí llega el usuario cuando hace clic en el correo
  @Get('verify')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      return { message: 'Token de verificación no proporcionado' };
    }

    // Buscamos si existe alguien con ese código secreto
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return {
        message: 'El código de verificación es inválido o ya fue utilizado.',
      };
    }

    // Si lo encontramos, lo descongelamos (isVerified: true) y borramos el código
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null, // Borramos el código para que no se use de nuevo
      },
    });

    // Podríamos redirigir a una página bonita de éxito, pero por ahora mostramos texto
    return {
      message:
        '¡Cuenta verificada con éxito! Ya puedes iniciar sesión en la app de La Jambre.',
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('perfil')
  getProfile(
    @Request() req: { user: { userId: number; email: string; role: string } },
  ) {
    return { mensaje: 'Acceso autorizado', usuario: req.user };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('recompensas')
  async getRecompensas(@Request() req: { user: { userId: number } }) {
    // Llamamos a la magia que acabamos de crear en el servicio
    return this.usersService.getRewardsInfo(req.user.userId);
  }
}
