import { describe, test, expect, beforeEach, mock } from "bun:test";
import { CreateCardUseCase } from "../../usecases/CreateCard";
import { CardRepository } from "@kanban/domain-core";
import { ListRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { ActivityRepository } from "@kanban/domain-core";
import { Card } from "@kanban/domain-core";
import { List } from "@kanban/domain-core";
import { Activity } from "@kanban/domain-core";


describe("CreateCardUseCase", () => {
  let useCase: CreateCardUseCase;
  let mockCardRepository: CardRepository;
  let mockListRepository: ListRepository;
  let mockBoardRepository: BoardRepository;
  let mockActivityRepository: ActivityRepository;

  beforeEach(() => {
    mockCardRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(null)),
      findByList: mock(() => Promise.resolve([])),
      findByAssignee: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
      getNextPosition: mock(() => Promise.resolve(1000)),
    } as unknown as CardRepository;

    mockListRepository = {
      findById: mock(() => {
        // Create a mock list object directly
        const mockList = {
          id: "list-123",
          boardId: "board-456",
          title: "Test List",
          position: 1000,
          color: "#0079BF",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return Promise.resolve(mockList);
      }),
      save: mock(() => Promise.resolve()),
      findByBoard: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
      getNextPosition: mock(() => Promise.resolve(1000)),
    } as unknown as ListRepository;

    mockBoardRepository = {
      findById: mock(() => Promise.resolve(null)),
      save: mock(() => Promise.resolve()),
      addMember: mock(() => Promise.resolve()),
      removeMember: mock(() => Promise.resolve()),
      getMemberRole: mock(() => Promise.resolve("ADMIN")),
      findByOwner: mock(() => Promise.resolve([])),
      findByMember: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
    } as unknown as BoardRepository;

    mockActivityRepository = {
      save: mock(() => Promise.resolve()),
      findByBoard: mock(() => Promise.resolve([])),
      findByCard: mock(() => Promise.resolve([])),
      findByUser: mock(() => Promise.resolve([])),
    } as unknown as ActivityRepository;

    useCase = new CreateCardUseCase(
      mockCardRepository,
      mockListRepository,
      mockBoardRepository,
      mockActivityRepository
    );
  });

  describe("Successful card creation", () => {
    test("should create a card with required fields only", async () => {
      const request = {
        title: "New Task",
        listId: "list-123",
        creatorId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.card).toBeInstanceOf(Card);
      expect(result.card.title).toBe("New Task");
      expect(result.card.listId).toBe("list-123");
      expect(result.card.creatorId).toBe("user-456");
      expect(result.card.position).toBe(1000);
      expect(result.card.isArchived).toBe(false);
      expect(result.card.assigneeId).toBeUndefined();
      expect(result.card.description).toBeUndefined();
      expect(result.card.dueDate).toBeUndefined();

      expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCardRepository.save).toHaveBeenCalledWith(result.card);
    });

    test("should create a card with all optional fields", async () => {
      const dueDate = new Date("2024-12-31T23:59:59Z");
      const startDate = new Date("2024-01-01T00:00:00Z");
      
      const request = {
        title: "Complex Task",
        description: "This is a detailed task description",
        listId: "list-123",
        creatorId: "user-456",
        assigneeId: "user-789",
        dueDate,
        startDate,
      };

      const result = await useCase.execute(request);

      expect(result.card.title).toBe("Complex Task");
      expect(result.card.description).toBe("This is a detailed task description");
      expect(result.card.assigneeId).toBe("user-789");
      expect(result.card.dueDate).toEqual(dueDate);
      expect(result.card.startDate).toEqual(startDate);
    });

    test("should trim whitespace from title and description", async () => {
      const request = {
        title: "  Trimmed Title  ",
        description: "  Trimmed Description  ",
        listId: "list-123",
        creatorId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.card.title).toBe("Trimmed Title");
      expect(result.card.description).toBe("Trimmed Description");
    });

    test("should get next position from repository", async () => {
      mockCardRepository.getNextPosition = mock(() => Promise.resolve(5000));

      const request = {
        title: "Positioned Card",
        listId: "list-123",
        creatorId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(mockCardRepository.getNextPosition).toHaveBeenCalledWith("list-123");
      expect(result.card.position).toBe(5000);
    });

    test("should create activity log for card creation", async () => {
      const request = {
        title: "Logged Card",
        listId: "list-123",
        creatorId: "user-456",
      };

      await useCase.execute(request);

      expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      expect(activityCall).toBeInstanceOf(Activity);
      expect(activityCall.action).toBe("CREATE");
      expect(activityCall.entityType).toBe("CARD");
      expect(activityCall.entityTitle).toBe("Logged Card");
      expect(activityCall.userId).toBe("user-456");
      expect(activityCall.boardId).toBe("board-456");
    });
  });

  describe("Validation errors", () => {
    test("should throw error if list not found", async () => {
      mockListRepository.findById = mock(() => Promise.resolve(null));

      const request = {
        title: "Test Card",
        listId: "non-existent-list",
        creatorId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("List not found");
      expect(mockCardRepository.save).not.toHaveBeenCalled();
      expect(mockActivityRepository.save).not.toHaveBeenCalled();
    });

    test("should throw error if title is empty", async () => {
      const request = {
        title: "",
        listId: "list-123",
        creatorId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Card title is required");
      expect(mockCardRepository.save).not.toHaveBeenCalled();
    });

    test("should throw error if title is only whitespace", async () => {
      const request = {
        title: "   ",
        listId: "list-123",
        creatorId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Card title is required");
      expect(mockCardRepository.save).not.toHaveBeenCalled();
    });

    test("should throw error if title is too long", async () => {
      const request = {
        title: "a".repeat(256),
        listId: "list-123",
        creatorId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Card title is too long");
      expect(mockCardRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("Permission validation", () => {
    test("should throw error if user has no role in board", async () => {
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

      const request = {
        title: "Unauthorized Card",
        listId: "list-123",
        creatorId: "unauthorized-user",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Access denied");
      expect(mockCardRepository.save).not.toHaveBeenCalled();
    });

    test("should throw error if user is only a viewer", async () => {
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve("VIEWER"));

      const request = {
        title: "Viewer Card",
        listId: "list-123",
        creatorId: "viewer-user",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Access denied");
      expect(mockCardRepository.save).not.toHaveBeenCalled();
    });

    test.each(["MEMBER", "ADMIN", "OWNER"])("should allow card creation for role %s", async (role) => {
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve(role));

      const request = {
        title: `Card by ${role}`,
        listId: "list-123",
        creatorId: "authorized-user",
      };

      const result = await useCase.execute(request);

      expect(result.card).toBeInstanceOf(Card);
      expect(mockCardRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("Repository interactions", () => {
    test("should call repositories in correct order", async () => {
      const request = {
        title: "Ordered Card",
        listId: "list-123",
        creatorId: "user-456",
      };

      await useCase.execute(request);

      // Verify order of calls
      expect(mockListRepository.findById).toHaveBeenCalledWith("list-123");
      expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith("board-456", "user-456");
      expect(mockCardRepository.getNextPosition).toHaveBeenCalledWith("list-123");
      expect(mockCardRepository.save).toHaveBeenCalled();
      expect(mockActivityRepository.save).toHaveBeenCalled();
    });

    test("should pass correct board ID to getMemberRole", async () => {
      const customList = {
        id: "custom-list",
        boardId: "custom-board-999",
        title: "Custom List",
        position: 1000,
        color: "#0079BF",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockListRepository.findById = mock(() => Promise.resolve(customList));

      const request = {
        title: "Custom Board Card",
        listId: "custom-list",
        creatorId: "user-456",
      };

      await useCase.execute(request);

      expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith("custom-board-999", "user-456");
    });

    test("should set correct cardId in activity log", async () => {
      const request = {
        title: "Activity Card",
        listId: "list-123",
        creatorId: "user-456",
      };

      const result = await useCase.execute(request);

      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      expect(activityCall.cardId).toBe(result.card.id);
      expect(activityCall.entityId).toBe(result.card.id);
    });
  });

  describe("Edge cases", () => {
    test("should handle undefined description gracefully", async () => {
      const request = {
        title: "No Description Card",
        description: undefined,
        listId: "list-123",
        creatorId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.card.description).toBeUndefined();
    });

    test("should handle empty description string", async () => {
      const request = {
        title: "Empty Description Card",
        description: "",
        listId: "list-123",
        creatorId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.card.description).toBe("");
    });

    test("should handle special characters in title", async () => {
      const specialTitle = "Card 🎯 <script>alert('xss')</script> & \"quotes\"";
      const request = {
        title: specialTitle,
        listId: "list-123",
        creatorId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.card.title).toBe(specialTitle);
    });

    test("should handle very long description", async () => {
      const longDescription = "a".repeat(10000);
      const request = {
        title: "Long Description Card",
        description: longDescription,
        listId: "list-123",
        creatorId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.card.description).toBe(longDescription);
    });

    test("should handle edge case dates", async () => {
      const farFutureDate = new Date("9999-12-31T23:59:59Z");
      const farPastDate = new Date("1900-01-01T00:00:00Z");

      const request = {
        title: "Edge Date Card",
        listId: "list-123",
        creatorId: "user-456",
        dueDate: farFutureDate,
        startDate: farPastDate,
      };

      const result = await useCase.execute(request);

      expect(result.card.dueDate).toEqual(farFutureDate);
      expect(result.card.startDate).toEqual(farPastDate);
    });
  });

  describe("Error propagation", () => {
    test("should propagate repository save errors", async () => {
      mockCardRepository.save = mock(() => Promise.reject(new Error("Database connection failed")));

      const request = {
        title: "Failing Card",
        listId: "list-123",
        creatorId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Database connection failed");
    });

    test("should propagate activity repository save errors", async () => {
      mockActivityRepository.save = mock(() => Promise.reject(new Error("Activity logging failed")));

      const request = {
        title: "Activity Fail Card",
        listId: "list-123",
        creatorId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Activity logging failed");
    });

    test("should propagate position calculation errors", async () => {
      mockCardRepository.getNextPosition = mock(() => Promise.reject(new Error("Position calculation failed")));

      const request = {
        title: "Position Fail Card",
        listId: "list-123",
        creatorId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Position calculation failed");
    });
  });
});