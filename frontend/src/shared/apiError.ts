export function extractApiErrorMessage(error: unknown, fallback = 'Произошла ошибка') {
  const e = error as {
    response?: {
      data?: {
        message?: unknown;
        error?: unknown;
        details?: unknown;
      };
    };
    message?: unknown;
  };

  // Try message field first
  const message = e?.response?.data?.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  // Try error field second
  const errorField = e?.response?.data?.error;
  if (typeof errorField === 'string' && errorField.trim()) {
    return errorField;
  }

  // Try details field
  const details = e?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0 && typeof details[0] === 'string') {
    return details[0];
  }
  if (details && typeof details === 'object') {
    const first = Object.values(details as Record<string, unknown>).find((value) =>
      typeof value === 'string' || (Array.isArray(value) && typeof value[0] === 'string'),
    );
    if (typeof first === 'string') {
      return first;
    }
    if (Array.isArray(first) && typeof first[0] === 'string') {
      return first[0];
    }
  }

  // Try error message property (for network errors)
  const errorMessage = e?.message;
  if (typeof errorMessage === 'string' && errorMessage.trim() && errorMessage !== 'Error') {
    return errorMessage;
  }

  return fallback;
}
