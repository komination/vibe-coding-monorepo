import { describe, test, expect, beforeEach, mock } from "bun:test";
import { UpdateLabelUseCase } from "@/domain/usecases/UpdateLabel";
import { LabelRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { ActivityRepository } from "@kanban/domain-core";
import { Board, BoardRole } from "@kanban/domain-core";
import { Label } from "@kanban/domain-core";

describe("UpdateLabelUseCase", () => {
  let useCase: UpdateLabelUseCase;
  let mockLabelRepository: LabelRepository;
  let mockBoardRepository: BoardRepository;
  let mockActivityRepository: ActivityRepository;
  let testLabel: Label;
  let testBoard: Board;

  beforeEach(() => {
    // Create test label
    testLabel = Label.create({
      name: "Bug",
      color: "#FF0000",
      boardId: "board-123",
    });

    // Create test board
    testBoard = Board.create({
      title: "Test Board",
      description: "Test Description",
      isPublic: false,
      isArchived: false,
      ownerId: "board-owner",
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
      getMemberRole: mock(() => Promise.resolve("ADMIN" as BoardRole)),
    } as unknown as BoardRepository;

    mockActivityRepository = {
      save: mock(() => Promise.resolve()),
      findByBoard: mock(() => Promise.resolve([])),
      findByUser: mock(() => Promise.resolve([])),
      findByEntityId: mock(() => Promise.resolve([])),
    } as unknown as ActivityRepository;

    useCase = new UpdateLabelUseCase(
      mockLabelRepository,
      mockBoardRepository,
      mockActivityRepository
    );
  });

  test("should update label name and color successfully", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      name: "Feature",
      color: "#00ff00",
    };

    const result = await useCase.execute(request);

    expect(result.label).toBeDefined();
    expect(result.label.name).toBe("Feature");
    expect(result.label.color).toBe("#00FF00"); // Should be uppercase

    // Verify repository calls
    expect(mockLabelRepository.findById).toHaveBeenCalledWith(testLabel.id);
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testLabel.boardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testLabel.boardId, "user-456");
    expect(mockLabelRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should update only name when color not provided", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      name: "Feature",
    };

    const result = await useCase.execute(request);

    expect(result.label.name).toBe("Feature");
    expect(result.label.color).toBe("#FF0000"); // Should remain unchanged

    expect(mockLabelRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should update only color when name not provided", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      color: "#00ff00",
    };

    const result = await useCase.execute(request);

    expect(result.label.name).toBe("Bug"); // Should remain unchanged
    expect(result.label.color).toBe("#00FF00");

    expect(mockLabelRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should not save or log activity when no changes are made", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      name: "Bug", // Same as current
      color: "#FF0000", // Same as current
    };

    const result = await useCase.execute(request);

    expect(result.label.name).toBe("Bug");
    expect(result.label.color).toBe("#FF0000");

    // Should not save or log activity when no changes
    expect(mockLabelRepository.save).toHaveBeenCalledTimes(0);
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(0);
  });

  test("should trim whitespace from name", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      name: "  Feature  ",
    };

    const result = await useCase.execute(request);

    expect(result.label.name).toBe("Feature");
  });

  test("should convert color to uppercase", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      color: "#00ff00",
    };

    const result = await useCase.execute(request);

    expect(result.label.color).toBe("#00FF00");
  });

  test("should throw error if label not found", async () => {
    mockLabelRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      labelId: "non-existent-label",
      userId: "user-456",
      name: "Feature",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label not found");
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      name: "Feature",
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
      labelId: testLabel.id,
      userId: "user-456",
      name: "Feature",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should allow OWNER to update label", async () => {
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
      labelId: testLabel.id,
      userId: ownerId,
      name: "Feature",
    };

    const result = await useCase.execute(request);

    expect(result.label.name).toBe("Feature");
  });

  test("should allow ADMIN to update label", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("ADMIN" as BoardRole));

    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      name: "Feature",
    };

    const result = await useCase.execute(request);

    expect(result.label.name).toBe("Feature");
  });

  test("should deny MEMBER to update label", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER" as BoardRole));

    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      name: "Feature",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should deny VIEWER to update label", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("VIEWER" as BoardRole));

    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      name: "Feature",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should throw error if label name is empty", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      name: "   ",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label name is required");
  });

  test("should throw error if label name is too long", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      name: "a".repeat(51),
    };

    expect(useCase.execute(request)).rejects.toThrow("Label name is too long");
  });

  test("should throw error if color is empty", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      color: "   ",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label color is required");
  });

  test("should throw error if color format is invalid", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      color: "red",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label color must be a valid hex color (e.g., #FF0000)");
  });

  test("should throw error if color is missing # prefix", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      color: "ff0000",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label color must be a valid hex color (e.g., #FF0000)");
  });

  test("should throw error if color is too short", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      color: "#ff0",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label color must be a valid hex color (e.g., #FF0000)");
  });

  test("should throw error if color contains invalid characters", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      color: "#gggggg",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label color must be a valid hex color (e.g., #FF0000)");
  });

  test("should accept valid hex colors with lowercase", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      color: "#abcdef",
    };

    const result = await useCase.execute(request);

    expect(result.label.color).toBe("#ABCDEF");
  });

  test("should accept valid hex colors with uppercase", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      color: "#ABCDEF",
    };

    const result = await useCase.execute(request);

    expect(result.label.color).toBe("#ABCDEF");
  });

  test("should log activity after updating label", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      name: "Feature",
      color: "#00ff00",
    };

    await useCase.execute(request);

    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.action).toBe("UPDATE");
    expect(activityCall.entityType).toBe("LABEL");
    expect(activityCall.entityTitle).toBe("Feature");
    expect(activityCall.userId).toBe("user-456");
    expect(activityCall.boardId).toBe(testLabel.boardId);
    expect(activityCall.data).toEqual({
      name: { from: "Bug", to: "Feature" },
      color: { from: "#FF0000", to: "#00FF00" },
    });
  });

  test("should log activity with name change only", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      name: "Feature",
    };

    await useCase.execute(request);

    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.data).toEqual({
      name: { from: "Bug", to: "Feature" },
    });
  });

  test("should log activity with color change only", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      color: "#00ff00",
    };

    await useCase.execute(request);

    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.data).toEqual({
      color: { from: "#FF0000", to: "#00FF00" },
    });
  });

  test("should handle name with 50 characters (boundary)", async () => {
    const name = "a".repeat(50);
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      name,
    };

    const result = await useCase.execute(request);

    expect(result.label.name).toBe(name);
  });

  test("should handle mixed case color with numbers", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      color: "#A1b2C3",
    };

    const result = await useCase.execute(request);

    expect(result.label.color).toBe("#A1B2C3");
  });

  test("should handle case where name is same but color is different", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      name: "Bug", // Same as current
      color: "#00FF00", // Different from current
    };

    const result = await useCase.execute(request);

    expect(result.label.name).toBe("Bug");
    expect(result.label.color).toBe("#00FF00");

    // Should save because color changed
    expect(mockLabelRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);

    // Activity should only show color change
    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.data).toEqual({
      color: { from: "#FF0000", to: "#00FF00" },
    });
  });

  test("should handle case where color is same but name is different", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
      name: "Enhancement", // Different from current
      color: "#FF0000", // Same as current
    };

    const result = await useCase.execute(request);

    expect(result.label.name).toBe("Enhancement");
    expect(result.label.color).toBe("#FF0000");

    // Should save because name changed
    expect(mockLabelRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);

    // Activity should only show name change
    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.data).toEqual({
      name: { from: "Bug", to: "Enhancement" },
    });
  });
});