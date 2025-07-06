import { CreateBoardDto, UpdateBoardDto, AddMemberDto, UpdateMemberDto } from '@/interfaces/http/dto/BoardDto';
import { Validator, ValidationResult } from '@/application/validators/ValidationError';

export class BoardValidator {
  static validateCreateBoard(data: any): ValidationResult<CreateBoardDto> {
    const validator = new Validator();

    validator
      .required(data.title, 'title')
      .string(data.title, 'title')
      .minLength(data.title, 1, 'title')
      .maxLength(data.title, 255, 'title');

    if (data.description !== undefined) {
      validator
        .string(data.description, 'description')
        .maxLength(data.description, 2000, 'description');
    }

    if (data.backgroundUrl !== undefined) {
      validator
        .string(data.backgroundUrl, 'backgroundUrl')
        .url(data.backgroundUrl, 'backgroundUrl');
    }

    if (data.isPublic !== undefined) {
      validator.boolean(data.isPublic, 'isPublic');
    }

    return validator.getResult({
      title: data.title?.trim(),
      description: data.description?.trim(),
      backgroundUrl: data.backgroundUrl,
      isPublic: data.isPublic ?? false,
    });
  }

  static validateUpdateBoard(data: any): ValidationResult<UpdateBoardDto> {
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
        .maxLength(data.description, 2000, 'description');
    }

    if (data.backgroundUrl !== undefined) {
      validator
        .string(data.backgroundUrl, 'backgroundUrl')
        .url(data.backgroundUrl, 'backgroundUrl');
    }

    if (data.isPublic !== undefined) {
      validator.boolean(data.isPublic, 'isPublic');
    }

    return validator.getResult({
      title: data.title?.trim(),
      description: data.description?.trim(),
      backgroundUrl: data.backgroundUrl,
      isPublic: data.isPublic,
    });
  }

  static validateAddMember(data: any): ValidationResult<AddMemberDto> {
    const validator = new Validator();

    validator
      .required(data.userId, 'userId')
      .string(data.userId, 'userId')
      .required(data.role, 'role')
      .oneOf(data.role, ['ADMIN', 'MEMBER', 'VIEWER'], 'role');

    return validator.getResult({
      userId: data.userId,
      role: data.role,
    });
  }

  static validateUpdateMember(data: any): ValidationResult<UpdateMemberDto> {
    const validator = new Validator();

    validator
      .required(data.role, 'role')
      .oneOf(data.role, ['ADMIN', 'MEMBER', 'VIEWER'], 'role');

    return validator.getResult({
      role: data.role,
    });
  }
}