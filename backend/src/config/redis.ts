import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis({
  host: env.redisHost,
  port: env.redisPort,
});