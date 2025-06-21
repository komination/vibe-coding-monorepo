import { CreateLabelDto, UpdateLabelDto, AddLabelToCardDto } from '@/interfaces/http/dto/LabelDto';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export class LabelValidator {
  static validateCreateLabel(data: any): ValidationResult<CreateLabelDto> {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string') {
      errors.push('Name is required and must be a string');
    } else if (data.name.trim().length === 0) {
      errors.push('Name cannot be empty');
    } else if (data.name.length > 50) {
      errors.push('Name cannot exceed 50 characters');
    }

    if (!data.color || typeof data.color !== 'string') {
      errors.push('Color is required and must be a string');
    } else if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
      errors.push('Color must be a valid hex color (e.g., #FF0000)');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      data: {
        name: data.name.trim(),
        color: data.color.toUpperCase(),
      },
    };
  }

  static validateUpdateLabel(data: any): ValidationResult<UpdateLabelDto> {
    const errors: string[] = [];
    const result: UpdateLabelDto = {};

    if (data.name !== undefined) {
      if (typeof data.name !== 'string') {
        errors.push('Name must be a string');
      } else if (data.name.trim().length === 0) {
        errors.push('Name cannot be empty');
      } else if (data.name.length > 50) {
        errors.push('Name cannot exceed 50 characters');
      } else {
        result.name = data.name.trim();
      }
    }

    if (data.color !== undefined) {
      if (typeof data.color !== 'string') {
        errors.push('Color must be a string');
      } else if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
        errors.push('Color must be a valid hex color (e.g., #FF0000)');
      } else {
        result.color = data.color.toUpperCase();
      }
    }

    // At least one field must be provided for update
    if (Object.keys(result).length === 0 && errors.length === 0) {
      errors.push('At least one field (name or color) must be provided for update');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: result };
  }

  static validateAddLabelToCard(data: any): ValidationResult<AddLabelToCardDto> {
    const errors: string[] = [];

    if (!data.labelId || typeof data.labelId !== 'string') {
      errors.push('Label ID is required and must be a string');
    } else if (data.labelId.trim().length === 0) {
      errors.push('Label ID cannot be empty');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      data: {
        labelId: data.labelId.trim(),
      },
    };
  }
}