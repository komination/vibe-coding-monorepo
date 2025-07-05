import { describe, test, expect, beforeEach, mock } from "bun:test";
import { GetListUseCase } from "@/domain/usecases/GetList";
import { ListRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { BoardBuilder, ListBuilder } from "@/test/fixtures/entityFactories";
import { BoardRole } from "@prisma/client";

describe("GetListUseCase", () => {
  let useCase: GetListUseCase;
  let mockListRepository: ListRepository;
  let mockBoardRepository: BoardRepository;

  const testUserId = "user-123";
  const testListId = "list-456";
  const testBoardId = "board-789";

  const testList = ListBuilder.valid()
    .withTitle("Test List")
    .withPosition(1000)
    .inBoard(testBoardId)
    .build();

  const testBoard = BoardBuilder.valid()
    .withTitle("Test Board")
    .withOwner(testUserId)
    .build();

  beforeEach(() => {
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
      isMember: mock(() => Promise.resolve(true)),
      delete: mock(() => Promise.resolve()),
      update: mock(() => Promise.resolve()),
    } as unknown as BoardRepository;

    useCase = new GetListUseCase(mockListRepository, mockBoardRepository);
  });

  test("should get list successfully for board member", async () => {
    const request = {
      listId: testListId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.id).toBe(testList.id);
    expect(result.list.title).toBe("Test List");
    expect(result.list.position).toBe(1000);
    expect(result.list.boardId).toBe(testBoardId);
    expect(mockListRepository.findById).toHaveBeenCalledWith(testListId);
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
  });

  test("should get list successfully for public board", async () => {
    const publicBoard = BoardBuilder.valid()
      .withTitle("Public Board")
      .withOwner("other-user")
      .public()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(publicBoard));
    mockBoardRepository.isMember = mock(() => Promise.resolve(false)); // Not a member

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.id).toBe(testList.id);
    expect(mockBoardRepository.isMember).not.toHaveBeenCalled(); // Should not check membership for public boards
  });

  test("should get list successfully for board owner", async () => {
    const request = {
      listId: testListId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.id).toBe(testList.id);
  });

  test("should get list with all properties", async () => {
    const detailedList = ListBuilder.valid()
      .withTitle("Detailed List")
      .withColor("#FF0000")
      .withPosition(2500)
      .inBoard(testBoardId)
      .build();

    mockListRepository.findById = mock(() => Promise.resolve(detailedList));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.title).toBe("Detailed List");
    expect(result.list.color).toBe("#FF0000");
    expect(result.list.position).toBe(2500);
    expect(result.list.boardId).toBe(testBoardId);
  });

  test("should throw error if list not found", async () => {
    mockListRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("List not found");
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("Board not found");
  });

  test("should throw error if user is not member of private board", async () => {
    const privateBoard = BoardBuilder.valid()
      .withTitle("Private Board")
      .withOwner("other-user")
      .private()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(privateBoard));
    mockBoardRepository.isMember = mock(() => Promise.resolve(false)); // Not a member

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
    expect(mockBoardRepository.isMember).toHaveBeenCalledWith(privateBoard.id, testUserId);
  });

  test("should allow access for board admin", async () => {
    const privateBoard = BoardBuilder.valid()
      .withTitle("Private Board")
      .withOwner("other-user")
      .private()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(privateBoard));
    mockBoardRepository.isMember = mock(() => Promise.resolve(true));

    const request = {
      listId: testListId,
      userId: "admin-user",
    };

    const result = await useCase.execute(request);

    expect(result.list.id).toBe(testList.id);
  });

  test("should allow access for board member", async () => {
    const privateBoard = BoardBuilder.valid()
      .withTitle("Private Board")
      .withOwner("other-user")
      .private()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(privateBoard));
    mockBoardRepository.isMember = mock(() => Promise.resolve(true));

    const request = {
      listId: testListId,
      userId: "member-user",
    };

    const result = await useCase.execute(request);

    expect(result.list.id).toBe(testList.id);
  });

  test("should allow access for board viewer", async () => {
    const privateBoard = BoardBuilder.valid()
      .withTitle("Private Board")
      .withOwner("other-user")
      .private()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(privateBoard));
    mockBoardRepository.isMember = mock(() => Promise.resolve(true));

    const request = {
      listId: testListId,
      userId: "viewer-user",
    };

    const result = await useCase.execute(request);

    expect(result.list.id).toBe(testList.id);
  });

  test("should handle archived board", async () => {
    const archivedBoard = BoardBuilder.valid()
      .withTitle("Archived Board")
      .withOwner(testUserId)
      .archived()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(archivedBoard));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.id).toBe(testList.id);
  });

  test("should work with list from different board scenarios", async () => {
    const differentBoardId = "board-999";
    const listInDifferentBoard = ListBuilder.valid()
      .withTitle("List in Different Board")
      .inBoard(differentBoardId)
      .build();

    const differentBoard = BoardBuilder.valid()
      .withTitle("Different Board")
      .withOwner(testUserId)
      .build();

    mockListRepository.findById = mock(() => Promise.resolve(listInDifferentBoard));
    mockBoardRepository.findById = mock(() => Promise.resolve(differentBoard));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.boardId).toBe(differentBoardId);
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(differentBoardId);
  });

  test("should handle empty list title", async () => {
    const emptyTitleList = ListBuilder.valid()
      .withTitle("")
      .inBoard(testBoardId)
      .build();

    mockListRepository.findById = mock(() => Promise.resolve(emptyTitleList));

    const request = {
      listId: testListId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.title).toBe("");
  });

  test("should not expose internal implementation details", async () => {
    const request = {
      listId: testListId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    // Should only return the list, not board or user details
    expect(result).toHaveProperty("list");
    expect(result).not.toHaveProperty("board");
    expect(result).not.toHaveProperty("user");
  });
});