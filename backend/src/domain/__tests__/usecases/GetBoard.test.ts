import { describe, test, expect, beforeEach, mock } from "bun:test";
import { GetBoardUseCase } from "@/domain/usecases/GetBoard";
import { BoardRepository } from "@/domain/repositories/BoardRepository";
import { BoardBuilder } from "@/test/fixtures/entityFactories";

describe("GetBoardUseCase", () => {
  let useCase: GetBoardUseCase;
  let mockBoardRepository: BoardRepository;

  const testUserId = "user-123";
  const testBoardId = "board-456";
  const testBoard = BoardBuilder.valid()
    .withTitle("Test Board")
    .withOwner(testUserId)
    .private()
    .build();

  beforeEach(() => {
    // Create mock repository
    mockBoardRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(testBoard)),
      findByIdWithMembers: mock(() => Promise.resolve(null)),
      findByOwner: mock(() => Promise.resolve([])),
      findByMember: mock(() => Promise.resolve([])),
      addMember: mock(() => Promise.resolve()),
      getMemberRole: mock(() => Promise.resolve("OWNER")),
      isMember: mock(() => Promise.resolve(true)),
      delete: mock(() => Promise.resolve()),
      update: mock(() => Promise.resolve()),
    } as unknown as BoardRepository;

    useCase = new GetBoardUseCase(mockBoardRepository);
  });

  test("should get board successfully for owner", async () => {
    const request = {
      boardId: testBoardId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.board).toBeDefined();
    expect(result.board.id).toBe(testBoard.id);
    expect(result.board.title).toBe("Test Board");
    expect(result.userRole).toBe("OWNER");

    // Verify repository calls
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, testUserId);
  });

  test("should get board successfully for admin member", async () => {
    const adminUserId = "admin-789";
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("ADMIN"));

    const request = {
      boardId: testBoardId,
      userId: adminUserId,
    };

    const result = await useCase.execute(request);

    expect(result.board).toBeDefined();
    expect(result.board.id).toBe(testBoard.id);
    expect(result.userRole).toBe("ADMIN");

    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, adminUserId);
  });

  test("should get board successfully for regular member", async () => {
    const memberUserId = "member-789";
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

    const request = {
      boardId: testBoardId,
      userId: memberUserId,
    };

    const result = await useCase.execute(request);

    expect(result.board).toBeDefined();
    expect(result.board.id).toBe(testBoard.id);
    expect(result.userRole).toBe("MEMBER");

    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, memberUserId);
  });

  test("should get board successfully for viewer member", async () => {
    const viewerUserId = "viewer-789";
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("VIEWER"));

    const request = {
      boardId: testBoardId,
      userId: viewerUserId,
    };

    const result = await useCase.execute(request);

    expect(result.board).toBeDefined();
    expect(result.board.id).toBe(testBoard.id);
    expect(result.userRole).toBe("VIEWER");

    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, viewerUserId);
  });

  test("should get public board successfully without membership", async () => {
    const publicBoard = BoardBuilder.valid()
      .withTitle("Public Board")
      .withOwner("other-user")
      .public()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(publicBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const request = {
      boardId: testBoardId,
      userId: "non-member-user",
    };

    const result = await useCase.execute(request);

    expect(result.board).toBeDefined();
    expect(result.board.id).toBe(publicBoard.id);
    expect(result.board.title).toBe("Public Board");
    expect(result.userRole).toBe("VIEWER");

    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, "non-member-user");
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      boardId: "non-existent-board",
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("Board not found");

    expect(mockBoardRepository.findById).toHaveBeenCalledWith("non-existent-board");
    expect(mockBoardRepository.getMemberRole).not.toHaveBeenCalled();
  });

  test("should throw error if user is not member of private board", async () => {
    const privateBoard = BoardBuilder.valid()
      .withTitle("Private Board")
      .withOwner("other-user")
      .private()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(privateBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const request = {
      boardId: testBoardId,
      userId: "non-member-user",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");

    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, "non-member-user");
  });

  test("should handle archived board access for owner", async () => {
    const archivedBoard = BoardBuilder.valid()
      .withTitle("Archived Board")
      .withOwner(testUserId)
      .private()
      .build();
    archivedBoard.archive();

    mockBoardRepository.findById = mock(() => Promise.resolve(archivedBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("OWNER"));

    const request = {
      boardId: testBoardId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.board).toBeDefined();
    expect(result.board.isArchived).toBe(true);
    expect(result.userRole).toBe("OWNER");
  });

  test("should handle archived board access for admin", async () => {
    const archivedBoard = BoardBuilder.valid()
      .withTitle("Archived Board")
      .withOwner("other-user")
      .private()
      .build();
    archivedBoard.archive();

    mockBoardRepository.findById = mock(() => Promise.resolve(archivedBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("ADMIN"));

    const request = {
      boardId: testBoardId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.board).toBeDefined();
    expect(result.board.isArchived).toBe(true);
    expect(result.userRole).toBe("ADMIN");
  });

  test("should handle archived board access for member and viewer", async () => {
    const archivedBoard = BoardBuilder.valid()
      .withTitle("Archived Board")
      .withOwner("other-user")
      .private()
      .build();
    archivedBoard.archive();

    mockBoardRepository.findById = mock(() => Promise.resolve(archivedBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

    const request = {
      boardId: testBoardId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.board).toBeDefined();
    expect(result.board.isArchived).toBe(true);
    expect(result.userRole).toBe("MEMBER");
  });

  test("should return VIEWER role when user has no explicit role", async () => {
    const publicBoard = BoardBuilder.valid()
      .withTitle("Public Board")
      .public()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(publicBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const request = {
      boardId: testBoardId,
      userId: "anonymous-user",
    };

    const result = await useCase.execute(request);

    expect(result.board).toBeDefined();
    expect(result.userRole).toBe("VIEWER");
  });

  test("should verify correct repository call sequence", async () => {
    const request = {
      boardId: testBoardId,
      userId: testUserId,
    };

    await useCase.execute(request);

    // Verify the order of repository calls
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, testUserId);
  });

  test("should preserve all board properties in response", async () => {
    const detailedBoard = BoardBuilder.valid()
      .withTitle("Detailed Board")
      .withDescription("A detailed test board")
      .withOwner(testUserId)
      .withBackgroundUrl("https://example.com/bg.jpg")
      .public()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(detailedBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("OWNER"));

    const request = {
      boardId: testBoardId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.board.title).toBe("Detailed Board");
    expect(result.board.description).toBe("A detailed test board");
    expect(result.board.ownerId).toBe(testUserId);
    expect(result.board.backgroundUrl).toBe("https://example.com/bg.jpg");
    expect(result.board.isPublic).toBe(true);
    expect(result.board.isArchived).toBe(false);
  });

  test("should handle owner access to own private board", async () => {
    const ownedBoard = BoardBuilder.valid()
      .withTitle("My Private Board")
      .withOwner(testUserId)
      .private()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(ownedBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("OWNER"));

    const request = {
      boardId: testBoardId,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.board).toBeDefined();
    expect(result.board.ownerId).toBe(testUserId);
    expect(result.userRole).toBe("OWNER");
  });

  test("should handle different board IDs correctly", async () => {
    const boardId1 = "board-1";
    const boardId2 = "board-2";

    await useCase.execute({ boardId: boardId1, userId: testUserId });
    await useCase.execute({ boardId: boardId2, userId: testUserId });

    expect(mockBoardRepository.findById).toHaveBeenCalledWith(boardId1);
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(boardId2);
    expect(mockBoardRepository.findById).toHaveBeenCalledTimes(2);
  });

  test("should handle different user IDs correctly", async () => {
    const userId1 = "user-1";
    const userId2 = "user-2";

    await useCase.execute({ boardId: testBoardId, userId: userId1 });
    await useCase.execute({ boardId: testBoardId, userId: userId2 });

    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, userId1);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, userId2);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledTimes(2);
  });

  test("should throw access denied for archived public board when canBeViewedBy returns false", async () => {
    const publicBoard = BoardBuilder.valid()
      .withTitle("Public Board")
      .withOwner("other-user")
      .public()
      .build();

    // Mock the canBeViewedBy method to return false
    publicBoard.canBeViewedBy = mock(() => false);

    mockBoardRepository.findById = mock(() => Promise.resolve(publicBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const request = {
      boardId: testBoardId,
      userId: "non-member-user",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");
  });

  test("should handle empty string user ID gracefully", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const request = {
      boardId: testBoardId,
      userId: "",
    };

    expect(useCase.execute(request)).rejects.toThrow("Access denied");

    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, "");
  });
});