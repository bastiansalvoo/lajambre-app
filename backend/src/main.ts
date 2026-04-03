import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 👇 AQUÍ HABILITAMOS CORS (El guardia le abre la puerta a la app móvil)
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // 🖼️ ¡ESTO YA LO TENÍAS Y ESTÁ PERFECTO! (Hace públicas las fotos)
  const uploadsPath = join(process.cwd(), 'uploads');
  console.log('📁 Carpeta de imágenes configurada en:', uploadsPath);
  app.use('/uploads', express.static(uploadsPath));

  await app.listen(3000, '0.0.0.0');
  console.log('🚀 Backend de Lajambre corriendo en: http://localhost:3000');
}
bootstrap();
