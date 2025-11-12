import cors from 'cors';
import express from 'express';

import routes from './routes';
import { env, serverConfig } from './config';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.status(200).json({
      name: 'Sanatan Ayurveda API',
      version: serverConfig.apiVersion,
      status: 'running',
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(`/api/${serverConfig.apiVersion}`, routes);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Unexpected error', details: err.message });
  });

  return app;
}

