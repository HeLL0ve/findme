import { createServer } from 'http';
import { app } from './app';
import { env } from './config/env';
import { initWsServer } from './ws/wsServer';

const server = createServer(app);
initWsServer(server);

server.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
