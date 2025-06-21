import { Card } from "@/domain/entities/Card";
import { UserRepository } from "@/domain/repositories/UserRepository";
import { CardRepository } from "@/domain/repositories/CardRepository";
import { BoardRepository } from "@/domain/repositories/BoardRepository";
import { ListRepository } from "@/domain/repositories/ListRepository";
import { ActivityRepository } from "@/domain/repositories/ActivityRepository";
import { BoardRole } from "@prisma/client";

interface UpdateCardData {
  title?: string;
  description?: string;
  position?: number;
  dueDate?: Date | null;
  startDate?: Date | null;
  assignedToId?: string | null;
  archived?: boolean;
}

export class UpdateCard {
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
    data: UpdateCardData
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

    // Get the list to access board information
    const list = await this.listRepository.findById(card.listId);
    if (!list) {
      throw new Error("List not found");
    }

    // Check if user has permission to update
    const board = await this.boardRepository.findById(list.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    const memberRole = await this.boardRepository.getMemberRole(
      list.boardId,
      userId
    );

    // Only board owner, admin, or members can update cards
    if (
      !board.isOwnedBy(userId) &&
      memberRole !== BoardRole.ADMIN &&
      memberRole !== BoardRole.MEMBER
    ) {
      throw new Error("You don't have permission to update this card");
    }

    // Track changes for activity log
    const changes: string[] = [];

    // Update card properties using entity methods
    if (data.title !== undefined && data.title !== card.title) {
      changes.push(`changed title from "${card.title}" to "${data.title}"`);
      card.updateTitle(data.title);
    }

    if (data.description !== undefined && data.description !== card.description) {
      changes.push("updated description");
      card.updateDescription(data.description);
    }

    if (data.position !== undefined && data.position !== card.position) {
      card.updatePosition(data.position);
    }

    if (data.dueDate !== undefined) {
      if (data.dueDate !== card.dueDate) {
        changes.push(
          data.dueDate
            ? `set due date to ${data.dueDate.toLocaleDateString()}`
            : "removed due date"
        );
        card.updateDueDate(data.dueDate || undefined);
      }
    }

    if (data.startDate !== undefined) {
      if (data.startDate !== card.startDate) {
        changes.push(
          data.startDate
            ? `set start date to ${data.startDate.toLocaleDateString()}`
            : "removed start date"
        );
        card.updateStartDate(data.startDate || undefined);
      }
    }

    if (data.assignedToId !== undefined) {
      if (data.assignedToId !== card.assigneeId) {
        if (data.assignedToId) {
          const assignee = await this.userRepository.findById(data.assignedToId);
          if (!assignee) {
            throw new Error("Assignee not found");
          }
          changes.push(`assigned to ${assignee.name}`);
        } else {
          changes.push("removed assignee");
        }
        card.assignTo(data.assignedToId || undefined);
      }
    }

    if (data.archived !== undefined && data.archived !== card.isArchived) {
      if (data.archived) {
        card.archive();
        changes.push("archived card");
      } else {
        card.unarchive();
        changes.push("unarchived card");
      }
    }

    // Validate dates
    if (card.startDate && card.dueDate && card.startDate > card.dueDate) {
      throw new Error("Start date cannot be after due date");
    }

    // Update the card
    await this.cardRepository.save(card);

    // Log activity if there were changes
    if (changes.length > 0) {
      await this.activityRepository.create({
        type: "UPDATE",
        userId,
        boardId: list.boardId,
        entityType: "CARD",
        entityId: card.id,
        entityTitle: card.title,
        description: changes.join(", "),
      });
    }

    return card;
  }
}