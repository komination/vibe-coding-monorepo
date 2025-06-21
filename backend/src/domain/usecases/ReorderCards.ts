import { UserRepository } from "../repositories/UserRepository.js";
import { CardRepository } from "../repositories/CardRepository.js";
import { BoardRepository } from "../repositories/BoardRepository.js";
import { ListRepository } from "../repositories/ListRepository.js";
import { ActivityRepository } from "../repositories/ActivityRepository.js";
import { BoardRole } from "@prisma/client";

export class ReorderCards {
  constructor(
    private cardRepository: CardRepository,
    private userRepository: UserRepository,
    private boardRepository: BoardRepository,
    private listRepository: ListRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(
    listId: string,
    userId: string,
    cardId: string,
    newPosition: number
  ): Promise<void> {
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

    // Get the card
    const card = await this.cardRepository.findById(cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    // Verify card belongs to the list
    if (card.listId !== listId) {
      throw new Error("Card does not belong to this list");
    }

    // Check if user has permission
    const board = await this.boardRepository.findById(list.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    const memberRole = await this.boardRepository.getMemberRole(
      list.boardId,
      userId
    );

    // Only board owner, admin, or members can reorder cards
    if (
      !board.isOwnedBy(userId) &&
      memberRole !== BoardRole.ADMIN &&
      memberRole !== BoardRole.MEMBER
    ) {
      throw new Error("You don't have permission to reorder cards");
    }

    // Reorder the cards
    await this.cardRepository.reorderCards(listId, cardId, newPosition);

    // Log activity
    await this.activityRepository.create({
      type: "REORDER_CARD",
      userId,
      boardId: list.boardId,
      entityType: "CARD",
      entityId: cardId,
      entityTitle: card.title,
      description: `reordered cards in ${list.title}`,
    });
  }
}