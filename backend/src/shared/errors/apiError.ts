export type ApiErrorDetails = Record<string, unknown> | string | string[] | null;

export class ApiError extends Error {
  status: number;
  code: string;
  details: ApiErrorDetails | undefined;

  constructor(code: string, message: string, status = 400, details?: ApiErrorDetails) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static validation(details?: ApiErrorDetails, message = 'Ошибка валидации') {
    return new ApiError('VALIDATION_ERROR', message, 400, details);
  }

  static notFound(message = 'Ресурс не найден') {
    return new ApiError('NOT_FOUND', message, 404);
  }

  static forbidden(message = 'Доступ запрещен') {
    return new ApiError('FORBIDDEN', message, 403);
  }

  static unauthorized(message = 'Требуется авторизация') {
    return new ApiError('UNAUTHORIZED', message, 401);
  }

  static conflict(message = 'Конфликт данных') {
    return new ApiError('CONFLICT', message, 409);
  }
}
