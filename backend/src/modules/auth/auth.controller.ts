import { Request, Response } from 'express';
import { registerSchema } from './auth.schemas';
import { AuthService } from './auth.service';

export class AuthController {
  static async register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      });
    }

    const user = await AuthService.register(parsed.data);

    return res.status(201).json(user);
  }
}