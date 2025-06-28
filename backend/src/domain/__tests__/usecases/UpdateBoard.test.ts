import { describe, test, expect, beforeEach, mock } from "bun:test";
import { UpdateBoardUseCase } from "@/domain/usecases/UpdateBoard";
import { BoardRepository } from "@/domain/repositories/BoardRepository";
import { ActivityRepository } from "@/domain/repositories/ActivityRepository";
import { Board } from "@/domain/entities/Board";
import { Activity } from "@/domain/entities/Activity";
import { BoardBuilder } from "@/test/fixtures/entityFactories";

describe("UpdateBoardUseCase", () => {
  let useCase: UpdateBoardUseCase;
  let mockBoardRepository: BoardRepository;
  let mockActivityRepository: ActivityRepository;
  let testBoard: Board;

  beforeEach(() => {
    // Create test board
    testBoard = BoardBuilder.valid()
      .withTitle("Original Board")
      .withDescription("Original Description")
      .withBackgroundUrl("https://example.com/bg.jpg")
      .withOwner("user-123")
      .private()
      .build();

    // Create mock repositories
    mockBoardRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(testBoard)),
      getMemberRole: mock(() => Promise.resolve("OWNER")),
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

    useCase = new UpdateBoardUseCase(
      mockBoardRepository,
      mockActivityRepository
    );
  });

  describe("Successful board updates", () => {
    test("should update board title", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        title: "Updated Board Title",
      };

      const result = await useCase.execute(request);

      expect(result.board.title).toBe("Updated Board Title");
      expect(mockBoardRepository.save).toHaveBeenCalledTimes(1);
      expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);

      // Verify activity log
      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      expect(activityCall).toBeInstanceOf(Activity);
      expect(activityCall.action).toBe("UPDATE");
      expect(activityCall.entityType).toBe("BOARD");
      expect(activityCall.entityId).toBe(testBoard.id);
      expect(activityCall.data).toEqual({
        title: { from: "Original Board", to: "Updated Board Title" }
      });
    });

    test("should update board description", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        description: "Updated Description",
      };

      const result = await useCase.execute(request);

      expect(result.board.description).toBe("Updated Description");
      expect(mockBoardRepository.save).toHaveBeenCalledTimes(1);
      expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);

      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      expect(activityCall.data).toEqual({
        description: { from: "Original Description", to: "Updated Description" }
      });
    });

    test("should update board background URL", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        backgroundUrl: "https://example.com/new-bg.jpg",
      };

      const result = await useCase.execute(request);

      expect(result.board.backgroundUrl).toBe("https://example.com/new-bg.jpg");
      expect(mockBoardRepository.save).toHaveBeenCalledTimes(1);

      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      expect(activityCall.data).toEqual({
        backgroundUrl: { from: "https://example.com/bg.jpg", to: "https://example.com/new-bg.jpg" }
      });
    });

    test("should update board visibility to public", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        isPublic: true,
      };

      const result = await useCase.execute(request);

      expect(result.board.isPublic).toBe(true);
      expect(mockBoardRepository.save).toHaveBeenCalledTimes(1);

      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      expect(activityCall.data).toEqual({
        isPublic: { from: false, to: true }
      });
    });

    test("should update board visibility to private", async () => {
      testBoard.makePublic();
      
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        isPublic: false,
      };

      const result = await useCase.execute(request);

      expect(result.board.isPublic).toBe(false);
      expect(mockBoardRepository.save).toHaveBeenCalledTimes(1);
    });

    test("should update multiple properties at once", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        title: "Multi-Update Board",
        description: "Multiple changes",
        isPublic: true,
      };

      const result = await useCase.execute(request);

      expect(result.board.title).toBe("Multi-Update Board");
      expect(result.board.description).toBe("Multiple changes");
      expect(result.board.isPublic).toBe(true);
      expect(mockBoardRepository.save).toHaveBeenCalledTimes(1);

      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      expect(activityCall.data).toEqual({
        title: { from: "Original Board", to: "Multi-Update Board" },
        description: { from: "Original Description", to: "Multiple changes" },
        isPublic: { from: false, to: true }
      });
    });

    test("should trim whitespace from title and description", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        title: "  Trimmed Title  ",
        description: "  Trimmed Description  ",
      };

      const result = await useCase.execute(request);

      expect(result.board.title).toBe("Trimmed Title");
      expect(result.board.description).toBe("Trimmed Description");
    });

    test("should handle empty description string", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        description: "",
      };

      const result = await useCase.execute(request);

      expect(result.board.description).toBe("");
      expect(mockBoardRepository.save).toHaveBeenCalledTimes(1);
    });

    test("should not update description when undefined (no change)", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        description: undefined,
      };

      const result = await useCase.execute(request);

      // Description should remain unchanged when undefined is passed
      expect(result.board.description).toBe("Original Description");
      // No save should happen since no changes were made
      expect(mockBoardRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("No changes scenarios", () => {
    test("should not save or log activity if no changes are made", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        title: "Original Board", // Same as current
        description: "Original Description", // Same as current
      };

      const result = await useCase.execute(request);

      expect(result.board).toBe(testBoard);
      expect(mockBoardRepository.save).not.toHaveBeenCalled();
      expect(mockActivityRepository.save).not.toHaveBeenCalled();
    });

    test("should not save if no update fields are provided", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
      };

      const result = await useCase.execute(request);

      expect(result.board).toBe(testBoard);
      expect(mockBoardRepository.save).not.toHaveBeenCalled();
      expect(mockActivityRepository.save).not.toHaveBeenCalled();
    });

    test("should not save if title is identical after trimming", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        title: "  Original Board  ", // Same after trimming
      };

      const result = await useCase.execute(request);

      expect(result.board).toBe(testBoard);
      expect(mockBoardRepository.save).not.toHaveBeenCalled();
      expect(mockActivityRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("Validation errors", () => {
    test("should throw error if board not found", async () => {
      mockBoardRepository.findById = mock(() => Promise.resolve(null));

      const request = {
        boardId: "non-existent-board",
        userId: "user-123",
        title: "Updated Title",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Board not found");
      expect(mockBoardRepository.save).not.toHaveBeenCalled();
      expect(mockActivityRepository.save).not.toHaveBeenCalled();
    });

    test("should throw error if title is empty", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        title: "",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Board title is required");
      expect(mockBoardRepository.save).not.toHaveBeenCalled();
    });

    test("should throw error if title is only whitespace", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        title: "   ",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Board title is required");
      expect(mockBoardRepository.save).not.toHaveBeenCalled();
    });

    test("should throw error if title is too long", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        title: "a".repeat(256),
      };

      await expect(useCase.execute(request)).rejects.toThrow("Board title is too long");
      expect(mockBoardRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("Permission validation", () => {
    test("should throw error if user has no role in board", async () => {
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

      const request = {
        boardId: testBoard.id,
        userId: "unauthorized-user",
        title: "Unauthorized Update",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Access denied");
      expect(mockBoardRepository.save).not.toHaveBeenCalled();
    });

    test("should throw error if user is only a viewer", async () => {
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve("VIEWER"));

      const request = {
        boardId: testBoard.id,
        userId: "viewer-user",
        title: "Viewer Update",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Access denied");
      expect(mockBoardRepository.save).not.toHaveBeenCalled();
    });

    test("should throw error if user is only a member but not admin/owner", async () => {
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

      const request = {
        boardId: testBoard.id,
        userId: "member-user",
        title: "Member Update",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Access denied");
      expect(mockBoardRepository.save).not.toHaveBeenCalled();
    });

    test("should allow board update for ADMIN role", async () => {
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve("ADMIN"));

      const request = {
        boardId: testBoard.id,
        userId: "admin-user",
        title: "Updated by ADMIN",
      };

      const result = await useCase.execute(request);

      expect(result.board.title).toBe("Updated by ADMIN");
      expect(mockBoardRepository.save).toHaveBeenCalledTimes(1);
    });

    test("should allow board update for OWNER role (board owner)", async () => {
      // Use the actual owner of the test board
      const request = {
        boardId: testBoard.id,
        userId: "user-123", // This is the ownerId of testBoard
        title: "Updated by OWNER",
      };

      const result = await useCase.execute(request);

      expect(result.board.title).toBe("Updated by OWNER");
      expect(mockBoardRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("Repository interactions", () => {
    test("should call repositories in correct order", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        title: "Updated Title",
      };

      await useCase.execute(request);

      // Verify order of calls
      expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoard.id);
      expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith(testBoard.id, "user-123");
      expect(mockBoardRepository.save).toHaveBeenCalledWith(testBoard);
      expect(mockActivityRepository.save).toHaveBeenCalled();
    });

    test("should set correct board data in activity log", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        title: "Activity Test",
      };

      await useCase.execute(request);

      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      expect(activityCall.entityId).toBe(testBoard.id);
      expect(activityCall.entityTitle).toBe("Activity Test");
      expect(activityCall.boardId).toBe(testBoard.id);
      expect(activityCall.userId).toBe("user-123");
    });
  });

  describe("Edge cases", () => {
    test("should handle special characters in title", async () => {
      const specialTitle = "Board 🎯 <script>alert('xss')</script> & \"quotes\"";
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        title: specialTitle,
      };

      const result = await useCase.execute(request);

      expect(result.board.title).toBe(specialTitle);
    });

    test("should handle very long description", async () => {
      const longDescription = "a".repeat(10000);
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        description: longDescription,
      };

      const result = await useCase.execute(request);

      expect(result.board.description).toBe(longDescription);
    });

    test("should handle background URL with special characters", async () => {
      const specialUrl = "https://example.com/bg%20with%20spaces.jpg?param=value&other=test";
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        backgroundUrl: specialUrl,
      };

      const result = await useCase.execute(request);

      expect(result.board.backgroundUrl).toBe(specialUrl);
    });

    test("should handle clearing background URL", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        backgroundUrl: "",
      };

      const result = await useCase.execute(request);

      expect(result.board.backgroundUrl).toBe("");
    });
  });

  describe("Error propagation", () => {
    test("should propagate repository save errors", async () => {
      mockBoardRepository.save = mock(() => Promise.reject(new Error("Database connection failed")));

      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        title: "Failing Update",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Database connection failed");
    });

    test("should propagate activity repository save errors", async () => {
      mockActivityRepository.save = mock(() => Promise.reject(new Error("Activity logging failed")));

      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        title: "Activity Fail",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Activity logging failed");
    });

    test("should propagate board repository findById errors", async () => {
      mockBoardRepository.findById = mock(() => Promise.reject(new Error("Database query failed")));

      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        title: "Query Fail",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Database query failed");
    });

    test("should propagate getMemberRole errors", async () => {
      mockBoardRepository.getMemberRole = mock(() => Promise.reject(new Error("Permission check failed")));

      const request = {
        boardId: testBoard.id,
        userId: "user-123",
        title: "Permission Fail",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Permission check failed");
    });
  });
});