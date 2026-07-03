import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import helmet from 'helmet';
import { join } from 'path';
import * as express from 'express';
import { AllExceptionsFilter } from './filters/http-exception.filter';

async function bootstrap() {
  // Winston: logs a consola + archivo rotativo diario
  const winstonLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        ),
      }),
      new winston.transports.DailyRotateFile({
        filename: 'logs/lajambre-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '30d',
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: winstonLogger }),
  });

  // Seguridad: Helmet (headers HTTP)
  app.use(helmet());

  // CORS: permite cualquier origen en desarrollo, configurable en producción
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Filtro global: errores estandarizados
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Archivos estáticos (uploads de productos)
  const uploadsPath = join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  const host = process.env.HOST || '0.0.0.0';
  const port = parseInt(process.env.PORT || '3000', 10);

  await app.listen(port, host);
  winstonLogger.info(
    `🚀 Backend de Lajambre corriendo en: http://${process.env.API_HOST || 'localhost'}:${port}`,
  );
}
bootstrap();
