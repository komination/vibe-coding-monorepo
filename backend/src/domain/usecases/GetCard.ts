import { Card } from "../entities/Card.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { CardRepository } from "../repositories/CardRepository.js";
import { BoardRepository } from "../repositories/BoardRepository.js";
import { ActivityRepository } from "../repositories/ActivityRepository.js";
import { BoardRole } from "@prisma/client";

export class GetCard {
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

    // Check if user has access to the board
    const board = await this.boardRepository.findById(card.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    // Check user permission
    const memberRole = await this.boardRepository.getMemberRole(
      card.boardId,
      userId
    );
    
    if (!board.isOwnedBy(userId) && !memberRole) {
      throw new Error("You don't have permission to view this card");
    }

    return card;
  }
}