import { List } from '@kanban/domain-core';
import { Activity } from '@kanban/domain-core';
import { ListRepository } from '@kanban/domain-core';
import { BoardRepository } from '@kanban/domain-core';
import { ActivityRepository } from '@kanban/domain-core';

export interface UpdateListRequest {
  listId: string;
  title?: string;
  color?: string;
  userId: string;
}

export interface UpdateListResponse {
  list: List;
}

export class UpdateListUseCase {
  constructor(
    private listRepository: ListRepository,
    private boardRepository: BoardRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: UpdateListRequest): Promise<UpdateListResponse> {
    const { listId, title, color, userId } = request;

    // Find list
    const list = await this.listRepository.findById(listId);
    if (!list) {
      throw new Error('List not found');
    }

    // Check if user has permission to update lists
    const memberRole = await this.boardRepository.getMemberRole(list.boardId, userId);
    if (!memberRole || memberRole === 'VIEWER') {
      throw new Error('User does not have permission to update lists in this board');
    }

    // Track changes for activity logging
    const changes: Record<string, any> = {};

    // Update title if provided
    if (title !== undefined) {
      if (!title.trim()) {
        throw new Error('List title cannot be empty');
      }
      if (title.length > 255) {
        throw new Error('List title is too long');
      }
      const oldTitle = list.title;
      const newTitle = title.trim();
      if (oldTitle !== newTitle) {
        list.updateTitle(newTitle);
        changes.title = { from: oldTitle, to: newTitle };
      }
    }

    // Update color if provided
    if (color !== undefined) {
      const oldColor = list.color;
      if (oldColor !== color) {
        list.updateColor(color);
        changes.color = { from: oldColor, to: color };
      }
    }

    // Save updated list
    await this.listRepository.save(list);

    // Log activity if there were changes
    if (Object.keys(changes).length > 0) {
      const activity = Activity.create({
        action: 'UPDATE',
        entityType: 'LIST',
        entityId: list.id,
        entityTitle: list.title,
        userId,
        boardId: list.boardId,
        data: changes,
      });
      await this.activityRepository.save(activity);
    }

    return { list };
  }
}