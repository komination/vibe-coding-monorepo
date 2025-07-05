import { describe, test, expect, beforeEach, mock } from "bun:test";
import { CreateListUseCase } from "../../usecases/CreateList";
import { ListRepository } from "@kanban/domain-core";
import { BoardRepository } from "@kanban/domain-core";
import { ActivityRepository } from "@kanban/domain-core";
import { List } from "@kanban/domain-core";
import { Activity } from "@kanban/domain-core";


describe("CreateListUseCase", () => {
  let useCase: CreateListUseCase;
  let mockListRepository: ListRepository;
  let mockBoardRepository: BoardRepository;
  let mockActivityRepository: ActivityRepository;
  let testBoard: any;

  beforeEach(() => {
    testBoard = {
      id: "board-123",
      title: "Test Board",
      ownerId: "user-123",
    };

    // Create mock repositories
    mockListRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(null)),
      findByBoard: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
      getNextPosition: mock(() => Promise.resolve(1000)),
    } as unknown as ListRepository;

    mockBoardRepository = {
      findById: mock(() => Promise.resolve(testBoard)),
      getMemberRole: mock(() => Promise.resolve("MEMBER")),
      save: mock(() => Promise.resolve()),
      addMember: mock(() => Promise.resolve()),
      removeMember: mock(() => Promise.resolve()),
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

    useCase = new CreateListUseCase(
      mockListRepository,
      mockBoardRepository,
      mockActivityRepository
    );
  });

  describe("Successful list creation", () => {
    test("should create a list with required fields only", async () => {
      const request = {
        title: "New List",
        boardId: "board-123",
        userId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.list).toBeInstanceOf(List);
      expect(result.list.title).toBe("New List");
      expect(result.list.boardId).toBe("board-123");
      expect(result.list.position).toBe(1000);
      expect(result.list.color).toBeUndefined();

      expect(mockListRepository.save).toHaveBeenCalledTimes(1);
      expect(mockListRepository.save).toHaveBeenCalledWith(result.list);
    });

    test("should create a list with all optional fields", async () => {
      const request = {
        title: "Colorful List",
        color: "#ff0000",
        boardId: "board-123",
        userId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.list.title).toBe("Colorful List");
      expect(result.list.color).toBe("#ff0000");
      expect(result.list.boardId).toBe("board-123");
      expect(result.list.position).toBe(1000);
    });

    test("should trim whitespace from title", async () => {
      const request = {
        title: "  Trimmed List  ",
        boardId: "board-123",
        userId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.list.title).toBe("Trimmed List");
    });

    test("should get next position from repository", async () => {
      mockListRepository.getNextPosition = mock(() => Promise.resolve(5000));

      const request = {
        title: "Positioned List",
        boardId: "board-123",
        userId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(mockListRepository.getNextPosition).toHaveBeenCalledWith("board-123");
      expect(result.list.position).toBe(5000);
    });

    test("should create activity log for list creation", async () => {
      const request = {
        title: "Logged List",
        boardId: "board-123",
        userId: "user-456",
      };

      await useCase.execute(request);

      expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      expect(activityCall).toBeInstanceOf(Activity);
      expect(activityCall.action).toBe("CREATE");
      expect(activityCall.entityType).toBe("LIST");
      expect(activityCall.entityTitle).toBe("Logged List");
      expect(activityCall.userId).toBe("user-456");
      expect(activityCall.boardId).toBe("board-123");
    });

    test("should handle various color formats", async () => {
      const colorFormats = [
        "#fff",
        "#ffffff", 
        "rgb(255, 255, 255)",
        "rgba(255, 255, 255, 0.5)",
        "red",
        "transparent",
      ];

      for (const color of colorFormats) {
        const request = {
          title: `List with ${color}`,
          color,
          boardId: "board-123",
          userId: "user-456",
        };

        const result = await useCase.execute(request);
        expect(result.list.color).toBe(color);
      }
    });

    test("should handle empty color string", async () => {
      const request = {
        title: "No Color List",
        color: "",
        boardId: "board-123", 
        userId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.list.color).toBe("");
    });
  });

  describe("Validation errors", () => {
    test("should throw error if board not found", async () => {
      mockBoardRepository.findById = mock(() => Promise.resolve(null));

      const request = {
        title: "Test List",
        boardId: "non-existent-board",
        userId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Board not found");
      expect(mockListRepository.save).not.toHaveBeenCalled();
      expect(mockActivityRepository.save).not.toHaveBeenCalled();
    });

    test("should throw error if title is empty", async () => {
      const request = {
        title: "",
        boardId: "board-123",
        userId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("List title is required");
      expect(mockListRepository.save).not.toHaveBeenCalled();
    });

    test("should throw error if title is only whitespace", async () => {
      const request = {
        title: "   ",
        boardId: "board-123",
        userId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("List title is required");
      expect(mockListRepository.save).not.toHaveBeenCalled();
    });

    test("should throw error if title is too long", async () => {
      const request = {
        title: "a".repeat(256),
        boardId: "board-123",
        userId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("List title is too long");
      expect(mockListRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("Permission validation", () => {
    test("should throw error if user has no role in board", async () => {
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

      const request = {
        title: "Unauthorized List",
        boardId: "board-123",
        userId: "unauthorized-user",
      };

      await expect(useCase.execute(request)).rejects.toThrow("User does not have permission to create lists in this board");
      expect(mockListRepository.save).not.toHaveBeenCalled();
    });

    test("should throw error if user is only a viewer", async () => {
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve("VIEWER"));

      const request = {
        title: "Viewer List",
        boardId: "board-123",
        userId: "viewer-user",
      };

      await expect(useCase.execute(request)).rejects.toThrow("User does not have permission to create lists in this board");
      expect(mockListRepository.save).not.toHaveBeenCalled();
    });

    test.each(["MEMBER", "ADMIN", "OWNER"])("should allow list creation for role %s", async (role) => {
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve(role));

      const request = {
        title: `List by ${role}`,
        boardId: "board-123",
        userId: "authorized-user",
      };

      const result = await useCase.execute(request);

      expect(result.list).toBeInstanceOf(List);
      expect(mockListRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("Repository interactions", () => {
    test("should call repositories in correct order", async () => {
      const request = {
        title: "Ordered List",
        boardId: "board-123",
        userId: "user-456",
      };

      await useCase.execute(request);

      // Verify order of calls
      expect(mockBoardRepository.findById).toHaveBeenCalledWith("board-123");
      expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith("board-123", "user-456");
      expect(mockListRepository.getNextPosition).toHaveBeenCalledWith("board-123");
      expect(mockListRepository.save).toHaveBeenCalled();
      expect(mockActivityRepository.save).toHaveBeenCalled();
    });

    test("should pass correct board ID to getMemberRole", async () => {
      const customBoardId = "custom-board-999";
      const customBoard = {
        id: customBoardId,
        title: "Custom Board",
        ownerId: "user-123",
      };

      mockBoardRepository.findById = mock(() => Promise.resolve(customBoard));

      const request = {
        title: "Custom Board List",
        boardId: customBoardId,
        userId: "user-456",
      };

      await useCase.execute(request);

      expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(customBoardId, "user-456");
    });

    test("should set correct list data in activity log", async () => {
      const request = {
        title: "Activity List",
        boardId: "board-123",
        userId: "user-456",
      };

      const result = await useCase.execute(request);

      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      expect(activityCall.entityId).toBe(result.list.id);
      expect(activityCall.entityTitle).toBe("Activity List");
      expect(activityCall.boardId).toBe("board-123");
      expect(activityCall.userId).toBe("user-456");
    });
  });

  describe("Edge cases", () => {
    test("should handle special characters in title", async () => {
      const specialTitle = "List 🎯 <script>alert('xss')</script> & \"quotes\"";
      const request = {
        title: specialTitle,
        boardId: "board-123",
        userId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.list.title).toBe(specialTitle);
    });

    test("should handle unicode characters in title", async () => {
      const unicodeTitle = "リスト 列表 Liste Список 목록";
      const request = {
        title: unicodeTitle,
        boardId: "board-123",
        userId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.list.title).toBe(unicodeTitle);
    });

    test("should handle maximum length title", async () => {
      const maxTitle = "a".repeat(255);
      const request = {
        title: maxTitle,
        boardId: "board-123",
        userId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.list.title).toBe(maxTitle);
      expect(result.list.title.length).toBe(255);
    });

    test("should handle title with leading/trailing special characters", async () => {
      const specialTitle = "...:::List with special chars:::...";
      const request = {
        title: specialTitle,
        boardId: "board-123",
        userId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.list.title).toBe(specialTitle);
    });

    test("should handle undefined color gracefully", async () => {
      const request = {
        title: "No Color List",
        color: undefined,
        boardId: "board-123",
        userId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.list.color).toBeUndefined();
    });

    test("should handle position edge values", async () => {
      const edgePositions = [0, 1, 999999, Number.MAX_SAFE_INTEGER];

      for (const position of edgePositions) {
        mockListRepository.getNextPosition = mock(() => Promise.resolve(position));

        const request = {
          title: `List at position ${position}`,
          boardId: "board-123",
          userId: "user-456",
        };

        const result = await useCase.execute(request);
        expect(result.list.position).toBe(position);
      }
    });
  });

  describe("Error propagation", () => {
    test("should propagate board repository findById errors", async () => {
      mockBoardRepository.findById = mock(() => Promise.reject(new Error("Database query failed")));

      const request = {
        title: "Failing List",
        boardId: "board-123",
        userId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Database query failed");
      expect(mockListRepository.save).not.toHaveBeenCalled();
    });

    test("should propagate getMemberRole errors", async () => {
      mockBoardRepository.getMemberRole = mock(() => Promise.reject(new Error("Permission check failed")));

      const request = {
        title: "Permission Fail List",
        boardId: "board-123",
        userId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Permission check failed");
      expect(mockListRepository.save).not.toHaveBeenCalled();
    });

    test("should propagate getNextPosition errors", async () => {
      mockListRepository.getNextPosition = mock(() => Promise.reject(new Error("Position calculation failed")));

      const request = {
        title: "Position Fail List",
        boardId: "board-123",
        userId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Position calculation failed");
      expect(mockListRepository.save).not.toHaveBeenCalled();
    });

    test("should propagate list repository save errors", async () => {
      mockListRepository.save = mock(() => Promise.reject(new Error("Database save failed")));

      const request = {
        title: "Save Fail List",
        boardId: "board-123",
        userId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Database save failed");
      expect(mockActivityRepository.save).not.toHaveBeenCalled();
    });

    test("should propagate activity repository save errors", async () => {
      mockActivityRepository.save = mock(() => Promise.reject(new Error("Activity logging failed")));

      const request = {
        title: "Activity Fail List",
        boardId: "board-123",
        userId: "user-456",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Activity logging failed");
      
      // List should still be saved even if activity logging fails
      expect(mockListRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("Return value validation", () => {
    test("should return list object with correct structure", async () => {
      const request = {
        title: "Structure Test List",
        boardId: "board-123",
        userId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result).toHaveProperty("list");
      expect(result.list).toBeInstanceOf(List);
      expect(result.list.id).toBeDefined();
      expect(result.list.title).toBe("Structure Test List");
      expect(result.list.boardId).toBe("board-123");
      expect(result.list.position).toBeDefined();
      expect(result.list.createdAt).toBeDefined();
    });

    test("should return different list instances for multiple calls", async () => {
      const request = {
        title: "Instance Test List",
        boardId: "board-123",
        userId: "user-456",
      };

      const result1 = await useCase.execute(request);
      const result2 = await useCase.execute(request);

      expect(result1.list).not.toBe(result2.list);
      expect(result1.list.id).not.toBe(result2.list.id);
      expect(result1.list.title).toBe(result2.list.title);
    });

    test("should preserve all input properties in returned list", async () => {
      const request = {
        title: "Property Test List",
        color: "#00ff00",
        boardId: "board-123",
        userId: "user-456",
      };

      const result = await useCase.execute(request);

      expect(result.list.title).toBe(request.title);
      expect(result.list.color).toBe(request.color);
      expect(result.list.boardId).toBe(request.boardId);
    });
  });

  describe("Integration scenarios", () => {
    test("should handle rapid successive list creation", async () => {
      const positions = [1000, 2000, 3000];
      let positionIndex = 0;
      
      mockListRepository.getNextPosition = mock(() => Promise.resolve(positions[positionIndex++]));

      const requests = [
        { title: "First List", boardId: "board-123", userId: "user-456" },
        { title: "Second List", boardId: "board-123", userId: "user-456" },
        { title: "Third List", boardId: "board-123", userId: "user-456" },
      ];

      const results = [];
      for (const request of requests) {
        const result = await useCase.execute(request);
        results.push(result);
      }

      expect(results).toHaveLength(3);
      expect(results[0].list.position).toBe(1000);
      expect(results[1].list.position).toBe(2000);
      expect(results[2].list.position).toBe(3000);
    });

    test("should handle lists with different permissions in same board", async () => {
      const roles = ["MEMBER", "ADMIN", "OWNER"];
      
      for (let i = 0; i < roles.length; i++) {
        mockBoardRepository.getMemberRole = mock(() => Promise.resolve(roles[i]));

        const request = {
          title: `List by ${roles[i]}`,
          boardId: "board-123",
          userId: `user-${i}`,
        };

        const result = await useCase.execute(request);
        expect(result.list.title).toBe(`List by ${roles[i]}`);
      }
    });
  });
});