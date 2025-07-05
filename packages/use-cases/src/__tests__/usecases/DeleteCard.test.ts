import { describe, test, expect, beforeEach, mock } from "bun:test";
import { DeleteCard } from "../../usecases/DeleteCard";
import { CardRepository } from "@kanban/domain-core";
import { UserRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { ListRepository } from "@kanban/domain-core";
import { ActivityRepository } from "@kanban/domain-core";

import type { BoardRole } from "@kanban/domain-core";
import { UserBuilder, BoardBuilder, ListBuilder, CardBuilder, LabelBuilder } from "../../test/fixtures/entityFactories";

describe("DeleteCard", () => {
  let useCase: DeleteCard;
  let mockCardRepository: CardRepository;
  let mockUserRepository: UserRepository;
  let mockBoardRepository: BoardRepository;
  let mockListRepository: ListRepository;
  let mockActivityRepository: ActivityRepository;

  const testUserId = "user-123";
  const testCardId = "card-456";
  const testListId = "list-789";
  const testBoardId = "board-012";
  const testCreatorId = "user-creator";

  const testUser = UserBuilder.valid()
    .withEmail("test@example.com")
    .withName("Test User")
    .active()
    .build();

  const testCard = CardBuilder.valid()
    .withTitle("Card to Delete")
    .withDescription("This card will be deleted")
    .inList(testListId)
    .createdBy(testCreatorId)
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

    useCase = new DeleteCard(
      mockCardRepository,
      mockUserRepository,
      mockBoardRepository,
      mockListRepository,
      mockActivityRepository
    );
  });

  test("should delete card successfully when user is board owner", async () => {
    await useCase.execute(testCardId, testUserId);

    expect(mockCardRepository.delete).toHaveBeenCalledWith(testCardId);
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "DELETE",
        userId: testUserId,
        boardId: testBoardId,
        entityType: "CARD",
        entityId: testCardId,
        entityTitle: "Card to Delete",
        description: 'deleted card "Card to Delete"',
      })
    );
  });

  test("should delete card successfully when user is board admin", async () => {
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
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve('ADMIN' as BoardRole));

    await useCase.execute(testCardId, adminUserId);

    expect(mockCardRepository.delete).toHaveBeenCalledWith(testCardId);
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "DELETE",
        userId: adminUserId,
      })
    );
  });

  test("should delete card successfully when user is card creator", async () => {
    const creatorUser = UserBuilder.valid()
      .withEmail("creator@example.com")
      .withName("Creator User")
      .build();

    const nonOwnerBoard = BoardBuilder.valid()
      .withTitle("Non-Owner Board")
      .withOwner("different-owner")
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(creatorUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve('MEMBER' as BoardRole));

    await useCase.execute(testCardId, testCreatorId);

    expect(mockCardRepository.delete).toHaveBeenCalledWith(testCardId);
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "DELETE",
        userId: testCreatorId,
      })
    );
  });

  test("should throw error if user not found", async () => {
    mockUserRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testCardId, testUserId)).rejects.toThrow("User not found");
    expect(mockCardRepository.delete).not.toHaveBeenCalled();
  });

  test("should throw error if card not found", async () => {
    mockCardRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testCardId, testUserId)).rejects.toThrow("Card not found");
    expect(mockCardRepository.delete).not.toHaveBeenCalled();
  });

  test("should throw error if list not found", async () => {
    mockListRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testCardId, testUserId)).rejects.toThrow("List not found");
    expect(mockCardRepository.delete).not.toHaveBeenCalled();
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    expect(useCase.execute(testCardId, testUserId)).rejects.toThrow("Board not found");
    expect(mockCardRepository.delete).not.toHaveBeenCalled();
  });

  test("should throw error if user is not board owner, admin, or card creator", async () => {
    const unauthorizedUserId = "user-unauthorized";
    const unauthorizedUser = UserBuilder.valid()
      .withEmail("unauthorized@example.com")
      .withName("Unauthorized User")
      .build();

    const nonOwnerBoard = BoardBuilder.valid()
      .withTitle("Non-Owner Board")
      .withOwner("different-owner")
      .build();

    // Card created by someone else
    const cardByOtherUser = CardBuilder.valid()
      .withTitle("Card by Other User")
      .createdBy("other-creator")
      .inList(testListId)
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(unauthorizedUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve('MEMBER' as BoardRole));
    mockCardRepository.findById = mock(() => Promise.resolve(cardByOtherUser));

    expect(useCase.execute(testCardId, unauthorizedUserId)).rejects.toThrow("You don't have permission to delete this card");
    expect(mockCardRepository.delete).not.toHaveBeenCalled();
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

    // Card created by someone else
    const cardByOtherUser = CardBuilder.valid()
      .withTitle("Card by Other User")
      .createdBy("other-creator")
      .inList(testListId)
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(viewerUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve('VIEWER' as BoardRole));
    mockCardRepository.findById = mock(() => Promise.resolve(cardByOtherUser));

    expect(useCase.execute(testCardId, viewerUserId)).rejects.toThrow("You don't have permission to delete this card");
    expect(mockCardRepository.delete).not.toHaveBeenCalled();
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

    // Card created by someone else
    const cardByOtherUser = CardBuilder.valid()
      .withTitle("Card by Other User")
      .createdBy("other-creator")
      .inList(testListId)
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(nonMemberUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null)); // Not a member
    mockCardRepository.findById = mock(() => Promise.resolve(cardByOtherUser));

    expect(useCase.execute(testCardId, nonMemberUserId)).rejects.toThrow("You don't have permission to delete this card");
    expect(mockCardRepository.delete).not.toHaveBeenCalled();
  });

  test("should verify all repository lookups are called", async () => {
    await useCase.execute(testCardId, testUserId);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserId);
    expect(mockCardRepository.findById).toHaveBeenCalledWith(testCardId);
    expect(mockListRepository.findById).toHaveBeenCalledWith(testListId);
    expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoardId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, testUserId);
  });

  test("should preserve card title in activity log even after deletion", async () => {
    const cardWithLongTitle = CardBuilder.valid()
      .withTitle("This is a very long card title that should be preserved in the activity log")
      .inList(testListId)
      .createdBy(testCreatorId)
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(cardWithLongTitle));

    await useCase.execute(testCardId, testUserId);

    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        entityTitle: "This is a very long card title that should be preserved in the activity log",
        description: 'deleted card "This is a very long card title that should be preserved in the activity log"',
      })
    );
  });

  test("should not create activity log if deletion fails", async () => {
    mockCardRepository.delete = mock(() => Promise.reject(new Error("Database error")));

    expect(useCase.execute(testCardId, testUserId)).rejects.toThrow("Database error");
    expect(mockActivityRepository.create).not.toHaveBeenCalled();
  });
});