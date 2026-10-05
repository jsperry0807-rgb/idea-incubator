export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown, message = 'Validation failed') {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

/**
 * The model provider did not answer in time.
 *
 * Distinct from a generic 500: the request made no progress, so the client can
 * safely retry the same input.
 */
export class LlmTimeoutError extends AppError {
  constructor(message = 'The AI provider did not respond in time') {
    super(message, 503, 'LLM_TIMEOUT');
  }
}

export class TooManyRequestsError extends AppError {
  retryAfterSec: number;

  constructor(message = 'Too many requests', retryAfterSec = 60) {
    super(message, 429, 'RATE_LIMITED');
    this.retryAfterSec = retryAfterSec;
  }
}
