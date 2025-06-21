import { Activity } from '@/domain/entities/Activity';
import { ListRepository } from '@/domain/repositories/ListRepository';
import { BoardRepository } from '@/domain/repositories/BoardRepository';
import { ActivityRepository } from '@/domain/repositories/ActivityRepository';

export interface ReorderListsRequest {
  boardId: string;
  listPositions: { id: string; position: number }[];
  userId: string;
}

export class ReorderListsUseCase {
  constructor(
    private listRepository: ListRepository,
    private boardRepository: BoardRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: ReorderListsRequest): Promise<void> {
    const { boardId, listPositions, userId } = request;

    // Check if board exists
    const board = await this.boardRepository.findById(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    // Check if user has permission to reorder lists
    const memberRole = await this.boardRepository.getMemberRole(boardId, userId);
    if (!memberRole || memberRole === 'VIEWER') {
      throw new Error('User does not have permission to reorder lists in this board');
    }

    // Validate all lists belong to the board
    for (const { id } of listPositions) {
      const exists = await this.listRepository.existsInBoard(id, boardId);
      if (!exists) {
        throw new Error(`List ${id} does not belong to board ${boardId}`);
      }
    }

    // Validate positions are unique and sequential
    const positions = listPositions.map(lp => lp.position).sort((a, b) => a - b);
    for (let i = 0; i < positions.length; i++) {
      if (i > 0 && positions[i] === positions[i - 1]) {
        throw new Error('Duplicate positions are not allowed');
      }
    }

    // Reorder lists
    await this.listRepository.reorderLists(boardId, listPositions);

    // Log activity
    const activity = Activity.create({
      action: 'MOVE',
      entityType: 'LIST',
      entityId: boardId,
      entityTitle: 'Lists reordered',
      userId,
      boardId,
      data: { listCount: listPositions.length },
    });
    await this.activityRepository.save(activity);
  }
}