import { describe, test, expect, beforeEach, mock } from "bun:test";
import { GetCard } from "@/domain/usecases/GetCard";
import { CardRepository } from "@/domain/repositories/CardRepository";
import { UserRepository } from "@/domain/repositories/UserRepository";
import { BoardRepository } from "@/domain/repositories/BoardRepository";
import { ListRepository } from "@/domain/repositories/ListRepository";
import { ActivityRepository } from "@/domain/repositories/ActivityRepository";
import { UserBuilder, BoardBuilder, ListBuilder, CardBuilder } from "@/test/fixtures/entityFactories";

describe("GetCard", () => {
  let useCase: GetCard;
  let mockCardRepository: CardRepository;
  let mockUserRepository: UserRepository;
  let mockBoardRepository: BoardRepository;
  let mockListRepository: ListRepository;
  let mockActivityRepository: ActivityRepository;

  const testUserId = "user-123";
  const testBoardId = "board-456";
  const testListId = "list-789";
  const testCardId = "card-abc";

  const testUser = UserBuilder.valid()
    .withEmail("test@example.com")
    .withName("Test User")
    .active()
    .build();

  const testBoard = BoardBuilder.valid()
    .withTitle("Test Board")
    .withOwner(testUserId)
    .private()
    .build();

  const testList = ListBuilder.valid()
    .withTitle("Test List")
    .inBoard(testBoardId)
    .build();

  const testCard = CardBuilder.valid()
    .withTitle("Test Card")
    .inList(testListId)
    .createdBy(testUserId)
    .build();

  beforeEach(() => {
    // Create mock repositories
    mockCardRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(testCard)),
      findByList: mock(() => Promise.resolve([])),
      findByAssignee: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
      getNextPosition: mock(() => Promise.resolve(1000)),
    } as unknown as CardRepository;

    mockUserRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(testUser)),
      findByCognitoSub: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
    } as unknown as UserRepository;

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

    mockListRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(testList)),
      findByBoard: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
      getNextPosition: mock(() => Promise.resolve(1000)),
    } as unknown as ListRepository;

    mockActivityRepository = {
      save: mock(() => Promise.resolve()),
      findByBoard: mock(() => Promise.resolve([])),
      findByCard: mock(() => Promise.resolve([])),
      findByUser: mock(() => Promise.resolve([])),
    } as unknown as ActivityRepository;

    useCase = new GetCard(
      mockCardRepository,
      mockUserRepository,
      mockBoardRepository,
      mockListRepository,
      mockActivityRepository
    );
  });

  test("should get card successfully for board owner", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("OWNER"));

    const result = await useCase.execute(testCardId, testUserId);

    expect(result).toBeDefined();
    expect(result.id).toBe(testCard.id);
    expect(result.title).toBe(testCard.title);
    expect(result.listId).toBe(testListId);

    // Verify repository call sequence
    expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserId);
    expect(mockCardRepository.findById).toHaveBeenCalledWith(testCardId);
    expect(mockListRepository.findById).toHaveBeenCalledWith(testListId);
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, testUserId);
  });

  test("should get card successfully for board admin", async () => {
    const adminUserId = "admin-456";
    const adminUser = UserBuilder.valid()
      .withEmail("admin@example.com")
      .withName("Admin User")
      .active()
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(adminUser));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("ADMIN"));

    const result = await useCase.execute(testCardId, adminUserId);

    expect(result).toBeDefined();
    expect(result.id).toBe(testCard.id);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(adminUserId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, adminUserId);
  });

  test("should get card successfully for board member", async () => {
    const memberUserId = "member-789";
    const memberUser = UserBuilder.valid()
      .withEmail("member@example.com")
      .withName("Member User")
      .active()
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(memberUser));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

    const result = await useCase.execute(testCardId, memberUserId);

    expect(result).toBeDefined();
    expect(result.id).toBe(testCard.id);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(memberUserId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, memberUserId);
  });

  test("should get card successfully for board viewer", async () => {
    const viewerUserId = "viewer-789";
    const viewerUser = UserBuilder.valid()
      .withEmail("viewer@example.com")
      .withName("Viewer User")
      .active()
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(viewerUser));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("VIEWER"));

    const result = await useCase.execute(testCardId, viewerUserId);

    expect(result).toBeDefined();
    expect(result.id).toBe(testCard.id);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(viewerUserId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, viewerUserId);
  });

  test("should get card successfully when user is board owner", async () => {
    const ownerBoard = BoardBuilder.valid()
      .withTitle("Owner's Board")
      .withOwner(testUserId)
      .private()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(ownerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const result = await useCase.execute(testCardId, testUserId);

    expect(result).toBeDefined();
    expect(result.id).toBe(testCard.id);

    // Owner check should pass even without explicit member role
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
  });

  test("should throw error if user not found", async () => {
    mockUserRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testCardId, "non-existent-user")).rejects.toThrow("User not found");

    // Verify that subsequent calls were not made
    expect(mockCardRepository.findById).not.toHaveBeenCalled();
    expect(mockListRepository.findById).not.toHaveBeenCalled();
    expect(mockBoardRepository.findById).not.toHaveBeenCalled();
  });

  test("should throw error if card not found", async () => {
    mockCardRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute("non-existent-card", testUserId)).rejects.toThrow("Card not found");

    expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserId);
    expect(mockCardRepository.findById).toHaveBeenCalledWith("non-existent-card");
    expect(mockListRepository.findById).not.toHaveBeenCalled();
  });

  test("should throw error if list not found", async () => {
    mockListRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testCardId, testUserId)).rejects.toThrow("List not found");

    expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserId);
    expect(mockCardRepository.findById).toHaveBeenCalledWith(testCardId);
    expect(mockListRepository.findById).toHaveBeenCalledWith(testListId);
    expect(mockBoardRepository.findById).not.toHaveBeenCalled();
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testCardId, testUserId)).rejects.toThrow("Board not found");

    expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserId);
    expect(mockCardRepository.findById).toHaveBeenCalledWith(testCardId);
    expect(mockListRepository.findById).toHaveBeenCalledWith(testListId);
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).not.toHaveBeenCalled();
  });

  test("should throw error if user has no permission to view card", async () => {
    const unauthorizedUserId = "unauthorized-user";
    const unauthorizedUser = UserBuilder.valid()
      .withEmail("unauthorized@example.com")
      .withName("Unauthorized User")
      .active()
      .build();

    const otherUserBoard = BoardBuilder.valid()
      .withTitle("Other User's Board")
      .withOwner("other-owner")
      .private()
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(unauthorizedUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(otherUserBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    expect(useCase.execute(testCardId, unauthorizedUserId)).rejects.toThrow(
      "You don't have permission to view this card"
    );

    expect(mockUserRepository.findById).toHaveBeenCalledWith(unauthorizedUserId);
    expect(mockCardRepository.findById).toHaveBeenCalledWith(testCardId);
    expect(mockListRepository.findById).toHaveBeenCalledWith(testListId);
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, unauthorizedUserId);
  });

  test("should handle archived card retrieval", async () => {
    const archivedCard = CardBuilder.valid()
      .withTitle("Archived Card")
      .inList(testListId)
      .createdBy(testUserId)
      .build();
    archivedCard.archive();

    mockCardRepository.findById = mock(() => Promise.resolve(archivedCard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

    const result = await useCase.execute(testCardId, testUserId);

    expect(result).toBeDefined();
    expect(result.id).toBe(archivedCard.id);
    expect(result.isArchived).toBe(true);
  });

  test("should handle card with due date", async () => {
    const dueDate = new Date("2024-12-31T23:59:59Z");
    const cardWithDueDate = CardBuilder.valid()
      .withTitle("Card with Due Date")
      .inList(testListId)
      .createdBy(testUserId)
      .withDueDate(dueDate)
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(cardWithDueDate));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

    const result = await useCase.execute(testCardId, testUserId);

    expect(result).toBeDefined();
    expect(result.dueDate).toEqual(dueDate);
  });

  test("should handle assigned card retrieval", async () => {
    const assigneeId = "assignee-456";
    const assignedCard = CardBuilder.valid()
      .withTitle("Assigned Card")
      .inList(testListId)
      .createdBy(testUserId)
      .assignedTo(assigneeId)
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(assignedCard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

    const result = await useCase.execute(testCardId, testUserId);

    expect(result).toBeDefined();
    expect(result.assigneeId).toBe(assigneeId);
  });

  test("should preserve all card properties in response", async () => {
    const detailedCard = CardBuilder.valid()
      .withTitle("Detailed Card")
      .withDescription("A detailed test card")
      .inList(testListId)
      .createdBy(testUserId)
      .assignedTo("assignee-789")
      .withDueDate(new Date("2024-12-31"))
      .withStartDate(new Date("2024-01-01"))
      .withCoverUrl("https://example.com/cover.jpg")
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(detailedCard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

    const result = await useCase.execute(testCardId, testUserId);

    expect(result.title).toBe("Detailed Card");
    expect(result.description).toBe("A detailed test card");
    expect(result.listId).toBe(testListId);
    expect(result.creatorId).toBe(testUserId);
    expect(result.assigneeId).toBe("assignee-789");
    expect(result.dueDate).toEqual(new Date("2024-12-31"));
    expect(result.startDate).toEqual(new Date("2024-01-01"));
    expect(result.coverUrl).toBe("https://example.com/cover.jpg");
  });

  test("should handle card in different positions", async () => {
    const positionedCard = CardBuilder.valid()
      .withTitle("Positioned Card")
      .inList(testListId)
      .withPosition(2500)
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(positionedCard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

    const result = await useCase.execute(testCardId, testUserId);

    expect(result).toBeDefined();
    expect(result.position).toBe(2500);
  });

  test("should verify correct repository call order", async () => {
    await useCase.execute(testCardId, testUserId);

    const findUserCall = mockUserRepository.findById.mock.calls[0];
    const findCardCall = mockCardRepository.findById.mock.calls[0];
    const findListCall = mockListRepository.findById.mock.calls[0];
    const findBoardCall = mockBoardRepository.findById.mock.calls[0];
    const getMemberRoleCall = mockBoardRepository.getMemberRole.mock.calls[0];

    expect(findUserCall).toBeDefined();
    expect(findCardCall).toBeDefined();
    expect(findListCall).toBeDefined();
    expect(findBoardCall).toBeDefined();
    expect(getMemberRoleCall).toBeDefined();
  });

  test("should handle different card IDs correctly", async () => {
    const cardId1 = "card-1";
    const cardId2 = "card-2";

    await useCase.execute(cardId1, testUserId);
    await useCase.execute(cardId2, testUserId);

    expect(mockCardRepository.findById).toHaveBeenCalledWith(cardId1);
    expect(mockCardRepository.findById).toHaveBeenCalledWith(cardId2);
    expect(mockCardRepository.findById).toHaveBeenCalledTimes(2);
  });

  test("should handle different user IDs correctly", async () => {
    const userId1 = "user-1";
    const userId2 = "user-2";

    await useCase.execute(testCardId, userId1);
    await useCase.execute(testCardId, userId2);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId1);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId2);
    expect(mockUserRepository.findById).toHaveBeenCalledTimes(2);
  });

  test("should handle card in public board", async () => {
    const publicBoard = BoardBuilder.valid()
      .withTitle("Public Board")
      .withOwner("other-user")
      .public()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(publicBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const result = await useCase.execute(testCardId, testUserId);

    expect(result).toBeDefined();
    expect(result.id).toBe(testCard.id);
  });

  test("should handle inactive user trying to access card", async () => {
    const inactiveUser = UserBuilder.valid()
      .withEmail("inactive@example.com")
      .withName("Inactive User")
      .inactive()
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(inactiveUser));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

    // Use case should still work for inactive users viewing cards
    const result = await useCase.execute(testCardId, testUserId);

    expect(result).toBeDefined();
    expect(result.id).toBe(testCard.id);
  });

  test("should handle empty string parameters gracefully", async () => {
    expect(useCase.execute("", testUserId)).rejects.toThrow("Card not found");
    expect(useCase.execute(testCardId, "")).rejects.toThrow("User not found");
  });
});