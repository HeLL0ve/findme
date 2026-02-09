import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT)!,

  databaseUrl: process.env.DATABASE_URL! as string,
  redisHost: process.env.REDIS_HOST! as string,
  redisPort: Number(process.env.REDIS_PORT)!,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET! as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET! as string,
};

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}