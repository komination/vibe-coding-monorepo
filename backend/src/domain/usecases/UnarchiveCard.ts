import { Card } from "../entities/Card.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { CardRepository } from "../repositories/CardRepository.js";
import { BoardRepository } from "../repositories/BoardRepository.js";
import { ActivityRepository } from "../repositories/ActivityRepository.js";
import { BoardRole } from "@prisma/client";

export class UnarchiveCard {
  constructor(
    private cardRepository: CardRepository,
    private userRepository: UserRepository,
    private boardRepository: BoardRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(cardId: string, userId: string): Promise<Card> {
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

    if (!card.archived) {
      throw new Error("Card is not archived");
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

    // Only board owner, admin, or members can unarchive cards
    if (
      !board.isOwnedBy(userId) &&
      memberRole !== BoardRole.ADMIN &&
      memberRole !== BoardRole.MEMBER
    ) {
      throw new Error("You don't have permission to unarchive this card");
    }

    // Unarchive the card
    card.unarchive();
    card.updatedAt = new Date();
    
    const unarchivedCard = await this.cardRepository.save(card);

    // Log activity
    await this.activityRepository.create({
      type: "UNARCHIVE_CARD",
      userId,
      boardId: card.boardId,
      entityType: "CARD",
      entityId: card.id,
      entityTitle: card.title,
      description: `unarchived card "${card.title}"`,
    });

    return unarchivedCard;
  }
}