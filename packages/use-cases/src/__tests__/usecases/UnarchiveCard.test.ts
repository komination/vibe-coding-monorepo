import { describe, test, expect, beforeEach, mock } from "bun:test";
import { UnarchiveCard } from "../../usecases/UnarchiveCard";
import { Card } from "@kanban/domain-core";
import { CardRepository } from "@kanban/domain-core";
import { UserRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { ListRepository } from "@kanban/domain-core";
import { ActivityRepository } from "@kanban/domain-core";

import type { BoardRole } from "@kanban/domain-core";
import { UserBuilder, BoardBuilder, ListBuilder, CardBuilder, LabelBuilder } from "../../test/fixtures/entityFactories";

describe("UnarchiveCard", () => {
  let useCase: UnarchiveCard;
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

  let testCard: Card;

  const testList = ListBuilder.valid()
    .withTitle("Test List")
    .inBoard(testBoardId)
    .build();

  const testBoard = BoardBuilder.valid()
    .withTitle("Test Board")
    .withOwner(testUserId)
    .build();

  beforeEach(() => {
    // Create fresh archived test card for each test
    testCard = CardBuilder.valid()
      .withTitle("Test Card")
      .withDescription("Test Description")
      .inList(testListId)
      .createdBy(testUserId)
      .archived() // Card is archived by default for unarchive tests
      .build();

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

    useCase = new UnarchiveCard(
      mockCardRepository,
      mockUserRepository,
      mockBoardRepository,
      mockListRepository,
      mockActivityRepository
    );
  });

  test("should unarchive card successfully", async () => {
    const result = await useCase.execute(testCardId, testUserId);

    expect(result.isArchived).toBe(false);
    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UNARCHIVE",
        userId: testUserId,
        boardId: testBoardId,
        entityType: "CARD",
        entityId: testCard.id,
        entityTitle: testCard.title,
        description: `unarchived card "${testCard.title}"`,
      })
    );
  });

  test("should allow board owner to unarchive card", async () => {
    const result = await useCase.execute(testCardId, testUserId);

    expect(result.isArchived).toBe(false);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, testUserId);
  });

  test("should allow board admin to unarchive card", async () => {
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

    const result = await useCase.execute(testCardId, adminUserId);

    expect(result.isArchived).toBe(false);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, adminUserId);
  });

  test("should allow board member to unarchive card", async () => {
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

    const result = await useCase.execute(testCardId, memberUserId);

    expect(result.isArchived).toBe(false);
  });

  test("should throw error if card is not archived", async () => {
    const activeCard = CardBuilder.valid()
      .withTitle("Active Card")
      .inList(testListId)
      .build(); // Not archived

    mockCardRepository.findById = mock(() => Promise.resolve(activeCard));

    expect(useCase.execute(testCardId, testUserId)).rejects.toThrow("Card is not archived");
  });

  test("should throw error if user not found", async () => {
    mockUserRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testCardId, testUserId)).rejects.toThrow("User not found");
  });

  test("should throw error if card not found", async () => {
    mockCardRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testCardId, testUserId)).rejects.toThrow("Card not found");
  });

  test("should throw error if list not found", async () => {
    mockListRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testCardId, testUserId)).rejects.toThrow("List not found");
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testCardId, testUserId)).rejects.toThrow("Board not found");
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

    expect(useCase.execute(testCardId, viewerUserId)).rejects.toThrow("You don't have permission to unarchive this card");
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

    expect(useCase.execute(testCardId, nonMemberUserId)).rejects.toThrow("You don't have permission to unarchive this card");
  });

  test("should preserve original card properties when unarchiving", async () => {
    const archivedCardWithDetails = CardBuilder.valid()
      .withTitle("Detailed Archived Card")
      .withDescription("Important description")
      .withPosition(5000)
      .withDueDate(new Date("2024-12-31"))
      .assignedTo("assignee-123")
      .inList(testListId)
      .createdBy(testUserId)
      .archived()
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(archivedCardWithDetails));

    const result = await useCase.execute(testCardId, testUserId);

    expect(result.isArchived).toBe(false);
    expect(result.title).toBe("Detailed Archived Card");
    expect(result.description).toBe("Important description");
    expect(result.position).toBe(5000);
    expect(result.dueDate).toEqual(new Date("2024-12-31"));
    expect(result.assigneeId).toBe("assignee-123");
  });

  test("should handle archived card in different list", async () => {
    const differentListId = "list-999";
    const differentList = ListBuilder.valid()
      .withTitle("Different List")
      .inBoard(testBoardId)
      .build();

    const archivedCardInDifferentList = CardBuilder.valid()
      .withTitle("Archived Card in Different List")
      .inList(differentListId)
      .archived()
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(archivedCardInDifferentList));
    mockListRepository.findById = mock(() => Promise.resolve(differentList));

    const result = await useCase.execute(testCardId, testUserId);

    expect(result.isArchived).toBe(false);
    expect(result.listId).toBe(differentListId);
  });

  test("should work with archived card created by different user", async () => {
    const archivedCardByDifferentUser = CardBuilder.valid()
      .withTitle("Archived Card by Another User")
      .inList(testListId)
      .createdBy("creator-999")
      .archived()
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(archivedCardByDifferentUser));

    const result = await useCase.execute(testCardId, testUserId);

    expect(result.isArchived).toBe(false);
    expect(result.creatorId).toBe("creator-999");
  });

  test("should handle multiple unarchive operations correctly", async () => {
    // First execution
    const result1 = await useCase.execute(testCardId, testUserId);
    expect(result1.isArchived).toBe(false);

    // Mock the card as active (not archived) for second call
    const activeCard = CardBuilder.valid()
      .withTitle("Test Card")
      .inList(testListId)
      .build();
    mockCardRepository.findById = mock(() => Promise.resolve(activeCard));

    // Second execution should fail
    expect(useCase.execute(testCardId, testUserId)).rejects.toThrow("Card is not archived");
  });
});