import { describe, test, expect, beforeEach, mock } from "bun:test";
import { DeleteBoardUseCase } from "@/domain/usecases/DeleteBoard";
import { BoardRepository } from "@/domain/repositories/BoardRepository";
import { ActivityRepository } from "@/domain/repositories/ActivityRepository";
import { Board } from "@/domain/entities/Board";
import { Activity } from "@/domain/entities/Activity";
import { BoardBuilder } from "@/test/fixtures/entityFactories";

describe("DeleteBoardUseCase", () => {
  let useCase: DeleteBoardUseCase;
  let mockBoardRepository: BoardRepository;
  let mockActivityRepository: ActivityRepository;
  let testBoard: Board;
  let ownerId: string;

  beforeEach(() => {
    ownerId = "user-123";
    
    // Create test board owned by the test user
    testBoard = BoardBuilder.valid()
      .withTitle("Board to Delete")
      .withDescription("This board will be deleted")
      .withOwner(ownerId)
      .build();

    // Create mock repositories
    mockBoardRepository = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(testBoard)),
      delete: mock(() => Promise.resolve()),
      getMemberRole: mock(() => Promise.resolve("OWNER")),
      addMember: mock(() => Promise.resolve()),
      removeMember: mock(() => Promise.resolve()),
      findByOwner: mock(() => Promise.resolve([])),
      findByMember: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve()),
    } as unknown as BoardRepository;

    mockActivityRepository = {
      save: mock(() => Promise.resolve()),
      findByBoard: mock(() => Promise.resolve([])),
      findByCard: mock(() => Promise.resolve([])),
      findByUser: mock(() => Promise.resolve([])),
    } as unknown as ActivityRepository;

    useCase = new DeleteBoardUseCase(
      mockBoardRepository,
      mockActivityRepository
    );
  });

  describe("Successful board deletion", () => {
    test("should delete board successfully when user is owner", async () => {
      const request = {
        boardId: testBoard.id,
        userId: ownerId,
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoard.id);
      expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
      expect(mockBoardRepository.delete).toHaveBeenCalledWith(testBoard.id);
    });

    test("should create activity log before deletion", async () => {
      const request = {
        boardId: testBoard.id,
        userId: ownerId,
      };

      await useCase.execute(request);

      expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
      
      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      expect(activityCall).toBeInstanceOf(Activity);
      expect(activityCall.action).toBe("DELETE");
      expect(activityCall.entityType).toBe("BOARD");
      expect(activityCall.entityId).toBe(testBoard.id);
      expect(activityCall.entityTitle).toBe("Board to Delete");
      expect(activityCall.userId).toBe(ownerId);
      expect(activityCall.boardId).toBe(testBoard.id);
      expect(activityCall.data).toEqual({
        boardTitle: "Board to Delete",
        boardDescription: "This board will be deleted",
      });
    });

    test("should handle board with no description", async () => {
      const boardWithoutDescription = BoardBuilder.valid()
        .withTitle("No Description Board")
        .withOwner(ownerId)
        .build();
      boardWithoutDescription.updateDescription(undefined);

      mockBoardRepository.findById = mock(() => Promise.resolve(boardWithoutDescription));

      const request = {
        boardId: boardWithoutDescription.id,
        userId: ownerId,
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      
      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      expect(activityCall.data).toEqual({
        boardTitle: "No Description Board",
        boardDescription: undefined,
      });
    });

    test("should handle board with empty description", async () => {
      const boardWithEmptyDescription = BoardBuilder.valid()
        .withTitle("Empty Description Board")
        .withDescription("")
        .withOwner(ownerId)
        .build();

      mockBoardRepository.findById = mock(() => Promise.resolve(boardWithEmptyDescription));

      const request = {
        boardId: boardWithEmptyDescription.id,
        userId: ownerId,
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      
      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      expect(activityCall.data).toEqual({
        boardTitle: "Empty Description Board",
        boardDescription: "",
      });
    });

    test("should delete board with special characters in title", async () => {
      const specialBoard = BoardBuilder.valid()
        .withTitle("Board 🎯 <script>alert('xss')</script> & \"quotes\"")
        .withDescription("Special chars: éñ中文 emoji 🚀")
        .withOwner(ownerId)
        .build();

      mockBoardRepository.findById = mock(() => Promise.resolve(specialBoard));

      const request = {
        boardId: specialBoard.id,
        userId: ownerId,
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      
      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      expect(activityCall.data.boardTitle).toBe("Board 🎯 <script>alert('xss')</script> & \"quotes\"");
      expect(activityCall.data.boardDescription).toBe("Special chars: éñ中文 emoji 🚀");
    });
  });

  describe("Validation errors", () => {
    test("should throw error if board not found", async () => {
      mockBoardRepository.findById = mock(() => Promise.resolve(null));

      const request = {
        boardId: "non-existent-board",
        userId: ownerId,
      };

      await expect(useCase.execute(request)).rejects.toThrow("Board not found");
      expect(mockBoardRepository.delete).not.toHaveBeenCalled();
      expect(mockActivityRepository.save).not.toHaveBeenCalled();
    });

    test("should throw error if user is not board owner", async () => {
      const nonOwnerUserId = "user-456";
      const request = {
        boardId: testBoard.id,
        userId: nonOwnerUserId,
      };

      await expect(useCase.execute(request)).rejects.toThrow("Only board owners can delete boards");
      expect(mockBoardRepository.delete).not.toHaveBeenCalled();
      expect(mockActivityRepository.save).not.toHaveBeenCalled();
    });

    test("should throw error if user ID is empty", async () => {
      const request = {
        boardId: testBoard.id,
        userId: "",
      };

      await expect(useCase.execute(request)).rejects.toThrow("Only board owners can delete boards");
      expect(mockBoardRepository.delete).not.toHaveBeenCalled();
    });

    test("should throw error if user ID is undefined", async () => {
      const request = {
        boardId: testBoard.id,
        userId: undefined as any,
      };

      await expect(useCase.execute(request)).rejects.toThrow("Only board owners can delete boards");
      expect(mockBoardRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("Permission validation", () => {
    test("should allow deletion only for board owner", async () => {
      // Test that only the exact owner can delete
      const ownerRequest = {
        boardId: testBoard.id,
        userId: ownerId,
      };

      const result = await useCase.execute(ownerRequest);
      expect(result.success).toBe(true);
    });

    test("should reject deletion by admin user (not owner)", async () => {
      const adminUserId = "admin-user-456";
      
      // Create board owned by different user
      const adminBoard = BoardBuilder.valid()
        .withTitle("Admin Board")
        .withOwner("different-owner-789")
        .build();

      mockBoardRepository.findById = mock(() => Promise.resolve(adminBoard));

      const request = {
        boardId: adminBoard.id,
        userId: adminUserId,
      };

      await expect(useCase.execute(request)).rejects.toThrow("Only board owners can delete boards");
      expect(mockBoardRepository.delete).not.toHaveBeenCalled();
    });

    test("should reject deletion by board member (not owner)", async () => {
      const memberUserId = "member-user-789";
      
      const memberBoard = BoardBuilder.valid()
        .withTitle("Member Board")
        .withOwner("different-owner-123")
        .build();

      mockBoardRepository.findById = mock(() => Promise.resolve(memberBoard));

      const request = {
        boardId: memberBoard.id,
        userId: memberUserId,
      };

      await expect(useCase.execute(request)).rejects.toThrow("Only board owners can delete boards");
      expect(mockBoardRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("Repository interactions", () => {
    test("should call repositories in correct order", async () => {
      const request = {
        boardId: testBoard.id,
        userId: ownerId,
      };

      await useCase.execute(request);

      // Verify order of operations:
      // 1. Find board
      // 2. Save activity log  
      // 3. Delete board
      expect(mockBoardRepository.findById).toHaveBeenCalledWith(testBoard.id);
      expect(mockActivityRepository.save).toHaveBeenCalled();
      expect(mockBoardRepository.delete).toHaveBeenCalledWith(testBoard.id);
      
      // Verify activity is logged BEFORE deletion
      const saveCalls = mockActivityRepository.save.mock.calls;
      const deleteCalls = mockBoardRepository.delete.mock.calls;
      expect(saveCalls.length).toBe(1);
      expect(deleteCalls.length).toBe(1);
    });

    test("should pass correct board ID to delete method", async () => {
      const customBoardId = "custom-board-999";
      const customBoard = BoardBuilder.valid()
        .withTitle("Custom Board")
        .withOwner(ownerId)
        .build();
      
      // Override the board's ID for this test
      Object.defineProperty(customBoard, 'id', { value: customBoardId });

      mockBoardRepository.findById = mock(() => Promise.resolve(customBoard));

      const request = {
        boardId: customBoardId,
        userId: ownerId,
      };

      await useCase.execute(request);

      expect(mockBoardRepository.findById).toHaveBeenCalledWith(customBoardId);
      expect(mockBoardRepository.delete).toHaveBeenCalledWith(customBoardId);
    });

    test("should create activity with all required fields", async () => {
      const request = {
        boardId: testBoard.id,
        userId: ownerId,
      };

      await useCase.execute(request);

      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      
      // Verify all required activity fields are set
      expect(activityCall.id).toBeDefined();
      expect(activityCall.action).toBe("DELETE");
      expect(activityCall.entityType).toBe("BOARD");
      expect(activityCall.entityId).toBe(testBoard.id);
      expect(activityCall.entityTitle).toBe(testBoard.title);
      expect(activityCall.userId).toBe(ownerId);
      expect(activityCall.boardId).toBe(testBoard.id);
      expect(activityCall.createdAt).toBeDefined();
      expect(activityCall.data).toBeDefined();
    });
  });

  describe("Edge cases", () => {
    test("should handle very long board title and description", async () => {
      const longTitle = "a".repeat(1000);
      const longDescription = "b".repeat(10000);
      
      const longBoard = BoardBuilder.valid()
        .withTitle(longTitle)
        .withDescription(longDescription)
        .withOwner(ownerId)
        .build();

      mockBoardRepository.findById = mock(() => Promise.resolve(longBoard));

      const request = {
        boardId: longBoard.id,
        userId: ownerId,
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      
      const activityCall = mockActivityRepository.save.mock.calls[0][0];
      expect(activityCall.data.boardTitle).toBe(longTitle);
      expect(activityCall.data.boardDescription).toBe(longDescription);
    });

    test("should handle board with all optional fields", async () => {
      const fullBoard = BoardBuilder.valid()
        .withTitle("Full Featured Board")
        .withDescription("Complete board with all fields")
        .withBackgroundUrl("https://example.com/bg.jpg")
        .withOwner(ownerId)
        .public()
        .build();

      mockBoardRepository.findById = mock(() => Promise.resolve(fullBoard));

      const request = {
        boardId: fullBoard.id,
        userId: ownerId,
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockBoardRepository.delete).toHaveBeenCalledWith(fullBoard.id);
    });
  });

  describe("Error propagation", () => {
    test("should propagate board repository findById errors", async () => {
      mockBoardRepository.findById = mock(() => Promise.reject(new Error("Database query failed")));

      const request = {
        boardId: testBoard.id,
        userId: ownerId,
      };

      await expect(useCase.execute(request)).rejects.toThrow("Database query failed");
      expect(mockBoardRepository.delete).not.toHaveBeenCalled();
      expect(mockActivityRepository.save).not.toHaveBeenCalled();
    });

    test("should propagate activity repository save errors", async () => {
      mockActivityRepository.save = mock(() => Promise.reject(new Error("Activity logging failed")));

      const request = {
        boardId: testBoard.id,
        userId: ownerId,
      };

      await expect(useCase.execute(request)).rejects.toThrow("Activity logging failed");
      expect(mockBoardRepository.delete).not.toHaveBeenCalled();
    });

    test("should propagate board repository delete errors", async () => {
      mockBoardRepository.delete = mock(() => Promise.reject(new Error("Database deletion failed")));

      const request = {
        boardId: testBoard.id,
        userId: ownerId,
      };

      await expect(useCase.execute(request)).rejects.toThrow("Database deletion failed");
      
      // Activity should still be logged even if deletion fails
      expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
    });

    test("should not delete board if activity logging fails", async () => {
      mockActivityRepository.save = mock(() => Promise.reject(new Error("Activity save failed")));

      const request = {
        boardId: testBoard.id,
        userId: ownerId,
      };

      await expect(useCase.execute(request)).rejects.toThrow("Activity save failed");
      
      // Deletion should not happen if activity logging fails
      expect(mockBoardRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("Return value validation", () => {
    test("should return success object with correct structure", async () => {
      const request = {
        boardId: testBoard.id,
        userId: ownerId,
      };

      const result = await useCase.execute(request);

      expect(result).toEqual({ success: true });
      expect(typeof result.success).toBe("boolean");
    });

    test("should consistently return success true for valid deletions", async () => {
      const request = {
        boardId: testBoard.id,
        userId: ownerId,
      };

      // Execute multiple times to ensure consistency
      const results = await Promise.all([
        useCase.execute(request),
        useCase.execute(request),
        useCase.execute(request)
      ]);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});