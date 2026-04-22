import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { createCorsOptions } from './common/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(createCorsOptions('http://localhost:3000'));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
