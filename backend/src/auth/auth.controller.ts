import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from './dto/register.dto'; // <-- Importamos
import { LoginDto } from './dto/login.dto'; // <-- Importamos

@Controller('auth')
// Aplicamos la validación solo a este controlador para mayor seguridad
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const newUser = await this.usersService.create(registerDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = newUser;
    return result;
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
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
