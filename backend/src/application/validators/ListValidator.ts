import { ValidationResult, ValidationError, Validator } from '@/application/validators/ValidationError';

export interface CreateListInput {
  title: string;
  color?: string;
}

export interface UpdateListInput {
  title?: string;
  color?: string;
}

export interface ReorderListsInput {
  lists: { id: string; position: number }[];
}

export class ListValidator {
  static validateCreateList(data: any): ValidationResult<CreateListInput> {
    const validator = new Validator();

    validator
      .required(data.title, 'title')
      .string(data.title, 'title')
      .maxLength(data.title, 255, 'title');

    if (data.color !== undefined) {
      validator
        .string(data.color, 'color')
        .maxLength(data.color, 7, 'color');
    }

    const result = validator.getResult({
      title: data.title?.trim(),
      color: data.color?.trim() || undefined,
    });

    return result;
  }

  static validateUpdateList(data: any): ValidationResult<UpdateListInput> {
    const validator = new Validator();

    if (data.title !== undefined) {
      validator
        .string(data.title, 'title')
        .maxLength(data.title, 255, 'title');
      
      if (data.title?.trim()?.length === 0) {
        validator.required('', 'title'); // This will create an error for empty string
      }
    }

    if (data.color !== undefined && data.color !== null) {
      validator
        .string(data.color, 'color')
        .maxLength(data.color, 7, 'color');
    }

    const resultData: UpdateListInput = {};
    
    if (data.title !== undefined) {
      resultData.title = data.title.trim();
    }
    
    if (data.color !== undefined) {
      resultData.color = data.color?.trim() || undefined;
    }

    return validator.getResult(resultData);
  }

  static validateReorderLists(data: any): ValidationResult<ReorderListsInput> {
    const errors: ValidationError[] = [];

    if (!data.lists || !Array.isArray(data.lists)) {
      errors.push(new ValidationError('Lists array is required', 'lists'));
      return { success: false, errors };
    }

    if (data.lists.length === 0) {
      errors.push(new ValidationError('Lists array cannot be empty', 'lists'));
      return { success: false, errors };
    }

    const positions = new Set<number>();
    
    for (let i = 0; i < data.lists.length; i++) {
      const item = data.lists[i];
      
      if (!item.id || typeof item.id !== 'string') {
        errors.push(new ValidationError(`List at index ${i} must have a valid id`, `lists[${i}].id`));
      }
      
      if (typeof item.position !== 'number' || item.position < 0) {
        errors.push(new ValidationError(`List at index ${i} must have a valid position (non-negative number)`, `lists[${i}].position`));
      } else {
        if (positions.has(item.position)) {
          errors.push(new ValidationError(`Duplicate position ${item.position} found`, `lists[${i}].position`));
        }
        positions.add(item.position);
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      data: {
        lists: data.lists,
      },
    };
  }
}