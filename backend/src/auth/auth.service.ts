import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findOneByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new BadRequestException('El correo ya está registrado');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const newUser = await this.usersService.create(registerDto as any);

    try {
      await this.mailService.sendVerificationEmail(
        newUser.email,
        newUser.verificationToken!,
        newUser.name,
      );
    } catch (error) {
      // Si el correo falla (ej: mala contraseña SMTP), eliminamos al usuario
      // para que no quede "atrapado" y pueda intentar registrarse de nuevo
      await this.prisma.user.delete({ where: { id: newUser.id } });
      console.error('Error enviando correo de registro:', error);
      throw new BadRequestException('No se pudo enviar el correo de verificación. Intenta nuevamente más tarde.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, verificationToken, ...result } = newUser;
    return result;
  }

  async login(email: string, pass: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Por favor verifica tu correo electrónico antes de iniciar sesión',
      );
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    // Refresh token: rotación cada vez que se usa
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const refreshHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshHash },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 43200, // 12 horas en segundos
      user: { id: user.id, name: user.name, role: user.role },
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token requerido');
    }

    const refreshHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: { refreshToken: refreshHash },
    });

    if (!user) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // Rotación: generar nuevo refresh token en cada uso
    const payload = { sub: user.id, email: user.email, role: user.role };
    const newAccessToken = await this.jwtService.signAsync(payload);
    const newRefreshToken = crypto.randomBytes(48).toString('hex');
    const newRefreshHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshHash },
    });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_in: 43200,
      user: { id: user.id, name: user.name, role: user.role },
    };
  }
}
