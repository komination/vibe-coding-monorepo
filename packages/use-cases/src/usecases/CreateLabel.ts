import { Label } from '@kanban/domain-core';
import { LabelRepository } from '@kanban/domain-core';
import { BoardRepository } from '@kanban/domain-core';
import { ActivityRepository } from '@kanban/domain-core';
import { Activity } from '@kanban/domain-core';

export interface CreateLabelRequest {
  name: string;
  color: string;
  boardId: string;
  userId: string;
}

export interface CreateLabelResponse {
  label: Label;
}

export class CreateLabelUseCase {
  constructor(
    private labelRepository: LabelRepository,
    private boardRepository: BoardRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: CreateLabelRequest): Promise<CreateLabelResponse> {
    const { name, color, boardId, userId } = request;

    // Find board
    const board = await this.boardRepository.findById(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    // Check permissions
    const userRole = await this.boardRepository.getMemberRole(boardId, userId);
    if (!board.canBeEditedBy(userId, userRole || 'VIEWER')) {
      throw new Error('Access denied');
    }

    // Validate input
    if (!name.trim()) {
      throw new Error('Label name is required');
    }
    if (name.length > 50) {
      throw new Error('Label name is too long');
    }
    if (!color.trim()) {
      throw new Error('Label color is required');
    }
    // Validate color format (hex color)
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      throw new Error('Label color must be a valid hex color (e.g., #FF0000)');
    }

    // Create label
    const label = Label.create({
      name: name.trim(),
      color: color.toUpperCase(),
      boardId,
    });

    // Save label
    await this.labelRepository.save(label);

    // Log activity
    const activity = Activity.create({
      action: 'CREATE',
      entityType: 'LABEL',
      entityId: label.id,
      entityTitle: label.name,
      data: {
        labelName: label.name,
        labelColor: label.color,
      },
      userId,
      boardId,
    });
    await this.activityRepository.save(activity);

    return { label };
  }
}