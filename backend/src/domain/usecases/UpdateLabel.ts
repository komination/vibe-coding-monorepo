import { Label } from '@/domain/entities/Label';
import { LabelRepository } from '@/domain/repositories/LabelRepository';
import { BoardRepository } from '@/domain/repositories/BoardRepository';
import { ActivityRepository } from '@/domain/repositories/ActivityRepository';
import { Activity } from '@/domain/entities/Activity';

export interface UpdateLabelRequest {
  labelId: string;
  userId: string;
  name?: string;
  color?: string;
}

export interface UpdateLabelResponse {
  label: Label;
}

export class UpdateLabelUseCase {
  constructor(
    private labelRepository: LabelRepository,
    private boardRepository: BoardRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: UpdateLabelRequest): Promise<UpdateLabelResponse> {
    const { labelId, userId, name, color } = request;

    // Find label
    const label = await this.labelRepository.findById(labelId);
    if (!label) {
      throw new Error('Label not found');
    }

    // Find board
    const board = await this.boardRepository.findById(label.boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    // Check permissions
    const userRole = await this.boardRepository.getMemberRole(label.boardId, userId);
    if (!board.canBeEditedBy(userId, userRole || 'VIEWER')) {
      throw new Error('Access denied');
    }

    // Track changes for activity log
    const changes: Record<string, any> = {};
    const currentName = label.name;
    const currentColor = label.color;

    // Validate and prepare updates
    let newName = currentName;
    let newColor = currentColor;

    if (name !== undefined) {
      if (!name.trim()) {
        throw new Error('Label name is required');
      }
      if (name.length > 50) {
        throw new Error('Label name is too long');
      }
      newName = name.trim();
      if (newName !== currentName) {
        changes.name = { from: currentName, to: newName };
      }
    }

    if (color !== undefined) {
      if (!color.trim()) {
        throw new Error('Label color is required');
      }
      // Validate color format (hex color)
      if (!/^#[0-9A-F]{6}$/i.test(color)) {
        throw new Error('Label color must be a valid hex color (e.g., #FF0000)');
      }
      newColor = color.toUpperCase();
      if (newColor !== currentColor) {
        changes.color = { from: currentColor, to: newColor };
      }
    }

    // Update label if there are changes
    if (Object.keys(changes).length > 0) {
      label.update(newName, newColor);
      await this.labelRepository.save(label);

      // Log activity
      const activity = Activity.create({
        action: 'UPDATE',
        entityType: 'LABEL',
        entityId: label.id,
        entityTitle: label.name,
        data: changes,
        userId,
        boardId: label.boardId,
      });
      await this.activityRepository.save(activity);
    }

    return { label };
  }
}