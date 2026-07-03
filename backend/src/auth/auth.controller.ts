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
  Res,
  Patch,
} from '@nestjs/common';
import type { Response } from 'express';
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
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    if (!token) {
      return res.status(400).send('<h1 style="color:white;background:#000;text-align:center;padding:50px;">Token de verificación no proporcionado</h1>');
    }

    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return res.status(400).send(`
        <body style="background:#0a0a0a; color:white; font-family:sans-serif; text-align:center; padding:50px;">
          <h1 style="color:#EF4444;">Enlace Inválido</h1>
          <p>El código de verificación es inválido o ya fue utilizado.</p>
        </body>
      `);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cuenta Verificada - Lajambre</title>
      </head>
      <body style="margin:0; padding:0; background-color:#0a0a0a; color:#ffffff; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh;">
        <div style="background-color:rgba(255,255,255,0.05); padding:40px; border-radius:24px; text-align:center; border:1px solid rgba(255,255,255,0.1); max-width:400px; width:90%; box-shadow: 0 10px 40px rgba(234, 179, 8, 0.1);">
          <div style="font-size:70px; margin-bottom:20px;">🍔</div>
          <h1 style="color:#EAB308; margin-top:0; text-transform:uppercase; font-weight:900; letter-spacing:1px;">¡Cuenta Verificada!</h1>
          <p style="color:#a3a3a3; line-height:1.6; font-size:16px;">Todo listo, <strong style="color:white;">${user.name}</strong>. Tu correo ha sido confirmado exitosamente.</p>
          <p style="color:#777; font-size:14px; margin-top:30px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.05);">Ya puedes cerrar esta ventana y regresar a la aplicación de <strong style="color:#EAB308;">Lajambre</strong> para iniciar sesión.</p>
        </div>
      </body>
      </html>
    `;

    return res.status(200).send(html);
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

  @UseGuards(AuthGuard('jwt'))
  @Patch('push-token')
  async updatePushToken(
    @Request() req: { user: { userId: number } },
    @Body('token') token: string,
  ) {
    return this.usersService.updatePushToken(req.user.userId, token);
  }
}
