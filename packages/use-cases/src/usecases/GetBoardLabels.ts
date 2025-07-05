import { Label } from '@kanban/domain-core';
import { LabelRepository } from '@kanban/domain-core';
import { BoardRepository } from '@kanban/domain-core';

export interface GetBoardLabelsRequest {
  boardId: string;
  userId: string;
}

export interface GetBoardLabelsResponse {
  labels: Label[];
}

export class GetBoardLabelsUseCase {
  constructor(
    private labelRepository: LabelRepository,
    private boardRepository: BoardRepository
  ) {}

  async execute(request: GetBoardLabelsRequest): Promise<GetBoardLabelsResponse> {
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

    // Get labels
    const labels = await this.labelRepository.findByBoard(boardId);

    return { labels };
  }
}