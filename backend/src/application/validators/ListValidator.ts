import { ValidationResult } from '@/application/validators/ValidationError';

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
    const errors: string[] = [];

    if (!data.title || typeof data.title !== 'string') {
      errors.push('Title is required and must be a string');
    } else if (data.title.trim().length === 0) {
      errors.push('Title cannot be empty');
    } else if (data.title.length > 255) {
      errors.push('Title must be 255 characters or less');
    }

    if (data.color !== undefined && data.color !== null) {
      if (typeof data.color !== 'string') {
        errors.push('Color must be a string');
      } else if (data.color.length > 7) {
        errors.push('Color must be 7 characters or less');
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      data: {
        title: data.title.trim(),
        color: data.color?.trim() || undefined,
      },
    };
  }

  static validateUpdateList(data: any): ValidationResult<UpdateListInput> {
    const errors: string[] = [];

    if (data.title !== undefined) {
      if (typeof data.title !== 'string') {
        errors.push('Title must be a string');
      } else if (data.title.trim().length === 0) {
        errors.push('Title cannot be empty');
      } else if (data.title.length > 255) {
        errors.push('Title must be 255 characters or less');
      }
    }

    if (data.color !== undefined && data.color !== null) {
      if (typeof data.color !== 'string') {
        errors.push('Color must be a string');
      } else if (data.color.length > 7) {
        errors.push('Color must be 7 characters or less');
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    const result: UpdateListInput = {};
    
    if (data.title !== undefined) {
      result.title = data.title.trim();
    }
    
    if (data.color !== undefined) {
      result.color = data.color?.trim() || undefined;
    }

    return {
      success: true,
      data: result,
    };
  }

  static validateReorderLists(data: any): ValidationResult<ReorderListsInput> {
    const errors: string[] = [];

    if (!data.lists || !Array.isArray(data.lists)) {
      errors.push('Lists array is required');
      return { success: false, errors };
    }

    if (data.lists.length === 0) {
      errors.push('Lists array cannot be empty');
      return { success: false, errors };
    }

    const positions = new Set<number>();
    
    for (let i = 0; i < data.lists.length; i++) {
      const item = data.lists[i];
      
      if (!item.id || typeof item.id !== 'string') {
        errors.push(`List at index ${i} must have a valid id`);
      }
      
      if (typeof item.position !== 'number' || item.position < 0) {
        errors.push(`List at index ${i} must have a valid position (non-negative number)`);
      } else {
        if (positions.has(item.position)) {
          errors.push(`Duplicate position ${item.position} found`);
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