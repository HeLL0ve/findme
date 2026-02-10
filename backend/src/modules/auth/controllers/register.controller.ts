import { Request, Response } from 'express';
import { registerSchema } from '../schemas/register.schemas';
import { registerService } from '../services/register.service';

export  async function registerController(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      });
    }

    const user = await registerService.register(parsed.data);

    return res.status(201).json(user);
}