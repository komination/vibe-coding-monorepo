import { describe, test, expect, beforeEach, mock } from "bun:test";
import { CreateBoardUseCase } from "@/domain/usecases/CreateBoard";
import { BoardRepository } from "@kanban/domain-core";
import { UserRepository } from "@kanban/domain-core";
import { ActivityRepository } from "@kanban/domain-core";
import { createMockUser } from "@/test/fixtures/entityFactories";

describe("CreateBoardUseCase", () => {
  let useCase: CreateBoardUseCase;
  let mockBoardRepository: BoardRepository;
  let mockUserRepository: UserRepository;
  let mockActivityRepository: ActivityRepository;

  beforeEach(() => {
    // Create mock repositories
    mockBoardRepository = {
      save: mock(() => Promise.resolve()),
      addMember: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(null)),
      findByIdWithMembers: mock(() => Promise.resolve(null)),
      findByOwner: mock(() => Promise.resolve([])),
      findByMember: mock(() => Promise.resolve([])),
      delete: mock(() => Promise.resolve()),
      update: mock(() => Promise.resolve()),
    } as unknown as BoardRepository;

    mockUserRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(createMockUser({ isActive: true }))),
      findByEmail: mock(() => Promise.resolve(null)),
      findByCognitoId: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve()),
    } as unknown as UserRepository;

    mockActivityRepository = {
      save: mock(() => Promise.resolve()),
      findByBoard: mock(() => Promise.resolve([])),
      findByUser: mock(() => Promise.resolve([])),
      findByEntityId: mock(() => Promise.resolve([])),
    } as unknown as ActivityRepository;

    useCase = new CreateBoardUseCase(
      mockBoardRepository,
      mockUserRepository,
      mockActivityRepository
    );
  });

  test("should create a board successfully", async () => {
    const ownerId = "user-123";
    const request = {
      title: "My Test Board",
      description: "A board for testing",
      ownerId,
    };

    const result = await useCase.execute(request);

    expect(result.board).toBeDefined();
    expect(result.board.title).toBe("My Test Board");
    expect(result.board.description).toBe("A board for testing");
    expect(result.board.ownerId).toBe(ownerId);
    expect(result.board.isPublic).toBe(false);
    expect(result.board.isArchived).toBe(false);

    // Verify repository calls
    expect(mockUserRepository.findById).toHaveBeenCalledWith(ownerId);
    expect(mockBoardRepository.save).toHaveBeenCalledTimes(1);
    expect(mockBoardRepository.addMember).toHaveBeenCalledWith(
      expect.any(String),
      ownerId,
      "OWNER"
    );
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should trim whitespace from title and description", async () => {
    const request = {
      title: "  My Board  ",
      description: "  Test Description  ",
      ownerId: "user-123",
    };

    const result = await useCase.execute(request);

    expect(result.board.title).toBe("My Board");
    expect(result.board.description).toBe("Test Description");
  });

  test("should throw error if owner not found", async () => {
    mockUserRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      title: "Test Board",
      ownerId: "non-existent-user",
    };

    expect(useCase.execute(request)).rejects.toThrow("Owner not found");
  });

  test("should throw error if owner account is inactive", async () => {
    mockUserRepository.findById = mock(() =>
      Promise.resolve(createMockUser({ isActive: false }))
    );

    const request = {
      title: "Test Board",
      ownerId: "inactive-user",
    };

    expect(useCase.execute(request)).rejects.toThrow("Owner account is inactive");
  });

  test("should throw error if title is empty", async () => {
    const request = {
      title: "   ",
      ownerId: "user-123",
    };

    expect(useCase.execute(request)).rejects.toThrow("Board title is required");
  });

  test("should throw error if title is too long", async () => {
    const request = {
      title: "a".repeat(256),
      ownerId: "user-123",
    };

    expect(useCase.execute(request)).rejects.toThrow("Board title is too long");
  });

  test("should create public board when specified", async () => {
    const request = {
      title: "Public Board",
      isPublic: true,
      ownerId: "user-123",
    };

    const result = await useCase.execute(request);

    expect(result.board.isPublic).toBe(true);
  });

  test("should set background URL when provided", async () => {
    const backgroundUrl = "https://example.com/background.jpg";
    const request = {
      title: "Board with Background",
      backgroundUrl,
      ownerId: "user-123",
    };

    const result = await useCase.execute(request);

    expect(result.board.backgroundUrl).toBe(backgroundUrl);
  });

  test("should log activity after creating board", async () => {
    const request = {
      title: "Test Board",
      ownerId: "user-123",
    };

    await useCase.execute(request);

    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.action).toBe("CREATE");
    expect(activityCall.entityType).toBe("BOARD");
    expect(activityCall.entityTitle).toBe("Test Board");
    expect(activityCall.userId).toBe("user-123");
  });
});