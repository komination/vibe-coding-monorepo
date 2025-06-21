import { LabelRepository } from '@/domain/repositories/LabelRepository';
import { CardRepository } from '@/domain/repositories/CardRepository';
import { BoardRepository } from '@/domain/repositories/BoardRepository';
import { ListRepository } from '@/domain/repositories/ListRepository';
import { ActivityRepository } from '@/domain/repositories/ActivityRepository';
import { Activity } from '@/domain/entities/Activity';

export interface RemoveLabelFromCardRequest {
  cardId: string;
  labelId: string;
  userId: string;
}

export interface RemoveLabelFromCardResponse {
  success: boolean;
}

export class RemoveLabelFromCardUseCase {
  constructor(
    private labelRepository: LabelRepository,
    private cardRepository: CardRepository,
    private boardRepository: BoardRepository,
    private listRepository: ListRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: RemoveLabelFromCardRequest): Promise<RemoveLabelFromCardResponse> {
    const { cardId, labelId, userId } = request;

    // Find card
    const card = await this.cardRepository.findById(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    // Find label
    const label = await this.labelRepository.findById(labelId);
    if (!label) {
      throw new Error('Label not found');
    }

    // Get the list to find the board
    const list = await this.listRepository.findById(card.listId);
    if (!list) {
      throw new Error('List not found');
    }

    // Find board
    const board = await this.boardRepository.findById(list.boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    // Check permissions
    const userRole = await this.boardRepository.getMemberRole(board.id, userId);
    if (!board.canBeEditedBy(userId, userRole || 'VIEWER')) {
      throw new Error('Access denied');
    }

    // Check if label is attached to card
    const isAttached = await this.labelRepository.isAttachedToCard(cardId, labelId);
    if (!isAttached) {
      throw new Error('Label is not attached to this card');
    }

    // Remove label from card
    await this.labelRepository.removeFromCard(cardId, labelId);

    // Log activity
    const activity = Activity.create({
      action: 'REMOVE_LABEL',
      entityType: 'CARD',
      entityId: card.id,
      entityTitle: card.title,
      data: {
        labelId: label.id,
        labelName: label.name,
        labelColor: label.color,
      },
      userId,
      boardId: board.id,
    });
    await this.activityRepository.save(activity);

    return { success: true };
  }
}