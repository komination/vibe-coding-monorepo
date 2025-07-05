import { Card } from '@kanban/domain-core';
import { Activity } from '@kanban/domain-core';
import { CardRepository } from '@kanban/domain-core';
import { ListRepository } from '@kanban/domain-core';
import { BoardRepository } from '@kanban/domain-core';
import { ActivityRepository } from '@kanban/domain-core';

export interface CreateCardRequest {
  title: string;
  description?: string;
  listId: string;
  creatorId: string;
  assigneeId?: string;
  dueDate?: Date;
  startDate?: Date;
}

export interface CreateCardResponse {
  card: Card;
}

export class CreateCardUseCase {
  constructor(
    private cardRepository: CardRepository,
    private listRepository: ListRepository,
    private boardRepository: BoardRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: CreateCardRequest): Promise<CreateCardResponse> {
    const { title, description, listId, creatorId, assigneeId, dueDate, startDate } = request;

    // Validate list exists
    const list = await this.listRepository.findById(listId);
    if (!list) {
      throw new Error('List not found');
    }

    // Check if creator has permission to the board
    const userRole = await this.boardRepository.getMemberRole(list.boardId, creatorId);
    if (!userRole || userRole === 'VIEWER') {
      throw new Error('Access denied');
    }

    // Validate title
    if (!title.trim()) {
      throw new Error('Card title is required');
    }

    if (title.length > 255) {
      throw new Error('Card title is too long');
    }

    // Get next position
    const position = await this.cardRepository.getNextPosition(listId);

    // Create card
    const card = Card.create({
      title: title.trim(),
      description: description?.trim(),
      position,
      listId,
      creatorId,
      assigneeId,
      dueDate,
      startDate,
      isArchived: false,
    });

    // Save card
    await this.cardRepository.save(card);

    // Log activity
    const activity = Activity.create({
      action: 'CREATE',
      entityType: 'CARD',
      entityId: card.id,
      entityTitle: card.title,
      userId: creatorId,
      boardId: list.boardId,
      cardId: card.id,
    });
    await this.activityRepository.save(activity);

    return { card };
  }
}