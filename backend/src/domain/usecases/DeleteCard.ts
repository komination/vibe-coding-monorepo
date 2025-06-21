import { UserRepository } from "@/domain/repositories/UserRepository";
import { CardRepository } from "@/domain/repositories/CardRepository";
import { BoardRepository } from "@/domain/repositories/BoardRepository";
import { ListRepository } from "@/domain/repositories/ListRepository";
import { ActivityRepository } from "@/domain/repositories/ActivityRepository";
import { BoardRole } from "@prisma/client";

export class DeleteCard {
  constructor(
    private cardRepository: CardRepository,
    private userRepository: UserRepository,
    private boardRepository: BoardRepository,
    private listRepository: ListRepository,
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

    // Get the list to access board information
    const list = await this.listRepository.findById(card.listId);
    if (!list) {
      throw new Error("List not found");
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
    const boardId = list.boardId;

    // Delete the card
    await this.cardRepository.delete(cardId);

    // Log activity
    await this.activityRepository.create({
      type: "DELETE",
      userId,
      boardId,
      entityType: "CARD",
      entityId: cardId,
      entityTitle: cardTitle,
      description: `deleted card "${cardTitle}"`,
    });
  }
}