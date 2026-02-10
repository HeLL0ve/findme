export class AuthError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }

  static invalidCredentials() {
    return new AuthError(
      'INVALID_CREDENTIALS',
      'Неверный email или пароль',
      401
    );
  }

  static validation(message: string) {
    return new AuthError(
      'VALIDATION_ERROR',
      message,
      400
    );
  }
}