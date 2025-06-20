import { Label } from '@/domain/entities/Label';
import { LabelRepository } from '@/domain/repositories/LabelRepository';
import { CardRepository } from '@/domain/repositories/CardRepository';
import { BoardRepository } from '@/domain/repositories/BoardRepository';
import { ListRepository } from '@/domain/repositories/ListRepository';

export interface GetCardLabelsRequest {
  cardId: string;
  userId: string;
}

export interface GetCardLabelsResponse {
  labels: Label[];
}

export class GetCardLabelsUseCase {
  constructor(
    private labelRepository: LabelRepository,
    private cardRepository: CardRepository,
    private boardRepository: BoardRepository,
    private listRepository: ListRepository
  ) {}

  async execute(request: GetCardLabelsRequest): Promise<GetCardLabelsResponse> {
    const { cardId, userId } = request;

    // Find card
    const card = await this.cardRepository.findById(cardId);
    if (!card) {
      throw new Error('Card not found');
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
    if (!board.canBeViewedBy(userId, userRole || undefined)) {
      throw new Error('Access denied');
    }

    // Get card labels
    const labels = await this.labelRepository.getCardLabels(cardId);

    return { labels };
  }
}