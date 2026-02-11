export type ApiErrorDetails = Record<string, unknown> | string | string[] | null;

export class ApiError extends Error {
  status: number;
  code: string;
  details?: ApiErrorDetails;

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

  static forbidden(message = 'Доступ запрещён') {
    return new ApiError('FORBIDDEN', message, 403);
  }
}
