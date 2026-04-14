import { createServer } from 'http';
import { app } from './app';
import { env } from './config/env';
import { initWsServer } from './ws/wsServer';
import { startTelegramBot } from './modules/telegram/telegram.bot';

const server = createServer(app);
initWsServer(server);
startTelegramBot();

server.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
