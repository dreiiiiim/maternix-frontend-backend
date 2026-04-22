import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const WORKERS_DEV_PATTERN = /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.workers\.dev$/i;

function parseOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createCorsOptions(defaultOrigin: string): CorsOptions {
  const configuredOrigins =
    process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? defaultOrigin;
  const allowWorkersDev = (process.env.ALLOW_WORKERS_DEV ?? 'true') !== 'false';
  const allowedOrigins = parseOrigins(configuredOrigins);

  return {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (allowWorkersDev && WORKERS_DEV_PATTERN.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  };
}
