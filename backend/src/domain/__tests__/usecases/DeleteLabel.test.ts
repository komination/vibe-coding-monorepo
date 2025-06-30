import { describe, test, expect, beforeEach, mock } from "bun:test";
import { DeleteLabelUseCase } from "@/domain/usecases/DeleteLabel";
import { LabelRepository } from "@/domain/repositories/LabelRepository";
import { BoardRepository } from "@/domain/repositories/BoardRepository";
import { ActivityRepository } from "@/domain/repositories/ActivityRepository";
import { Board, BoardRole } from "@/domain/entities/Board";
import { Label } from "@/domain/entities/Label";

describe("DeleteLabelUseCase", () => {
  let useCase: DeleteLabelUseCase;
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

    useCase = new DeleteLabelUseCase(
      mockLabelRepository,
      mockBoardRepository,
      mockActivityRepository
    );
  });

  test("should delete label successfully", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);

    // Verify repository calls
    expect(mockLabelRepository.findById).toHaveBeenCalledWith(testLabel.id);
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testLabel.boardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testLabel.boardId, "user-456");
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
    expect(mockLabelRepository.delete).toHaveBeenCalledWith(testLabel.id);
  });

  test("should throw error if label not found", async () => {
    mockLabelRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      labelId: "non-existent-label",
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Label not found");
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    const request = {
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
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should allow OWNER to delete label", async () => {
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
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
    expect(mockLabelRepository.delete).toHaveBeenCalledWith(testLabel.id);
  });

  test("should allow ADMIN to delete label", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("ADMIN" as BoardRole));

    const request = {
      labelId: testLabel.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
    expect(mockLabelRepository.delete).toHaveBeenCalledWith(testLabel.id);
  });

  test("should deny MEMBER to delete label", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER" as BoardRole));

    const request = {
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should deny VIEWER to delete label", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("VIEWER" as BoardRole));

    const request = {
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should log activity before deleting label", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
    };

    await useCase.execute(request);

    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
    
    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.action).toBe("DELETE");
    expect(activityCall.entityType).toBe("LABEL");
    expect(activityCall.entityId).toBe(testLabel.id);
    expect(activityCall.entityTitle).toBe("Bug");
    expect(activityCall.userId).toBe("user-456");
    expect(activityCall.boardId).toBe(testLabel.boardId);
    expect(activityCall.data).toEqual({
      labelName: "Bug",
      labelColor: "#FF0000",
    });
  });

  test("should delete label after logging activity", async () => {
    const request = {
      labelId: testLabel.id,
      userId: "user-456",
    };

    await useCase.execute(request);

    // Verify that activity is logged before deletion
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
    expect(mockLabelRepository.delete).toHaveBeenCalledTimes(1);
    expect(mockLabelRepository.delete).toHaveBeenCalledWith(testLabel.id);
  });

  test("should handle label with special characters in name", async () => {
    const specialLabel = Label.create({
      name: "Bug & Feature",
      color: "#FF0000",
      boardId: "board-123",
    });
    mockLabelRepository.findById = mock(() => Promise.resolve(specialLabel));

    const request = {
      labelId: specialLabel.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
    
    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.entityTitle).toBe("Bug & Feature");
    expect(activityCall.data.labelName).toBe("Bug & Feature");
  });

  test("should handle label with unicode characters in name", async () => {
    const unicodeLabel = Label.create({
      name: "🐛 バグ",
      color: "#FF0000",
      boardId: "board-123",
    });
    mockLabelRepository.findById = mock(() => Promise.resolve(unicodeLabel));

    const request = {
      labelId: unicodeLabel.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
    
    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.entityTitle).toBe("🐛 バグ");
    expect(activityCall.data.labelName).toBe("🐛 バグ");
  });

  test("should handle label with maximum length name", async () => {
    const longName = "a".repeat(50);
    const longLabel = Label.create({
      name: longName,
      color: "#FF0000",
      boardId: "board-123",
    });
    mockLabelRepository.findById = mock(() => Promise.resolve(longLabel));

    const request = {
      labelId: longLabel.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
    
    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.entityTitle).toBe(longName);
    expect(activityCall.data.labelName).toBe(longName);
  });

  test("should handle different color formats", async () => {
    const colorLabel = Label.create({
      name: "Feature",
      color: "#ABCDEF",
      boardId: "board-123",
    });
    mockLabelRepository.findById = mock(() => Promise.resolve(colorLabel));

    const request = {
      labelId: colorLabel.id,
      userId: "user-456",
    };

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
    
    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.data.labelColor).toBe("#ABCDEF");
  });

  test("should handle repository errors gracefully", async () => {
    mockLabelRepository.delete = mock(() => Promise.reject(new Error("Database error")));

    const request = {
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Database error");
  });

  test("should handle activity logging errors gracefully", async () => {
    mockActivityRepository.save = mock(() => Promise.reject(new Error("Activity logging failed")));

    const request = {
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Activity logging failed");
  });

  test("should handle case where getMemberRole returns null", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const request = {
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should handle case where user is not a member of the board", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const request = {
      labelId: testLabel.id,
      userId: "user-456",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });
});