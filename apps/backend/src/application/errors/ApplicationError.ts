export abstract class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends ApplicationError {
  constructor(
    message: string,
    public readonly details?: any
  ) {
    super(message);
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message = 'Authentication failed') {
    super(message);
  }
}

export class RateLimitError extends ApplicationError {
  constructor(
    message = 'Rate limit exceeded',
    public readonly retryAfter?: number
  ) {
    super(message);
  }
}

export class TooManyRequestsError extends ApplicationError {
  constructor(
    message = 'Too many requests',
    public readonly retryAfter?: number
  ) {
    super(message);
  }
}