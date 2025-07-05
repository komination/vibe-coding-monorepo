import { describe, test, expect, beforeEach, mock } from "bun:test";
import { RemoveLabelFromCardUseCase } from "../../usecases/RemoveLabelFromCard";
import { LabelRepository } from "@kanban/domain-core";
import { CardRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { ListRepository } from "@kanban/domain-core";
import { ActivityRepository } from "@kanban/domain-core";
import { Board, BoardRole } from "@kanban/domain-core";
import { Label } from "@kanban/domain-core";
import { Card } from "@kanban/domain-core";
import { List } from "@kanban/domain-core";

describe("RemoveLabelFromCardUseCase", () => {
  let useCase: RemoveLabelFromCardUseCase;
  let mockLabelRepository: LabelRepository;
  let mockCardRepository: CardRepository;
  let mockBoardRepository: BoardRepository;
  let mockListRepository: ListRepository;
  let mockActivityRepository: ActivityRepository;
  let testLabel: Label;
  let testCard: Card;
  let testList: List;
  let testBoard: Board;

  beforeEach(() => {
    // Create test board
    testBoard = Board.create({
      title: "Test Board",
      description: "Test Description",
      isPublic: false,
      isArchived: false,
      ownerId: "board-owner",
    });

    // Create test list
    testList = List.create({
      title: "Test List",
      position: 1000,
      boardId: testBoard.id,
    });

    // Create test card
    testCard = Card.create({
      title: "Test Card",
      description: "Test Description",
      position: 1000,
      isArchived: false,
      listId: testList.id,
      creatorId: "creator-123",
    });

    // Create test label
    testLabel = Label.create({
      name: "Bug",
      color: "#FF0000",
      boardId: testBoard.id,
    });

    // Create mock repositories
    mockLabelRepository = {
      findById: mock(() => Promise.resolve(testLabel)),
      findByBoard: mock(() => Promise.resolve([])),
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
      addToCard: mock(() => Promise.resolve()),
      removeFromCard: mock(() => Promise.resolve()),
      getCardLabels: mock(() => Promise.resolve([])),
      isAttachedToCard: mock(() => Promise.resolve(true)), // Label is attached by default
      existsInBoard: mock(() => Promise.resolve(false)),
    } as unknown as LabelRepository;

    mockCardRepository = {
      findById: mock(() => Promise.resolve(testCard)),
      findByList: mock(() => Promise.resolve([])),
      findByBoard: mock(() => Promise.resolve([])),
      findByAssignee: mock(() => Promise.resolve([])),
      findOverdueCards: mock(() => Promise.resolve([])),
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
      moveCard: mock(() => Promise.resolve()),
      reorderCards: mock(() => Promise.resolve()),
      getNextPosition: mock(() => Promise.resolve(2000)),
      existsInList: mock(() => Promise.resolve(true)),
    } as unknown as CardRepository;

    mockListRepository = {
      findById: mock(() => Promise.resolve(testList)),
      findByBoard: mock(() => Promise.resolve([])),
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
      reorderLists: mock(() => Promise.resolve()),
      getNextPosition: mock(() => Promise.resolve(2000)),
      existsInBoard: mock(() => Promise.resolve(true)),
    } as unknown as ListRepository;

    mockBoardRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(testBoard)),
      findByIdWithMembers: mock(() => Promise.resolve(null)),
      findByOwner: mock(() => Promise.resolve([])),
      findByMember: mock(() => Promise.resolve([])),
      delete: mock(() => Promise.resolve()),
      update: mock(() => Promise.resolve()),
      addMember: mock(() => Promise.resolve()),
      removeMember: mock(() => Promise.resolve()),
      updateMemberRole: mock(() => Promise.resolve()),
      getMemberRole: mock(() => Promise.resolve("ADMIN" as BoardRole)),
    } as unknown as BoardRepository;

    mockActivityRepository = {
      save: mock(() => Promise.resolve()),
      findByBoard: mock(() => Promise.resolve([])),
      findByUser: mock(() => Promise.resolve([])),
      findByEntityId: mock(() => Promise.resolve([])),
    } as unknown as ActivityRepository;

    useCase = new RemoveLabelFromCardUseCase(
      mockLabelRepository,
      mockCardRepository,
      mockBoardRepository,
      mockListRepository,
      mockActivityRepository
    );
  });

  test("should remove label from card successfully", async () => {
    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);

    // Verify repository calls
    expect(mockCardRepository.findById).toHaveBeenCalledWith(testCard.id);
    expect(mockLabelRepository.findById).toHaveBeenCalledWith(testLabel.id);
    expect(mockListRepository.findById).toHaveBeenCalledWith(testCard.listId);
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoard.id);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoard.id, "user-456");
    expect(mockLabelRepository.isAttachedToCard).toHaveBeenCalledWith(testCard.id, testLabel.id);
    expect(mockLabelRepository.removeFromCard).toHaveBeenCalledWith(testCard.id, testLabel.id);
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should throw error if card not found", async () => {
    mockCardRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      cardId: "non-existent-card",
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Card not found");
  });

  test("should throw error if label not found", async () => {
    mockLabelRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      cardId: testCard.id,
      labelId: "non-existent-label",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label not found");
  });

  test("should throw error if list not found", async () => {
    mockListRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("List not found");
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Board not found");
  });

  test("should throw error if user has no edit permissions", async () => {
    // Mock board that denies edit access
    const mockBoard = Board.create({
      title: "Test Board",
      description: "Test",
      isPublic: false,
      isArchived: false,
      ownerId: "other-user",
    });
    mockBoardRepository.findById = mock(() => Promise.resolve(mockBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("VIEWER" as BoardRole));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should throw error if label is not attached to card", async () => {
    mockLabelRepository.isAttachedToCard = mock(() => Promise.resolve(false));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label is not attached to this card");
  });

  test("should allow OWNER to remove label from card", async () => {
    const ownerId = "user-456";
    const mockBoard = Board.create({
      title: "Test Board",
      description: "Test",
      isPublic: false,
      isArchived: false,
      ownerId,
    });
    mockBoardRepository.findById = mock(() => Promise.resolve(mockBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("OWNER" as BoardRole));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: ownerId,
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
  });

  test("should allow ADMIN to remove label from card", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("ADMIN" as BoardRole));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
  });

  test("should deny MEMBER to remove label from card", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER" as BoardRole));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should deny VIEWER to remove label from card", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("VIEWER" as BoardRole));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should log activity after removing label from card", async () => {
    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    await useCase.execute(request);

    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
    
    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.action).toBe("REMOVE_LABEL");
    expect(activityCall.entityType).toBe("CARD");
    expect(activityCall.entityId).toBe(testCard.id);
    expect(activityCall.entityTitle).toBe("Test Card");
    expect(activityCall.userId).toBe("user-456");
    expect(activityCall.boardId).toBe(testBoard.id);
    expect(activityCall.data).toEqual({
      labelId: testLabel.id,
      labelName: "Bug",
      labelColor: "#FF0000",
    });
  });

  test("should handle card with special characters in title", async () => {
    const specialCard = Card.create({
      title: "Bug & Feature Card",
      description: "Test Description",
      position: 1000,
      isArchived: false,
      listId: testList.id,
      creatorId: "creator-123",
    });
    mockCardRepository.findById = mock(() => Promise.resolve(specialCard));

    const request = {
      cardId: specialCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
    
    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.entityTitle).toBe("Bug & Feature Card");
  });

  test("should handle label with special characters in name", async () => {
    const specialLabel = Label.create({
      name: "🐛 Bug & Fix",
      color: "#FF0000",
      boardId: testBoard.id,
    });
    mockLabelRepository.findById = mock(() => Promise.resolve(specialLabel));

    const request = {
      cardId: testCard.id,
      labelId: specialLabel.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
    
    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.data.labelName).toBe("🐛 Bug & Fix");
  });

  test("should handle archived card", async () => {
    const archivedCard = Card.create({
      title: "Archived Card",
      description: "Test Description",
      position: 1000,
      isArchived: true,
      listId: testList.id,
      creatorId: "creator-123",
    });
    mockCardRepository.findById = mock(() => Promise.resolve(archivedCard));

    const request = {
      cardId: archivedCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
  });

  test("should handle repository errors gracefully", async () => {
    mockLabelRepository.removeFromCard = mock(() => Promise.reject(new Error("Database error")));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Database error");
  });

  test("should handle activity logging errors gracefully", async () => {
    mockActivityRepository.save = mock(() => Promise.reject(new Error("Activity logging failed")));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Activity logging failed");
  });

  test("should handle case where getMemberRole returns null", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should handle case where user is not a member of the board", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should handle different color formats in labels", async () => {
    const colorLabel = Label.create({
      name: "Feature",
      color: "#ABCDEF",
      boardId: testBoard.id,
    });
    mockLabelRepository.findById = mock(() => Promise.resolve(colorLabel));

    const request = {
      cardId: testCard.id,
      labelId: colorLabel.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
    
    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.data.labelColor).toBe("#ABCDEF");
  });

  test("should handle card with no description", async () => {
    const noDescCard = Card.create({
      title: "No Description Card",
      position: 1000,
      isArchived: false,
      listId: testList.id,
      creatorId: "creator-123",
    });
    mockCardRepository.findById = mock(() => Promise.resolve(noDescCard));

    const request = {
      cardId: noDescCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
  });

  test("should handle label with maximum length name", async () => {
    const longName = "a".repeat(50);
    const longLabel = Label.create({
      name: longName,
      color: "#FF0000",
      boardId: testBoard.id,
    });
    mockLabelRepository.findById = mock(() => Promise.resolve(longLabel));

    const request = {
      cardId: testCard.id,
      labelId: longLabel.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
    
    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.data.labelName).toBe(longName);
  });

  test("should handle card with maximum length title", async () => {
    const longTitle = "a".repeat(255);
    const longCard = Card.create({
      title: longTitle,
      description: "Test Description",
      position: 1000,
      isArchived: false,
      listId: testList.id,
      creatorId: "creator-123",
    });
    mockCardRepository.findById = mock(() => Promise.resolve(longCard));

    const request = {
      cardId: longCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
    
    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.entityTitle).toBe(longTitle);
  });

  test("should handle checking attachment status errors gracefully", async () => {
    mockLabelRepository.isAttachedToCard = mock(() => Promise.reject(new Error("Attachment check failed")));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Attachment check failed");
  });

  test("should handle card repository errors gracefully", async () => {
    mockCardRepository.findById = mock(() => Promise.reject(new Error("Card fetch error")));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Card fetch error");
  });

  test("should handle label repository errors gracefully", async () => {
    mockLabelRepository.findById = mock(() => Promise.reject(new Error("Label fetch error")));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label fetch error");
  });

  test("should handle list repository errors gracefully", async () => {
    mockListRepository.findById = mock(() => Promise.reject(new Error("List fetch error")));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("List fetch error");
  });

  test("should handle board repository errors gracefully", async () => {
    mockBoardRepository.findById = mock(() => Promise.reject(new Error("Board fetch error")));

    const request = {
      cardId: testCard.id,
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Board fetch error");
  });
});