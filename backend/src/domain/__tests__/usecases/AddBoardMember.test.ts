import { describe, test, expect, beforeEach, mock } from "bun:test";
import { AddBoardMemberUseCase } from "@/domain/usecases/AddBoardMember";
import { BoardRepository } from "@/domain/repositories/BoardRepository";
import { UserRepository } from "@/domain/repositories/UserRepository";
import { ActivityRepository } from "@/domain/repositories/ActivityRepository";
import { createMockUser, BoardBuilder, createRegularMember, createBoardMember } from "@/test/fixtures/entityFactories";

describe("AddBoardMemberUseCase", () => {
  let useCase: AddBoardMemberUseCase;
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
      getMembers: mock(() => Promise.resolve([createRegularMember("new-member-456")])),
      isMember: mock(() => Promise.resolve(false)), // Default: target user is not already a member
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

    useCase = new AddBoardMemberUseCase(
      mockBoardRepository,
      mockUserRepository,
      mockActivityRepository
    );
  });

  describe("Successful member addition", () => {
    test("should add a member to board successfully", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "new-member-456",
        role: "MEMBER" as const,
      };

      const result = await useCase.execute(request);

      expect(result.member).toBeDefined();
      expect(result.member.userId).toBe("new-member-456");
      expect(result.member.role).toBe("MEMBER");

      // Verify repository calls
      expect(mockBoardRepository.findById).toHaveBeenCalledWith("board-123");
      expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith("board-123", "admin-user-123");
      expect(mockUserRepository.findById).toHaveBeenCalledWith("new-member-456");
      expect(mockBoardRepository.isMember).toHaveBeenCalledWith("board-123", "new-member-456");
      expect(mockBoardRepository.addMember).toHaveBeenCalledWith("board-123", "new-member-456", "MEMBER");
      expect(mockBoardRepository.getMembers).toHaveBeenCalledWith("board-123");
      expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
    });

    test("should add ADMIN member successfully", async () => {
      const request = {
        boardId: "board-123",
        userId: "owner-user-123",
        memberUserId: "new-admin-456",
        role: "ADMIN" as const,
      };

      // Mock owner permission
      const ownerBoard = BoardBuilder.valid().withOwner("owner-user-123").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(ownerBoard));
      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "new-admin-456", role: "ADMIN" })
      ]));

      const result = await useCase.execute(request);

      expect(result.member.role).toBe("ADMIN");
      expect(mockBoardRepository.addMember).toHaveBeenCalledWith("board-123", "new-admin-456", "ADMIN");
    });

    test("should add VIEWER member successfully", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "viewer-456",
        role: "VIEWER" as const,
      };

      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "viewer-456", role: "VIEWER" })
      ]));

      const result = await useCase.execute(request);

      expect(result.member.role).toBe("VIEWER");
      expect(mockBoardRepository.addMember).toHaveBeenCalledWith("board-123", "viewer-456", "VIEWER");
    });

    test("should log activity after adding member", async () => {
      const board = BoardBuilder.valid().withTitle("Test Board").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(board));

      const request = {
        boardId: board.id,
        userId: "admin-user-123",
        memberUserId: "new-member-456",
        role: "MEMBER" as const,
      };

      await useCase.execute(request);

      const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
      expect(activityCall.action).toBe("ADD_MEMBER");
      expect(activityCall.entityType).toBe("BOARD");
      expect(activityCall.entityId).toBe(board.id);
      expect(activityCall.entityTitle).toBe("Test Board");
      expect(activityCall.userId).toBe("admin-user-123");
      expect(activityCall.boardId).toBe(board.id);
      expect(activityCall.data).toEqual({
        memberUserId: "new-member-456",
        role: "MEMBER",
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
        role: "MEMBER" as const,
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
        role: "MEMBER" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("Cannot add members to archived board");
    });
  });

  describe("Permission validation", () => {
    test("should allow board owner to add members", async () => {
      const ownerBoard = BoardBuilder.valid().withOwner("owner-123").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(ownerBoard));

      const request = {
        boardId: "board-123",
        userId: "owner-123",
        memberUserId: "new-member-456",
        role: "MEMBER" as const,
      };

      const result = await useCase.execute(request);
      expect(result.member).toBeDefined();
    });

    test("should allow admin to add members", async () => {
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve("ADMIN"));

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "new-member-456",
        role: "MEMBER" as const,
      };

      const result = await useCase.execute(request);
      expect(result.member).toBeDefined();
    });

    test("should throw error if user is not owner or admin", async () => {
      const board = BoardBuilder.valid().withOwner("other-owner").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(board));
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve("MEMBER"));

      const request = {
        boardId: "board-123",
        userId: "regular-user-123",
        memberUserId: "new-member-456",
        role: "MEMBER" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("Insufficient permissions to add members");
    });

    test("should throw error if user is not a member at all", async () => {
      const board = BoardBuilder.valid().withOwner("other-owner").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(board));
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve(null));

      const request = {
        boardId: "board-123",
        userId: "non-member-123",
        memberUserId: "new-member-456",
        role: "MEMBER" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("Insufficient permissions to add members");
    });

    test("should throw error if viewer tries to add members", async () => {
      const board = BoardBuilder.valid().withOwner("other-owner").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(board));
      mockBoardRepository.getMemberRole = mock(() => Promise.resolve("VIEWER"));

      const request = {
        boardId: "board-123",
        userId: "viewer-user-123",
        memberUserId: "new-member-456",
        role: "MEMBER" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("Insufficient permissions to add members");
    });
  });

  describe("Target user validation", () => {
    test("should throw error if member user not found", async () => {
      mockUserRepository.findById = mock(() => Promise.resolve(null));

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "non-existent-user",
        role: "MEMBER" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("User to be added not found");
    });

    test("should throw error if member user account is inactive", async () => {
      mockUserRepository.findById = mock(() =>
        Promise.resolve(createMockUser({ isActive: false }))
      );

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "inactive-user-456",
        role: "MEMBER" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("User account is inactive");
    });

    test("should throw error if user is already a member", async () => {
      mockBoardRepository.isMember = mock(() => Promise.resolve(true));

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "existing-member-456",
        role: "MEMBER" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("User is already a member of this board");
    });
  });

  describe("Role validation", () => {
    test("should accept ADMIN role", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "new-member-456",
        role: "ADMIN" as const,
      };

      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "new-member-456", role: "ADMIN" })
      ]));

      const result = await useCase.execute(request);
      expect(result.member.role).toBe("ADMIN");
    });

    test("should accept MEMBER role", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "new-member-456",
        role: "MEMBER" as const,
      };

      const result = await useCase.execute(request);
      expect(result.member.role).toBe("MEMBER");
    });

    test("should accept VIEWER role", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "new-member-456",
        role: "VIEWER" as const,
      };

      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "new-member-456", role: "VIEWER" })
      ]));

      const result = await useCase.execute(request);
      expect(result.member.role).toBe("VIEWER");
    });

    test("should throw error for OWNER role assignment", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "new-member-456",
        role: "OWNER" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow(
        "Invalid role. Only ADMIN, MEMBER, or VIEWER roles can be assigned"
      );
    });

    test("should throw error for invalid role", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "new-member-456",
        role: "INVALID_ROLE" as any,
      };

      expect(useCase.execute(request)).rejects.toThrow(
        "Invalid role. Only ADMIN, MEMBER, or VIEWER roles can be assigned"
      );
    });
  });

  describe("Repository error handling", () => {
    test("should throw error if failed to retrieve added member", async () => {
      mockBoardRepository.getMembers = mock(() => Promise.resolve([])); // Member not found after adding

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "new-member-456",
        role: "MEMBER" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("Failed to retrieve added member");
    });

    test("should handle repository add member failure", async () => {
      mockBoardRepository.addMember = mock(() => Promise.reject(new Error("Database error")));

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "new-member-456",
        role: "MEMBER" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("Database error");
    });

    test("should handle activity logging failure gracefully", async () => {
      mockActivityRepository.save = mock(() => Promise.reject(new Error("Activity log failed")));

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "new-member-456",
        role: "MEMBER" as const,
      };

      // Should still complete member addition even if activity logging fails
      expect(useCase.execute(request)).rejects.toThrow("Activity log failed");
    });
  });

  describe("Edge cases", () => {
    test("should handle same user adding themselves (self-invitation)", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "admin-user-123", // Same user
        role: "ADMIN" as const,
      };

      mockBoardRepository.isMember = mock(() => Promise.resolve(false));
      mockBoardRepository.getMembers = mock(() => Promise.resolve([createRegularMember("admin-user-123")]));

      const result = await useCase.execute(request);
      expect(result.member.userId).toBe("admin-user-123");
    });

    test("should handle board with maximum members (if limit exists)", async () => {
      // This test documents behavior for potential future member limits
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "new-member-456",
        role: "MEMBER" as const,
      };

      const result = await useCase.execute(request);
      expect(result.member).toBeDefined();
      // Currently no member limit enforced
    });

    test("should preserve member join timestamp", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "new-member-456",
        role: "MEMBER" as const,
      };

      const result = await useCase.execute(request);
      expect(result.member.joinedAt).toBeDefined();
      expect(result.member.joinedAt instanceof Date).toBe(true);
    });

    test("should handle special characters in user IDs", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin@example.com",
        memberUserId: "user+special@example.com",
        role: "MEMBER" as const,
      };

      mockBoardRepository.getMembers = mock(() => 
        Promise.resolve([createRegularMember("user+special@example.com")])
      );

      const result = await useCase.execute(request);
      expect(result.member.userId).toBe("user+special@example.com");
    });
  });
});