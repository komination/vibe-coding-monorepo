import { LabelRepository } from '@kanban/domain-core';
import { BoardRepository } from '@kanban/domain-core';
import { ActivityRepository } from '@kanban/domain-core';
import { Activity } from '@kanban/domain-core';

export interface DeleteLabelRequest {
  labelId: string;
  userId: string;
}

export interface DeleteLabelResponse {
  success: boolean;
}

export class DeleteLabelUseCase {
  constructor(
    private labelRepository: LabelRepository,
    private boardRepository: BoardRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: DeleteLabelRequest): Promise<DeleteLabelResponse> {
    const { labelId, userId } = request;

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

    // Log activity before deletion
    const activity = Activity.create({
      action: 'DELETE',
      entityType: 'LABEL',
      entityId: label.id,
      entityTitle: label.name,
      data: {
        labelName: label.name,
        labelColor: label.color,
      },
      userId,
      boardId: label.boardId,
    });
    await this.activityRepository.save(activity);

    // Delete the label (cascading delete will handle CardLabel associations)
    await this.labelRepository.delete(labelId);

    return { success: true };
  }
}