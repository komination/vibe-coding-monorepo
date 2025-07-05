import { Board } from '@kanban/domain-core';
import { BoardRepository } from '@kanban/domain-core';

export interface GetBoardRequest {
  boardId: string;
  userId: string;
}

export interface GetBoardResponse {
  board: Board;
  userRole: string;
}

export class GetBoardUseCase {
  constructor(private boardRepository: BoardRepository) {}

  async execute(request: GetBoardRequest): Promise<GetBoardResponse> {
    const { boardId, userId } = request;

    // Find board
    const board = await this.boardRepository.findById(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    // Check permissions
    const userRole = await this.boardRepository.getMemberRole(boardId, userId);
    
    if (!board.canBeViewedBy(userId, userRole || undefined)) {
      throw new Error('Access denied');
    }

    return { 
      board, 
      userRole: userRole || 'VIEWER'
    };
  }
}