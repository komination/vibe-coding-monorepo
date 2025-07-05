import { BoardRepository } from '@kanban/domain-core';
import { ActivityRepository } from '@kanban/domain-core';
import { Activity } from '@kanban/domain-core';

export interface DeleteBoardRequest {
  boardId: string;
  userId: string;
}

export interface DeleteBoardResponse {
  success: boolean;
}

export class DeleteBoardUseCase {
  constructor(
    private boardRepository: BoardRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: DeleteBoardRequest): Promise<DeleteBoardResponse> {
    const { boardId, userId } = request;

    // Find board
    const board = await this.boardRepository.findById(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    // Check permissions - only board owners can delete boards
    if (!board.isOwner(userId)) {
      throw new Error('Only board owners can delete boards');
    }

    // Log activity before deletion
    const activity = Activity.create({
      action: 'DELETE',
      entityType: 'BOARD',
      entityId: board.id,
      entityTitle: board.title,
      data: {
        boardTitle: board.title,
        boardDescription: board.description,
      },
      userId,
      boardId: board.id,
    });
    await this.activityRepository.save(activity);

    // Delete the board (cascading delete will handle related data)
    await this.boardRepository.delete(boardId);

    return { success: true };
  }
}