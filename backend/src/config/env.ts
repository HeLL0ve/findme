import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 3000,

  databaseUrl: process.env.DATABASE_URL! as string,
  redisHost: process.env.REDIS_HOST! as string,
  redisPort: Number(process.env.REDIS_PORT) || 6379,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET! as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET! as string,

  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChannelId: process.env.TELEGRAM_CHANNEL_ID || '',
};

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}
