import { ValidationResult, ValidationError } from '@/application/validators/ValidationError';

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

export interface UpdateProfileInput {
  name?: string;
  avatarUrl?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export class AuthValidator {
  static validateRegister(data: any): ValidationResult<RegisterInput> {
    const errors: ValidationError[] = [];

    // Validate email
    if (!data.email || typeof data.email !== 'string') {
      errors.push(new ValidationError('Email is required and must be a string', 'email'));
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push(new ValidationError('Invalid email format', 'email'));
      }
    }

    // Validate username
    if (!data.username || typeof data.username !== 'string') {
      errors.push(new ValidationError('Username is required and must be a string', 'username'));
    } else {
      if (data.username.length < 3 || data.username.length > 20) {
        errors.push(new ValidationError('Username must be between 3 and 20 characters', 'username'));
      }
      const usernameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!usernameRegex.test(data.username)) {
        errors.push(new ValidationError('Username can only contain letters, numbers, underscores, and hyphens', 'username'));
      }
    }

    // Validate password
    if (!data.password || typeof data.password !== 'string') {
      errors.push(new ValidationError('Password is required and must be a string', 'password'));
    } else {
      if (data.password.length < 8) {
        errors.push(new ValidationError('Password must be at least 8 characters long', 'password'));
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
        errors.push(new ValidationError('Password must contain at least one lowercase letter, one uppercase letter, and one number', 'password'));
      }
    }

    // Validate name (optional)
    if (data.name !== undefined && data.name !== null) {
      if (typeof data.name !== 'string') {
        errors.push(new ValidationError('Name must be a string', 'name'));
      } else if (data.name.length > 100) {
        errors.push(new ValidationError('Name must be 100 characters or less', 'name'));
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
    const errors: ValidationError[] = [];

    // Validate identifier (email or username)
    if (!data.identifier || typeof data.identifier !== 'string') {
      errors.push(new ValidationError('Email or username is required', 'identifier'));
    } else if (data.identifier.trim().length === 0) {
      errors.push(new ValidationError('Email or username cannot be empty', 'identifier'));
    }

    // Validate password
    if (!data.password || typeof data.password !== 'string') {
      errors.push(new ValidationError('Password is required', 'password'));
    } else if (data.password.length === 0) {
      errors.push(new ValidationError('Password cannot be empty', 'password'));
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
    const errors: ValidationError[] = [];

    // Validate refresh token
    if (!data.refreshToken || typeof data.refreshToken !== 'string') {
      errors.push(new ValidationError('Refresh token is required and must be a string', 'refreshToken'));
    } else if (data.refreshToken.trim().length === 0) {
      errors.push(new ValidationError('Refresh token cannot be empty', 'refreshToken'));
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

  static validateUpdateProfile(data: any): ValidationResult<UpdateProfileInput> {
    const errors: ValidationError[] = [];

    // Validate name (optional)
    if (data.name !== undefined && data.name !== null) {
      if (typeof data.name !== 'string') {
        errors.push(new ValidationError('Name must be a string', 'name'));
      } else if (data.name.length > 100) {
        errors.push(new ValidationError('Name must be 100 characters or less', 'name'));
      }
    }

    // Validate avatarUrl (optional)
    if (data.avatarUrl !== undefined && data.avatarUrl !== null) {
      if (typeof data.avatarUrl !== 'string') {
        errors.push(new ValidationError('Avatar URL must be a string', 'avatarUrl'));
      } else if (data.avatarUrl.length > 500) {
        errors.push(new ValidationError('Avatar URL must be 500 characters or less', 'avatarUrl'));
      } else if (data.avatarUrl.length > 0) {
        // Basic URL validation
        const urlRegex = /^https?:\/\/.+\..+/;
        if (!urlRegex.test(data.avatarUrl)) {
          errors.push(new ValidationError('Invalid avatar URL format', 'avatarUrl'));
        }
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      data: {
        name: data.name?.trim(),
        avatarUrl: data.avatarUrl?.trim(),
      },
    };
  }

  static validateChangePassword(data: any): ValidationResult<ChangePasswordInput> {
    const errors: ValidationError[] = [];

    // Validate current password
    if (!data.currentPassword || typeof data.currentPassword !== 'string') {
      errors.push(new ValidationError('Current password is required and must be a string', 'currentPassword'));
    } else if (data.currentPassword.length === 0) {
      errors.push(new ValidationError('Current password cannot be empty', 'currentPassword'));
    }

    // Validate new password
    if (!data.newPassword || typeof data.newPassword !== 'string') {
      errors.push(new ValidationError('New password is required and must be a string', 'newPassword'));
    } else {
      if (data.newPassword.length < 8) {
        errors.push(new ValidationError('New password must be at least 8 characters long', 'newPassword'));
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.newPassword)) {
        errors.push(new ValidationError('New password must contain at least one lowercase letter, one uppercase letter, and one number', 'newPassword'));
      }
    }

    // Check if passwords are different
    if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
      errors.push(new ValidationError('New password must be different from current password', 'newPassword'));
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      data: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
    };
  }
}