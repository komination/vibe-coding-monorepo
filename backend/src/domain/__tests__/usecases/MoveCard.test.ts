import { describe, test, expect, beforeEach, mock } from "bun:test";
import { MoveCard } from "@/domain/usecases/MoveCard";
import { Card } from "@/domain/entities/Card";
import { CardRepository } from "@/domain/repositories/CardRepository";
import { UserRepository } from "@/domain/repositories/UserRepository";
import { BoardRepository } from "@/domain/repositories/BoardRepository";
import { ListRepository } from "@/domain/repositories/ListRepository";
import { ActivityRepository } from "@/domain/repositories/ActivityRepository";
import { UserBuilder, BoardBuilder, ListBuilder, CardBuilder } from "@/test/fixtures/entityFactories";
import { BoardRole } from "@prisma/client";

describe("MoveCard", () => {
  let useCase: MoveCard;
  let mockCardRepository: CardRepository;
  let mockUserRepository: UserRepository;
  let mockBoardRepository: BoardRepository;
  let mockListRepository: ListRepository;
  let mockActivityRepository: ActivityRepository;

  const testUserId = "user-123";
  const testCardId = "card-456";
  const testSourceListId = "list-source";
  const testTargetListId = "list-target";
  const testBoardId = "board-012";

  const testUser = UserBuilder.valid()
    .withEmail("test@example.com")
    .withName("Test User")
    .active()
    .build();

  let testCard: Card;

  const testSourceList = ListBuilder.valid()
    .withTitle("Source List")
    .withPosition(1000)
    .inBoard(testBoardId)
    .build();

  const testTargetList = ListBuilder.valid()
    .withTitle("Target List")
    .withPosition(2000)
    .inBoard(testBoardId)
    .build();

  const testBoard = BoardBuilder.valid()
    .withTitle("Test Board")
    .withOwner(testUserId)
    .build();

  beforeEach(() => {
    // Create fresh test card for each test
    testCard = CardBuilder.valid()
      .withTitle("Card to Move")
      .withDescription("This card will be moved")
      .withPosition(1000)
      .inList(testSourceListId)
      .createdBy(testUserId)
      .build();

    // Create mock repositories
    mockCardRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock((id: string) => {
        if (id === testCardId) {
          return Promise.resolve(testCard);
        }
        return Promise.resolve(null);
      }),
      findByList: mock(() => Promise.resolve([])),
      delete: mock(() => Promise.resolve()),
      update: mock(() => Promise.resolve()),
    } as unknown as CardRepository;

    mockUserRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(testUser)),
      findByEmail: mock(() => Promise.resolve(null)),
      findByCognitoId: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve()),
    } as unknown as UserRepository;

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

    mockListRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock((id: string) => {
        if (id === testSourceListId) return Promise.resolve(testSourceList);
        if (id === testTargetListId) return Promise.resolve(testTargetList);
        return Promise.resolve(null);
      }),
      findByBoard: mock(() => Promise.resolve([])),
      delete: mock(() => Promise.resolve()),
      update: mock(() => Promise.resolve()),
    } as unknown as ListRepository;

    mockActivityRepository = {
      save: mock(() => Promise.resolve()),
      create: mock(() => Promise.resolve()),
      findByBoard: mock(() => Promise.resolve([])),
      findByUser: mock(() => Promise.resolve([])),
      findByEntityId: mock(() => Promise.resolve([])),
    } as unknown as ActivityRepository;

    useCase = new MoveCard(
      mockCardRepository,
      mockUserRepository,
      mockBoardRepository,
      mockListRepository,
      mockActivityRepository
    );
  });

  test("should move card to different list successfully", async () => {
    const targetPosition = 2000;

    const result = await useCase.execute(testCardId, testUserId, testTargetListId, targetPosition);

    expect(result).toBeDefined();
    expect(result.listId).toBe(testTargetListId);
    expect(result.position).toBe(targetPosition);
    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "MOVE",
        userId: testUserId,
        boardId: testBoardId,
        entityType: "CARD",
        entityId: testCard.id,  // Use actual card ID
        entityTitle: "Card to Move",
        description: "moved card from Source List to Target List",
      })
    );
  });

  test("should move card within same list successfully", async () => {
    const targetPosition = 500;

    const result = await useCase.execute(testCardId, testUserId, testSourceListId, targetPosition);

    expect(result).toBeDefined();
    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "MOVE",
        description: "moved card within Source List",
      })
    );
  });

  test("should allow board owner to move card", async () => {
    const targetPosition = 2000;

    const result = await useCase.execute(testCardId, testUserId, testTargetListId, targetPosition);

    expect(result).toBeDefined();
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, testUserId);
  });

  test("should allow board admin to move card", async () => {
    const adminUserId = "user-admin";
    const adminUser = UserBuilder.valid()
      .withEmail("admin@example.com")
      .withName("Admin User")
      .build();

    const nonOwnerBoard = BoardBuilder.valid()
      .withTitle("Non-Owner Board")
      .withOwner("different-owner")
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(adminUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(BoardRole.ADMIN));

    const targetPosition = 2000;
    const result = await useCase.execute(testCardId, adminUserId, testTargetListId, targetPosition);

    expect(result).toBeDefined();
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: adminUserId,
      })
    );
  });

  test("should allow board member to move card", async () => {
    const memberUserId = "user-member";
    const memberUser = UserBuilder.valid()
      .withEmail("member@example.com")
      .withName("Member User")
      .build();

    const nonOwnerBoard = BoardBuilder.valid()
      .withTitle("Non-Owner Board")
      .withOwner("different-owner")
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(memberUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(BoardRole.MEMBER));

    const targetPosition = 2000;
    const result = await useCase.execute(testCardId, memberUserId, testTargetListId, targetPosition);

    expect(result).toBeDefined();
  });

  test("should throw error if user not found", async () => {
    mockUserRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testCardId, testUserId, testTargetListId, 2000)).rejects.toThrow("User not found");
    expect(mockCardRepository.save).not.toHaveBeenCalled();
  });

  test("should throw error if card not found", async () => {
    mockCardRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testCardId, testUserId, testTargetListId, 2000)).rejects.toThrow("Card not found");
    expect(mockCardRepository.save).not.toHaveBeenCalled();
  });

  test("should throw error if source list not found", async () => {
    mockListRepository.findById = mock((id: string) => {
      if (id === testTargetListId) return Promise.resolve(testTargetList);
      return Promise.resolve(null); // Source list not found
    });

    await expect(useCase.execute(testCardId, testUserId, testTargetListId, 2000)).rejects.toThrow("Source list not found");
    expect(mockCardRepository.save).not.toHaveBeenCalled();
  });

  test("should throw error if target list not found", async () => {
    mockListRepository.findById = mock((id: string) => {
      if (id === testSourceListId) return Promise.resolve(testSourceList);
      return Promise.resolve(null); // Target list not found
    });

    await expect(useCase.execute(testCardId, testUserId, testTargetListId, 2000)).rejects.toThrow("Target list not found");
    expect(mockCardRepository.save).not.toHaveBeenCalled();
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testCardId, testUserId, testTargetListId, 2000)).rejects.toThrow("Board not found");
    expect(mockCardRepository.save).not.toHaveBeenCalled();
  });

  test("should throw error when moving card between different boards", async () => {
    const differentBoardId = "board-different";
    const differentTargetList = ListBuilder.valid()
      .withTitle("Different Board List")
      .inBoard(differentBoardId)
      .build();

    mockListRepository.findById = mock((id: string) => {
      if (id === testSourceListId) return Promise.resolve(testSourceList);
      if (id === testTargetListId) return Promise.resolve(differentTargetList);
      return Promise.resolve(null);
    });

    await expect(useCase.execute(testCardId, testUserId, testTargetListId, 2000)).rejects.toThrow("Cannot move card between different boards");
    expect(mockCardRepository.save).not.toHaveBeenCalled();
  });

  test("should throw error if user is not board member", async () => {
    const nonMemberUserId = "user-nonmember";
    const nonMemberUser = UserBuilder.valid()
      .withEmail("nonmember@example.com")
      .withName("Non-Member User")
      .build();

    const nonOwnerBoard = BoardBuilder.valid()
      .withTitle("Non-Owner Board")
      .withOwner("different-owner")
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(nonMemberUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null)); // Not a member

    expect(useCase.execute(testCardId, nonMemberUserId, testTargetListId, 2000)).rejects.toThrow("You don't have permission to move this card");
    expect(mockCardRepository.save).not.toHaveBeenCalled();
  });

  test("should throw error if user is only viewer", async () => {
    const viewerUserId = "user-viewer";
    const viewerUser = UserBuilder.valid()
      .withEmail("viewer@example.com")
      .withName("Viewer User")
      .build();

    const nonOwnerBoard = BoardBuilder.valid()
      .withTitle("Non-Owner Board")
      .withOwner("different-owner")
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(viewerUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(BoardRole.VIEWER));

    expect(useCase.execute(testCardId, viewerUserId, testTargetListId, 2000)).rejects.toThrow("You don't have permission to move this card");
    expect(mockCardRepository.save).not.toHaveBeenCalled();
  });

  test("should handle position at beginning of list", async () => {
    const firstPosition = 0;

    const result = await useCase.execute(testCardId, testUserId, testTargetListId, firstPosition);

    expect(result).toBeDefined();
    expect(mockCardRepository.save).toHaveBeenCalled();
  });

  test("should handle very large position value", async () => {
    const largePosition = 999999;

    const result = await useCase.execute(testCardId, testUserId, testTargetListId, largePosition);

    expect(result).toBeDefined();
    expect(mockCardRepository.save).toHaveBeenCalled();
  });

  test("should handle negative position value", async () => {
    const negativePosition = -100;

    const result = await useCase.execute(testCardId, testUserId, testTargetListId, negativePosition);

    expect(result).toBeDefined();
    expect(mockCardRepository.save).toHaveBeenCalled();
  });

  test("should verify all repository lookups are called for cross-list move", async () => {
    const targetPosition = 2000;

    await useCase.execute(testCardId, testUserId, testTargetListId, targetPosition);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserId);
    expect(mockCardRepository.findById).toHaveBeenCalledWith(testCardId);
    expect(mockListRepository.findById).toHaveBeenCalledWith(testSourceListId);
    expect(mockListRepository.findById).toHaveBeenCalledWith(testTargetListId);
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, testUserId);
  });

  test("should throw error if card retrieval fails after update", async () => {
    mockCardRepository.findById = mock(() => Promise.resolve(testCard))
      .mockImplementationOnce(() => Promise.resolve(testCard)) // First call succeeds
      .mockImplementationOnce(() => Promise.resolve(null)); // Second call (after save) fails

    expect(useCase.execute(testCardId, testUserId, testTargetListId, 2000)).rejects.toThrow("Failed to retrieve updated card");
  });

  test("should preserve card metadata during move", async () => {
    const cardWithMetadata = CardBuilder.valid()
      .withTitle("Complex Card")
      .withDescription("Card with lots of metadata")
      .withDueDate(new Date("2024-12-31"))
      .assignedTo("user-assigned")
      .inList(testSourceListId)
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(cardWithMetadata));

    const result = await useCase.execute(testCardId, testUserId, testTargetListId, 2000);

    expect(result).toBeDefined();
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        entityTitle: "Complex Card",
      })
    );
  });

  test("should generate correct activity description for complex list names", async () => {
    const sourceListWithSpecialChars = ListBuilder.valid()
      .withTitle("Source List (Special & Characters)")
      .inBoard(testBoardId)
      .build();

    const targetListWithSpecialChars = ListBuilder.valid()
      .withTitle("Target List [With Brackets]")
      .inBoard(testBoardId)
      .build();

    mockListRepository.findById = mock((id: string) => {
      if (id === testSourceListId) return Promise.resolve(sourceListWithSpecialChars);
      if (id === testTargetListId) return Promise.resolve(targetListWithSpecialChars);
      return Promise.resolve(null);
    });

    await useCase.execute(testCardId, testUserId, testTargetListId, 2000);

    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "moved card from Source List (Special & Characters) to Target List [With Brackets]",
      })
    );
  });
});