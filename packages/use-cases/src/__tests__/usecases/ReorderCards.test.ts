import { describe, test, expect, beforeEach, mock } from "bun:test";
import { ReorderCards } from "../../usecases/ReorderCards";
import { CardRepository } from "@kanban/domain-core";
import { UserRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { ListRepository } from "@kanban/domain-core";
import { ActivityRepository } from "@kanban/domain-core";

import type { BoardRole } from "@kanban/domain-core";
import { UserBuilder, BoardBuilder, ListBuilder, CardBuilder, LabelBuilder } from "../../test/fixtures/entityFactories";

describe("ReorderCards", () => {
  let useCase: ReorderCards;
  let mockCardRepository: CardRepository;
  let mockUserRepository: UserRepository;
  let mockBoardRepository: BoardRepository;
  let mockListRepository: ListRepository;
  let mockActivityRepository: ActivityRepository;

  const testUserId = "user-123";
  const testCardId = "card-456";
  const testListId = "list-789";
  const testBoardId = "board-012";

  const testUser = UserBuilder.valid()
    .withEmail("test@example.com")
    .withName("Test User")
    .active()
    .build();

  const testCard = CardBuilder.valid()
    .withTitle("Test Card")
    .withPosition(1000)
    .inList(testListId)
    .createdBy(testUserId)
    .build();

  const testList = ListBuilder.valid()
    .withTitle("Test List")
    .inBoard(testBoardId)
    .build();

  const testBoard = BoardBuilder.valid()
    .withTitle("Test Board")
    .withOwner(testUserId)
    .build();

  beforeEach(() => {
    // Create mock repositories
    mockCardRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(testCard)),
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
      getMemberRole: mock(() => Promise.resolve('MEMBER' as BoardRole)),
      delete: mock(() => Promise.resolve()),
      update: mock(() => Promise.resolve()),
    } as unknown as BoardRepository;

    mockListRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(testList)),
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

    useCase = new ReorderCards(
      mockCardRepository,
      mockUserRepository,
      mockBoardRepository,
      mockListRepository,
      mockActivityRepository
    );
  });

  test("should reorder card successfully", async () => {
    const newPosition = 2000;

    await useCase.execute(testListId, testUserId, testCardId, newPosition);

    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "MOVE",
        userId: testUserId,
        boardId: testBoardId,
        entityType: "CARD",
        entityId: testCardId,
        entityTitle: testCard.title,
        description: `reordered cards in ${testList.title}`,
      })
    );
  });

  test("should update card position correctly", async () => {
    const newPosition = 5000;
    let updatedCard = testCard;

    mockCardRepository.save = mock((card) => {
      updatedCard = card;
      return Promise.resolve();
    });

    await useCase.execute(testListId, testUserId, testCardId, newPosition);

    expect(updatedCard.position).toBe(newPosition);
  });

  test("should allow board owner to reorder cards", async () => {
    await useCase.execute(testListId, testUserId, testCardId, 2000);

    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, testUserId);
    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should allow board admin to reorder cards", async () => {
    const adminUserId = "admin-user";
    const adminUser = UserBuilder.valid()
      .withEmail("admin@example.com")
      .build();

    const nonOwnerBoard = BoardBuilder.valid()
      .withOwner("different-owner")
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(adminUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve('ADMIN' as BoardRole));

    await useCase.execute(testListId, adminUserId, testCardId, 2000);

    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should allow board member to reorder cards", async () => {
    const memberUserId = "member-user";
    const memberUser = UserBuilder.valid()
      .withEmail("member@example.com")
      .build();

    const nonOwnerBoard = BoardBuilder.valid()
      .withOwner("different-owner")
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(memberUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve('MEMBER' as BoardRole));

    await useCase.execute(testListId, memberUserId, testCardId, 2000);

    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should handle position zero", async () => {
    let updatedCard = testCard;

    mockCardRepository.save = mock((card) => {
      updatedCard = card;
      return Promise.resolve();
    });

    await useCase.execute(testListId, testUserId, testCardId, 0);

    expect(updatedCard.position).toBe(0);
    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should handle negative position", async () => {
    let updatedCard = testCard;

    mockCardRepository.save = mock((card) => {
      updatedCard = card;
      return Promise.resolve();
    });

    await useCase.execute(testListId, testUserId, testCardId, -1000);

    expect(updatedCard.position).toBe(-1000);
    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should handle decimal position", async () => {
    let updatedCard = testCard;

    mockCardRepository.save = mock((card) => {
      updatedCard = card;
      return Promise.resolve();
    });

    await useCase.execute(testListId, testUserId, testCardId, 1500.5);

    expect(updatedCard.position).toBe(1500.5);
    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should throw error if card does not belong to list", async () => {
    const cardInDifferentList = CardBuilder.valid()
      .withTitle("Card in Different List")
      .inList("different-list-id")
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(cardInDifferentList));

    expect(useCase.execute(testListId, testUserId, testCardId, 2000)).rejects.toThrow("Card does not belong to this list");
  });

  test("should throw error if user not found", async () => {
    mockUserRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testListId, testUserId, testCardId, 2000)).rejects.toThrow("User not found");
  });

  test("should throw error if list not found", async () => {
    mockListRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testListId, testUserId, testCardId, 2000)).rejects.toThrow("List not found");
  });

  test("should throw error if card not found", async () => {
    mockCardRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testListId, testUserId, testCardId, 2000)).rejects.toThrow("Card not found");
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testListId, testUserId, testCardId, 2000)).rejects.toThrow("Board not found");
  });

  test("should throw error if user is only viewer", async () => {
    const viewerUserId = "viewer-user";
    const viewerUser = UserBuilder.valid()
      .withEmail("viewer@example.com")
      .build();

    const nonOwnerBoard = BoardBuilder.valid()
      .withOwner("different-owner")
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(viewerUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve('VIEWER' as BoardRole));

    expect(useCase.execute(testListId, viewerUserId, testCardId, 2000)).rejects.toThrow("You don't have permission to reorder cards");
  });

  test("should throw error if user is not board member", async () => {
    const nonMemberUserId = "non-member";
    const nonMemberUser = UserBuilder.valid()
      .withEmail("nonmember@example.com")
      .build();

    const nonOwnerBoard = BoardBuilder.valid()
      .withOwner("different-owner")
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(nonMemberUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null)); // Not a member

    expect(useCase.execute(testListId, nonMemberUserId, testCardId, 2000)).rejects.toThrow("You don't have permission to reorder cards");
  });

  test("should work with archived cards", async () => {
    const archivedCard = CardBuilder.valid()
      .withTitle("Archived Card")
      .withPosition(1000)
      .inList(testListId)
      .archived()
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(archivedCard));

    await useCase.execute(testListId, testUserId, testCardId, 3000);

    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should preserve card properties when reordering", async () => {
    const detailedCard = CardBuilder.valid()
      .withTitle("Detailed Card")
      .withDescription("Important description")
      .withPosition(1000)
      .withDueDate(new Date("2024-12-31"))
      .assignedTo("assignee-123")
      .inList(testListId)
      .build();

    let savedCard;
    mockCardRepository.findById = mock(() => Promise.resolve(detailedCard));
    mockCardRepository.save = mock((card) => {
      savedCard = card;
      return Promise.resolve();
    });

    await useCase.execute(testListId, testUserId, testCardId, 5000);

    expect(savedCard.position).toBe(5000);
    expect(savedCard.title).toBe("Detailed Card");
    expect(savedCard.description).toBe("Important description");
    expect(savedCard.dueDate).toEqual(new Date("2024-12-31"));
    expect(savedCard.assigneeId).toBe("assignee-123");
  });

  test("should handle multiple cards reorder", async () => {
    // First reorder
    await useCase.execute(testListId, testUserId, testCardId, 500);
    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);

    // Second reorder of same card
    await useCase.execute(testListId, testUserId, testCardId, 1500);
    expect(mockCardRepository.save).toHaveBeenCalledTimes(2);

    // Activity should be logged for both
    expect(mockActivityRepository.create).toHaveBeenCalledTimes(2);
  });
});