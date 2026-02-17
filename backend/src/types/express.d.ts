import { Request } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string;
      role: 'USER' | 'ADMIN';
    };
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
  }
}
