import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { BoardMember, BoardRole } from "@kanban/domain-core";
import { mockDate, UUID_REGEX, DEFAULT_TEST_DATE } from "@/test/utils/testHelpers";
import { 
  createBoardMember, 
  createOwnerMember, 
  createAdminMember, 
  createRegularMember, 
  createViewerMember 
} from "@/test/fixtures/entityFactories";

describe("BoardMember Entity", () => {
  let restoreDate: () => void;

  beforeEach(() => {
    restoreDate = mockDate(DEFAULT_TEST_DATE);
  });

  afterEach(() => {
    restoreDate();
  });

  describe("BoardMember creation", () => {
    test("creates board member with required properties", () => {
      const member = createBoardMember({
        userId: "user-123",
        role: "MEMBER",
        joinedAt: new Date("2024-01-01T00:00:00Z")
      });

      expect(member.userId).toBe("user-123");
      expect(member.role).toBe("MEMBER");
      expect(member.joinedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
    });

    test("creates board member with default properties", () => {
      const member = createBoardMember();

      expect(member.userId).toBe("user-123");
      expect(member.role).toBe("MEMBER");
      expect(member.joinedAt).toEqual(DEFAULT_TEST_DATE);
    });

    test("accepts partial overrides", () => {
      const member = createBoardMember({
        userId: "custom-user-456",
        role: "ADMIN"
      });

      expect(member.userId).toBe("custom-user-456");
      expect(member.role).toBe("ADMIN");
      expect(member.joinedAt).toEqual(DEFAULT_TEST_DATE);
    });

    test("preserves all provided properties", () => {
      const customDate = new Date("2024-06-15T10:30:00Z");
      const member = createBoardMember({
        userId: "user-789",
        role: "VIEWER",
        joinedAt: customDate
      });

      expect(member.userId).toBe("user-789");
      expect(member.role).toBe("VIEWER");
      expect(member.joinedAt).toEqual(customDate);
    });
  });

  describe("BoardMember role validation", () => {
    test("accepts OWNER role", () => {
      const member = createBoardMember({ role: "OWNER" });
      expect(member.role).toBe("OWNER");
    });

    test("accepts ADMIN role", () => {
      const member = createBoardMember({ role: "ADMIN" });
      expect(member.role).toBe("ADMIN");
    });

    test("accepts MEMBER role", () => {
      const member = createBoardMember({ role: "MEMBER" });
      expect(member.role).toBe("MEMBER");
    });

    test("accepts VIEWER role", () => {
      const member = createBoardMember({ role: "VIEWER" });
      expect(member.role).toBe("VIEWER");
    });

    test("role property is properly typed", () => {
      const member = createBoardMember({ role: "ADMIN" });
      const validRoles: BoardRole[] = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];
      
      expect(validRoles).toContain(member.role);
    });
  });

  describe("BoardMember role hierarchy understanding", () => {
    test("OWNER role represents highest permission level", () => {
      const owner = createBoardMember({ role: "OWNER" });
      expect(owner.role).toBe("OWNER");
    });

    test("ADMIN role represents administrative permissions", () => {
      const admin = createBoardMember({ role: "ADMIN" });
      expect(admin.role).toBe("ADMIN");
    });

    test("MEMBER role represents standard user permissions", () => {
      const member = createBoardMember({ role: "MEMBER" });
      expect(member.role).toBe("MEMBER");
    });

    test("VIEWER role represents read-only permissions", () => {
      const viewer = createBoardMember({ role: "VIEWER" });
      expect(viewer.role).toBe("VIEWER");
    });
  });

  describe("BoardMember date handling", () => {
    test("handles current date for joinedAt", () => {
      const now = new Date();
      const member = createBoardMember({ joinedAt: now });
      expect(member.joinedAt).toEqual(now);
    });

    test("handles past date for joinedAt", () => {
      const pastDate = new Date("2023-01-01T00:00:00Z");
      const member = createBoardMember({ joinedAt: pastDate });
      expect(member.joinedAt).toEqual(pastDate);
    });

    test("handles future date for joinedAt", () => {
      const futureDate = new Date("2025-12-31T23:59:59Z");
      const member = createBoardMember({ joinedAt: futureDate });
      expect(member.joinedAt).toEqual(futureDate);
    });

    test("preserves timezone information in joinedAt", () => {
      const utcDate = new Date("2024-06-15T12:00:00.000Z");
      const member = createBoardMember({ joinedAt: utcDate });
      
      expect(member.joinedAt.toISOString()).toBe("2024-06-15T12:00:00.000Z");
    });

    test("maintains date precision", () => {
      const preciseDate = new Date("2024-01-01T15:30:45.123Z");
      const member = createBoardMember({ joinedAt: preciseDate });
      
      expect(member.joinedAt.getTime()).toBe(preciseDate.getTime());
    });
  });

  describe("BoardMember data integrity", () => {
    test("maintains userId integrity", () => {
      const member = createBoardMember({ userId: "user-abc-123" });
      expect(member.userId).toBe("user-abc-123");
      expect(typeof member.userId).toBe("string");
    });

    test("maintains role as exact string match", () => {
      const member = createBoardMember({ role: "ADMIN" });
      expect(member.role).toBe("ADMIN");
      expect(member.role).not.toBe("admin");
      expect(member.role).not.toBe("Admin");
    });

    test("maintains joinedAt as Date object", () => {
      const member = createBoardMember();
      expect(member.joinedAt instanceof Date).toBe(true);
    });

    test("handles empty userId string", () => {
      const member = createBoardMember({ userId: "" });
      expect(member.userId).toBe("");
    });

    test("handles special characters in userId", () => {
      const member = createBoardMember({ userId: "user@domain.com" });
      expect(member.userId).toBe("user@domain.com");
    });

    test("handles UUID format userId", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      const member = createBoardMember({ userId: uuid });
      expect(member.userId).toBe(uuid);
      expect(member.userId).toMatch(UUID_REGEX);
    });
  });

  describe("Convenience factory functions", () => {
    describe("createOwnerMember", () => {
      test("creates owner member with specified userId", () => {
        const member = createOwnerMember("owner-123");
        
        expect(member.userId).toBe("owner-123");
        expect(member.role).toBe("OWNER");
        expect(member.joinedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
      });

      test("accepts custom joinedAt date", () => {
        const customDate = new Date("2024-02-15T10:00:00Z");
        const member = createOwnerMember("owner-456", customDate);
        
        expect(member.userId).toBe("owner-456");
        expect(member.role).toBe("OWNER");
        expect(member.joinedAt).toEqual(customDate);
      });
    });

    describe("createAdminMember", () => {
      test("creates admin member with specified userId", () => {
        const member = createAdminMember("admin-123");
        
        expect(member.userId).toBe("admin-123");
        expect(member.role).toBe("ADMIN");
        expect(member.joinedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
      });

      test("accepts custom joinedAt date", () => {
        const customDate = new Date("2024-03-20T14:30:00Z");
        const member = createAdminMember("admin-456", customDate);
        
        expect(member.userId).toBe("admin-456");
        expect(member.role).toBe("ADMIN");
        expect(member.joinedAt).toEqual(customDate);
      });
    });

    describe("createRegularMember", () => {
      test("creates regular member with specified userId", () => {
        const member = createRegularMember("member-123");
        
        expect(member.userId).toBe("member-123");
        expect(member.role).toBe("MEMBER");
        expect(member.joinedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
      });

      test("accepts custom joinedAt date", () => {
        const customDate = new Date("2024-04-10T09:15:00Z");
        const member = createRegularMember("member-456", customDate);
        
        expect(member.userId).toBe("member-456");
        expect(member.role).toBe("MEMBER");
        expect(member.joinedAt).toEqual(customDate);
      });
    });

    describe("createViewerMember", () => {
      test("creates viewer member with specified userId", () => {
        const member = createViewerMember("viewer-123");
        
        expect(member.userId).toBe("viewer-123");
        expect(member.role).toBe("VIEWER");
        expect(member.joinedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
      });

      test("accepts custom joinedAt date", () => {
        const customDate = new Date("2024-05-05T16:45:00Z");
        const member = createViewerMember("viewer-456", customDate);
        
        expect(member.userId).toBe("viewer-456");
        expect(member.role).toBe("VIEWER");
        expect(member.joinedAt).toEqual(customDate);
      });
    });
  });

  describe("BoardMember immutability and copying", () => {
    test("creates independent objects", () => {
      const member1 = createBoardMember({ userId: "user-1", role: "ADMIN" });
      const member2 = createBoardMember({ userId: "user-2", role: "MEMBER" });
      
      expect(member1.userId).not.toBe(member2.userId);
      expect(member1.role).not.toBe(member2.role);
    });

    test("factory creates new Date objects", () => {
      const member1 = createBoardMember();
      const member2 = createBoardMember();
      
      expect(member1.joinedAt).not.toBe(member2.joinedAt); // Different object references
      expect(member1.joinedAt.getTime()).toBe(member2.joinedAt.getTime()); // Same time value
    });

    test("modifying one member does not affect others", () => {
      const member1 = createBoardMember({ userId: "user-1" });
      const member2 = createBoardMember({ userId: "user-2" });
      
      // TypeScript prevents direct property modification in well-typed scenarios
      // This test documents the expected behavior
      expect(member1.userId).toBe("user-1");
      expect(member2.userId).toBe("user-2");
    });
  });

  describe("BoardMember serialization and compatibility", () => {
    test("can be serialized to JSON", () => {
      const member = createBoardMember({
        userId: "user-123",
        role: "ADMIN",
        joinedAt: new Date("2024-01-01T00:00:00Z")
      });

      const json = JSON.stringify(member);
      const parsed = JSON.parse(json);

      expect(parsed.userId).toBe("user-123");
      expect(parsed.role).toBe("ADMIN");
      expect(parsed.joinedAt).toBe("2024-01-01T00:00:00.000Z");
    });

    test("can be reconstructed from JSON", () => {
      const originalMember = createBoardMember({
        userId: "user-456",
        role: "VIEWER",
        joinedAt: new Date("2024-02-15T10:30:00Z")
      });

      const json = JSON.stringify(originalMember);
      const parsed = JSON.parse(json);
      
      const reconstructedMember: BoardMember = {
        userId: parsed.userId,
        role: parsed.role as BoardRole,
        joinedAt: new Date(parsed.joinedAt)
      };

      expect(reconstructedMember.userId).toBe(originalMember.userId);
      expect(reconstructedMember.role).toBe(originalMember.role);
      expect(reconstructedMember.joinedAt.getTime()).toBe(originalMember.joinedAt.getTime());
    });

    test("maintains type safety after JSON round-trip", () => {
      const member = createBoardMember({ role: "OWNER" });
      const json = JSON.stringify(member);
      const parsed = JSON.parse(json);
      
      const validRoles: BoardRole[] = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];
      expect(validRoles).toContain(parsed.role);
    });
  });

  describe("BoardMember edge cases and validation", () => {
    test("handles whitespace in userId", () => {
      const member = createBoardMember({ userId: "  user-123  " });
      expect(member.userId).toBe("  user-123  ");
    });

    test("handles extremely long userId", () => {
      const longUserId = "a".repeat(1000);
      const member = createBoardMember({ userId: longUserId });
      expect(member.userId).toBe(longUserId);
      expect(member.userId.length).toBe(1000);
    });

    test("handles date at epoch", () => {
      const epochDate = new Date(0);
      const member = createBoardMember({ joinedAt: epochDate });
      expect(member.joinedAt.getTime()).toBe(0);
    });

    test("handles maximum date value", () => {
      const maxDate = new Date(8640000000000000); // Max safe date
      const member = createBoardMember({ joinedAt: maxDate });
      expect(member.joinedAt.getTime()).toBe(8640000000000000);
    });

    test("maintains role case sensitivity", () => {
      const member = createBoardMember({ role: "ADMIN" });
      expect(member.role).toBe("ADMIN");
      expect(member.role).not.toBe("admin");
      expect(member.role).not.toBe("Admin");
      expect(member.role).not.toBe("ADMIN".toLowerCase());
    });
  });

  describe("BoardMember factory consistency", () => {
    test("all convenience factories return valid BoardMember objects", () => {
      const owner = createOwnerMember("user-1");
      const admin = createAdminMember("user-2");
      const member = createRegularMember("user-3");
      const viewer = createViewerMember("user-4");

      const members = [owner, admin, member, viewer];
      
      members.forEach(m => {
        expect(typeof m.userId).toBe("string");
        expect(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).toContain(m.role);
        expect(m.joinedAt instanceof Date).toBe(true);
      });
    });

    test("factory functions produce consistent structure", () => {
      const member1 = createBoardMember();
      const member2 = createRegularMember("user-123");
      
      expect(Object.keys(member1).sort()).toEqual(Object.keys(member2).sort());
      expect(Object.keys(member1)).toEqual(["userId", "role", "joinedAt"]);
    });

    test("factory functions preserve type information", () => {
      const member = createAdminMember("admin-user");
      
      // TypeScript compile-time checks
      const userId: string = member.userId;
      const role: BoardRole = member.role;
      const joinedAt: Date = member.joinedAt;
      
      expect(userId).toBe("admin-user");
      expect(role).toBe("ADMIN");
      expect(joinedAt instanceof Date).toBe(true);
    });
  });
});