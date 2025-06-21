import { UserRepository } from "../repositories/UserRepository.js";
import { CardRepository } from "../repositories/CardRepository.js";
import { BoardRepository } from "../repositories/BoardRepository.js";
import { ActivityRepository } from "../repositories/ActivityRepository.js";
import { BoardRole } from "@prisma/client";

export class DeleteCard {
  constructor(
    private cardRepository: CardRepository,
    private userRepository: UserRepository,
    private boardRepository: BoardRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(cardId: string, userId: string): Promise<void> {
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

    // Check if user has permission
    const board = await this.boardRepository.findById(card.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    const memberRole = await this.boardRepository.getMemberRole(
      card.boardId,
      userId
    );

    // Only board owner, admin, or the card creator can delete cards
    if (
      !board.isOwnedBy(userId) &&
      memberRole !== BoardRole.ADMIN &&
      !card.isCreatedBy(userId)
    ) {
      throw new Error("You don't have permission to delete this card");
    }

    // Store card info for activity log before deletion
    const cardTitle = card.title;
    const boardId = card.boardId;

    // Delete the card
    await this.cardRepository.delete(cardId);

    // Log activity
    await this.activityRepository.create({
      type: "DELETE_CARD",
      userId,
      boardId,
      entityType: "CARD",
      entityId: cardId,
      entityTitle: cardTitle,
      description: `deleted card "${cardTitle}"`,
    });
  }
}