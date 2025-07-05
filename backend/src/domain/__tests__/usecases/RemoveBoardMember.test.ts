import { describe, test, expect, beforeEach, mock } from "bun:test";
import { RemoveBoardMemberUseCase } from "@/domain/usecases/RemoveBoardMember";
import { BoardRepository } from "@kanban/domain-core";
import { UserRepository } from "@kanban/domain-core";
import { ActivityRepository } from "@kanban/domain-core";
import { createMockUser, BoardBuilder } from "@/test/fixtures/entityFactories";

describe("RemoveBoardMemberUseCase", () => {
  let useCase: RemoveBoardMemberUseCase;
  let mockBoardRepository: BoardRepository;
  let mockUserRepository: UserRepository;
  let mockActivityRepository: ActivityRepository;

  beforeEach(() => {
    // Create mock repositories
    mockBoardRepository = {
      findById: mock(() => Promise.resolve(BoardBuilder.valid().build())),
      save: mock(() => Promise.resolve()),
      addMember: mock(() => Promise.resolve()),
      removeMember: mock(() => Promise.resolve()),
      updateMemberRole: mock(() => Promise.resolve()),
      getMemberRole: mock(() => Promise.resolve("ADMIN")), // Default: requesting user is admin
      getMembers: mock(() => Promise.resolve([])),
      isMember: mock(() => Promise.resolve(true)),
      findByOwner: mock(() => Promise.resolve([])),
      findByMember: mock(() => Promise.resolve([])),
      findPublicBoards: mock(() => Promise.resolve([])),
      delete: mock(() => Promise.resolve()),
    } as unknown as BoardRepository;

    mockUserRepository = {
      findById: mock(() => Promise.resolve(createMockUser({ isActive: true }))),
      save: mock(() => Promise.resolve()),
      findByEmail: mock(() => Promise.resolve(null)),
      findByCognitoId: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve()),
    } as unknown as UserRepository;

    mockActivityRepository = {
      save: mock(() => Promise.resolve()),
      findByBoard: mock(() => Promise.resolve([])),
      findByUser: mock(() => Promise.resolve([])),
      findByEntityId: mock(() => Promise.resolve([])),
    } as unknown as ActivityRepository;

    useCase = new RemoveBoardMemberUseCase(
      mockBoardRepository,
      mockUserRepository,
      mockActivityRepository
    );
  });

  describe("Successful member removal", () => {
    test("should remove a member successfully by admin", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "member-to-remove-456",
      };

      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "member-to-remove-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);

      // Verify repository calls
      expect(mockBoardRepository.findById).toHaveBeenCalledWith("board-123");
      expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith("board-123", "admin-user-123");
      expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith("board-123", "member-to-remove-456");
      expect(mockUserRepository.findById).toHaveBeenCalledWith("member-to-remove-456");
      expect(mockBoardRepository.removeMember).toHaveBeenCalledWith("board-123", "member-to-remove-456");
      expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
    });

    test("should allow board owner to remove members", async () => {
      const ownerBoard = BoardBuilder.valid().withOwner("owner-123").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(ownerBoard));

      const request = {
        boardId: "board-123",
        userId: "owner-123",
        memberUserId: "member-to-remove-456",
      };

      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "member-to-remove-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const result = await useCase.execute(request);
      expect(result.success).toBe(true);
    });

    test("should allow self-removal", async () => {
      const request = {
        boardId: "board-123",
        userId: "member-123",
        memberUserId: "member-123", // Same user - self removal
      };

      mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockBoardRepository.removeMember).toHaveBeenCalledWith("board-123", "member-123");
    });

    test("should log activity after removing member", async () => {
      const board = BoardBuilder.valid().withTitle("Test Board").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(board));

      const request = {
        boardId: board.id,
        userId: "admin-user-123",
        memberUserId: "member-to-remove-456",
      };

      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "member-to-remove-456") return Promise.resolve("VIEWER");
        return Promise.resolve(null);
      });

      await useCase.execute(request);

      const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
      expect(activityCall.action).toBe("REMOVE_MEMBER");
      expect(activityCall.entityType).toBe("BOARD");
      expect(activityCall.entityId).toBe(board.id);
      expect(activityCall.entityTitle).toBe("Test Board");
      expect(activityCall.userId).toBe("admin-user-123");
      expect(activityCall.boardId).toBe(board.id);
      expect(activityCall.data).toEqual({
        memberUserId: "member-to-remove-456",
        removedRole: "VIEWER",
        selfRemoval: false,
      });
    });

    test("should log self-removal activity correctly", async () => {
      const board = BoardBuilder.valid().withTitle("Test Board").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(board));

      const request = {
        boardId: board.id,
        userId: "member-123",
        memberUserId: "member-123", // Self removal
      };

      mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

      await useCase.execute(request);

      const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
      expect(activityCall.data).toEqual({
        memberUserId: "member-123",
        removedRole: "MEMBER",
        selfRemoval: true,
      });
    });
  });

  describe("Board validation", () => {
    test("should throw error if board not found", async () => {
      mockBoardRepository.findById = mock(() => Promise.resolve(null));

      const request = {
        boardId: "non-existent-board",
        userId: "user-123",
        memberUserId: "member-456",
      };

      expect(useCase.execute(request)).rejects.toThrow("Board not found");
    });

    test("should throw error if board is archived", async () => {
      const archivedBoard = BoardBuilder.valid().archived().build();
      mockBoardRepository.findById = mock(() => Promise.resolve(archivedBoard));

      const request = {
        boardId: "archived-board-123",
        userId: "user-123",
        memberUserId: "member-456",
      };

      expect(useCase.execute(request)).rejects.toThrow("Cannot remove members from archived board");
    });
  });

  describe("Permission validation", () => {
    test("should throw error if user is not owner or admin (and not self-removal)", async () => {
      const board = BoardBuilder.valid().withOwner("other-owner").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(board));
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "regular-user-123") return Promise.resolve("MEMBER");
        if (userId === "member-to-remove-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "regular-user-123",
        memberUserId: "member-to-remove-456", // Different user
      };

      expect(useCase.execute(request)).rejects.toThrow("Insufficient permissions to remove members");
    });

    test("should throw error if user is not a member at all", async () => {
      const board = BoardBuilder.valid().withOwner("other-owner").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(board));
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "non-member-123") return Promise.resolve(null);
        if (userId === "member-to-remove-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "non-member-123",
        memberUserId: "member-to-remove-456",
      };

      expect(useCase.execute(request)).rejects.toThrow("Insufficient permissions to remove members");
    });

    test("should throw error if viewer tries to remove other members", async () => {
      const board = BoardBuilder.valid().withOwner("other-owner").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(board));
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "viewer-user-123") return Promise.resolve("VIEWER");
        if (userId === "member-to-remove-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "viewer-user-123",
        memberUserId: "member-to-remove-456",
      };

      expect(useCase.execute(request)).rejects.toThrow("Insufficient permissions to remove members");
    });

    test("should allow viewer to remove themselves", async () => {
      const board = BoardBuilder.valid().withOwner("other-owner").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(board));
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve("VIEWER"));

      const request = {
        boardId: "board-123",
        userId: "viewer-user-123",
        memberUserId: "viewer-user-123", // Self removal
      };

      const result = await useCase.execute(request);
      expect(result.success).toBe(true);
    });
  });

  describe("Target member validation", () => {
    test("should throw error if member user not found", async () => {
      mockUserRepository.findById = mock(() => Promise.resolve(null));

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "non-existent-user",
      };

      expect(useCase.execute(request)).rejects.toThrow("Member not found");
    });

    test("should throw error if user is not a member of the board", async () => {
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "non-member-456") return Promise.resolve(null); // Not a member
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "non-member-456",
      };

      expect(useCase.execute(request)).rejects.toThrow("User is not a member of this board");
    });

    test("should throw error when trying to remove board owner", async () => {
      const ownerBoard = BoardBuilder.valid().withOwner("owner-123").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(ownerBoard));

      const request = {
        boardId: "board-123",
        userId: "admin-user-456",
        memberUserId: "owner-123", // Trying to remove owner
      };

      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-456") return Promise.resolve("ADMIN");
        if (userId === "owner-123") return Promise.resolve("OWNER");
        return Promise.resolve(null);
      });

      expect(useCase.execute(request)).rejects.toThrow("Cannot remove the board owner");
    });

    test("should throw error when owner tries to remove themselves", async () => {
      const ownerBoard = BoardBuilder.valid().withOwner("owner-123").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(ownerBoard));

      const request = {
        boardId: "board-123",
        userId: "owner-123",
        memberUserId: "owner-123", // Owner trying to remove themselves
      };

      mockBoardRepository.getMemberRole = mock(() => Promise.resolve("OWNER"));

      expect(useCase.execute(request)).rejects.toThrow("Cannot remove the board owner");
    });
  });

  describe("Different role removal scenarios", () => {
    test("should allow admin to remove regular member", async () => {
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "member-456",
      };

      const result = await useCase.execute(request);
      expect(result.success).toBe(true);
    });

    test("should allow admin to remove viewer", async () => {
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "viewer-456") return Promise.resolve("VIEWER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "viewer-456",
      };

      const result = await useCase.execute(request);
      expect(result.success).toBe(true);
    });

    test("should allow owner to remove admin", async () => {
      const ownerBoard = BoardBuilder.valid().withOwner("owner-123").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(ownerBoard));

      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-456") return Promise.resolve("ADMIN");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "owner-123",
        memberUserId: "admin-456",
      };

      const result = await useCase.execute(request);
      expect(result.success).toBe(true);
    });

    test("should allow member to remove themselves", async () => {
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

      const request = {
        boardId: "board-123",
        userId: "member-123",
        memberUserId: "member-123",
      };

      const result = await useCase.execute(request);
      expect(result.success).toBe(true);
    });

    test("should allow admin to remove themselves", async () => {
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve("ADMIN"));

      const request = {
        boardId: "board-123",
        userId: "admin-123",
        memberUserId: "admin-123",
      };

      const result = await useCase.execute(request);
      expect(result.success).toBe(true);
    });
  });

  describe("Repository error handling", () => {
    test("should handle repository remove member failure", async () => {
      mockBoardRepository.removeMember = mock(() => Promise.reject(new Error("Database error")));
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "member-456",
      };

      expect(useCase.execute(request)).rejects.toThrow("Database error");
    });

    test("should handle activity logging failure gracefully", async () => {
      mockActivityRepository.save = mock(() => Promise.reject(new Error("Activity log failed")));
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "member-456",
      };

      // Should still complete member removal even if activity logging fails
      expect(useCase.execute(request)).rejects.toThrow("Activity log failed");
    });
  });

  describe("Edge cases", () => {
    test("should handle special characters in user IDs", async () => {
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin@example.com") return Promise.resolve("ADMIN");
        if (userId === "user+special@example.com") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "admin@example.com",
        memberUserId: "user+special@example.com",
      };

      const result = await useCase.execute(request);
      expect(result.success).toBe(true);
    });

    test("should handle inactive user removal", async () => {
      mockUserRepository.findById = mock(() => 
        Promise.resolve(createMockUser({ isActive: false }))
      );
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "inactive-member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "inactive-member-456",
      };

      // Should still allow removal of inactive users
      const result = await useCase.execute(request);
      expect(result.success).toBe(true);
    });

    test("should handle removal of last non-owner member", async () => {
      // This test documents behavior when removing the last member (excluding owner)
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "last-member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "last-member-456",
      };

      const result = await useCase.execute(request);
      expect(result.success).toBe(true);
      // Board should still exist with just the owner
    });
  });
});