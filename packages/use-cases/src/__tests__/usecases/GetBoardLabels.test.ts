import { describe, test, expect, beforeEach, mock } from "bun:test";
import { GetBoardLabelsUseCase } from "../../usecases/GetBoardLabels";
import { LabelRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { Board, BoardRole } from "@kanban/domain-core";
import { Label } from "@kanban/domain-core";

describe("GetBoardLabelsUseCase", () => {
  let useCase: GetBoardLabelsUseCase;
  let mockLabelRepository: LabelRepository;
  let mockBoardRepository: BoardRepository;
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

    // Create test labels
    testLabels = [
      Label.create({
        name: "Bug",
        color: "#FF0000",
        boardId: "board-123",
      }),
      Label.create({
        name: "Feature",
        color: "#00FF00",
        boardId: "board-123",
      }),
      Label.create({
        name: "Enhancement",
        color: "#0000FF",
        boardId: "board-123",
      }),
    ];

    // Create mock repositories
    mockLabelRepository = {
      findById: mock(() => Promise.resolve(null)),
      findByBoard: mock(() => Promise.resolve(testLabels)),
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
      addToCard: mock(() => Promise.resolve()),
      removeFromCard: mock(() => Promise.resolve()),
      getCardLabels: mock(() => Promise.resolve([])),
      isAttachedToCard: mock(() => Promise.resolve(false)),
      existsInBoard: mock(() => Promise.resolve(false)),
    } as unknown as LabelRepository;

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

    useCase = new GetBoardLabelsUseCase(
      mockLabelRepository,
      mockBoardRepository
    );
  });

  test("should get board labels successfully", async () => {
    const request = {
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toBeDefined();
    expect(result.labels).toHaveLength(3);
    expect(result.labels[0].name).toBe("Bug");
    expect(result.labels[1].name).toBe("Feature");
    expect(result.labels[2].name).toBe("Enhancement");

    // Verify repository calls
    expect(mockBoardRepository.findById).toHaveBeenCalledWith("board-123");
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith("board-123", "user-456");
    expect(mockLabelRepository.findByBoard).toHaveBeenCalledWith("board-123");
  });

  test("should return empty array when board has no labels", async () => {
    mockLabelRepository.findByBoard = mock(() => Promise.resolve([]));

    const request = {
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toBeDefined();
    expect(result.labels).toHaveLength(0);
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      boardId: "non-existent-board",
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
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should allow OWNER to view labels", async () => {
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
      boardId: "board-123",
      userId: ownerId,
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
  });

  test("should allow ADMIN to view labels", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("ADMIN" as BoardRole));

    const request = {
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
  });

  test("should allow MEMBER to view labels", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER" as BoardRole));

    const request = {
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
  });

  test("should allow VIEWER to view labels", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("VIEWER" as BoardRole));

    const request = {
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
  });

  test("should allow access to public board for non-members", async () => {
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
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
  });

  test("should deny access to archived board for non-owners", async () => {
    const archivedBoard = Board.create({
      title: "Archived Board",
      description: "Test",
      isPublic: true,
      isArchived: true,
      ownerId: "other-user",
    });
    mockBoardRepository.findById = mock(() => Promise.resolve(archivedBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER" as BoardRole));

    const request = {
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should allow owner to view archived board labels", async () => {
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
      boardId: "board-123",
      userId: ownerId,
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
  });

  test("should handle labels with special characters", async () => {
    const specialLabels = [
      Label.create({
        name: "Bug & Fix",
        color: "#FF0000",
        boardId: "board-123",
      }),
      Label.create({
        name: "🚀 Feature",
        color: "#00FF00",
        boardId: "board-123",
      }),
    ];
    mockLabelRepository.findByBoard = mock(() => Promise.resolve(specialLabels));

    const request = {
      boardId: "board-123",
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
        boardId: "board-123",
      }),
      Label.create({
        name: "Green",
        color: "#00FF00",
        boardId: "board-123",
      }),
      Label.create({
        name: "Blue",
        color: "#0000FF",
        boardId: "board-123",
      }),
    ];
    mockLabelRepository.findByBoard = mock(() => Promise.resolve(colorLabels));

    const request = {
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
    expect(result.labels[0].color).toBe("#FF0000");
    expect(result.labels[1].color).toBe("#00FF00");
    expect(result.labels[2].color).toBe("#0000FF");
  });

  test("should handle repository errors gracefully", async () => {
    mockLabelRepository.findByBoard = mock(() => Promise.reject(new Error("Database error")));

    const request = {
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Database error");
  });

  test("should handle board repository errors gracefully", async () => {
    mockBoardRepository.findById = mock(() => Promise.reject(new Error("Board fetch error")));

    const request = {
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Board fetch error");
  });

  test("should handle getMemberRole errors gracefully", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.reject(new Error("Permission check error")));

    const request = {
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Permission check error");
  });

  test("should return labels sorted by creation order", async () => {
    const request = {
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(3);
    // Assuming repository returns them in the order they were created
    expect(result.labels[0].name).toBe("Bug");
    expect(result.labels[1].name).toBe("Feature");
    expect(result.labels[2].name).toBe("Enhancement");
  });

  test("should handle case where user role is undefined", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const request = {
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should handle single label", async () => {
    const singleLabel = [
      Label.create({
        name: "Important",
        color: "#FF0000",
        boardId: "board-123",
      }),
    ];
    mockLabelRepository.findByBoard = mock(() => Promise.resolve(singleLabel));

    const request = {
      boardId: "board-123",
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
        boardId: "board-123",
      }),
    ];
    mockLabelRepository.findByBoard = mock(() => Promise.resolve(longNameLabels));

    const request = {
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.labels).toHaveLength(1);
    expect(result.labels[0].name).toBe(longName);
  });
});