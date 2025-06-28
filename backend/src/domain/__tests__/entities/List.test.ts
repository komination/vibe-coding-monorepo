import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { List } from "@/domain/entities/List";
import { mockDate, UUID_REGEX, DEFAULT_TEST_DATE } from "@/test/utils/testHelpers";
import { ListBuilder } from "@/test/fixtures/entityFactories";

describe("List Entity", () => {
  let restoreDate: () => void;

  beforeEach(() => {
    restoreDate = mockDate(DEFAULT_TEST_DATE);
  });

  afterEach(() => {
    restoreDate();
  });

  describe("List creation", () => {
    test("generates unique UUID when creating list", () => {
      const list = ListBuilder.valid().build();
      expect(list.id).toMatch(UUID_REGEX);
    });

    test("assigns provided title to new list", () => {
      const list = ListBuilder.valid().withTitle("Custom List").build();
      expect(list.title).toBe("Custom List");
    });

    test("assigns provided position to new list", () => {
      const list = ListBuilder.valid().withPosition(2500).build();
      expect(list.position).toBe(2500);
    });

    test("assigns provided color to new list", () => {
      const list = ListBuilder.valid().withColor("#FF5733").build();
      expect(list.color).toBe("#FF5733");
    });

    test("assigns list to specified board", () => {
      const list = ListBuilder.valid().inBoard("board-456").build();
      expect(list.boardId).toBe("board-456");
    });

    test("sets current timestamp for creation date", () => {
      const list = ListBuilder.valid().build();
      expect(list.createdAt).toEqual(DEFAULT_TEST_DATE);
    });

    test("sets current timestamp for updated date", () => {
      const list = ListBuilder.valid().build();
      expect(list.updatedAt).toEqual(DEFAULT_TEST_DATE);
    });

    test("creates list without color when not provided", () => {
      const list = ListBuilder.valid().withTitle("No Color List").build();
      expect(list.color).toBeUndefined();
    });

    test("generates different UUIDs for multiple lists", () => {
      const list1 = ListBuilder.valid().withTitle("List 1").build();
      const list2 = ListBuilder.valid().withTitle("List 2").build();
      expect(list1.id).not.toBe(list2.id);
    });

    test("should allow zero position", () => {
      const list = List.create({
        title: "First List",
        position: 0,
        boardId: "board-123",
      });

      expect(list.position).toBe(0);
    });

    test("should allow negative position", () => {
      const list = List.create({
        title: "Negative Position List",
        position: -1000,
        boardId: "board-123",
      });

      expect(list.position).toBe(-1000);
    });
  });

  describe("List restoration from persistence", () => {
    test("should restore list from persistence data", () => {
      const persistenceData = {
        id: "list-123",
        title: "Persisted List",
        position: 3000,
        color: "#00FF00",
        boardId: "board-789",
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-06-01"),
      };

      const list = List.fromPersistence(persistenceData);

      expect(list.id).toBe("list-123");
      expect(list.title).toBe("Persisted List");
      expect(list.position).toBe(3000);
      expect(list.color).toBe("#00FF00");
      expect(list.boardId).toBe("board-789");
      expect(list.createdAt).toEqual(new Date("2023-01-01"));
      expect(list.updatedAt).toEqual(new Date("2023-06-01"));
    });

    test("should restore list without color from persistence", () => {
      const persistenceData = {
        id: "list-no-color",
        title: "No Color Persisted",
        position: 4000,
        boardId: "board-999",
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-06-01"),
      };

      const list = List.fromPersistence(persistenceData);

      expect(list.color).toBeUndefined();
    });
  });

  describe("List title updates", () => {
    test("should update list title", () => {
      const list = List.create({
        title: "Original Title",
        position: 1000,
        boardId: "board-123",
      });

      const originalId = list.id;
      const originalCreatedAt = list.createdAt;
      const originalPosition = list.position;

      // Move time forward
      restoreDate();
      restoreDate = mockDate(new Date("2024-01-02T00:00:00Z"));

      list.updateTitle("Updated Title");

      expect(list.id).toBe(originalId); // ID should not change
      expect(list.title).toBe("Updated Title");
      expect(list.position).toBe(originalPosition); // Position should not change
      expect(list.createdAt).toEqual(originalCreatedAt); // Created date should not change
      expect(list.updatedAt).toEqual(new Date("2024-01-02T00:00:00Z")); // Updated date should change
    });

    test("should update to empty title (validation at application layer)", () => {
      const list = List.create({
        title: "Non-empty Title",
        position: 1000,
        boardId: "board-123",
      });

      list.updateTitle("");

      expect(list.title).toBe("");
    });
  });

  describe("List color updates", () => {
    test("should update list color", () => {
      const list = List.create({
        title: "Test List",
        position: 1000,
        color: "#FF0000",
        boardId: "board-123",
      });

      // Move time forward
      restoreDate();
      restoreDate = mockDate(new Date("2024-01-02T00:00:00Z"));

      list.updateColor("#00FF00");

      expect(list.color).toBe("#00FF00");
      expect(list.updatedAt).toEqual(new Date("2024-01-02T00:00:00Z"));
    });

    test("should clear color when set to undefined", () => {
      const list = List.create({
        title: "Test List",
        position: 1000,
        color: "#FF0000",
        boardId: "board-123",
      });

      list.updateColor(undefined);

      expect(list.color).toBeUndefined();
    });

    test("should set color on list without initial color", () => {
      const list = List.create({
        title: "No Color List",
        position: 1000,
        boardId: "board-123",
      });

      list.updateColor("#0000FF");

      expect(list.color).toBe("#0000FF");
    });
  });

  describe("List position updates", () => {
    test("should update list position", () => {
      const list = List.create({
        title: "Test List",
        position: 1000,
        boardId: "board-123",
      });

      // Move time forward
      restoreDate();
      restoreDate = mockDate(new Date("2024-01-02T00:00:00Z"));

      list.updatePosition(2000);

      expect(list.position).toBe(2000);
      expect(list.updatedAt).toEqual(new Date("2024-01-02T00:00:00Z"));
    });

    test("should update to zero position", () => {
      const list = List.create({
        title: "Test List",
        position: 1000,
        boardId: "board-123",
      });

      list.updatePosition(0);

      expect(list.position).toBe(0);
    });

    test("should update to negative position", () => {
      const list = List.create({
        title: "Test List",
        position: 1000,
        boardId: "board-123",
      });

      list.updatePosition(-500);

      expect(list.position).toBe(-500);
    });

    test("should handle large position values", () => {
      const list = List.create({
        title: "Test List",
        position: 1000,
        boardId: "board-123",
      });

      const largePosition = Number.MAX_SAFE_INTEGER;
      list.updatePosition(largePosition);

      expect(list.position).toBe(largePosition);
    });
  });

  describe("belongsToBoard", () => {
    test("should return true when list belongs to the board", () => {
      const list = List.create({
        title: "Test List",
        position: 1000,
        boardId: "board-123",
      });

      expect(list.belongsToBoard("board-123")).toBe(true);
    });

    test("should return false when list does not belong to the board", () => {
      const list = List.create({
        title: "Test List",
        position: 1000,
        boardId: "board-123",
      });

      expect(list.belongsToBoard("board-456")).toBe(false);
    });

    test("should handle undefined or null board IDs correctly", () => {
      const list = List.create({
        title: "Test List",
        position: 1000,
        boardId: "board-123",
      });

      expect(list.belongsToBoard("")).toBe(false);
    });
  });

  describe("List serialization", () => {
    test("should serialize list to JSON", () => {
      const list = List.create({
        title: "Test List",
        position: 1000,
        color: "#FF5733",
        boardId: "board-123",
      });

      const json = list.toJSON();

      expect(json).toEqual({
        id: list.id,
        title: "Test List",
        position: 1000,
        color: "#FF5733",
        boardId: "board-123",
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      });
    });

    test("should serialize list without color to JSON", () => {
      const list = List.create({
        title: "No Color List",
        position: 2000,
        boardId: "board-456",
      });

      const json = list.toJSON();

      expect(json).toEqual({
        id: list.id,
        title: "No Color List",
        position: 2000,
        color: undefined,
        boardId: "board-456",
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      });
    });
  });

  describe("getters", () => {
    test("should expose all properties through getters", () => {
      const list = List.create({
        title: "Getter Test List",
        position: 5000,
        color: "#123456",
        boardId: "board-getter",
      });

      expect(list.id).toBeDefined();
      expect(list.title).toBe("Getter Test List");
      expect(list.position).toBe(5000);
      expect(list.color).toBe("#123456");
      expect(list.boardId).toBe("board-getter");
      expect(list.createdAt).toBeInstanceOf(Date);
      expect(list.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("List business rules validation", () => {
    test("should allow empty title (validation at application layer)", () => {
      const list = List.create({
        title: "", // Empty title - validation handled at application layer
        position: 1000,
        boardId: "board-123",
      });
      expect(list.title).toBe("");
    });

    test("should allow long titles (validation at application layer)", () => {
      const longTitle = "a".repeat(256);
      const list = List.create({
        title: longTitle, // Long title - validation handled at application layer
        position: 1000,
        boardId: "board-123",
      });
      expect(list.title).toBe(longTitle);
    });

    test("should allow invalid color formats (validation at application layer)", () => {
      const list = List.create({
        title: "Test List",
        position: 1000,
        color: "not-a-color", // Invalid color - validation handled at application layer
        boardId: "board-123",
      });
      expect(list.color).toBe("not-a-color");
    });

    test("should allow decimal positions", () => {
      const list = List.create({
        title: "Decimal Position List",
        position: 1500.5,
        boardId: "board-123",
      });
      expect(list.position).toBe(1500.5);
    });

    test("should handle multiple updates correctly", () => {
      const list = List.create({
        title: "Original",
        position: 1000,
        color: "#FF0000",
        boardId: "board-123",
      });

      // Multiple updates
      list.updateTitle("First Update");
      list.updatePosition(2000);
      list.updateColor("#00FF00");
      list.updateTitle("Second Update");
      list.updatePosition(3000);

      expect(list.title).toBe("Second Update");
      expect(list.position).toBe(3000);
      expect(list.color).toBe("#00FF00");
    });
  });
});