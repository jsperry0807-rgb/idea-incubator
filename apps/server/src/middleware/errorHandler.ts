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

/**
 * `body-parser` rejects malformed or oversized payloads with its own errors
 * carrying a `status`/`statusCode`, which the catch-all below would otherwise
 * report as a 500. They are client mistakes, so translate them.
 */
function asClientError(err: unknown): AppError | null {
  if (typeof err !== 'object' || err === null) return null;

  const candidate = err as { type?: unknown; status?: unknown; statusCode?: unknown };
  const status = typeof candidate.status === 'number' ? candidate.status : candidate.statusCode;

  if (status === 413 || candidate.type === 'entity.too.large') {
    return new AppError('Request body too large', 413, 'PAYLOAD_TOO_LARGE');
  }
  if (status === 400 || candidate.type === 'entity.parse.failed') {
    return new AppError('Malformed request body', 400, 'BAD_REQUEST');
  }
  return null;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response<ErrorEnvelope>,
  _next: NextFunction
) {
  // Once a response has started there is no way to change the status code; hand
  // back to express so it tears the connection down instead of throwing
  // ERR_HTTP_HEADERS_SENT on top of the original failure.
  if (res.headersSent) {
    _next(err);
    return;
  }

  const clientError = asClientError(err);
  if (clientError) {
    res.status(clientError.statusCode).json({
      error: { code: clientError.code, message: clientError.message },
    });
    return;
  }

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
