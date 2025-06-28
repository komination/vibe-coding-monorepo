import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Board } from "@/domain/entities/Board";
import { mockDate, UUID_REGEX, DEFAULT_TEST_DATE } from "@/test/utils/testHelpers";
import { BoardBuilder } from "@/test/fixtures/entityFactories";

describe("Board Entity", () => {
  let restoreDate: () => void;

  beforeEach(() => {
    restoreDate = mockDate(DEFAULT_TEST_DATE);
  });

  afterEach(() => {
    restoreDate();
  });

  describe("Board creation", () => {
    test("generates unique UUID when creating board", () => {
      const board = BoardBuilder.valid().build();
      expect(board.id).toMatch(UUID_REGEX);
    });

    test("assigns provided title to new board", () => {
      const board = BoardBuilder.valid().withTitle("Custom Title").build();
      expect(board.title).toBe("Custom Title");
    });

    test("assigns provided description to new board", () => {
      const board = BoardBuilder.valid().withDescription("Custom Description").build();
      expect(board.description).toBe("Custom Description");
    });

    test("assigns provided owner to new board", () => {
      const board = BoardBuilder.valid().withOwner("owner-456").build();
      expect(board.ownerId).toBe("owner-456");
    });

    test("sets public flag according to specification", () => {
      const publicBoard = BoardBuilder.valid().public().build();
      const privateBoard = BoardBuilder.valid().private().build();
      expect(publicBoard.isPublic).toBe(true);
      expect(privateBoard.isPublic).toBe(false);
    });

    test("sets archived flag according to specification", () => {
      const archivedBoard = BoardBuilder.valid().archived().build();
      const activeBoard = BoardBuilder.valid().active().build();
      expect(archivedBoard.isArchived).toBe(true);
      expect(activeBoard.isArchived).toBe(false);
    });

    test("sets current timestamp for creation date", () => {
      const board = BoardBuilder.valid().build();
      expect(board.createdAt).toEqual(DEFAULT_TEST_DATE);
    });

    test("sets current timestamp for updated date", () => {
      const board = BoardBuilder.valid().build();
      expect(board.updatedAt).toEqual(DEFAULT_TEST_DATE);
    });

    test("creates board without optional properties when not provided", () => {
      const board = BoardBuilder.valid().withTitle("Minimal Board").build();
      expect(board.description).toBeUndefined();
      expect(board.backgroundUrl).toBeUndefined();
    });

    test("generates different UUIDs for multiple boards", () => {
      const board1 = BoardBuilder.valid().withTitle("Board 1").build();
      const board2 = BoardBuilder.valid().withTitle("Board 2").build();
      expect(board1.id).not.toBe(board2.id);
    });
  });

  describe("Board restoration from persistence", () => {
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

    test("restores board ID from persistence data", () => {
      const board = Board.fromPersistence(persistenceData);
      expect(board.id).toBe("board-123");
    });

    test("restores board properties from persistence data", () => {
      const board = Board.fromPersistence(persistenceData);
      expect(board.title).toBe("Persisted Board");
      expect(board.description).toBe("From database");
      expect(board.backgroundUrl).toBe("https://example.com/bg.jpg");
      expect(board.isPublic).toBe(true);
      expect(board.isArchived).toBe(false);
      expect(board.ownerId).toBe("user-456");
    });

    test("restores board timestamps from persistence data", () => {
      const board = Board.fromPersistence(persistenceData);
      expect(board.createdAt).toEqual(new Date("2023-01-01"));
      expect(board.updatedAt).toEqual(new Date("2023-06-01"));
    });
  });

  describe("Board title updates", () => {
    test("updates board title to new value", () => {
      const board = BoardBuilder.valid().withTitle("Original Title").build();
      board.updateTitle("Updated Title");
      expect(board.title).toBe("Updated Title");
    });

    test("preserves board ID when title is updated", () => {
      const board = BoardBuilder.valid().build();
      const originalId = board.id;
      board.updateTitle("New Title");
      expect(board.id).toBe(originalId);
    });

    test("preserves creation timestamp when title is updated", () => {
      const board = BoardBuilder.valid().build();
      const originalCreatedAt = board.createdAt;
      board.updateTitle("New Title");
      expect(board.createdAt).toEqual(originalCreatedAt);
    });

    test("updates timestamp when title is changed", () => {
      const board = BoardBuilder.valid().build();
      
      restoreDate();
      restoreDate = mockDate(new Date("2024-01-02T00:00:00Z"));
      
      board.updateTitle("New Title");
      expect(board.updatedAt).toEqual(new Date("2024-01-02T00:00:00Z"));
    });

  });

  describe("Board description updates", () => {
    test("updates board description to new value", () => {
      const board = BoardBuilder.valid().withDescription("Original Description").build();
      board.updateDescription("New Description");
      expect(board.description).toBe("New Description");
    });

    test("clears description when set to undefined", () => {
      const board = BoardBuilder.valid().withDescription("Has Description").build();
      board.updateDescription(undefined);
      expect(board.description).toBeUndefined();
    });
  });

  describe("Board background updates", () => {
    test("updates background URL to new value", () => {
      const board = BoardBuilder.valid().build();
      board.updateBackground("https://example.com/new-bg.jpg");
      expect(board.backgroundUrl).toBe("https://example.com/new-bg.jpg");
    });
  });

  describe("Board visibility changes", () => {

    test("makes private board public", () => {
      const board = BoardBuilder.valid().private().build();

      board.makePublic();
      expect(board.isPublic).toBe(true);
    });

    test("makes public board private", () => {
      const board = BoardBuilder.valid().public().build();
      board.makePrivate();
      expect(board.isPublic).toBe(false);
    });
  });

  describe("Board archival", () => {
    test("archives active board", () => {
      const board = BoardBuilder.valid().active().build();
      board.archive();
      expect(board.isArchived).toBe(true);
    });

    test("unarchives archived board", () => {
      const board = BoardBuilder.valid().archived().build();

      board.unarchive();

      expect(board.isArchived).toBe(false);
    });
  });

  describe("Board serialization", () => {
    test("serializes board with all properties to JSON", () => {
      const board = BoardBuilder.valid()
        .withTitle("Test Board")
        .withDescription("Test Description")
        .withBackgroundUrl("https://example.com/bg.jpg")
        .public()
        .withOwner("user-123")
        .build();

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

  describe("Board ownership identification", () => {
    test("identifies correct owner using isOwner", () => {
      const board = BoardBuilder.valid().withOwner("user-123").build();
      expect(board.isOwner("user-123")).toBe(true);
      expect(board.isOwner("user-456")).toBe(false);
    });

    test("identifies correct owner using isOwnedBy", () => {
      const board = BoardBuilder.valid().withOwner("user-123").build();
      expect(board.isOwnedBy("user-123")).toBe(true);
      expect(board.isOwnedBy("user-456")).toBe(false);
    });
  });

  describe("Board editing permissions", () => {
    test("allows owner to edit board regardless of role", () => {
      const board = BoardBuilder.valid().withOwner("user-123").build();
      expect(board.canBeEditedBy("user-123", "MEMBER")).toBe(true);
      expect(board.canBeEditedBy("user-123", "VIEWER")).toBe(true);
    });

    test("allows admin to edit board", () => {
      const board = BoardBuilder.valid().withOwner("user-123").build();
      expect(board.canBeEditedBy("user-456", "ADMIN")).toBe(true);
    });

    test("denies member and viewer editing access", () => {
      const board = BoardBuilder.valid().withOwner("user-123").build();
      expect(board.canBeEditedBy("user-456", "MEMBER")).toBe(false);
      expect(board.canBeEditedBy("user-456", "VIEWER")).toBe(false);
    });
  });

  describe("Board viewing permissions", () => {

    test("allows anyone to view public board", () => {
      const board = BoardBuilder.valid().public().withOwner("user-123").build();
      expect(board.canBeViewedBy("user-456")).toBe(true);
      expect(board.canBeViewedBy("user-789", undefined)).toBe(true);
    });

    test("allows owner to view private board", () => {
      const board = BoardBuilder.valid().private().withOwner("user-123").build();
      expect(board.canBeViewedBy("user-123")).toBe(true);
    });

    test("allows members with any role to view private board", () => {
      const board = BoardBuilder.valid().private().withOwner("user-123").build();
      expect(board.canBeViewedBy("user-456", "OWNER")).toBe(true);
      expect(board.canBeViewedBy("user-456", "ADMIN")).toBe(true);
      expect(board.canBeViewedBy("user-456", "MEMBER")).toBe(true);
      expect(board.canBeViewedBy("user-456", "VIEWER")).toBe(true);
    });

    test("denies non-members access to view private board", () => {
      const board = BoardBuilder.valid().private().withOwner("user-123").build();
      expect(board.canBeViewedBy("user-456")).toBe(false);
      expect(board.canBeViewedBy("user-456", undefined)).toBe(false);
    });
  });

  describe("Board business rules validation", () => {
    test("accepts empty title at domain layer", () => {
      const board = BoardBuilder.valid().withTitle("").build();
      expect(board.title).toBe("");
    });

    test("accepts long titles at domain layer", () => {
      const longTitle = "a".repeat(256);
      const board = BoardBuilder.valid().withTitle(longTitle).build();
      expect(board.title).toBe(longTitle);
    });

    test("accepts long descriptions at domain layer", () => {
      const longDescription = "a".repeat(2001);
      const board = BoardBuilder.valid().withDescription(longDescription).build();
      expect(board.description).toBe(longDescription);
    });

    test("accepts invalid URLs at domain layer", () => {
      const board = BoardBuilder.valid().withBackgroundUrl("not-a-valid-url").build();
      expect(board.backgroundUrl).toBe("not-a-valid-url");
    });
  });
});