export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export class Validator {
  private errors: ValidationError[] = [];

  required(value: any, field: string): this {
    if (value === undefined || value === null || value === '') {
      this.errors.push(new ValidationError(`${field} is required`, field, 'REQUIRED'));
    }
    return this;
  }

  string(value: any, field: string): this {
    if (value !== undefined && typeof value !== 'string') {
      this.errors.push(new ValidationError(`${field} must be a string`, field, 'TYPE_ERROR'));
    }
    return this;
  }

  minLength(value: string, min: number, field: string): this {
    if (value && value.length < min) {
      this.errors.push(new ValidationError(`${field} must be at least ${min} characters`, field, 'MIN_LENGTH'));
    }
    return this;
  }

  maxLength(value: string, max: number, field: string): this {
    if (value && value.length > max) {
      this.errors.push(new ValidationError(`${field} must be no more than ${max} characters`, field, 'MAX_LENGTH'));
    }
    return this;
  }

  email(value: string, field: string): this {
    if (value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.errors.push(new ValidationError(`${field} must be a valid email`, field, 'INVALID_EMAIL'));
      }
    }
    return this;
  }

  url(value: string, field: string): this {
    if (value) {
      try {
        new URL(value);
      } catch {
        this.errors.push(new ValidationError(`${field} must be a valid URL`, field, 'INVALID_URL'));
      }
    }
    return this;
  }

  boolean(value: any, field: string): this {
    if (value !== undefined && typeof value !== 'boolean') {
      this.errors.push(new ValidationError(`${field} must be a boolean`, field, 'TYPE_ERROR'));
    }
    return this;
  }

  date(value: string, field: string): this {
    if (value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        this.errors.push(new ValidationError(`${field} must be a valid date`, field, 'INVALID_DATE'));
      }
    }
    return this;
  }

  oneOf<T>(value: T, options: T[], field: string): this {
    if (value !== undefined && !options.includes(value)) {
      this.errors.push(new ValidationError(`${field} must be one of: ${options.join(', ')}`, field, 'INVALID_OPTION'));
    }
    return this;
  }

  getResult<T>(data: T): ValidationResult<T> {
    if (this.errors.length > 0) {
      return {
        success: false,
        errors: this.errors,
      };
    }
    return {
      success: true,
      data,
    };
  }
}