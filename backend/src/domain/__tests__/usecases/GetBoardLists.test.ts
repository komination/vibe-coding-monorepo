import { describe, test, expect, beforeEach, mock } from "bun:test";
import { GetBoardListsUseCase } from "@/domain/usecases/GetBoardLists";
import { ListRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { BoardBuilder, ListBuilder } from "@/test/fixtures/entityFactories";

describe("GetBoardListsUseCase", () => {
  let useCase: GetBoardListsUseCase;
  let mockListRepository: ListRepository;
  let mockBoardRepository: BoardRepository;

  const testUserId = "user-123";
  const testBoardId = "board-456";
  const testBoard = BoardBuilder.valid()
    .withTitle("Test Board")
    .withOwner(testUserId)
    .build();

  const testLists = [
    ListBuilder.valid()
      .withTitle("To Do")
      .withPosition(1000)
      .inBoard(testBoardId)
      .build(),
    ListBuilder.valid()
      .withTitle("In Progress")
      .withPosition(2000)
      .inBoard(testBoardId)
      .build(),
    ListBuilder.valid()
      .withTitle("Done")
      .withPosition(3000)
      .inBoard(testBoardId)
      .build(),
  ];

  beforeEach(() => {
    // Create mock repositories
    mockListRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(null)),
      findByBoard: mock(() => Promise.resolve(testLists)),
      delete: mock(() => Promise.resolve()),
      updatePosition: mock(() => Promise.resolve()),
    } as unknown as ListRepository;

    mockBoardRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(testBoard)),
      findByIdWithMembers: mock(() => Promise.resolve(null)),
      findByOwner: mock(() => Promise.resolve([])),
      findByMember: mock(() => Promise.resolve([])),
      addMember: mock(() => Promise.resolve()),
      getMemberRole: mock(() => Promise.resolve("MEMBER")),
      isMember: mock(() => Promise.resolve(true)),
      delete: mock(() => Promise.resolve()),
      update: mock(() => Promise.resolve()),
    } as unknown as BoardRepository;

    useCase = new GetBoardListsUseCase(
      mockListRepository,
      mockBoardRepository
    );
  });

  test("should get board lists successfully for board member", async () => {
    const request = {
      boardId: testBoardId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.lists).toBeDefined();
    expect(result.lists).toHaveLength(3);
    expect(result.lists[0].title).toBe("To Do");
    expect(result.lists[1].title).toBe("In Progress");
    expect(result.lists[2].title).toBe("Done");

    // Verify repository calls
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.isMember).toHaveBeenCalledWith(testBoardId, testUserId);
    expect(mockListRepository.findByBoard).toHaveBeenCalledWith(testBoardId, {
      orderBy: undefined,
      order: undefined,
    });
  });

  test("should get board lists for public board without membership check", async () => {
    const publicBoard = BoardBuilder.valid()
      .withTitle("Public Board")
      .public()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(publicBoard));

    const request = {
      boardId: testBoardId,
      userId: "non-member-user",
    };

    const result = await useCase.execute(request);

    expect(result.lists).toBeDefined();
    expect(result.lists).toHaveLength(3);

    // Verify that membership check was not called for public board
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.isMember).not.toHaveBeenCalled();
    expect(mockListRepository.findByBoard).toHaveBeenCalledWith(testBoardId, {
      orderBy: undefined,
      order: undefined,
    });
  });

  test("should get lists ordered by position ascending", async () => {
    const request = {
      boardId: testBoardId,
      userId: testUserId,
      orderBy: "position" as const,
      order: "asc" as const,
    };

    const result = await useCase.execute(request);

    expect(result.lists).toBeDefined();
    expect(mockListRepository.findByBoard).toHaveBeenCalledWith(testBoardId, {
      orderBy: "position",
      order: "asc",
    });
  });

  test("should get lists ordered by title descending", async () => {
    const request = {
      boardId: testBoardId,
      userId: testUserId,
      orderBy: "title" as const,
      order: "desc" as const,
    };

    const result = await useCase.execute(request);

    expect(result.lists).toBeDefined();
    expect(mockListRepository.findByBoard).toHaveBeenCalledWith(testBoardId, {
      orderBy: "title",
      order: "desc",
    });
  });

  test("should get lists ordered by creation date", async () => {
    const request = {
      boardId: testBoardId,
      userId: testUserId,
      orderBy: "createdAt" as const,
      order: "asc" as const,
    };

    const result = await useCase.execute(request);

    expect(result.lists).toBeDefined();
    expect(mockListRepository.findByBoard).toHaveBeenCalledWith(testBoardId, {
      orderBy: "createdAt",
      order: "asc",
    });
  });

  test("should return empty array when board has no lists", async () => {
    mockListRepository.findByBoard = mock(() => Promise.resolve([]));

    const request = {
      boardId: testBoardId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.lists).toBeDefined();
    expect(result.lists).toHaveLength(0);
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      boardId: "non-existent-board",
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("Board not found");

    // Verify that list repository was not called
    expect(mockListRepository.findByBoard).not.toHaveBeenCalled();
  });

  test("should throw error if user is not member of private board", async () => {
    const privateBoard = BoardBuilder.valid()
      .withTitle("Private Board")
      .private()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(privateBoard));
    mockBoardRepository.isMember = mock(() => Promise.resolve(false));

    const request = {
      boardId: testBoardId,
      userId: "non-member-user",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");

    // Verify repository call sequence
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.isMember).toHaveBeenCalledWith(testBoardId, "non-member-user");
    expect(mockListRepository.findByBoard).not.toHaveBeenCalled();
  });

  test("should verify correct repository call sequence", async () => {
    const request = {
      boardId: testBoardId,
      userId: testUserId,
      orderBy: "position" as const,
    };

    await useCase.execute(request);

    // Verify the order of repository calls
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.isMember).toHaveBeenCalledWith(testBoardId, testUserId);
    expect(mockListRepository.findByBoard).toHaveBeenCalledWith(testBoardId, {
      orderBy: "position",
      order: undefined,
    });
  });

  test("should handle board owner access", async () => {
    const ownerBoard = BoardBuilder.valid()
      .withTitle("Owner Board")
      .withOwner(testUserId)
      .private()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(ownerBoard));
    mockBoardRepository.isMember = mock(() => Promise.resolve(true));

    const request = {
      boardId: testBoardId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.lists).toBeDefined();
    expect(result.lists).toHaveLength(3);
  });

  test("should handle admin member access", async () => {
    const adminBoard = BoardBuilder.valid()
      .withTitle("Admin Board")
      .withOwner("other-user")
      .private()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(adminBoard));
    mockBoardRepository.isMember = mock(() => Promise.resolve(true));

    const request = {
      boardId: testBoardId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.lists).toBeDefined();
    expect(result.lists).toHaveLength(3);
  });

  test("should handle viewer member access", async () => {
    const viewerBoard = BoardBuilder.valid()
      .withTitle("Viewer Board")
      .withOwner("other-user")
      .private()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(viewerBoard));
    mockBoardRepository.isMember = mock(() => Promise.resolve(true));

    const request = {
      boardId: testBoardId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.lists).toBeDefined();
    expect(result.lists).toHaveLength(3);
  });

  test("should pass through all sorting options", async () => {
    const sortingTestCases = [
      { orderBy: "position", order: "asc" },
      { orderBy: "position", order: "desc" },
      { orderBy: "title", order: "asc" },
      { orderBy: "title", order: "desc" },
      { orderBy: "createdAt", order: "asc" },
      { orderBy: "createdAt", order: "desc" },
    ] as const;

    for (const { orderBy, order } of sortingTestCases) {
      const request = {
        boardId: testBoardId,
        userId: testUserId,
        orderBy,
        order,
      };

      await useCase.execute(request);

      expect(mockListRepository.findByBoard).toHaveBeenCalledWith(testBoardId, {
        orderBy,
        order,
      });
    }
  });

  test("should handle lists with same position", async () => {
    const listsWithSamePosition = [
      ListBuilder.valid()
        .withTitle("List A")
        .withPosition(1000)
        .inBoard(testBoardId)
        .build(),
      ListBuilder.valid()
        .withTitle("List B")
        .withPosition(1000)
        .inBoard(testBoardId)
        .build(),
    ];

    mockListRepository.findByBoard = mock(() => Promise.resolve(listsWithSamePosition));

    const request = {
      boardId: testBoardId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.lists).toBeDefined();
    expect(result.lists).toHaveLength(2);
    expect(result.lists[0].position).toBe(1000);
    expect(result.lists[1].position).toBe(1000);
  });

  test("should preserve list properties in response", async () => {
    const detailedList = ListBuilder.valid()
      .withTitle("Detailed List")
      .withColor("#FF5722")
      .withPosition(1500)
      .inBoard(testBoardId)
      .build();

    mockListRepository.findByBoard = mock(() => Promise.resolve([detailedList]));

    const request = {
      boardId: testBoardId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.lists).toHaveLength(1);
    const list = result.lists[0];
    expect(list.title).toBe("Detailed List");
    expect(list.color).toBe("#FF5722");
    expect(list.position).toBe(1500);
    expect(list.boardId).toBe(testBoardId);
  });
});