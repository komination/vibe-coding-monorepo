import { describe, test, expect, beforeEach, mock } from "bun:test";
import { UpdateListUseCase } from "../../usecases/UpdateList";
import { List } from "@kanban/domain-core";
import { ListRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { ActivityRepository } from "@kanban/domain-core";

import type { BoardRole } from "@kanban/domain-core";
import { UserBuilder, BoardBuilder, ListBuilder, CardBuilder, LabelBuilder } from "../../test/fixtures/entityFactories";

describe("UpdateListUseCase", () => {
  let useCase: UpdateListUseCase;
  let mockListRepository: ListRepository;
  let mockBoardRepository: BoardRepository;
  let mockActivityRepository: ActivityRepository;

  const testUserId = "user-123";
  const testListId = "list-456";
  const testBoardId = "board-789";

  let testList: List;

  const testBoard = BoardBuilder.valid()
    .withTitle("Test Board")
    .withOwner(testUserId)
    .build();

  beforeEach(() => {
    // Create fresh test list for each test
    testList = ListBuilder.valid()
      .withTitle("Original List Title")
      .withColor("#0079BF")
      .withPosition(1000)
      .inBoard(testBoardId)
      .build();

    // Create mock repositories
    mockListRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(testList)),
      findByBoard: mock(() => Promise.resolve([])),
      delete: mock(() => Promise.resolve()),
      update: mock(() => Promise.resolve()),
    } as unknown as ListRepository;

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

    mockActivityRepository = {
      save: mock(() => Promise.resolve()),
      create: mock(() => Promise.resolve()),
      findByBoard: mock(() => Promise.resolve([])),
      findByUser: mock(() => Promise.resolve([])),
      findByEntityId: mock(() => Promise.resolve([])),
    } as unknown as ActivityRepository;

    useCase = new UpdateListUseCase(
      mockListRepository,
      mockBoardRepository,
      mockActivityRepository
    );
  });

  test("should update list title successfully", async () => {
    const request = {
      listId: testListId,
      title: "Updated List Title",
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list).toBeDefined();
    expect(result.list.title).toBe("Updated List Title");
    expect(mockListRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "UPDATE",
        entityType: "LIST",
        entityId: testList.id,  // Use actual list ID
        entityTitle: "Updated List Title",
        userId: testUserId,
        boardId: testBoardId,
      })
    );
  });

  test("should update list color successfully", async () => {
    const request = {
      listId: testListId,
      color: "#FF5722",
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list).toBeDefined();
    expect(result.list.color).toBe("#FF5722");
    expect(mockListRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "UPDATE",
        entityType: "LIST",
        data: expect.objectContaining({
          color: {
            from: "#0079BF",
            to: "#FF5722",
          },
        }),
      })
    );
  });

  test("should update both title and color", async () => {
    const request = {
      listId: testListId,
      title: "New Title",
      color: "#4CAF50",
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.title).toBe("New Title");
    expect(result.list.color).toBe("#4CAF50");
    expect(mockListRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: testList.id,  // Use actual list ID
        data: expect.objectContaining({
          title: {
            from: "Original List Title",
            to: "New Title",
          },
          color: {
            from: "#0079BF",
            to: "#4CAF50",
          },
        }),
      })
    );
  });

  test("should trim whitespace from title", async () => {
    const request = {
      listId: testListId,
      title: "  Trimmed Title  ",
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.title).toBe("Trimmed Title");
    expect(mockActivityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: testList.id,  // Use actual list ID
        entityTitle: "Trimmed Title",
        data: expect.objectContaining({
          title: {
            from: "Original List Title",
            to: "Trimmed Title",
          },
        }),
      })
    );
  });

  test("should not log activity if no changes made", async () => {
    const request = {
      listId: testListId,
      title: "Original List Title", // Same as current title
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list).toBeDefined();
    expect(mockListRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.save).not.toHaveBeenCalled();
  });

  test("should allow board owner to update list", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve('OWNER' as BoardRole));

    const request = {
      listId: testListId,
      title: "Owner Updated Title",
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.title).toBe("Owner Updated Title");
  });

  test("should allow board admin to update list", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve('ADMIN' as BoardRole));

    const request = {
      listId: testListId,
      title: "Admin Updated Title",
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.title).toBe("Admin Updated Title");
  });

  test("should allow board member to update list", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve('MEMBER' as BoardRole));

    const request = {
      listId: testListId,
      title: "Member Updated Title",
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.title).toBe("Member Updated Title");
  });

  test("should throw error if list not found", async () => {
    mockListRepository.findById = mock(() => Promise.resolve(null));

    const request = {
      listId: testListId,
      title: "Updated Title",
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("List not found");
    expect(mockListRepository.save).not.toHaveBeenCalled();
  });

  test("should throw error if user is not board member", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

    const request = {
      listId: testListId,
      title: "Updated Title",
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("User does not have permission to update lists in this board");
    expect(mockListRepository.save).not.toHaveBeenCalled();
  });

  test("should throw error if user is only viewer", async () => {
    mockBoardRepository.getMemberRole = mock(() => Promise.resolve('VIEWER' as BoardRole));

    const request = {
      listId: testListId,
      title: "Updated Title",
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("User does not have permission to update lists in this board");
    expect(mockListRepository.save).not.toHaveBeenCalled();
  });

  test("should throw error if title is empty", async () => {
    const request = {
      listId: testListId,
      title: "",
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("List title cannot be empty");
    expect(mockListRepository.save).not.toHaveBeenCalled();
  });

  test("should throw error if title is only whitespace", async () => {
    const request = {
      listId: testListId,
      title: "   ",
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("List title cannot be empty");
    expect(mockListRepository.save).not.toHaveBeenCalled();
  });

  test("should throw error if title is too long", async () => {
    const longTitle = "a".repeat(256);
    const request = {
      listId: testListId,
      title: longTitle,
      userId: testUserId,
    };

    expect(useCase.execute(request)).rejects.toThrow("List title is too long");
    expect(mockListRepository.save).not.toHaveBeenCalled();
  });

  test("should accept title at maximum length", async () => {
    const maxLengthTitle = "a".repeat(255);
    const request = {
      listId: testListId,
      title: maxLengthTitle,
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.title).toBe(maxLengthTitle);
    expect(mockListRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should update color to empty string", async () => {
    const request = {
      listId: testListId,
      color: "",
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.color).toBe("");
    expect(mockActivityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: testList.id,  // Use actual list ID
        data: expect.objectContaining({
          color: {
            from: "#0079BF",
            to: "",
          },
        }),
      })
    );
  });

  test("should handle hex color codes", async () => {
    const request = {
      listId: testListId,
      color: "#FF5722",
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.color).toBe("#FF5722");
  });

  test("should handle color names", async () => {
    const request = {
      listId: testListId,
      color: "blue",
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.color).toBe("blue");
  });

  test("should verify repository call sequence", async () => {
    const request = {
      listId: testListId,
      title: "Updated Title",
      userId: testUserId,
    };

    await useCase.execute(request);

    expect(mockListRepository.findById).toHaveBeenCalledWith(testListId);
    expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoardId, testUserId);
    expect(mockListRepository.save).toHaveBeenCalledTimes(1);
    expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
  });

  test("should handle undefined title gracefully", async () => {
    const request = {
      listId: testListId,
      color: "#FF5722",
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.title).toBe("Original List Title"); // Should remain unchanged
    expect(result.list.color).toBe("#FF5722");
  });

  test("should handle undefined color gracefully", async () => {
    const request = {
      listId: testListId,
      title: "New Title",
      userId: testUserId,
    };

    const result = await useCase.execute(request);

    expect(result.list.title).toBe("New Title");
    expect(result.list.color).toBe("#0079BF"); // Should remain unchanged
  });

  test("should create activity with correct structure", async () => {
    const request = {
      listId: testListId,
      title: "Activity Test Title",
      color: "#9C27B0",
      userId: testUserId,
    };

    await useCase.execute(request);

    const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
    expect(activityCall.action).toBe("UPDATE");
    expect(activityCall.entityType).toBe("LIST");
    expect(activityCall.entityId).toBe(testList.id);
    expect(activityCall.entityTitle).toBe("Activity Test Title");
    expect(activityCall.userId).toBe(testUserId);
    expect(activityCall.boardId).toBe(testBoardId);
    expect(activityCall.data).toEqual({
      title: {
        from: "Original List Title",
        to: "Activity Test Title",
      },
      color: {
        from: "#0079BF",
        to: "#9C27B0",
      },
    });
  });
});