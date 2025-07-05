import { describe, test, expect, beforeEach, mock } from "bun:test";
import { UpdateCard } from "../../usecases/UpdateCard";
import { Card } from "@kanban/domain-core";
import { CardRepository } from "@kanban/domain-core";
import { UserRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { ListRepository } from "@kanban/domain-core";
import { ActivityRepository } from "@kanban/domain-core";
import type { BoardRole } from "@kanban/domain-core";

import { UserBuilder, BoardBuilder, ListBuilder, CardBuilder, LabelBuilder } from "../../test/fixtures/entityFactories";

describe("UpdateCard", () => {
  let useCase: UpdateCard;
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
    // Create fresh test card for each test
    testCard = CardBuilder.valid()
      .withTitle("Original Title")
      .withDescription("Original Description")
      .withPosition(1000)
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

    useCase = new UpdateCard(
      mockCardRepository,
      mockUserRepository,
      mockBoardRepository,
      mockListRepository,
      mockActivityRepository
    );
  });

  test("should update card title successfully", async () => {
    const updateData = {
      title: "Updated Title",
    };

    const result = await useCase.execute(testCardId, testUserId, updateData);

    expect(result.title).toBe("Updated Title");
    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE",
        userId: testUserId,
        boardId: testBoardId,
        entityType: "CARD",
        entityId: testCard.id,  // Use actual card ID instead of testCardId
        description: expect.stringContaining('changed title from "Original Title" to "Updated Title"'),
      })
    );
  });

  test("should update card description successfully", async () => {
    const updateData = {
      description: "Updated Description",
    };

    const result = await useCase.execute(testCardId, testUserId, updateData);

    expect(result.description).toBe("Updated Description");
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "updated description",
      })
    );
  });

  test("should update card position", async () => {
    const updateData = {
      position: 2000,
    };

    const result = await useCase.execute(testCardId, testUserId, updateData);

    expect(result.position).toBe(2000);
    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should update card due date", async () => {
    const dueDate = new Date("2024-12-31");
    const updateData = {
      dueDate,
    };

    const result = await useCase.execute(testCardId, testUserId, updateData);

    expect(result.dueDate).toEqual(dueDate);
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining("set due date to"),
      })
    );
  });

  test("should remove card due date when set to null", async () => {
    const cardWithDueDate = CardBuilder.valid()
      .withTitle("Card with Due Date")
      .withDueDate(new Date("2024-12-31"))
      .inList(testListId)
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(cardWithDueDate));

    const updateData = {
      dueDate: null,
    };

    const result = await useCase.execute(testCardId, testUserId, updateData);

    expect(result.dueDate).toBeUndefined();
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "removed due date",
      })
    );
  });

  test("should update card start date", async () => {
    const startDate = new Date("2024-01-01");
    const updateData = {
      startDate,
    };

    const result = await useCase.execute(testCardId, testUserId, updateData);

    expect(result.startDate).toEqual(startDate);
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining("set start date to"),
      })
    );
  });

  test("should assign card to user", async () => {
    const assigneeId = "user-789";
    const assignee = UserBuilder.valid()
      .withName("Assignee User")
      .build();

    mockUserRepository.findById = mock((id: string) => {
      if (id === testUserId) return Promise.resolve(testUser);
      if (id === assigneeId) return Promise.resolve(assignee);
      return Promise.resolve(null);
    });

    const updateData = {
      assignedToId: assigneeId,
    };

    const result = await useCase.execute(testCardId, testUserId, updateData);

    expect(result.assigneeId).toBe(assigneeId);
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "assigned to Assignee User",
      })
    );
  });

  test("should unassign card when assignedToId is null", async () => {
    const cardWithAssignee = CardBuilder.valid()
      .withTitle("Assigned Card")
      .assignedTo("user-789")
      .inList(testListId)
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(cardWithAssignee));

    const updateData = {
      assignedToId: null,
    };

    const result = await useCase.execute(testCardId, testUserId, updateData);

    expect(result.assigneeId).toBeUndefined();
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "removed assignee",
      })
    );
  });

  test("should archive card", async () => {
    const updateData = {
      archived: true,
    };

    const result = await useCase.execute(testCardId, testUserId, updateData);

    expect(result.isArchived).toBe(true);
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "archived card",
      })
    );
  });

  test("should unarchive card", async () => {
    const archivedCard = CardBuilder.valid()
      .withTitle("Archived Card")
      .archived()
      .inList(testListId)
      .build();

    mockCardRepository.findById = mock(() => Promise.resolve(archivedCard));

    const updateData = {
      archived: false,
    };

    const result = await useCase.execute(testCardId, testUserId, updateData);

    expect(result.isArchived).toBe(false);
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "unarchived card",
      })
    );
  });

  test("should update multiple properties at once", async () => {
    const updateData = {
      title: "New Title",
      description: "New Description",
      position: 5000,
    };

    const result = await useCase.execute(testCardId, testUserId, updateData);

    expect(result.title).toBe("New Title");
    expect(result.description).toBe("New Description");
    expect(result.position).toBe(5000);
    expect(mockActivityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining('changed title from "Original Title" to "New Title"'),
      })
    );
  });

  test("should not log activity if no changes made", async () => {
    const updateData = {
      title: "Original Title", // Same as current title
    };

    await useCase.execute(testCardId, testUserId, updateData);

    expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.create).not.toHaveBeenCalled();
  });

  test("should throw error if user not found", async () => {
    mockUserRepository.findById = mock(() => Promise.resolve(null));

    const updateData = { title: "New Title" };

    expect(useCase.execute(testCardId, testUserId, updateData)).rejects.toThrow("User not found");
  });

  test("should throw error if card not found", async () => {
    mockCardRepository.findById = mock(() => Promise.resolve(null));

    const updateData = { title: "New Title" };

    expect(useCase.execute(testCardId, testUserId, updateData)).rejects.toThrow("Card not found");
  });

  test("should throw error if list not found", async () => {
    mockListRepository.findById = mock(() => Promise.resolve(null));

    const updateData = { title: "New Title" };

    expect(useCase.execute(testCardId, testUserId, updateData)).rejects.toThrow("List not found");
  });

  test("should throw error if board not found", async () => {
    mockBoardRepository.findById = mock(() => Promise.resolve(null));

    const updateData = { title: "New Title" };

    expect(useCase.execute(testCardId, testUserId, updateData)).rejects.toThrow("Board not found");
  });

  test("should throw error if assignee not found", async () => {
    mockUserRepository.findById = mock((id: string) => {
      if (id === testUserId) return Promise.resolve(testUser);
      return Promise.resolve(null); // Assignee not found
    });

    const updateData = {
      assignedToId: "non-existent-user",
    };

    expect(useCase.execute(testCardId, testUserId, updateData)).rejects.toThrow("Assignee not found");
  });

  test("should throw error if start date is after due date", async () => {
    const updateData = {
      startDate: new Date("2024-12-31"),
      dueDate: new Date("2024-01-01"), // Due date before start date
    };

    expect(useCase.execute(testCardId, testUserId, updateData)).rejects.toThrow("Start date cannot be after due date");
  });

  test("should allow board owner to update card", async () => {
    const updateData = { title: "Owner Updated Title" };

    const result = await useCase.execute(testCardId, testUserId, updateData);

    expect(result.title).toBe("Owner Updated Title");
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, testUserId);
  });

  test("should allow board admin to update card", async () => {
    const nonOwnerUserId = "user-999";
    const nonOwnerUser = UserBuilder.valid()
      .withEmail("admin@example.com")
      .build();

    const nonOwnerBoard = BoardBuilder.valid()
      .withOwner("different-owner")
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(nonOwnerUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve('ADMIN' as BoardRole));

    const updateData = { title: "Admin Updated Title" };

    const result = await useCase.execute(testCardId, nonOwnerUserId, updateData);

    expect(result.title).toBe("Admin Updated Title");
  });

  test("should allow board member to update card", async () => {
    const memberUserId = "user-888";
    const memberUser = UserBuilder.valid()
      .withEmail("member@example.com")
      .build();

    const nonOwnerBoard = BoardBuilder.valid()
      .withOwner("different-owner")
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(memberUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve('MEMBER' as BoardRole));

    const updateData = { title: "Member Updated Title" };

    const result = await useCase.execute(testCardId, memberUserId, updateData);

    expect(result.title).toBe("Member Updated Title");
  });

  test("should throw error if user is not board member", async () => {
    const nonMemberUserId = "user-777";
    const nonMemberUser = UserBuilder.valid()
      .withEmail("nonmember@example.com")
      .build();

    const nonOwnerBoard = BoardBuilder.valid()
      .withOwner("different-owner")
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(nonMemberUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null)); // Not a member

    const updateData = { title: "Should Fail" };

    expect(useCase.execute(testCardId, nonMemberUserId, updateData)).rejects.toThrow("You don't have permission to update this card");
  });

  test("should throw error if user is only viewer", async () => {
    const viewerUserId = "user-666";
    const viewerUser = UserBuilder.valid()
      .withEmail("viewer@example.com")
      .build();

    const nonOwnerBoard = BoardBuilder.valid()
      .withOwner("different-owner")
      .build();

    mockUserRepository.findById = mock(() => Promise.resolve(viewerUser));
    mockBoardRepository.findById = mock(() => Promise.resolve(nonOwnerBoard));
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve('VIEWER' as BoardRole));

    const updateData = { title: "Should Fail" };

    expect(useCase.execute(testCardId, viewerUserId, updateData)).rejects.toThrow("You don't have permission to update this card");
  });
});