import { Card } from "@kanban/domain-core";
import { UserRepository } from "@kanban/domain-core";
import { CardRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { ListRepository } from "@kanban/domain-core";

export class GetCard {
  constructor(
    private cardRepository: CardRepository,
    private userRepository: UserRepository,
    private boardRepository: BoardRepository,
    private listRepository: ListRepository
  ) {}

  async execute(cardId: string, userId: string): Promise<Card> {
    // Validate input parameters
    if (!cardId || !userId) {
      throw new Error(!cardId ? "Card not found" : "User not found");
    }

    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get the card
    const card = await this.cardRepository.findById(cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    // Get the list to access board information
    const list = await this.listRepository.findById(card.listId);
    if (!list) {
      throw new Error("List not found");
    }

    // Check if user has access to the board
    const board = await this.boardRepository.findById(list.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Check user permission
    const memberRole = await this.boardRepository.getMemberRole(
      list.boardId,
      userId
    );
    
    if (!board.isPublic && !board.isOwnedBy(userId) && !memberRole) {
      throw new Error("You don't have permission to view this card");
    }

    return card;
  }
}