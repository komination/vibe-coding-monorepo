import { describe, test, expect, beforeEach, mock } from "bun:test";
import { ArchiveCard } from "../../usecases/ArchiveCard";
import { Card } from "@kanban/domain-core";
import { CardRepository } from "@kanban/domain-core";
import { UserRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { ListRepository } from "@kanban/domain-core";
import { ActivityRepository } from "@kanban/domain-core";

import type { BoardRole } from "@kanban/domain-core";
import { UserBuilder, BoardBuilder, ListBuilder, CardBuilder } from "../../test/fixtures/entityFactories";

describe("ArchiveCard", () => {
  let useCase: ArchiveCard;
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
    // Create fresh test card for each test (not archived by default)
    testCard = CardBuilder.valid()
      .withTitle("Test Card")
      .withDescription("Test Description")
      .inList(testListId)
      .createdBy(testUserId)
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

    useCase = new ArchiveCard(
      mockCardRepository,
      mockUserRepository,
      mockBoardRepository,
      mockListRepository,
      mockActivityRepository
    );
  });

  test("should archive card successfully", async () => {
    const result = await useCase.execute(testCardId, testUserId);

    expect(result.isArchived).toBe(true);
    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ARCHIVE",
        userId: testUserId,
        boardId: testBoardId,
        entityType: "CARD",
        entityId: testCard.id,
        entityTitle: testCard.title,
        description: `archived card "${testCard.title}"`,
      })
    );
  });

  test("should allow board owner to archive card", async () => {
    const result = await useCase.execute(testCardId, testUserId);

    expect(result.isArchived).toBe(true);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, testUserId);
  });

  test("should allow board admin to archive card", async () => {
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

    expect(result.isArchived).toBe(true);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, adminUserId);
  });

  test("should allow board member to archive card", async () => {
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

    expect(result.isArchived).toBe(true);
  });

  test("should throw error if card is already archived", async () => {
    const archivedCard = CardBuilder.valid()
      .withTitle("Already Archived Card")
      .inList(testListId)
      .archived()
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(archivedCard));

    expect(useCase.execute(testCardId, testUserId)).rejects.toThrow("Card is already archived");
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

    expect(useCase.execute(testCardId, viewerUserId)).rejects.toThrow("You don't have permission to archive this card");
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

    expect(useCase.execute(testCardId, nonMemberUserId)).rejects.toThrow("You don't have permission to archive this card");
  });

  test("should preserve original card properties when archiving", async () => {
    const cardWithDetails = CardBuilder.valid()
      .withTitle("Detailed Card")
      .withDescription("Important description")
      .withPosition(5000)
      .withDueDate(new Date("2024-12-31"))
      .assignedTo("assignee-123")
      .inList(testListId)
      .createdBy(testUserId)
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(cardWithDetails));

    const result = await useCase.execute(testCardId, testUserId);

    expect(result.isArchived).toBe(true);
    expect(result.title).toBe("Detailed Card");
    expect(result.description).toBe("Important description");
    expect(result.position).toBe(5000);
    expect(result.dueDate).toEqual(new Date("2024-12-31"));
    expect(result.assigneeId).toBe("assignee-123");
  });

  test("should handle card in different list", async () => {
    const differentListId = "list-999";
    const differentList = ListBuilder.valid()
      .withTitle("Different List")
      .inBoard(testBoardId)
      .build();

    const cardInDifferentList = CardBuilder.valid()
      .withTitle("Card in Different List")
      .inList(differentListId)
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(cardInDifferentList));
    mockListRepository.findById = mock(() => Promise.resolve(differentList));

    const result = await useCase.execute(testCardId, testUserId);

    expect(result.isArchived).toBe(true);
    expect(result.listId).toBe(differentListId);
  });

  test("should work with card created by different user", async () => {
    const cardByDifferentUser = CardBuilder.valid()
      .withTitle("Card by Another User")
      .inList(testListId)
      .createdBy("creator-999")
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(cardByDifferentUser));

    const result = await useCase.execute(testCardId, testUserId);

    expect(result.isArchived).toBe(true);
    expect(result.creatorId).toBe("creator-999");
  });
});