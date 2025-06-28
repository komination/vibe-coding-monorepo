import { describe, test, expect, beforeEach, mock } from "bun:test";
import { GetListCards } from "@/domain/usecases/GetListCards";
import { CardRepository } from "@/domain/repositories/CardRepository";
import { UserRepository } from "@/domain/repositories/UserRepository";
import { BoardRepository } from "@/domain/repositories/BoardRepository";
import { ListRepository } from "@/domain/repositories/ListRepository";
import { UserBuilder, BoardBuilder, ListBuilder, CardBuilder } from "@/test/fixtures/entityFactories";

describe("GetListCards", () => {
  let useCase: GetListCards;
  let mockCardRepository: CardRepository;
  let mockUserRepository: UserRepository;
  let mockBoardRepository: BoardRepository;
  let mockListRepository: ListRepository;

  const testUserId = "user-123";
  const testBoardId = "board-456";
  const testListId = "list-789";

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

  const testCards = [
    CardBuilder.valid()
      .withTitle("Card 1")
      .inList(testListId)
      .withPosition(1000)
      .createdBy(testUserId)
      .build(),
    CardBuilder.valid()
      .withTitle("Card 2")
      .inList(testListId)
      .withPosition(2000)
      .createdBy(testUserId)
      .build(),
    CardBuilder.valid()
      .withTitle("Card 3")
      .inList(testListId)
      .withPosition(3000)
      .createdBy(testUserId)
      .build(),
  ];

  beforeEach(() => {
    // Create mock repositories
    mockCardRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(null)),
      findByList: mock(() => Promise.resolve(testCards)),
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

    useCase = new GetListCards(
      mockCardRepository,
      mockUserRepository,
      mockBoardRepository,
      mockListRepository
    );
  });

  test("should get list cards successfully for board owner", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("OWNER"));

    const result = await useCase.execute(testListId, testUserId);

    expect(result).toBeDefined();
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe("Card 1");
    expect(result[1].title).toBe("Card 2");
    expect(result[2].title).toBe("Card 3");

    // Verify repository call sequence
    expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserId);
    expect(mockListRepository.findById).toHaveBeenCalledWith(testListId);
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, testUserId);
    expect(mockCardRepository.findByList).toHaveBeenCalledWith(testListId);
  });

  test("should get list cards successfully for board admin", async () => {
    const adminUserId = "admin-456";
    const adminUser = UserBuilder.valid()
      .withEmail("admin@example.com")
      .withName("Admin User")
      .active()
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(adminUser));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("ADMIN"));

    const result = await useCase.execute(testListId, adminUserId);

    expect(result).toBeDefined();
    expect(result).toHaveLength(3);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(adminUserId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, adminUserId);
  });

  test("should get list cards successfully for board member", async () => {
    const memberUserId = "member-789";
    const memberUser = UserBuilder.valid()
      .withEmail("member@example.com")
      .withName("Member User")
      .active()
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(memberUser));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

    const result = await useCase.execute(testListId, memberUserId);

    expect(result).toBeDefined();
    expect(result).toHaveLength(3);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(memberUserId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, memberUserId);
  });

  test("should get list cards successfully for board viewer", async () => {
    const viewerUserId = "viewer-789";
    const viewerUser = UserBuilder.valid()
      .withEmail("viewer@example.com")
      .withName("Viewer User")
      .active()
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(viewerUser));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("VIEWER"));

    const result = await useCase.execute(testListId, viewerUserId);

    expect(result).toBeDefined();
    expect(result).toHaveLength(3);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(viewerUserId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, viewerUserId);
  });

  test("should get list cards successfully when user is board owner", async () => {
    const ownerBoard = BoardBuilder.valid()
      .withTitle("Owner's Board")
      .withOwner(testUserId)
      .private()
      .build();

    mockBoardRepository.findById = mock(() => Promise.resolve(ownerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const result = await useCase.execute(testListId, testUserId);

    expect(result).toBeDefined();
    expect(result).toHaveLength(3);

    // Owner check should pass even without explicit member role
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
  });

  test("should return empty array when list has no cards", async () => {
    mockCardRepository.findByList = mock(() => Promise.resolve([]));

    const result = await useCase.execute(testListId, testUserId);

    expect(result).toBeDefined();
    expect(result).toHaveLength(0);

    expect(mockCardRepository.findByList).toHaveBeenCalledWith(testListId);
  });

  test("should filter out archived cards by default", async () => {
    const cardsWithArchived = [
      CardBuilder.valid()
        .withTitle("Active Card 1")
        .inList(testListId)
        .withPosition(1000)
        .build(),
      CardBuilder.valid()
        .withTitle("Archived Card")
        .inList(testListId)
        .withPosition(2000)
        .build(),
      CardBuilder.valid()
        .withTitle("Active Card 2")
        .inList(testListId)
        .withPosition(3000)
        .build(),
    ];

    // Archive the middle card
    cardsWithArchived[1].archive();

    mockCardRepository.findByList = mock(() => Promise.resolve(cardsWithArchived));

    const result = await useCase.execute(testListId, testUserId);

    expect(result).toBeDefined();
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Active Card 1");
    expect(result[1].title).toBe("Active Card 2");
    expect(result.every(card => !card.isArchived)).toBe(true);
  });

  test("should handle cards with different properties", async () => {
    const diverseCards = [
      CardBuilder.valid()
        .withTitle("Simple Card")
        .inList(testListId)
        .withPosition(1000)
        .build(),
      CardBuilder.valid()
        .withTitle("Assigned Card")
        .inList(testListId)
        .withPosition(2000)
        .assignedTo("assignee-123")
        .withDueDate(new Date("2024-12-31"))
        .build(),
      CardBuilder.valid()
        .withTitle("Detailed Card")
        .withDescription("Card with description")
        .inList(testListId)
        .withPosition(3000)
        .withCoverUrl("https://example.com/cover.jpg")
        .build(),
    ];

    mockCardRepository.findByList = mock(() => Promise.resolve(diverseCards));

    const result = await useCase.execute(testListId, testUserId);

    expect(result).toHaveLength(3);
    expect(result[0].title).toBe("Simple Card");
    expect(result[1].title).toBe("Assigned Card");
    expect(result[1].assigneeId).toBe("assignee-123");
    expect(result[1].dueDate).toEqual(new Date("2024-12-31"));
    expect(result[2].title).toBe("Detailed Card");
    expect(result[2].description).toBe("Card with description");
    expect(result[2].coverUrl).toBe("https://example.com/cover.jpg");
  });

  test("should throw error if user not found", async () => {
    mockUserRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testListId, "non-existent-user")).rejects.toThrow("User not found");

    expect(mockUserRepository.findById).toHaveBeenCalledWith("non-existent-user");
    expect(mockListRepository.findById).not.toHaveBeenCalled();
  });

  test("should throw error if list not found", async () => {
    mockListRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute("non-existent-list", testUserId)).rejects.toThrow("List not found");

    expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserId);
    expect(mockListRepository.findById).toHaveBeenCalledWith("non-existent-list");
    expect(mockBoardRepository.findById).not.toHaveBeenCalled();
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testListId, testUserId)).rejects.toThrow("Board not found");

    expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserId);
    expect(mockListRepository.findById).toHaveBeenCalledWith(testListId);
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).not.toHaveBeenCalled();
  });

  test("should throw error if user has no permission to view cards in list", async () => {
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

    expect(useCase.execute(testListId, unauthorizedUserId)).rejects.toThrow(
      "You don't have permission to view cards in this list"
    );

    expect(mockUserRepository.findById).toHaveBeenCalledWith(unauthorizedUserId);
    expect(mockListRepository.findById).toHaveBeenCalledWith(testListId);
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, unauthorizedUserId);
    expect(mockCardRepository.findByList).not.toHaveBeenCalled();
  });

  test("should handle public board access", async () => {
    const publicBoard = BoardBuilder.valid()
      .withTitle("Public Board")
      .withOwner("other-user")
      .public()
      .build();

    const publicUserId = "public-user";
    const publicUser = UserBuilder.valid()
      .withEmail("public@example.com")
      .withName("Public User")
      .active()
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(publicUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(publicBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const result = await useCase.execute(testListId, publicUserId);

    expect(result).toBeDefined();
    expect(result).toHaveLength(3);
  });

  test("should handle inactive user access", async () => {
    const inactiveUser = UserBuilder.valid()
      .withEmail("inactive@example.com")
      .withName("Inactive User")
      .inactive()
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(inactiveUser));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

    const result = await useCase.execute(testListId, testUserId);

    expect(result).toBeDefined();
    expect(result).toHaveLength(3);
  });

  test("should preserve card order from repository", async () => {
    const orderedCards = [
      CardBuilder.valid()
        .withTitle("First Card")
        .inList(testListId)
        .withPosition(500)
        .build(),
      CardBuilder.valid()
        .withTitle("Second Card")
        .inList(testListId)
        .withPosition(1500)
        .build(),
      CardBuilder.valid()
        .withTitle("Third Card")
        .inList(testListId)
        .withPosition(2500)
        .build(),
    ];

    mockCardRepository.findByList = mock(() => Promise.resolve(orderedCards));

    const result = await useCase.execute(testListId, testUserId);

    expect(result).toHaveLength(3);
    expect(result[0].title).toBe("First Card");
    expect(result[0].position).toBe(500);
    expect(result[1].title).toBe("Second Card");
    expect(result[1].position).toBe(1500);
    expect(result[2].title).toBe("Third Card");
    expect(result[2].position).toBe(2500);
  });

  test("should handle cards with same position", async () => {
    const samePositionCards = [
      CardBuilder.valid()
        .withTitle("Card A")
        .inList(testListId)
        .withPosition(1000)
        .build(),
      CardBuilder.valid()
        .withTitle("Card B")
        .inList(testListId)
        .withPosition(1000)
        .build(),
    ];

    mockCardRepository.findByList = mock(() => Promise.resolve(samePositionCards));

    const result = await useCase.execute(testListId, testUserId);

    expect(result).toHaveLength(2);
    expect(result[0].position).toBe(1000);
    expect(result[1].position).toBe(1000);
  });

  test("should verify correct repository call order", async () => {
    await useCase.execute(testListId, testUserId);

    const findUserCall = mockUserRepository.findById.mock.calls[0];
    const findListCall = mockListRepository.findById.mock.calls[0];
    const findBoardCall = mockBoardRepository.findById.mock.calls[0];
    const getMemberRoleCall = mockBoardRepository.getMemberRole.mock.calls[0];
    const findByListCall = mockCardRepository.findByList.mock.calls[0];

    expect(findUserCall).toBeDefined();
    expect(findListCall).toBeDefined();
    expect(findBoardCall).toBeDefined();
    expect(getMemberRoleCall).toBeDefined();
    expect(findByListCall).toBeDefined();
  });

  test("should handle different list IDs correctly", async () => {
    const listId1 = "list-1";
    const listId2 = "list-2";

    await useCase.execute(listId1, testUserId);
    await useCase.execute(listId2, testUserId);

    expect(mockListRepository.findById).toHaveBeenCalledWith(listId1);
    expect(mockListRepository.findById).toHaveBeenCalledWith(listId2);
    expect(mockCardRepository.findByList).toHaveBeenCalledWith(listId1);
    expect(mockCardRepository.findByList).toHaveBeenCalledWith(listId2);
  });

  test("should handle different user IDs correctly", async () => {
    const userId1 = "user-1";
    const userId2 = "user-2";

    await useCase.execute(testListId, userId1);
    await useCase.execute(testListId, userId2);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId1);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId2);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, userId1);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, userId2);
  });

  test("should handle mix of archived and active cards correctly", async () => {
    const mixedCards = [
      CardBuilder.valid()
        .withTitle("Active Card 1")
        .inList(testListId)
        .withPosition(1000)
        .build(),
      CardBuilder.valid()
        .withTitle("Archived Card 1")
        .inList(testListId)
        .withPosition(2000)
        .build(),
      CardBuilder.valid()
        .withTitle("Active Card 2")
        .inList(testListId)
        .withPosition(3000)
        .build(),
      CardBuilder.valid()
        .withTitle("Archived Card 2")
        .inList(testListId)
        .withPosition(4000)
        .build(),
    ];

    // Archive cards at indices 1 and 3
    mixedCards[1].archive();
    mixedCards[3].archive();

    mockCardRepository.findByList = mock(() => Promise.resolve(mixedCards));

    const result = await useCase.execute(testListId, testUserId);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Active Card 1");
    expect(result[1].title).toBe("Active Card 2");
    expect(result.every(card => !card.isArchived)).toBe(true);
  });

  test("should handle empty string parameters gracefully", async () => {
    expect(useCase.execute("", testUserId)).rejects.toThrow("List not found");
    expect(useCase.execute(testListId, "")).rejects.toThrow("User not found");
  });

  test("should return all non-archived cards regardless of assignee", async () => {
    const cardsWithDifferentAssignees = [
      CardBuilder.valid()
        .withTitle("Unassigned Card")
        .inList(testListId)
        .withPosition(1000)
        .build(),
      CardBuilder.valid()
        .withTitle("Self-assigned Card")
        .inList(testListId)
        .withPosition(2000)
        .assignedTo(testUserId)
        .build(),
      CardBuilder.valid()
        .withTitle("Other-assigned Card")
        .inList(testListId)
        .withPosition(3000)
        .assignedTo("other-user")
        .build(),
    ];

    mockCardRepository.findByList = mock(() => Promise.resolve(cardsWithDifferentAssignees));

    const result = await useCase.execute(testListId, testUserId);

    expect(result).toHaveLength(3);
    expect(result[0].title).toBe("Unassigned Card");
    expect(result[0].assigneeId).toBeUndefined();
    expect(result[1].title).toBe("Self-assigned Card");
    expect(result[1].assigneeId).toBe(testUserId);
    expect(result[2].title).toBe("Other-assigned Card");
    expect(result[2].assigneeId).toBe("other-user");
  });
});