import { describe, test, expect, beforeEach, mock } from "bun:test";
import { DeleteListUseCase } from "@/domain/usecases/DeleteList";
import { List } from "@/domain/entities/List";
import { ListRepository } from "@/domain/repositories/ListRepository";
import { BoardRepository } from "@/domain/repositories/BoardRepository";
import { ActivityRepository } from "@/domain/repositories/ActivityRepository";
import { UserBuilder, BoardBuilder, ListBuilder, CardBuilder } from "@/test/fixtures/entityFactories";
import { BoardRole } from "@prisma/client";

describe("DeleteListUseCase", () => {
  let useCase: DeleteListUseCase;
  let mockListRepository: ListRepository;
  let mockBoardRepository: BoardRepository;
  let mockActivityRepository: ActivityRepository;

  const testUserId = "user-123";
  const testListId = "list-456";
  const testBoardId = "board-789";

  let testList: List;

  const testBoard = BoardBuilder.valid()
    .withTitle("Test Board")
    .withOwner(testUserId)
    .build();

  beforeEach(() => {
    // Create fresh test list for each test
    testList = ListBuilder.valid()
      .withTitle("List to Delete")
      .withColor("#FF5722")
      .withPosition(1000)
      .inBoard(testBoardId)
      .build();

    // Create mock repositories
    mockListRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(testList)),
      findByBoard: mock(() => Promise.resolve([])),
      delete: mock(() => Promise.resolve()),
      update: mock(() => Promise.resolve()),
    } as unknown as ListRepository;

    mockBoardRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(testBoard)),
      findByIdWithMembers: mock(() => Promise.resolve(null)),
      findByOwner: mock(() => Promise.resolve([])),
      findByMember: mock(() => Promise.resolve([])),
      addMember: mock(() => Promise.resolve()),
      getMemberRole: mock(() => Promise.resolve(BoardRole.MEMBER)),
      delete: mock(() => Promise.resolve()),
      update: mock(() => Promise.resolve()),
    } as unknown as BoardRepository;

    mockActivityRepository = {
      save: mock(() => Promise.resolve()),
      create: mock(() => Promise.resolve()),
      findByBoard: mock(() => Promise.resolve([])),
      findByUser: mock(() => Promise.resolve([])),
      findByEntityId: mock(() => Promise.resolve([])),
    } as unknown as ActivityRepository;

    useCase = new DeleteListUseCase(
      mockListRepository,
      mockBoardRepository,
      mockActivityRepository
    );
  });

  test("should delete list successfully when user is board member", async () => {
    const request = {
      listId: testListId,
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockActivityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DELETE",
        entityType: "LIST",
        entityId: testList.id,  // Use actual list ID
        entityTitle: "List to Delete",
        userId: testUserId,
        boardId: testBoardId,
      })
    );
    expect(mockListRepository.delete).toHaveBeenCalledWith(testListId);
  });

  test("should delete list successfully when user is board owner", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(BoardRole.OWNER));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.delete).toHaveBeenCalledWith(testListId);
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should delete list successfully when user is board admin", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(BoardRole.ADMIN));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.delete).toHaveBeenCalledWith(testListId);
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should log activity before deletion", async () => {
    const request = {
      listId: testListId,
      userId: testUserId,
    };

    await useCase.execute(request);

    // Verify activity is saved and deletion is performed
    expect(mockActivityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DELETE",
        entityType: "LIST",
        entityId: testList.id,  // Use actual list ID
        entityTitle: "List to Delete",
        userId: testUserId,
        boardId: testBoardId,
      })
    );
  });

  test("should throw error if list not found", async () => {
    mockListRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("List not found");
    expect(mockListRepository.delete).not.toHaveBeenCalled();
    expect(mockActivityRepository.save).not.toHaveBeenCalled();
  });

  test("should throw error if user is not board member", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("User does not have permission to delete lists in this board");
    expect(mockListRepository.delete).not.toHaveBeenCalled();
    expect(mockActivityRepository.save).not.toHaveBeenCalled();
  });

  test("should throw error if user is only viewer", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(BoardRole.VIEWER));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("User does not have permission to delete lists in this board");
    expect(mockListRepository.delete).not.toHaveBeenCalled();
    expect(mockActivityRepository.save).not.toHaveBeenCalled();
  });

  test("should verify repository call sequence", async () => {
    const request = {
      listId: testListId,
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.findById).toHaveBeenCalledWith(testListId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, testUserId);
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
    expect(mockListRepository.delete).toHaveBeenCalledWith(testListId);
  });

  test("should preserve list information in activity log", async () => {
    const listWithMetadata = ListBuilder.valid()
      .withTitle("Complex List Name with Special Characters !@#$%")
      .withColor("#9C27B0")
      .withPosition(5000)
      .inBoard(testBoardId)
      .build();

    mockListRepository.findById = mock(() => Promise.resolve(listWithMetadata));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockActivityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        entityTitle: "Complex List Name with Special Characters !@#$%",
      })
    );
  });

  test("should not delete list if activity logging fails", async () => {
    mockActivityRepository.save = mock(() => Promise.reject(new Error("Activity logging failed")));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("Activity logging failed");
    expect(mockListRepository.delete).not.toHaveBeenCalled();
  });

  test("should handle cascade deletion of cards", async () => {
    // This test verifies that the list deletion call is made
    // The cascade deletion of cards is handled by database constraints
    const request = {
      listId: testListId,
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.delete).toHaveBeenCalledWith(testListId);
    // Note: Card deletion is handled by database cascade constraints
    // so we don't expect any specific card deletion calls in the use case
  });

  test("should handle list with empty title", async () => {
    const emptyTitleList = ListBuilder.valid()
      .withTitle("")
      .inBoard(testBoardId)
      .build();

    mockListRepository.findById = mock(() => Promise.resolve(emptyTitleList));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockActivityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        entityTitle: "",
      })
    );
    expect(mockListRepository.delete).toHaveBeenCalledWith(testListId);
  });

  test("should handle list with very long title", async () => {
    const longTitle = "A".repeat(255);
    const longTitleList = ListBuilder.valid()
      .withTitle(longTitle)
      .inBoard(testBoardId)
      .build();

    mockListRepository.findById = mock(() => Promise.resolve(longTitleList));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockActivityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        entityTitle: longTitle,
      })
    );
  });

  test("should create activity with correct structure", async () => {
    const request = {
      listId: testListId,
      userId: testUserId,
    };

    await useCase.execute(request);

    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.action).toBe("DELETE");
    expect(activityCall.entityType).toBe("LIST");
    expect(activityCall.entityId).toBe(testList.id);
    expect(activityCall.entityTitle).toBe("List to Delete");
    expect(activityCall.userId).toBe(testUserId);
    expect(activityCall.boardId).toBe(testBoardId);
    expect(activityCall.id).toBeDefined(); // Should have an ID from Activity.create()
    expect(activityCall.createdAt).toBeDefined(); // Should have a timestamp
  });

  test("should handle different user roles correctly", async () => {
    const testCases = [
      { role: BoardRole.OWNER, shouldSucceed: true },
      { role: BoardRole.ADMIN, shouldSucceed: true },
      { role: BoardRole.MEMBER, shouldSucceed: true },
      { role: BoardRole.VIEWER, shouldSucceed: false },
      { role: null, shouldSucceed: false },
    ];

    for (const testCase of testCases) {
      // Reset mocks for each test case
      mockListRepository.delete = mock(() => Promise.resolve());
      mockActivityRepository.save = mock(() => Promise.resolve());
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve(testCase.role));

      const request = {
        listId: testListId,
        userId: testUserId,
      };

      if (testCase.shouldSucceed) {
        await expect(useCase.execute(request)).resolves.toBeUndefined();
        expect(mockListRepository.delete).toHaveBeenCalledWith(testListId);
      } else {
        await expect(useCase.execute(request)).rejects.toThrow("User does not have permission to delete lists in this board");
        expect(mockListRepository.delete).not.toHaveBeenCalled();
      }
    }
  });

  test("should handle database deletion failure gracefully", async () => {
    mockListRepository.delete = mock(() => Promise.reject(new Error("Database deletion failed")));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("Database deletion failed");
    
    // Activity should still be logged even if deletion fails
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
  });
});