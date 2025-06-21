import { Card } from "../entities/Card.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { CardRepository } from "../repositories/CardRepository.js";
import { BoardRepository } from "../repositories/BoardRepository.js";
import { ListRepository } from "../repositories/ListRepository.js";
import { ActivityRepository } from "../repositories/ActivityRepository.js";
import { BoardRole } from "@prisma/client";

export class MoveCard {
  constructor(
    private cardRepository: CardRepository,
    private userRepository: UserRepository,
    private boardRepository: BoardRepository,
    private listRepository: ListRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(
    cardId: string,
    userId: string,
    targetListId: string,
    position: number
  ): Promise<Card> {
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

    // Get source and target lists
    const sourceList = await this.listRepository.findById(card.listId);
    if (!sourceList) {
      throw new Error("Source list not found");
    }

    const targetList = await this.listRepository.findById(targetListId);
    if (!targetList) {
      throw new Error("Target list not found");
    }

    // Verify both lists belong to the same board
    if (sourceList.boardId !== targetList.boardId) {
      throw new Error("Cannot move card between different boards");
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

    // Only board owner, admin, or members can move cards
    if (
      !board.isOwnedBy(userId) &&
      memberRole !== BoardRole.ADMIN &&
      memberRole !== BoardRole.MEMBER
    ) {
      throw new Error("You don't have permission to move this card");
    }

    // Move the card
    const isMovingToSameList = card.listId === targetListId;
    const previousListTitle = sourceList.title;
    
    card.moveToList(targetListId);
    card.position = position;
    card.updatedAt = new Date();

    // If moving within the same list, just reorder
    if (isMovingToSameList) {
      await this.cardRepository.reorderCards(targetListId, cardId, position);
    } else {
      // Moving to a different list
      await this.cardRepository.moveToList(cardId, targetListId, position);
    }

    // Get the updated card
    const updatedCard = await this.cardRepository.findById(cardId);
    if (!updatedCard) {
      throw new Error("Failed to retrieve updated card");
    }

    // Log activity
    const activityDescription = isMovingToSameList
      ? `moved card within ${targetList.title}`
      : `moved card from ${previousListTitle} to ${targetList.title}`;

    await this.activityRepository.create({
      type: "MOVE_CARD",
      userId,
      boardId: card.boardId,
      entityType: "CARD",
      entityId: card.id,
      entityTitle: card.title,
      description: activityDescription,
    });

    return updatedCard;
  }
}