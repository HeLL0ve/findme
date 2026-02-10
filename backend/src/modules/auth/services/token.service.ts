import { redis } from '../../../config/redis';

const refreshPrefix = 'refresh:';

export const tokenService = {
  async saveRefreshToken(token: string, userId: string, expiresInSeconds: number) {
    const key = refreshPrefix + token;
    await redis.set(key, userId, 'EX', expiresInSeconds);
  },

  async deleteRefreshToken(token: string) {
    const key = refreshPrefix + token;
    await redis.del(key);
  },

  async verifyTokenExists(token: string) {
    const key = refreshPrefix + token;
    const val = await redis.get(key);
    return val; // userId or null
  },
};

export default tokenService;
