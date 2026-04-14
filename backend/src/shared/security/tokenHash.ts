import { createHash, randomBytes } from 'crypto';

export function createRawToken(size = 32) {
  return randomBytes(size).toString('hex');
}

export function hashToken(value: string) {
  return createHash('sha256').update(value).digest('hex');
}
