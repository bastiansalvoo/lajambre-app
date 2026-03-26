import 'dotenv/config'; // <--- ESTO DEBE SER LA LÍNEA 1, ANTES DE TODO
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
  console.log('Servidor Lajambre listo en el puerto 3000 🍔');
}
bootstrap().catch((err) => {
  console.error('Error al arrancar el servidor:', err);
  process.exit(1);
});
