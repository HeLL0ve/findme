import { ApiError } from '../../shared/errors/apiError';

export class AuthError extends ApiError {
  constructor(code: string, message: string, status = 400) {
    super(code, message, status);
  }

  static invalidCredentials() {
    return new AuthError('INVALID_CREDENTIALS', 'Неверный email или пароль', 401);
  }

  static validation(message: string) {
    return new AuthError('VALIDATION_ERROR', message, 400);
  }
}
