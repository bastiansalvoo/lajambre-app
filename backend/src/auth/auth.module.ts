import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt'; // <-- 1. Importamos el módulo JWT
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,
    // 2. Configuramos la llave secreta
    JwtModule.register({
      global: true,
      secret: 'super_secreto_lajambre_2026', // En producción esto va en el .env
      signOptions: { expiresIn: '12h' }, // La sesión dura 12 horas
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
