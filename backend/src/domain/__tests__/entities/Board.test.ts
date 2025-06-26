import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Board } from "@/domain/entities/Board";
import { mockDate } from "@/test/utils/testHelpers";

describe("Board Entity", () => {
  let restoreDate: () => void;

  beforeEach(() => {
    // Mock date for consistent testing
    restoreDate = mockDate(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    restoreDate();
  });

  describe("create", () => {
    test("should create a new board with generated ID", () => {
      const board = Board.create({
        title: "Test Board",
        description: "Test Description",
        isPublic: false,
        isArchived: false,
        ownerId: "user-123",
      });

      expect(board.id).toBeDefined();
      expect(board.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(board.title).toBe("Test Board");
      expect(board.description).toBe("Test Description");
      expect(board.isPublic).toBe(false);
      expect(board.isArchived).toBe(false);
      expect(board.ownerId).toBe("user-123");
      expect(board.createdAt).toEqual(new Date("2024-01-01T00:00:00Z"));
      expect(board.updatedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
    });

    test("should create board with minimal properties", () => {
      const board = Board.create({
        title: "Minimal Board",
        isPublic: false,
        isArchived: false,
        ownerId: "user-123",
      });

      expect(board.title).toBe("Minimal Board");
      expect(board.description).toBeUndefined();
      expect(board.backgroundUrl).toBeUndefined();
    });

    test("should create unique IDs for different boards", () => {
      const board1 = Board.create({
        title: "Board 1",
        isPublic: false,
        isArchived: false,
        ownerId: "user-123",
      });

      const board2 = Board.create({
        title: "Board 2",
        isPublic: false,
        isArchived: false,
        ownerId: "user-123",
      });

      expect(board1.id).not.toBe(board2.id);
    });
  });

  describe("fromPersistence", () => {
    test("should restore board from persistence data", () => {
      const persistenceData = {
        id: "board-123",
        title: "Persisted Board",
        description: "From database",
        backgroundUrl: "https://example.com/bg.jpg",
        isPublic: true,
        isArchived: false,
        ownerId: "user-456",
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-06-01"),
      };

      const board = Board.fromPersistence(persistenceData);

      expect(board.id).toBe("board-123");
      expect(board.title).toBe("Persisted Board");
      expect(board.description).toBe("From database");
      expect(board.backgroundUrl).toBe("https://example.com/bg.jpg");
      expect(board.isPublic).toBe(true);
      expect(board.isArchived).toBe(false);
      expect(board.ownerId).toBe("user-456");
      expect(board.createdAt).toEqual(new Date("2023-01-01"));
      expect(board.updatedAt).toEqual(new Date("2023-06-01"));
    });
  });

  describe("update methods", () => {
    test("should update board title", () => {
      const board = Board.create({
        title: "Original Title",
        isPublic: false,
        isArchived: false,
        ownerId: "user-123",
      });

      const originalId = board.id;
      const originalCreatedAt = board.createdAt;

      // Move time forward
      restoreDate();
      restoreDate = mockDate(new Date("2024-01-02T00:00:00Z"));

      board.updateTitle("Updated Title");

      expect(board.id).toBe(originalId); // ID should not change
      expect(board.title).toBe("Updated Title");
      expect(board.createdAt).toEqual(originalCreatedAt); // Created date should not change
      expect(board.updatedAt).toEqual(new Date("2024-01-02T00:00:00Z")); // Updated date should change
    });

    test("should update board description", () => {
      const board = Board.create({
        title: "Test Board",
        description: "Original Description",
        isPublic: false,
        isArchived: false,
        ownerId: "user-123",
      });

      board.updateDescription("New Description");

      expect(board.description).toBe("New Description");
    });

    test("should clear description when set to undefined", () => {
      const board = Board.create({
        title: "Test Board",
        description: "Has Description",
        isPublic: false,
        isArchived: false,
        ownerId: "user-123",
      });

      board.updateDescription(undefined);

      expect(board.description).toBeUndefined();
    });

    test("should update background URL", () => {
      const board = Board.create({
        title: "Test Board",
        isPublic: false,
        isArchived: false,
        ownerId: "user-123",
      });

      board.updateBackground("https://example.com/new-bg.jpg");

      expect(board.backgroundUrl).toBe("https://example.com/new-bg.jpg");
    });

    test("should make board public", () => {
      const board = Board.create({
        title: "Test Board",
        isPublic: false,
        isArchived: false,
        ownerId: "user-123",
      });

      board.makePublic();

      expect(board.isPublic).toBe(true);
    });

    test("should make board private", () => {
      const board = Board.create({
        title: "Test Board",
        isPublic: true,
        isArchived: false,
        ownerId: "user-123",
      });

      board.makePrivate();

      expect(board.isPublic).toBe(false);
    });
  });

  describe("archive/unarchive", () => {
    test("should archive board", () => {
      const board = Board.create({
        title: "Active Board",
        isPublic: false,
        isArchived: false,
        ownerId: "user-123",
      });

      board.archive();

      expect(board.isArchived).toBe(true);
    });

    test("should unarchive board", () => {
      const board = Board.create({
        title: "Archived Board",
        isPublic: false,
        isArchived: true,
        ownerId: "user-123",
      });

      board.unarchive();

      expect(board.isArchived).toBe(false);
    });
  });

  describe("toJSON", () => {
    test("should serialize board to JSON", () => {
      const board = Board.create({
        title: "Test Board",
        description: "Test Description",
        backgroundUrl: "https://example.com/bg.jpg",
        isPublic: true,
        isArchived: false,
        ownerId: "user-123",
      });

      const json = board.toJSON();

      expect(json).toEqual({
        id: board.id,
        title: "Test Board",
        description: "Test Description",
        backgroundUrl: "https://example.com/bg.jpg",
        isPublic: true,
        isArchived: false,
        ownerId: "user-123",
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      });
    });
  });

  describe("business rules", () => {
    test("should allow empty title (validation at application layer)", () => {
      const board = Board.create({
        title: "", // Empty title - validation handled at application layer
        isPublic: false,
        isArchived: false,
        ownerId: "user-123",
      });
      expect(board.title).toBe("");
    });

    test("should allow long titles (validation at application layer)", () => {
      const longTitle = "a".repeat(256);
      const board = Board.create({
        title: longTitle, // Long title - validation handled at application layer
        isPublic: false,
        isArchived: false,
        ownerId: "user-123",
      });
      expect(board.title).toBe(longTitle);
    });

    test("should allow long descriptions (validation at application layer)", () => {
      const longDescription = "a".repeat(2001);
      const board = Board.create({
        title: "Valid Title",
        description: longDescription, // Long description - validation handled at application layer
        isPublic: false,
        isArchived: false,
        ownerId: "user-123",
      });
      expect(board.description).toBe(longDescription);
    });

    test("should allow invalid URLs (validation at application layer)", () => {
      const board = Board.create({
        title: "Valid Title",
        backgroundUrl: "not-a-valid-url", // Invalid URL - validation handled at application layer
        isPublic: false,
        isArchived: false,
        ownerId: "user-123",
      });
      expect(board.backgroundUrl).toBe("not-a-valid-url");
    });
  });
});