import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // 🔥 FUSIONADOS: Una sola configuración para dominarlos a todos
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Esto es la clave para el Error 400
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const uploadsPath = join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // 0.0.0.0 permite que el celular entre por la IP de tu Wi-Fi
  await app.listen(3000, '0.0.0.0');
  console.log('🚀 Backend de Lajambre corriendo en: http://192.168.1.14:3000');
}
bootstrap();
