import { Card } from "@kanban/domain-core";
import { UserRepository } from "@kanban/domain-core";
import { CardRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { ListRepository } from "@kanban/domain-core";

export class GetListCards {
  constructor(
    private cardRepository: CardRepository,
    private userRepository: UserRepository,
    private boardRepository: BoardRepository,
    private listRepository: ListRepository
  ) {}

  async execute(listId: string, userId: string): Promise<Card[]> {
    // Validate input parameters
    if (!listId || !userId) {
      throw new Error(!listId ? "List not found" : "User not found");
    }

    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get the list
    const list = await this.listRepository.findById(listId);
    if (!list) {
      throw new Error("List not found");
    }

    // Check if user has access to the board
    const board = await this.boardRepository.findById(list.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    const memberRole = await this.boardRepository.getMemberRole(
      list.boardId,
      userId
    );

    if (!board.isPublic && !board.isOwnedBy(userId) && !memberRole) {
      throw new Error("You don't have permission to view cards in this list");
    }

    // Get all cards in the list, sorted by position
    const cards = await this.cardRepository.findByList(listId);
    
    // Filter out archived cards unless specifically requested
    return cards.filter(card => !card.isArchived);
  }
}