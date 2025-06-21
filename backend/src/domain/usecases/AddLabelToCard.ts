import { LabelRepository } from '@/domain/repositories/LabelRepository';
import { CardRepository } from '@/domain/repositories/CardRepository';
import { BoardRepository } from '@/domain/repositories/BoardRepository';
import { ListRepository } from '@/domain/repositories/ListRepository';
import { ActivityRepository } from '@/domain/repositories/ActivityRepository';
import { Activity } from '@/domain/entities/Activity';

export interface AddLabelToCardRequest {
  cardId: string;
  labelId: string;
  userId: string;
}

export interface AddLabelToCardResponse {
  success: boolean;
}

export class AddLabelToCardUseCase {
  constructor(
    private labelRepository: LabelRepository,
    private cardRepository: CardRepository,
    private boardRepository: BoardRepository,
    private listRepository: ListRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: AddLabelToCardRequest): Promise<AddLabelToCardResponse> {
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

    // Verify label belongs to the same board as the card
    if (!label.belongsToBoard(list.boardId)) {
      throw new Error('Label does not belong to the same board as the card');
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

    // Check if label is already attached to card
    const isAlreadyAttached = await this.labelRepository.isAttachedToCard(cardId, labelId);
    if (isAlreadyAttached) {
      throw new Error('Label is already attached to this card');
    }

    // Add label to card
    await this.labelRepository.addToCard(cardId, labelId);

    // Log activity
    const activity = Activity.create({
      action: 'ADD_LABEL',
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