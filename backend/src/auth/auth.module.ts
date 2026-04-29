import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; // <-- Importamos esto
import { JwtStrategy } from './jwt.strategy';
import { MailService } from './mail.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    UsersModule,
    // Usamos registerAsync para asegurar que lea el .env correctamente
    JwtModule.registerAsync({
      imports: [ConfigModule],
      // Quitamos el 'async' de aquí:
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') || 'secreto_de_respaldo_123',
        signOptions: { expiresIn: '12h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, MailService, PrismaService],
  controllers: [AuthController],
})
export class AuthModule {}
