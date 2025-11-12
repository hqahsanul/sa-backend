import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? 'development';

export const env = {
  nodeEnv,
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
} as const;

export const serverConfig = {
  port: Number(process.env.PORT ?? 4000),
  apiVersion: process.env.API_VERSION ?? 'v1',
} as const;

export const securityConfig = {
  jwtSecret: process.env.JWT_SECRET ?? 'super-secret-development-key',
  tokenExpirySeconds: Number(process.env.JWT_EXPIRY_SECONDS ?? 60 * 60 * 8),
} as const;

export const socketConfig = {
  path: process.env.WS_PATH ?? '/ws',
} as const;

