import { describe, test, expect, beforeEach, mock } from "bun:test";
import { UpdateMemberRoleUseCase } from "@/domain/usecases/UpdateMemberRole";
import { BoardRepository } from "@kanban/domain-core";
import { UserRepository } from "@kanban/domain-core";
import { ActivityRepository } from "@kanban/domain-core";
import { createMockUser, BoardBuilder, createBoardMember } from "@/test/fixtures/entityFactories";

describe("UpdateMemberRoleUseCase", () => {
  let useCase: UpdateMemberRoleUseCase;
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
      getMembers: mock(() => Promise.resolve([createBoardMember({ userId: "member-456", role: "ADMIN" })])),
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

    useCase = new UpdateMemberRoleUseCase(
      mockBoardRepository,
      mockUserRepository,
      mockActivityRepository
    );
  });

  describe("Successful role updates", () => {
    test("should update member role from MEMBER to ADMIN", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "member-456",
        newRole: "ADMIN" as const,
      };

      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "member-456", role: "ADMIN" })
      ]));

      const result = await useCase.execute(request);

      expect(result.member).toBeDefined();
      expect(result.member.userId).toBe("member-456");
      expect(result.member.role).toBe("ADMIN");

      // Verify repository calls
      expect(mockBoardRepository.findById).toHaveBeenCalledWith("board-123");
      expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith("board-123", "admin-user-123");
      expect(mockBoardRepository.getMemberRole).toHaveBeenCalledWith("board-123", "member-456");
      expect(mockUserRepository.findById).toHaveBeenCalledWith("member-456");
      expect(mockBoardRepository.updateMemberRole).toHaveBeenCalledWith("board-123", "member-456", "ADMIN");
      expect(mockBoardRepository.getMembers).toHaveBeenCalledWith("board-123");
      expect(mockActivityRepository.save).toHaveBeenCalledTimes(1);
    });

    test("should update member role from ADMIN to MEMBER", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "admin-456",
        newRole: "MEMBER" as const,
      };

      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "admin-456") return Promise.resolve("ADMIN");
        return Promise.resolve(null);
      });

      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "admin-456", role: "MEMBER" })
      ]));

      const result = await useCase.execute(request);
      expect(result.member.role).toBe("MEMBER");
    });

    test("should update member role from MEMBER to VIEWER", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "member-456",
        newRole: "VIEWER" as const,
      };

      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "member-456", role: "VIEWER" })
      ]));

      const result = await useCase.execute(request);
      expect(result.member.role).toBe("VIEWER");
    });

    test("should update member role from VIEWER to ADMIN", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "viewer-456",
        newRole: "ADMIN" as const,
      };

      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "viewer-456") return Promise.resolve("VIEWER");
        return Promise.resolve(null);
      });

      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "viewer-456", role: "ADMIN" })
      ]));

      const result = await useCase.execute(request);
      expect(result.member.role).toBe("ADMIN");
    });

    test("should allow board owner to update member roles", async () => {
      const ownerBoard = BoardBuilder.valid().withOwner("owner-123").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(ownerBoard));

      const request = {
        boardId: "board-123",
        userId: "owner-123",
        memberUserId: "member-456",
        newRole: "ADMIN" as const,
      };

      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "member-456", role: "ADMIN" })
      ]));

      const result = await useCase.execute(request);
      expect(result.member.role).toBe("ADMIN");
    });

    test("should log activity after updating member role", async () => {
      const board = BoardBuilder.valid().withTitle("Test Board").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(board));

      const request = {
        boardId: board.id,
        userId: "admin-user-123",
        memberUserId: "member-456",
        newRole: "ADMIN" as const,
      };

      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "member-456") return Promise.resolve("VIEWER");
        return Promise.resolve(null);
      });

      await useCase.execute(request);

      const activityCall = (mockActivityRepository.save as any).mock.calls[0][0];
      expect(activityCall.action).toBe("UPDATE");
      expect(activityCall.entityType).toBe("BOARD");
      expect(activityCall.entityId).toBe(board.id);
      expect(activityCall.entityTitle).toBe("Test Board");
      expect(activityCall.userId).toBe("admin-user-123");
      expect(activityCall.boardId).toBe(board.id);
      expect(activityCall.data).toEqual({
        memberUserId: "member-456",
        oldRole: "VIEWER",
        newRole: "ADMIN",
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
        newRole: "ADMIN" as const,
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
        newRole: "ADMIN" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("Cannot update member roles in archived board");
    });
  });

  describe("Permission validation", () => {
    test("should throw error if user is not owner or admin", async () => {
      const board = BoardBuilder.valid().withOwner("other-owner").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(board));
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "regular-user-123") return Promise.resolve("MEMBER");
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "regular-user-123",
        memberUserId: "member-456",
        newRole: "ADMIN" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("Insufficient permissions to update member roles");
    });

    test("should throw error if user is not a member at all", async () => {
      const board = BoardBuilder.valid().withOwner("other-owner").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(board));
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "non-member-123") return Promise.resolve(null);
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "non-member-123",
        memberUserId: "member-456",
        newRole: "ADMIN" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("Insufficient permissions to update member roles");
    });

    test("should throw error if viewer tries to update member roles", async () => {
      const board = BoardBuilder.valid().withOwner("other-owner").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(board));
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "viewer-user-123") return Promise.resolve("VIEWER");
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "viewer-user-123",
        memberUserId: "member-456",
        newRole: "ADMIN" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("Insufficient permissions to update member roles");
    });

    test("should throw error if member tries to update other member roles", async () => {
      const board = BoardBuilder.valid().withOwner("other-owner").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(board));
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "member-user-123") return Promise.resolve("MEMBER");
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "member-user-123",
        memberUserId: "member-456",
        newRole: "ADMIN" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("Insufficient permissions to update member roles");
    });
  });

  describe("Target member validation", () => {
    test("should throw error if member user not found", async () => {
      mockUserRepository.findById = mock(() => Promise.resolve(null));

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "non-existent-user",
        newRole: "ADMIN" as const,
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
        newRole: "ADMIN" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("User is not a member of this board");
    });

    test("should throw error when trying to change board owner role", async () => {
      const ownerBoard = BoardBuilder.valid().withOwner("owner-123").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(ownerBoard));

      const request = {
        boardId: "board-123",
        userId: "admin-user-456",
        memberUserId: "owner-123", // Trying to change owner role
        newRole: "ADMIN" as const,
      };

      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-456") return Promise.resolve("ADMIN");
        if (userId === "owner-123") return Promise.resolve("OWNER");
        return Promise.resolve(null);
      });

      expect(useCase.execute(request)).rejects.toThrow("Cannot change the role of the board owner");
    });

    test("should throw error when owner tries to change their own role", async () => {
      const ownerBoard = BoardBuilder.valid().withOwner("owner-123").build();
      mockBoardRepository.findById = mock(() => Promise.resolve(ownerBoard));

      const request = {
        boardId: "board-123",
        userId: "owner-123",
        memberUserId: "owner-123", // Owner trying to change their own role
        newRole: "ADMIN" as const,
      };

      mockBoardRepository.getMemberRole = mock(() => Promise.resolve("OWNER"));

      expect(useCase.execute(request)).rejects.toThrow("Cannot change the role of the board owner");
    });
  });

  describe("Role validation", () => {
    test("should accept ADMIN role", async () => {
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "member-456", role: "ADMIN" })
      ]));

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "member-456",
        newRole: "ADMIN" as const,
      };

      const result = await useCase.execute(request);
      expect(result.member.role).toBe("ADMIN");
    });

    test("should accept MEMBER role", async () => {
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "admin-456") return Promise.resolve("ADMIN");
        return Promise.resolve(null);
      });

      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "admin-456", role: "MEMBER" })
      ]));

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "admin-456",
        newRole: "MEMBER" as const,
      };

      const result = await useCase.execute(request);
      expect(result.member.role).toBe("MEMBER");
    });

    test("should accept VIEWER role", async () => {
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "member-456", role: "VIEWER" })
      ]));

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "member-456",
        newRole: "VIEWER" as const,
      };

      const result = await useCase.execute(request);
      expect(result.member.role).toBe("VIEWER");
    });

    test("should throw error for OWNER role assignment", async () => {
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "member-456",
        newRole: "OWNER" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("Only the board owner can transfer ownership");
    });

    test("should throw error for invalid role", async () => {
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "member-456",
        newRole: "INVALID_ROLE" as any,
      };

      expect(useCase.execute(request)).rejects.toThrow("Invalid role. Valid roles are: ADMIN, MEMBER, VIEWER");
    });

    test("should throw error if member already has the specified role", async () => {
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "admin-456") return Promise.resolve("ADMIN");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "admin-456",
        newRole: "ADMIN" as const, // Same as current role
      };

      expect(useCase.execute(request)).rejects.toThrow("Member already has this role");
    });
  });

  describe("Repository error handling", () => {
    test("should throw error if failed to retrieve updated member", async () => {
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      mockBoardRepository.getMembers = mock(() => Promise.resolve([])); // Member not found after update

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "member-456",
        newRole: "ADMIN" as const,
      };

      expect(useCase.execute(request)).rejects.toThrow("Failed to retrieve updated member");
    });

    test("should handle repository update member role failure", async () => {
      mockBoardRepository.updateMemberRole = mock(() => Promise.reject(new Error("Database error")));
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "member-456",
        newRole: "ADMIN" as const,
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
        newRole: "ADMIN" as const,
      };

      // Should still complete role update even if activity logging fails
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

      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "user+special@example.com", role: "ADMIN" })
      ]));

      const request = {
        boardId: "board-123",
        userId: "admin@example.com",
        memberUserId: "user+special@example.com",
        newRole: "ADMIN" as const,
      };

      const result = await useCase.execute(request);
      expect(result.member.userId).toBe("user+special@example.com");
    });

    test("should handle updating inactive user role", async () => {
      mockUserRepository.findById = mock(() => 
        Promise.resolve(createMockUser({ isActive: false }))
      );
      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "inactive-member-456") return Promise.resolve("MEMBER");
        return Promise.resolve(null);
      });

      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "inactive-member-456", role: "VIEWER" })
      ]));

      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "inactive-member-456",
        newRole: "VIEWER" as const,
      };

      // Should still allow role update for inactive users
      const result = await useCase.execute(request);
      expect(result.member.role).toBe("VIEWER");
    });

    test("should handle role escalation (VIEWER -> MEMBER -> ADMIN)", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "member-456",
        newRole: "ADMIN" as const,
      };

      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "member-456") return Promise.resolve("VIEWER");
        return Promise.resolve(null);
      });

      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "member-456", role: "ADMIN" })
      ]));

      const result = await useCase.execute(request);
      expect(result.member.role).toBe("ADMIN");
    });

    test("should handle role demotion (ADMIN -> MEMBER -> VIEWER)", async () => {
      const request = {
        boardId: "board-123",
        userId: "admin-user-123",
        memberUserId: "admin-456",
        newRole: "VIEWER" as const,
      };

      mockBoardRepository.getMemberRole = mock((boardId, userId) => {
        if (userId === "admin-user-123") return Promise.resolve("ADMIN");
        if (userId === "admin-456") return Promise.resolve("ADMIN");
        return Promise.resolve(null);
      });

      mockBoardRepository.getMembers = mock(() => Promise.resolve([
        createBoardMember({ userId: "admin-456", role: "VIEWER" })
      ]));

      const result = await useCase.execute(request);
      expect(result.member.role).toBe("VIEWER");
    });
  });
});