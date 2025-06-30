import { describe, test, expect, beforeEach, mock } from "bun:test";
import { GetCardLabelsUseCase } from "@/domain/usecases/GetCardLabels";
import { LabelRepository } from "@/domain/repositories/LabelRepository";
import { CardRepository } from "@/domain/repositories/CardRepository";
import { BoardRepository } from "@/domain/repositories/BoardRepository";
import { ListRepository } from "@/domain/repositories/ListRepository";
import { Board, BoardRole } from "@/domain/entities/Board";
import { Label } from "@/domain/entities/Label";
import { Card } from "@/domain/entities/Card";
import { List } from "@/domain/entities/List";

describe("GetCardLabelsUseCase", () => {
  let useCase: GetCardLabelsUseCase;
  let mockLabelRepository: LabelRepository;
  let mockCardRepository: CardRepository;
  let mockBoardRepository: BoardRepository;
  let mockListRepository: ListRepository;
  let testCard: Card;
  let testList: List;
  let testBoard: Board;
  let testLabels: Label[];

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

    // Create test labels
    testLabels = [
      Label.create({
        name: "Bug",
        color: "#FF0000",
        boardId: testBoard.id,
      }),
      Label.create({
        name: "Feature",
        color: "#00FF00",
        boardId: testBoard.id,
      }),
      Label.create({
        name: "Priority",
        color: "#0000FF",
        boardId: testBoard.id,
      }),
    ];

    // Create mock repositories
    mockLabelRepository = {
      findById: mock(() => Promise.resolve(null)),
      findByBoard: mock(() => Promise.resolve([])),
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
      addToCard: mock(() => Promise.resolve()),
      removeFromCard: mock(() => Promise.resolve()),
      getCardLabels: mock(() => Promise.resolve(testLabels)),
      isAttachedToCard: mock(() => Promise.resolve(false)),
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
      getMemberRole: mock(() => Promise.resolve("MEMBER" as BoardRole)),
    } as unknown as BoardRepository;

    useCase = new GetCardLabelsUseCase(
      mockLabelRepository,
      mockCardRepository,
      mockBoardRepository,
      mockListRepository
    );
  });

  test("should get card labels successfully", async () => {
    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toBeDefined();
    expect(result.labels).toHaveLength(3);
    expect(result.labels[0].name).toBe("Bug");
    expect(result.labels[1].name).toBe("Feature");
    expect(result.labels[2].name).toBe("Priority");

    // Verify repository calls
    expect(mockCardRepository.findById).toHaveBeenCalledWith(testCard.id);
    expect(mockListRepository.findById).toHaveBeenCalledWith(testCard.listId);
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoard.id);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoard.id, "user-456");
    expect(mockLabelRepository.getCardLabels).toHaveBeenCalledWith(testCard.id);
  });

  test("should return empty array when card has no labels", async () => {
    mockLabelRepository.getCardLabels = mock(() => Promise.resolve([]));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toBeDefined();
    expect(result.labels).toHaveLength(0);
  });

  test("should throw error if card not found", async () => {
    mockCardRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      cardId: "non-existent-card",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Card not found");
  });

  test("should throw error if list not found", async () => {
    mockListRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("List not found");
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Board not found");
  });

  test("should throw error if user has no view permissions", async () => {
    // Mock board that denies view access
    const mockBoard = Board.create({
      title: "Private Board",
      description: "Test",
      isPublic: false,
      isArchived: false,
      ownerId: "other-user",
    });
    mockBoardRepository.findById = mock(() => Promise.resolve(mockBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null)); // Not a member

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should allow OWNER to view card labels", async () => {
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
      userId: ownerId,
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
  });

  test("should allow ADMIN to view card labels", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("ADMIN" as BoardRole));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
  });

  test("should allow MEMBER to view card labels", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER" as BoardRole));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
  });

  test("should allow VIEWER to view card labels", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("VIEWER" as BoardRole));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
  });

  test("should allow access to public board cards for non-members", async () => {
    const publicBoard = Board.create({
      title: "Public Board",
      description: "Test",
      isPublic: true,
      isArchived: false,
      ownerId: "other-user",
    });
    mockBoardRepository.findById = mock(() => Promise.resolve(publicBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null)); // Not a member

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
  });

  test("should deny access to archived board cards for members", async () => {
    const archivedBoard = Board.create({
      title: "Archived Board",
      description: "Test",
      isPublic: false,
      isArchived: true,
      ownerId: "other-user",
    });
    mockBoardRepository.findById = mock(() => Promise.resolve(archivedBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER" as BoardRole));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should allow owner to view archived board card labels", async () => {
    const ownerId = "user-456";
    const archivedBoard = Board.create({
      title: "Archived Board",
      description: "Test",
      isPublic: false,
      isArchived: true,
      ownerId,
    });
    mockBoardRepository.findById = mock(() => Promise.resolve(archivedBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("OWNER" as BoardRole));

    const request = {
      cardId: testCard.id,
      userId: ownerId,
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
  });

  test("should handle archived card labels", async () => {
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
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
  });

  test("should handle labels with special characters", async () => {
    const specialLabels = [
      Label.create({
        name: "Bug & Fix",
        color: "#FF0000",
        boardId: testBoard.id,
      }),
      Label.create({
        name: "🚀 Feature",
        color: "#00FF00",
        boardId: testBoard.id,
      }),
    ];
    mockLabelRepository.getCardLabels = mock(() => Promise.resolve(specialLabels));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(2);
    expect(result.labels[0].name).toBe("Bug & Fix");
    expect(result.labels[1].name).toBe("🚀 Feature");
  });

  test("should handle labels with different color formats", async () => {
    const colorLabels = [
      Label.create({
        name: "Red",
        color: "#FF0000",
        boardId: testBoard.id,
      }),
      Label.create({
        name: "Green",
        color: "#00FF00",
        boardId: testBoard.id,
      }),
      Label.create({
        name: "Blue",
        color: "#0000FF",
        boardId: testBoard.id,
      }),
    ];
    mockLabelRepository.getCardLabels = mock(() => Promise.resolve(colorLabels));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
    expect(result.labels[0].color).toBe("#FF0000");
    expect(result.labels[1].color).toBe("#00FF00");
    expect(result.labels[2].color).toBe("#0000FF");
  });

  test("should handle repository errors gracefully", async () => {
    mockLabelRepository.getCardLabels = mock(() => Promise.reject(new Error("Database error")));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Database error");
  });

  test("should handle card repository errors gracefully", async () => {
    mockCardRepository.findById = mock(() => Promise.reject(new Error("Card fetch error")));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Card fetch error");
  });

  test("should handle list repository errors gracefully", async () => {
    mockListRepository.findById = mock(() => Promise.reject(new Error("List fetch error")));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("List fetch error");
  });

  test("should handle board repository errors gracefully", async () => {
    mockBoardRepository.findById = mock(() => Promise.reject(new Error("Board fetch error")));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Board fetch error");
  });

  test("should handle getMemberRole errors gracefully", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.reject(new Error("Permission check error")));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Permission check error");
  });

  test("should return labels sorted by application order", async () => {
    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
    // Assuming repository returns them in the order they were applied
    expect(result.labels[0].name).toBe("Bug");
    expect(result.labels[1].name).toBe("Feature");
    expect(result.labels[2].name).toBe("Priority");
  });

  test("should handle case where user role is undefined", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should handle single label", async () => {
    const singleLabel = [
      Label.create({
        name: "Important",
        color: "#FF0000",
        boardId: testBoard.id,
      }),
    ];
    mockLabelRepository.getCardLabels = mock(() => Promise.resolve(singleLabel));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(1);
    expect(result.labels[0].name).toBe("Important");
  });

  test("should handle labels with maximum name length", async () => {
    const longName = "a".repeat(50);
    const longNameLabels = [
      Label.create({
        name: longName,
        color: "#FF0000",
        boardId: testBoard.id,
      }),
    ];
    mockLabelRepository.getCardLabels = mock(() => Promise.resolve(longNameLabels));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(1);
    expect(result.labels[0].name).toBe(longName);
  });

  test("should handle card with special characters in title", async () => {
    const specialCard = Card.create({
      title: "Card with & special chars",
      description: "Test Description",
      position: 1000,
      isArchived: false,
      listId: testList.id,
      creatorId: "creator-123",
    });
    mockCardRepository.findById = mock(() => Promise.resolve(specialCard));

    const request = {
      cardId: specialCard.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
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
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
  });

  test("should handle large number of labels", async () => {
    const manyLabels = Array.from({ length: 20 }, (_, i) =>
      Label.create({
        name: `Label ${i + 1}`,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()}`,
        boardId: testBoard.id,
      })
    );
    mockLabelRepository.getCardLabels = mock(() => Promise.resolve(manyLabels));

    const request = {
      cardId: testCard.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(20);
    expect(result.labels[0].name).toBe("Label 1");
    expect(result.labels[19].name).toBe("Label 20");
  });
});