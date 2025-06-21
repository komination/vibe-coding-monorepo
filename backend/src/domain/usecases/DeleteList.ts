import { Activity } from '@/domain/entities/Activity';
import { ListRepository } from '@/domain/repositories/ListRepository';
import { BoardRepository } from '@/domain/repositories/BoardRepository';
import { ActivityRepository } from '@/domain/repositories/ActivityRepository';

export interface DeleteListRequest {
  listId: string;
  userId: string;
}

export class DeleteListUseCase {
  constructor(
    private listRepository: ListRepository,
    private boardRepository: BoardRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: DeleteListRequest): Promise<void> {
    const { listId, userId } = request;

    // Find list
    const list = await this.listRepository.findById(listId);
    if (!list) {
      throw new Error('List not found');
    }

    // Check if user has permission to delete lists
    const memberRole = await this.boardRepository.getMemberRole(list.boardId, userId);
    if (!memberRole || memberRole === 'VIEWER') {
      throw new Error('User does not have permission to delete lists in this board');
    }

    // Log activity before deletion
    const activity = Activity.create({
      action: 'DELETE',
      entityType: 'LIST',
      entityId: list.id,
      entityTitle: list.title,
      userId,
      boardId: list.boardId,
    });
    await this.activityRepository.save(activity);

    // Delete list (cards will be cascade deleted due to database constraint)
    await this.listRepository.delete(listId);
  }
}