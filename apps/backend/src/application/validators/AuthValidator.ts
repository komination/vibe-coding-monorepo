import { ValidationResult, ValidationError } from '@/application/validators/ValidationError';

export interface UpdateProfileInput {
  name?: string;
  avatarUrl?: string;
}

export class AuthValidator {

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

}