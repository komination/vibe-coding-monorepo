import { describe, test, expect, beforeEach, mock } from "bun:test";
import { ReorderListsUseCase } from "@/domain/usecases/ReorderLists";
import { ListRepository } from "@/domain/repositories/ListRepository";
import { BoardRepository } from "@/domain/repositories/BoardRepository";
import { ActivityRepository } from "@/domain/repositories/ActivityRepository";
import { UserBuilder, BoardBuilder, ListBuilder } from "@/test/fixtures/entityFactories";
import { BoardRole } from "@prisma/client";

describe("ReorderListsUseCase", () => {
  let useCase: ReorderListsUseCase;
  let mockListRepository: ListRepository;
  let mockBoardRepository: BoardRepository;
  let mockActivityRepository: ActivityRepository;

  const testUserId = "user-123";
  const testBoardId = "board-456";
  const testList1Id = "list-1";
  const testList2Id = "list-2";
  const testList3Id = "list-3";

  const testBoard = BoardBuilder.valid()
    .withTitle("Test Board")
    .withOwner(testUserId)
    .build();

  beforeEach(() => {
    // Create mock repositories
    mockListRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(null)),
      findByBoard: mock(() => Promise.resolve([])),
      delete: mock(() => Promise.resolve()),
      update: mock(() => Promise.resolve()),
      existsInBoard: mock(() => Promise.resolve(true)),
      reorderLists: mock(() => Promise.resolve()),
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

    useCase = new ReorderListsUseCase(
      mockListRepository,
      mockBoardRepository,
      mockActivityRepository
    );
  });

  test("should reorder lists successfully", async () => {
    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
        { id: testList2Id, position: 2000 },
        { id: testList3Id, position: 3000 },
      ],
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.reorderLists).toHaveBeenCalledWith(testBoardId, request.listPositions);
    expect(mockActivityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "MOVE",
        entityType: "LIST",
        entityId: testBoardId,
        entityTitle: "Lists reordered",
        userId: testUserId,
        boardId: testBoardId,
        data: { listCount: 3 },
      })
    );
  });

  test("should allow board owner to reorder lists", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(BoardRole.OWNER));

    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
        { id: testList2Id, position: 2000 },
      ],
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.reorderLists).toHaveBeenCalledTimes(1);
  });

  test("should allow board admin to reorder lists", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(BoardRole.ADMIN));

    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
        { id: testList2Id, position: 2000 },
      ],
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.reorderLists).toHaveBeenCalledTimes(1);
  });

  test("should allow board member to reorder lists", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(BoardRole.MEMBER));

    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
        { id: testList2Id, position: 2000 },
      ],
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.reorderLists).toHaveBeenCalledTimes(1);
  });

  test("should handle empty list positions", async () => {
    const request = {
      boardId: testBoardId,
      listPositions: [],
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.reorderLists).toHaveBeenCalledWith(testBoardId, []);
    expect(mockActivityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { listCount: 0 },
      })
    );
  });

  test("should handle single list reorder", async () => {
    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
      ],
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.reorderLists).toHaveBeenCalledWith(testBoardId, request.listPositions);
    expect(mockActivityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { listCount: 1 },
      })
    );
  });

  test("should handle various position values", async () => {
    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 0 },
        { id: testList2Id, position: 100.5 },
        { id: testList3Id, position: 999999 },
      ],
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.reorderLists).toHaveBeenCalledWith(testBoardId, request.listPositions);
  });

  test("should handle negative positions", async () => {
    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: -100 },
        { id: testList2Id, position: 0 },
        { id: testList3Id, position: 100 },
      ],
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.reorderLists).toHaveBeenCalledTimes(1);
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
      ],
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("Board not found");
    expect(mockListRepository.reorderLists).not.toHaveBeenCalled();
  });

  test("should throw error if user is not board member", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
      ],
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("User does not have permission to reorder lists in this board");
    expect(mockListRepository.reorderLists).not.toHaveBeenCalled();
  });

  test("should throw error if user is only viewer", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(BoardRole.VIEWER));

    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
      ],
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("User does not have permission to reorder lists in this board");
    expect(mockListRepository.reorderLists).not.toHaveBeenCalled();
  });

  test("should throw error if list does not belong to board", async () => {
    mockListRepository.existsInBoard = mock((listId: string) => {
      if (listId === testList1Id) return Promise.resolve(true);
      return Promise.resolve(false); // testList2Id doesn't belong to board
    });

    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
        { id: testList2Id, position: 2000 },
      ],
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow(`List ${testList2Id} does not belong to board ${testBoardId}`);
    expect(mockListRepository.reorderLists).not.toHaveBeenCalled();
  });

  test("should throw error for duplicate positions", async () => {
    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
        { id: testList2Id, position: 1000 }, // Duplicate position
        { id: testList3Id, position: 2000 },
      ],
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("Duplicate positions are not allowed");
    expect(mockListRepository.reorderLists).not.toHaveBeenCalled();
  });

  test("should throw error for multiple duplicate positions", async () => {
    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
        { id: testList2Id, position: 2000 },
        { id: testList3Id, position: 2000 }, // Duplicate
        { id: "list-4", position: 2000 }, // Another duplicate
      ],
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("Duplicate positions are not allowed");
    expect(mockListRepository.reorderLists).not.toHaveBeenCalled();
  });

  test("should verify all lists belong to board before reordering", async () => {
    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
        { id: testList2Id, position: 2000 },
        { id: testList3Id, position: 3000 },
      ],
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.existsInBoard).toHaveBeenCalledWith(testList1Id, testBoardId);
    expect(mockListRepository.existsInBoard).toHaveBeenCalledWith(testList2Id, testBoardId);
    expect(mockListRepository.existsInBoard).toHaveBeenCalledWith(testList3Id, testBoardId);
    expect(mockListRepository.existsInBoard).toHaveBeenCalledTimes(3);
  });

  test("should verify repository call sequence", async () => {
    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
        { id: testList2Id, position: 2000 },
      ],
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, testUserId);
    expect(mockListRepository.existsInBoard).toHaveBeenCalledTimes(2);
    expect(mockListRepository.reorderLists).toHaveBeenCalledWith(testBoardId, request.listPositions);
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should not reorder if list validation fails", async () => {
    mockListRepository.existsInBoard = mock(() => Promise.reject(new Error("Database error")));

    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
      ],
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("Database error");
    expect(mockListRepository.reorderLists).not.toHaveBeenCalled();
    expect(mockActivityRepository.save).not.toHaveBeenCalled();
  });

  test("should not log activity if reordering fails", async () => {
    mockListRepository.reorderLists = mock(() => Promise.reject(new Error("Reorder failed")));

    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
      ],
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("Reorder failed");
    expect(mockActivityRepository.save).not.toHaveBeenCalled();
  });

  test("should handle out-of-order position validation correctly", async () => {
    // Positions don't need to be sorted in input, but duplicates should still be caught
    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 3000 },
        { id: testList2Id, position: 1000 },
        { id: testList3Id, position: 2000 },
      ],
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.reorderLists).toHaveBeenCalledWith(testBoardId, request.listPositions);
  });

  test("should create activity with correct structure", async () => {
    const request = {
      boardId: testBoardId,
      listPositions: [
        { id: testList1Id, position: 1000 },
        { id: testList2Id, position: 2000 },
      ],
      userId: testUserId,
    };

    await useCase.execute(request);

    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.action).toBe("MOVE");
    expect(activityCall.entityType).toBe("LIST");
    expect(activityCall.entityId).toBe(testBoardId);
    expect(activityCall.entityTitle).toBe("Lists reordered");
    expect(activityCall.userId).toBe(testUserId);
    expect(activityCall.boardId).toBe(testBoardId);
    expect(activityCall.data).toEqual({ listCount: 2 });
    expect(activityCall.id).toBeDefined();
    expect(activityCall.createdAt).toBeDefined();
  });

  test("should handle large number of lists", async () => {
    const manyListPositions = Array.from({ length: 100 }, (_, i) => ({
      id: `list-${i}`,
      position: i * 1000,
    }));

    const request = {
      boardId: testBoardId,
      listPositions: manyListPositions,
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.existsInBoard).toHaveBeenCalledTimes(100);
    expect(mockListRepository.reorderLists).toHaveBeenCalledWith(testBoardId, manyListPositions);
    expect(mockActivityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { listCount: 100 },
      })
    );
  });

  test("should handle various position scenarios", async () => {
    const testCases = [
      {
        name: "sequential positions",
        positions: [
          { id: testList1Id, position: 1 },
          { id: testList2Id, position: 2 },
          { id: testList3Id, position: 3 },
        ],
        shouldSucceed: true,
      },
      {
        name: "non-sequential positions",
        positions: [
          { id: testList1Id, position: 100 },
          { id: testList2Id, position: 500 },
          { id: testList3Id, position: 999 },
        ],
        shouldSucceed: true,
      },
      {
        name: "duplicate positions",
        positions: [
          { id: testList1Id, position: 100 },
          { id: testList2Id, position: 100 },
          { id: testList3Id, position: 200 },
        ],
        shouldSucceed: false,
      },
      {
        name: "floating point positions",
        positions: [
          { id: testList1Id, position: 100.5 },
          { id: testList2Id, position: 200.75 },
          { id: testList3Id, position: 300.25 },
        ],
        shouldSucceed: true,
      },
    ];

    for (const testCase of testCases) {
      // Reset mocks for each test case
      mockListRepository.reorderLists = mock(() => Promise.resolve());
      
      const request = {
        boardId: testBoardId,
        listPositions: testCase.positions,
        userId: testUserId,
      };

      if (testCase.shouldSucceed) {
        await expect(useCase.execute(request)).resolves.toBeUndefined();
        expect(mockListRepository.reorderLists).toHaveBeenCalledWith(testBoardId, testCase.positions);
      } else {
        await expect(useCase.execute(request)).rejects.toThrow("Duplicate positions are not allowed");
        expect(mockListRepository.reorderLists).not.toHaveBeenCalled();
      }
    }
  });
});