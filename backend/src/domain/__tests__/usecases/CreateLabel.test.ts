import { describe, test, expect, beforeEach, mock } from "bun:test";
import { CreateLabelUseCase } from "@/domain/usecases/CreateLabel";
import { LabelRepository } from "@/domain/repositories/LabelRepository";
import { BoardRepository } from "@/domain/repositories/BoardRepository";
import { ActivityRepository } from "@/domain/repositories/ActivityRepository";
import { Board, BoardRole } from "@/domain/entities/Board";

describe("CreateLabelUseCase", () => {
  let useCase: CreateLabelUseCase;
  let mockLabelRepository: LabelRepository;
  let mockBoardRepository: BoardRepository;
  let mockActivityRepository: ActivityRepository;

  beforeEach(() => {
    // Create mock repositories
    mockLabelRepository = {
      findById: mock(() => Promise.resolve(null)),
      findByBoard: mock(() => Promise.resolve([])),
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
      addToCard: mock(() => Promise.resolve()),
      removeFromCard: mock(() => Promise.resolve()),
      getCardLabels: mock(() => Promise.resolve([])),
      isAttachedToCard: mock(() => Promise.resolve(false)),
      existsInBoard: mock(() => Promise.resolve(false)),
    } as unknown as LabelRepository;

    // Create a default board entity
    const defaultBoard = Board.create({
      title: "Test Board",
      description: "Test Description",
      isPublic: false,
      isArchived: false,
      ownerId: "board-owner",
    });

    mockBoardRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(defaultBoard)),
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

    useCase = new CreateLabelUseCase(
      mockLabelRepository,
      mockBoardRepository,
      mockActivityRepository
    );
  });

  test("should create a label successfully", async () => {
    const boardId = "board-123";
    const userId = "user-456";
    const request = {
      name: "Bug",
      color: "#ff0000",
      boardId,
      userId,
    };

    const result = await useCase.execute(request);

    expect(result.label).toBeDefined();
    expect(result.label.name).toBe("Bug");
    expect(result.label.color).toBe("#FF0000"); // Should be uppercase
    expect(result.label.boardId).toBe(boardId);

    // Verify repository calls
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(boardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(boardId, userId);
    expect(mockLabelRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should trim whitespace from name", async () => {
    const request = {
      name: "  Bug  ",
      color: "#ff0000",
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.label.name).toBe("Bug");
  });

  test("should convert color to uppercase", async () => {
    const request = {
      name: "Feature",
      color: "#00ff00",
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.label.color).toBe("#00FF00");
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      name: "Bug",
      color: "#ff0000",
      boardId: "non-existent-board",
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
      name: "Bug",
      color: "#ff0000",
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should allow OWNER to create label", async () => {
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
      name: "Bug",
      color: "#ff0000",
      boardId: "board-123",
      userId: ownerId,
    };

    const result = await useCase.execute(request);

    expect(result.label).toBeDefined();
    expect(result.label.name).toBe("Bug");
  });

  test("should allow ADMIN to create label", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("ADMIN" as BoardRole));

    const request = {
      name: "Bug",
      color: "#ff0000",
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.label).toBeDefined();
    expect(result.label.name).toBe("Bug");
  });

  test("should deny MEMBER to create label", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER" as BoardRole));

    const request = {
      name: "Bug",
      color: "#ff0000",
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should deny VIEWER to create label", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("VIEWER" as BoardRole));

    const request = {
      name: "Bug",
      color: "#ff0000",
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should throw error if label name is empty", async () => {
    const request = {
      name: "   ",
      color: "#ff0000",
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label name is required");
  });

  test("should throw error if label name is too long", async () => {
    const request = {
      name: "a".repeat(51),
      color: "#ff0000",
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label name is too long");
  });

  test("should throw error if color is empty", async () => {
    const request = {
      name: "Bug",
      color: "   ",
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label color is required");
  });

  test("should throw error if color format is invalid", async () => {
    const request = {
      name: "Bug",
      color: "red",
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label color must be a valid hex color (e.g., #FF0000)");
  });

  test("should throw error if color is missing # prefix", async () => {
    const request = {
      name: "Bug",
      color: "ff0000",
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label color must be a valid hex color (e.g., #FF0000)");
  });

  test("should throw error if color is too short", async () => {
    const request = {
      name: "Bug",
      color: "#ff0",
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label color must be a valid hex color (e.g., #FF0000)");
  });

  test("should throw error if color contains invalid characters", async () => {
    const request = {
      name: "Bug",
      color: "#gggggg",
      boardId: "board-123",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label color must be a valid hex color (e.g., #FF0000)");
  });

  test("should accept valid hex colors with lowercase", async () => {
    const request = {
      name: "Bug",
      color: "#abcdef",
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.label.color).toBe("#ABCDEF");
  });

  test("should accept valid hex colors with uppercase", async () => {
    const request = {
      name: "Bug",
      color: "#ABCDEF",
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.label.color).toBe("#ABCDEF");
  });

  test("should log activity after creating label", async () => {
    const request = {
      name: "Bug",
      color: "#ff0000",
      boardId: "board-123",
      userId: "user-456",
    };

    await useCase.execute(request);

    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.action).toBe("CREATE");
    expect(activityCall.entityType).toBe("LABEL");
    expect(activityCall.entityTitle).toBe("Bug");
    expect(activityCall.userId).toBe("user-456");
    expect(activityCall.boardId).toBe("board-123");
    expect(activityCall.data).toEqual({
      labelName: "Bug",
      labelColor: "#FF0000",
    });
  });

  test("should handle name with 50 characters (boundary)", async () => {
    const name = "a".repeat(50);
    const request = {
      name,
      color: "#ff0000",
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.label.name).toBe(name);
  });

  test("should handle mixed case color with numbers", async () => {
    const request = {
      name: "Bug",
      color: "#A1b2C3",
      boardId: "board-123",
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.label.color).toBe("#A1B2C3");
  });
});