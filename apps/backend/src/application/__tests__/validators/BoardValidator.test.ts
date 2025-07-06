import { describe, test, expect } from "bun:test";
import { BoardValidator } from "@/application/validators/BoardValidator";

describe("BoardValidator", () => {
  describe("validateCreateBoard", () => {
    test("should validate valid board data", () => {
      const data = {
        title: "My Board",
        description: "A test board",
        backgroundUrl: "https://example.com/bg.jpg",
        isPublic: true,
      };

      const result = BoardValidator.validateCreateBoard(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        title: "My Board",
        description: "A test board",
        backgroundUrl: "https://example.com/bg.jpg",
        isPublic: true,
      });
    });

    test("should trim whitespace from title and description", () => {
      const data = {
        title: "  My Board  ",
        description: "  A test board  ",
      };

      const result = BoardValidator.validateCreateBoard(data);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("My Board");
      expect(result.data?.description).toBe("A test board");
    });

    test("should fail if title is missing", () => {
      const data = {
        description: "A test board",
      };

      const result = BoardValidator.validateCreateBoard(data);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "title",
          message: "title is required",
        })
      );
    });

    test("should fail if title is empty", () => {
      const data = {
        title: "",
      };

      const result = BoardValidator.validateCreateBoard(data);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "title",
          message: "title is required",
        })
      );
    });

    test("should fail if title is too long", () => {
      const data = {
        title: "a".repeat(256),
      };

      const result = BoardValidator.validateCreateBoard(data);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "title",
          message: "title must be no more than 255 characters",
        })
      );
    });

    test("should fail if description is too long", () => {
      const data = {
        title: "My Board",
        description: "a".repeat(2001),
      };

      const result = BoardValidator.validateCreateBoard(data);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "description",
          message: "description must be no more than 2000 characters",
        })
      );
    });

    test("should fail if backgroundUrl is invalid", () => {
      const data = {
        title: "My Board",
        backgroundUrl: "not-a-url",
      };

      const result = BoardValidator.validateCreateBoard(data);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "backgroundUrl",
          message: "backgroundUrl must be a valid URL",
        })
      );
    });

    test("should fail if isPublic is not boolean", () => {
      const data = {
        title: "My Board",
        isPublic: "yes",
      };

      const result = BoardValidator.validateCreateBoard(data);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "isPublic",
          message: "isPublic must be a boolean",
        })
      );
    });

    test("should default isPublic to false if not provided", () => {
      const data = {
        title: "My Board",
      };

      const result = BoardValidator.validateCreateBoard(data);

      expect(result.success).toBe(true);
      expect(result.data?.isPublic).toBe(false);
    });
  });

  describe("validateUpdateBoard", () => {
    test("should validate partial update data", () => {
      const data = {
        title: "Updated Title",
      };

      const result = BoardValidator.validateUpdateBoard(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        title: "Updated Title",
        description: undefined,
        backgroundUrl: undefined,
        isPublic: undefined,
      });
    });

    test("should allow all fields to be optional", () => {
      const data = {};

      const result = BoardValidator.validateUpdateBoard(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        title: undefined,
        description: undefined,
        backgroundUrl: undefined,
        isPublic: undefined,
      });
    });

    test("should validate all fields when provided", () => {
      const data = {
        title: "Updated Title",
        description: "Updated description",
        backgroundUrl: "https://example.com/new-bg.jpg",
        isPublic: false,
      };

      const result = BoardValidator.validateUpdateBoard(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });
  });

  describe("validateAddMember", () => {
    test("should validate valid member data", () => {
      const data = {
        userId: "user-123",
        role: "MEMBER" as const,
      };

      const result = BoardValidator.validateAddMember(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    test("should accept all valid roles", () => {
      const roles = ["ADMIN", "MEMBER", "VIEWER"] as const;

      for (const role of roles) {
        const data = {
          userId: "user-123",
          role,
        };

        const result = BoardValidator.validateAddMember(data);

        expect(result.success).toBe(true);
        expect(result.data?.role).toBe(role);
      }
    });

    test("should fail if userId is missing", () => {
      const data = {
        role: "MEMBER",
      };

      const result = BoardValidator.validateAddMember(data);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "userId",
          message: "userId is required",
        })
      );
    });

    test("should fail if role is missing", () => {
      const data = {
        userId: "user-123",
      };

      const result = BoardValidator.validateAddMember(data);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "role",
          message: "role is required",
        })
      );
    });

    test("should fail if role is invalid", () => {
      const data = {
        userId: "user-123",
        role: "OWNER", // OWNER should not be assignable
      };

      const result = BoardValidator.validateAddMember(data);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "role",
          message: "role must be one of: ADMIN, MEMBER, VIEWER",
        })
      );
    });
  });

  describe("validateUpdateMember", () => {
    test("should validate valid role update", () => {
      const data = {
        role: "ADMIN" as const,
      };

      const result = BoardValidator.validateUpdateMember(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    test("should fail if role is missing", () => {
      const data = {};

      const result = BoardValidator.validateUpdateMember(data);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "role",
          message: "role is required",
        })
      );
    });

    test("should fail if role is invalid", () => {
      const data = {
        role: "SUPERUSER",
      };

      const result = BoardValidator.validateUpdateMember(data);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "role",
          message: "role must be one of: ADMIN, MEMBER, VIEWER",
        })
      );
    });
  });
});