import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import path from 'path';
import { createRequire } from 'module';
import { AppModule } from './app.module';
import { createCorsOptions } from './common/cors';

async function bootstrap() {
  const port = Number(process.env.SINGLE_PORT ?? '3000');
  const frontendUrl = process.env.FRONTEND_URL ?? `http://localhost:${port}`;
  const apiPrefix = process.env.API_PREFIX ?? 'api';

  process.env.PORT = String(port);
  process.env.FRONTEND_URL = frontendUrl;

  const backendDir = path.resolve(__dirname, '..');
  const frontendDir = path.resolve(backendDir, '..', 'frontend');
  const frontendRequire = createRequire(path.join(frontendDir, 'package.json'));
  const next = frontendRequire('next') as (options: {
    dev: boolean;
    dir: string;
    hostname: string;
    port: number;
  }) => {
    prepare: () => Promise<void>;
    getRequestHandler: () => (req: express.Request, res: express.Response) => Promise<void>;
  };

  const nextApp = next({
    dev: true,
    dir: frontendDir,
    hostname: 'localhost',
    port,
  });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    cors: false,
  });

  app.enableCors(createCorsOptions(frontendUrl));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix(apiPrefix);

  await app.init();

  server.all(/.*/, (req, res) => handle(req, res));

  server.listen(port, () => {
    console.log(`[single-port] frontend and backend ready on ${frontendUrl}`);
    console.log(`[single-port] api available at ${frontendUrl}/${apiPrefix}`);
  });
}

bootstrap().catch((error) => {
  console.error('[single-port] failed to start', error);
  process.exit(1);
});
