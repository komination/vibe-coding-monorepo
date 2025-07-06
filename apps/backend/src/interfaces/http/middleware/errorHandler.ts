import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { 
  DomainError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BusinessRuleViolationError
} from '@/domain/errors/DomainError';
import {
  ApplicationError,
  BadRequestError,
  AuthenticationError,
  RateLimitError,
  TooManyRequestsError
} from '@/application/errors/ApplicationError';
import { serverConfig } from '@/infrastructure/config/env';

interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  timestamp: string;
  path?: string;
  requestId?: string;
}

export function errorHandler(err: Error, c: Context): Response {
  console.error('Error occurred:', {
    name: err.name,
    message: err.message,
    stack: serverConfig.isDevelopment ? err.stack : undefined,
    path: c.req.path,
    method: c.req.method,
  });

  // Default error response
  let status = 500;
  let errorResponse: ErrorResponse = {
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    path: c.req.path,
  };

  // Handle HTTPException from Hono
  if (err instanceof HTTPException) {
    status = err.status;
    errorResponse.error = getErrorName(status);
    errorResponse.message = err.message;
  }
  // Handle Domain Errors
  else if (err instanceof NotFoundError) {
    status = 404;
    errorResponse.error = 'NotFound';
    errorResponse.message = err.message;
  }
  else if (err instanceof ValidationError) {
    status = 400;
    errorResponse.error = 'ValidationError';
    errorResponse.message = err.message;
    errorResponse.details = err.errors;
  }
  else if (err instanceof UnauthorizedError) {
    status = 401;
    errorResponse.error = 'Unauthorized';
    errorResponse.message = err.message;
  }
  else if (err instanceof ForbiddenError) {
    status = 403;
    errorResponse.error = 'Forbidden';
    errorResponse.message = err.message;
  }
  else if (err instanceof ConflictError) {
    status = 409;
    errorResponse.error = 'Conflict';
    errorResponse.message = err.message;
  }
  else if (err instanceof BusinessRuleViolationError) {
    status = 422;
    errorResponse.error = 'BusinessRuleViolation';
    errorResponse.message = err.message;
  }
  // Handle Application Errors
  else if (err instanceof BadRequestError) {
    status = 400;
    errorResponse.error = 'BadRequest';
    errorResponse.message = err.message;
    errorResponse.details = err.details;
  }
  else if (err instanceof AuthenticationError) {
    status = 401;
    errorResponse.error = 'AuthenticationError';
    errorResponse.message = err.message;
  }
  else if (err instanceof RateLimitError) {
    status = 429;
    errorResponse.error = 'RateLimitExceeded';
    errorResponse.message = err.message;
    if (err.retryAfter) {
      c.header('Retry-After', err.retryAfter.toString());
    }
  }
  else if (err instanceof TooManyRequestsError) {
    status = 429;
    errorResponse.error = 'TooManyRequests';
    errorResponse.message = err.message;
    if (err.retryAfter) {
      c.header('Retry-After', err.retryAfter.toString());
    }
  }
  // Handle other errors
  else if (err instanceof Error) {
    // In development, expose error details
    if (serverConfig.isDevelopment) {
      errorResponse.message = err.message;
      errorResponse.details = {
        name: err.name,
        stack: err.stack,
      };
    }
  }

  return c.json(errorResponse, status as any);
}

function getErrorName(status: number): string {
  const errorNames: Record<number, string> = {
    400: 'BadRequest',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'NotFound',
    409: 'Conflict',
    422: 'UnprocessableEntity',
    429: 'TooManyRequests',
    500: 'InternalServerError',
    503: 'ServiceUnavailable',
  };
  return errorNames[status] || 'Error';
}