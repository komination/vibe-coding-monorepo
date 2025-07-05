import { Board } from '@kanban/domain-core';
import { Activity } from '@kanban/domain-core';
import { BoardRepository } from '@kanban/domain-core';
import { ActivityRepository } from '@kanban/domain-core';

export interface UpdateBoardRequest {
  boardId: string;
  userId: string;
  title?: string;
  description?: string;
  backgroundUrl?: string;
  isPublic?: boolean;
}

export interface UpdateBoardResponse {
  board: Board;
}

export class UpdateBoardUseCase {
  constructor(
    private boardRepository: BoardRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: UpdateBoardRequest): Promise<UpdateBoardResponse> {
    const { boardId, userId, title, description, backgroundUrl, isPublic } = request;

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

    // Validate title if provided
    if (title !== undefined) {
      if (!title.trim()) {
        throw new Error('Board title is required');
      }
      if (title.length > 255) {
        throw new Error('Board title is too long');
      }
    }

    // Track changes for activity log
    const changes: Record<string, any> = {};
    
    // Update board properties
    if (title !== undefined && title.trim() !== board.title) {
      changes.title = { from: board.title, to: title.trim() };
      board.updateTitle(title.trim());
    }

    if (description !== undefined && description?.trim() !== board.description) {
      changes.description = { from: board.description, to: description?.trim() };
      board.updateDescription(description?.trim());
    }

    if (backgroundUrl !== undefined && backgroundUrl !== board.backgroundUrl) {
      changes.backgroundUrl = { from: board.backgroundUrl, to: backgroundUrl };
      board.updateBackground(backgroundUrl);
    }

    if (isPublic !== undefined && isPublic !== board.isPublic) {
      changes.isPublic = { from: board.isPublic, to: isPublic };
      if (isPublic) {
        board.makePublic();
      } else {
        board.makePrivate();
      }
    }

    // Save board if there were changes
    if (Object.keys(changes).length > 0) {
      await this.boardRepository.save(board);

      // Log activity
      const activity = Activity.create({
        action: 'UPDATE',
        entityType: 'BOARD',
        entityId: board.id,
        entityTitle: board.title,
        data: changes,
        userId,
        boardId: board.id,
      });
      await this.activityRepository.save(activity);
    }

    return { board };
  }
}