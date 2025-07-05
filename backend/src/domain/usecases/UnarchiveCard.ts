import { Card } from "@kanban/domain-core";
import { UserRepository } from "@kanban/domain-core";
import { CardRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { ListRepository } from "@kanban/domain-core";
import { ActivityRepository } from "@kanban/domain-core";
import { BoardRole } from "@prisma/client";

export class UnarchiveCard {
  constructor(
    private cardRepository: CardRepository,
    private userRepository: UserRepository,
    private boardRepository: BoardRepository,
    private listRepository: ListRepository,
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

    if (!card.isArchived) {
      throw new Error("Card is not archived");
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
    
    await this.cardRepository.save(card);

    // Log activity
    await this.activityRepository.create({
      type: "UNARCHIVE",
      userId,
      boardId: list.boardId,
      entityType: "CARD",
      entityId: card.id,
      entityTitle: card.title,
      description: `unarchived card "${card.title}"`,
    });

    return card;
  }
}