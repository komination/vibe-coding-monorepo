import { Card } from "@/domain/entities/Card";
import { UserRepository } from "@/domain/repositories/UserRepository";
import { CardRepository } from "@/domain/repositories/CardRepository";
import { BoardRepository } from "@/domain/repositories/BoardRepository";
import { ListRepository } from "@/domain/repositories/ListRepository";
import { ActivityRepository } from "@/domain/repositories/ActivityRepository";
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

    // Check if user has permission (use source list's board)
    const board = await this.boardRepository.findById(sourceList.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    const memberRole = await this.boardRepository.getMemberRole(
      sourceList.boardId,
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
    
    card.moveToList(targetListId, position);

    // Save the updated card regardless of whether it's moving within same list or not
    await this.cardRepository.save(card);

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
      type: "MOVE",
      userId,
      boardId: sourceList.boardId,
      entityType: "CARD",
      entityId: card.id,
      entityTitle: card.title,
      description: activityDescription,
    });

    return updatedCard;
  }
}