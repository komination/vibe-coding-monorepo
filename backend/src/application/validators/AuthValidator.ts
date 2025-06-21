import { ValidationResult } from '@/application/validators/ValidationError';

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  identifier: string; // email or username
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export class AuthValidator {
  static validateRegister(data: any): ValidationResult<RegisterInput> {
    const errors: string[] = [];

    // Validate email
    if (!data.email || typeof data.email !== 'string') {
      errors.push('Email is required and must be a string');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Invalid email format');
      }
    }

    // Validate username
    if (!data.username || typeof data.username !== 'string') {
      errors.push('Username is required and must be a string');
    } else {
      if (data.username.length < 3 || data.username.length > 20) {
        errors.push('Username must be between 3 and 20 characters');
      }
      const usernameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!usernameRegex.test(data.username)) {
        errors.push('Username can only contain letters, numbers, underscores, and hyphens');
      }
    }

    // Validate password
    if (!data.password || typeof data.password !== 'string') {
      errors.push('Password is required and must be a string');
    } else {
      if (data.password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
        errors.push('Password must contain at least one lowercase letter, one uppercase letter, and one number');
      }
    }

    // Validate name (optional)
    if (data.name !== undefined && data.name !== null) {
      if (typeof data.name !== 'string') {
        errors.push('Name must be a string');
      } else if (data.name.length > 100) {
        errors.push('Name must be 100 characters or less');
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      data: {
        email: data.email.toLowerCase().trim(),
        username: data.username.trim(),
        password: data.password,
        name: data.name?.trim(),
      },
    };
  }

  static validateLogin(data: any): ValidationResult<LoginInput> {
    const errors: string[] = [];

    // Validate identifier (email or username)
    if (!data.identifier || typeof data.identifier !== 'string') {
      errors.push('Email or username is required');
    } else if (data.identifier.trim().length === 0) {
      errors.push('Email or username cannot be empty');
    }

    // Validate password
    if (!data.password || typeof data.password !== 'string') {
      errors.push('Password is required');
    } else if (data.password.length === 0) {
      errors.push('Password cannot be empty');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      data: {
        identifier: data.identifier.trim(),
        password: data.password,
      },
    };
  }

  static validateRefreshToken(data: any): ValidationResult<RefreshTokenInput> {
    const errors: string[] = [];

    // Validate refresh token
    if (!data.refreshToken || typeof data.refreshToken !== 'string') {
      errors.push('Refresh token is required and must be a string');
    } else if (data.refreshToken.trim().length === 0) {
      errors.push('Refresh token cannot be empty');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      data: {
        refreshToken: data.refreshToken.trim(),
      },
    };
  }
}