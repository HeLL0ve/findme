import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 3000,

  databaseUrl: process.env.DATABASE_URL! as string,
  redisHost: process.env.REDIS_HOST! as string,
  redisPort: Number(process.env.REDIS_PORT) || 6379,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET! as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET! as string,

  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  appUrl: process.env.APP_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  publicApiUrl: process.env.PUBLIC_API_URL || process.env.API_URL || process.env.APP_URL || 'http://localhost:3000',

  mailFrom: process.env.MAIL_FROM || 'noreply@findme.local',
  mailBrandName: process.env.MAIL_BRAND_NAME || 'FindMe',
  mailLogoUrl: process.env.MAIL_LOGO_URL || '',
  mailApiUrl: process.env.MAIL_API_URL || '',
  mailApiKey: process.env.MAIL_API_KEY || '',
  gmailUser: process.env.GMAIL_USER || '',
  gmailPassword: process.env.GMAIL_PASSWORD || '', // Use Gmail App Password

  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChannelId: process.env.TELEGRAM_CHANNEL_ID || '',
  telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || '',

  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
};

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}
