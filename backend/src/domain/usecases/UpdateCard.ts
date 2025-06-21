import { Card } from "../entities/Card.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { CardRepository } from "../repositories/CardRepository.js";
import { BoardRepository } from "../repositories/BoardRepository.js";
import { ActivityRepository } from "../repositories/ActivityRepository.js";
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

    // Check if user has permission to update
    const board = await this.boardRepository.findById(card.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    const memberRole = await this.boardRepository.getMemberRole(
      card.boardId,
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

    // Update card properties
    if (data.title !== undefined && data.title !== card.title) {
      changes.push(`changed title from "${card.title}" to "${data.title}"`);
      card.title = data.title;
    }

    if (data.description !== undefined && data.description !== card.description) {
      changes.push("updated description");
      card.description = data.description;
    }

    if (data.position !== undefined && data.position !== card.position) {
      card.position = data.position;
    }

    if (data.dueDate !== undefined) {
      if (data.dueDate !== card.dueDate) {
        changes.push(
          data.dueDate
            ? `set due date to ${data.dueDate.toLocaleDateString()}`
            : "removed due date"
        );
        card.dueDate = data.dueDate;
      }
    }

    if (data.startDate !== undefined) {
      if (data.startDate !== card.startDate) {
        changes.push(
          data.startDate
            ? `set start date to ${data.startDate.toLocaleDateString()}`
            : "removed start date"
        );
        card.startDate = data.startDate;
      }
    }

    if (data.assignedToId !== undefined) {
      if (data.assignedToId !== card.assignedToId) {
        if (data.assignedToId) {
          const assignee = await this.userRepository.findById(data.assignedToId);
          if (!assignee) {
            throw new Error("Assignee not found");
          }
          changes.push(`assigned to ${assignee.name}`);
        } else {
          changes.push("removed assignee");
        }
        card.assignedToId = data.assignedToId;
      }
    }

    if (data.archived !== undefined && data.archived !== card.archived) {
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
    card.updatedAt = new Date();
    const updatedCard = await this.cardRepository.save(card);

    // Log activity if there were changes
    if (changes.length > 0) {
      await this.activityRepository.create({
        type: "UPDATE_CARD",
        userId,
        boardId: card.boardId,
        entityType: "CARD",
        entityId: card.id,
        entityTitle: card.title,
        description: changes.join(", "),
      });
    }

    return updatedCard;
  }
}