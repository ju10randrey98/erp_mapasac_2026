import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS para Vite (5173)
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  // DTO validations (si usas class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(3000);
  console.log(`API running on http://localhost:3000`);
}

bootstrap();
