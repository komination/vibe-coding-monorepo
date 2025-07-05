import { List } from '@kanban/domain-core';
import { Activity } from '@kanban/domain-core';
import { ListRepository } from '@kanban/domain-core';
import { BoardRepository } from '@kanban/domain-core';
import { ActivityRepository } from '@kanban/domain-core';

export interface CreateListRequest {
  title: string;
  color?: string;
  boardId: string;
  userId: string;
}

export interface CreateListResponse {
  list: List;
}

export class CreateListUseCase {
  constructor(
    private listRepository: ListRepository,
    private boardRepository: BoardRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: CreateListRequest): Promise<CreateListResponse> {
    const { title, color, boardId, userId } = request;

    // Validate board exists
    const board = await this.boardRepository.findById(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    // Check if user has permission to create lists
    const memberRole = await this.boardRepository.getMemberRole(boardId, userId);
    if (!memberRole || memberRole === 'VIEWER') {
      throw new Error('User does not have permission to create lists in this board');
    }

    // Validate title
    if (!title.trim()) {
      throw new Error('List title is required');
    }

    if (title.length > 255) {
      throw new Error('List title is too long');
    }

    // Get next position
    const position = await this.listRepository.getNextPosition(boardId);

    // Create list
    const list = List.create({
      title: title.trim(),
      color,
      position,
      boardId,
    });

    // Save list
    await this.listRepository.save(list);

    // Log activity
    const activity = Activity.create({
      action: 'CREATE',
      entityType: 'LIST',
      entityId: list.id,
      entityTitle: list.title,
      userId,
      boardId,
    });
    await this.activityRepository.save(activity);

    return { list };
  }
}