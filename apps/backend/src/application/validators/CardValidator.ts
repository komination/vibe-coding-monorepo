import { CreateCardDto, UpdateCardDto, MoveCardDto } from '@/interfaces/http/dto/CardDto';
import { Validator, ValidationResult } from '@/application/validators/ValidationError';

export class CardValidator {
  static validateCreateCard(data: any): ValidationResult<CreateCardDto> {
    const validator = new Validator();

    validator
      .required(data.title, 'title')
      .string(data.title, 'title')
      .minLength(data.title, 1, 'title')
      .maxLength(data.title, 255, 'title');

    if (data.description !== undefined) {
      validator
        .string(data.description, 'description')
        .maxLength(data.description, 5000, 'description');
    }

    if (data.assigneeId !== undefined) {
      validator.string(data.assigneeId, 'assigneeId');
    }

    if (data.dueDate !== undefined) {
      validator
        .string(data.dueDate, 'dueDate')
        .date(data.dueDate, 'dueDate');
    }

    if (data.startDate !== undefined) {
      validator
        .string(data.startDate, 'startDate')
        .date(data.startDate, 'startDate');
    }

    // Validate that startDate is before dueDate if both are provided
    if (data.startDate && data.dueDate) {
      const startDate = new Date(data.startDate);
      const dueDate = new Date(data.dueDate);
      
      if (startDate >= dueDate) {
        validator['errors'].push({
          message: 'Start date must be before due date',
          field: 'startDate',
          code: 'DATE_ORDER',
        } as any);
      }
    }

    return validator.getResult({
      title: data.title?.trim(),
      description: data.description?.trim(),
      assigneeId: data.assigneeId,
      dueDate: data.dueDate,
      startDate: data.startDate,
    });
  }

  static validateUpdateCard(data: any): ValidationResult<UpdateCardDto> {
    const validator = new Validator();

    if (data.title !== undefined) {
      validator
        .string(data.title, 'title')
        .minLength(data.title, 1, 'title')
        .maxLength(data.title, 255, 'title');
    }

    if (data.description !== undefined) {
      validator
        .string(data.description, 'description')
        .maxLength(data.description, 5000, 'description');
    }

    if (data.assigneeId !== undefined) {
      validator.string(data.assigneeId, 'assigneeId');
    }

    if (data.dueDate !== undefined) {
      validator
        .string(data.dueDate, 'dueDate')
        .date(data.dueDate, 'dueDate');
    }

    if (data.startDate !== undefined) {
      validator
        .string(data.startDate, 'startDate')
        .date(data.startDate, 'startDate');
    }

    if (data.coverUrl !== undefined) {
      validator
        .string(data.coverUrl, 'coverUrl')
        .url(data.coverUrl, 'coverUrl');
    }

    // Validate date order if both dates are provided
    if (data.startDate && data.dueDate) {
      const startDate = new Date(data.startDate);
      const dueDate = new Date(data.dueDate);
      
      if (startDate >= dueDate) {
        validator['errors'].push({
          message: 'Start date must be before due date',
          field: 'startDate',
          code: 'DATE_ORDER',
        } as any);
      }
    }

    return validator.getResult({
      title: data.title?.trim(),
      description: data.description?.trim(),
      assigneeId: data.assigneeId,
      dueDate: data.dueDate,
      startDate: data.startDate,
      coverUrl: data.coverUrl,
    });
  }

  static validateMoveCard(data: any): ValidationResult<MoveCardDto> {
    const validator = new Validator();

    validator
      .required(data.listId, 'listId')
      .string(data.listId, 'listId')
      .required(data.position, 'position');

    if (typeof data.position !== 'number' || data.position < 0) {
      validator['errors'].push({
        message: 'Position must be a non-negative number',
        field: 'position',
        code: 'INVALID_POSITION',
      } as any);
    }

    return validator.getResult({
      listId: data.listId,
      position: data.position,
    });
  }
}