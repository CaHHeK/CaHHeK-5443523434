import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Используем встроенный метод для статических файлов
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/',
  });

  await app.listen(3002);
  console.log('Application is running on: http://localhost:3002');
}
bootstrap();
