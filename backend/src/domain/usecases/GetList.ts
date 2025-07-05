import { List } from '@kanban/domain-core';
import { ListRepository } from '@kanban/domain-core';
import { BoardRepository } from '@kanban/domain-core';

export interface GetListRequest {
  listId: string;
  userId: string;
}

export interface GetListResponse {
  list: List;
}

export class GetListUseCase {
  constructor(
    private listRepository: ListRepository,
    private boardRepository: BoardRepository
  ) {}

  async execute(request: GetListRequest): Promise<GetListResponse> {
    const { listId, userId } = request;

    // Find list
    const list = await this.listRepository.findById(listId);
    if (!list) {
      throw new Error('List not found');
    }

    // Check if user has access to the board
    const board = await this.boardRepository.findById(list.boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    // Check if board is public or user is a member
    if (!board.isPublic) {
      const isMember = await this.boardRepository.isMember(board.id, userId);
      if (!isMember) {
        throw new Error('Access denied');
      }
    }

    return { list };
  }
}