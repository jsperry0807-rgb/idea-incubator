import type { NextFunction, Request, Response } from 'express';

import { AppError, TooManyRequestsError } from '../lib/errors';
import { env } from '../config/env';

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response<ErrorEnvelope>,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    // Tell the client when it may retry; the synthesis budget is charged in the
    // service, so this is the only place a 429 can carry a Retry-After.
    if (err instanceof TooManyRequestsError) {
      res.setHeader('Retry-After', String(err.retryAfterSec));
    }
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
    return;
  }

  console.error('[error]', err);

  const statusCode = 500;
  res.status(statusCode).json({
    error: {
      code: 'INTERNAL_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err instanceof Error
            ? err.message
            : 'An unexpected error occurred',
    },
  });
}
