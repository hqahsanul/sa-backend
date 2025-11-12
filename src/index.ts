import { createServer } from 'http';

import { createApp } from './app';
import { serverConfig } from './config';
import { seedInitialUsers, seededPassword } from './store/seed';
import { createRealtimeServer } from './sockets/realtime.socket';

async function start() {
  seedInitialUsers();

  const app = createApp();
  const server = createServer(app);
  createRealtimeServer(server);

  server.listen(serverConfig.port, () => {
    console.log(`Server listening on http://localhost:${serverConfig.port}`);
    console.log(`Seeded accounts ready. Example login: doctor@sayurveda.test / ${seededPassword}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});

