import { List } from '@kanban/domain-core';
import { ListRepository } from '@kanban/domain-core';
import { BoardRepository } from '@kanban/domain-core';

export interface GetBoardListsRequest {
  boardId: string;
  userId: string;
  orderBy?: 'position' | 'title' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface GetBoardListsResponse {
  lists: List[];
}

export class GetBoardListsUseCase {
  constructor(
    private listRepository: ListRepository,
    private boardRepository: BoardRepository
  ) {}

  async execute(request: GetBoardListsRequest): Promise<GetBoardListsResponse> {
    const { boardId, userId, orderBy, order } = request;

    // Check if board exists
    const board = await this.boardRepository.findById(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    // Check if board is public or user is a member
    if (!board.isPublic) {
      const isMember = await this.boardRepository.isMember(boardId, userId);
      if (!isMember) {
        throw new Error('Access denied');
      }
    }

    // Get lists
    const lists = await this.listRepository.findByBoard(boardId, {
      orderBy,
      order,
    });

    return { lists };
  }
}